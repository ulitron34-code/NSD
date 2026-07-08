import express from 'express';
import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import { runAIReviewCascaded } from '../services/aiEngine.js';
import { evaluateReadinessDocument } from '../agents/readinessRubricAgent.js';
import { runReadinessCrossReferences } from '../agents/readinessCrossRefAgent.js';

const router = express.Router();
const MAX_DOCUMENT_BYTES = Number(process.env.MAX_DOCUMENT_BYTES || 25 * 1024 * 1024);
const allowedExtensions = new Set(['pdf', 'docx', 'xlsx', 'csv', 'png', 'jpg', 'jpeg']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'image/png',
  'image/jpeg'
]);

// Códigos del checklist de 13 Requisitos Mínimos (ver
// sql_migrations_pendientes/2026-07-04_readiness_document_types.sql). Solo
// estos códigos pueden venir del header X-Document-Type; cualquier otro
// valor se ignora y se conserva la inferencia automática por nombre.
const READINESS_DOCUMENT_TYPES = new Set([
  'READY_DOC_CORPORATIVA',
  'READY_IDENTIFICACION_OFICIAL',
  'READY_DOC_KYC',
  'READY_MARCO_RIESGOS',
  'READY_ESTUDIO_VIABILIDAD',
  'READY_ESTUDIO_MERCADO',
  'READY_PLAN_NEGOCIOS',
  'READY_MODELO_FINANCIERO',
  'READY_VIABILIDAD_FINANCIERA',
  'READY_TRANSPARENCIA_DOCUMENTAL',
  'READY_ODS',
  'READY_ESG',
  'READY_ESIA'
]);

function inferDocumentType(filename = '') {
  const normalized = String(filename)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/acta|constitutiva|estatuto|poder|legal/.test(normalized)) return 'corporativo_legal';
  if (/ine|identificacion|pasaporte|kyc|beneficiario/.test(normalized)) return 'identidad_kyc';
  if (/estado|financier|balance|resultado|flujo|banco/.test(normalized)) return 'financiero';
  if (/sat|rfc|fiscal|opinion|cumplimiento|declaracion/.test(normalized)) return 'fiscal';
  if (/garantia|aval|colateral|inmueble|escritura/.test(normalized)) return 'garantias';
  if (/pitch|deck|business|plan|proyecto|resumen/.test(normalized)) return 'proyecto';
  return 'otro';
}

const ALLOWED_DOCUMENT_STATUSES = new Set([
  'uploaded',
  'in_review',
  'approved',
  'observed',
  'rejected',
  'expired',
  'waived'
]);

function normalizeDocumentPatch(body = {}) {
  const patch = {};

  if (body.documentType !== undefined) patch.document_type = body.documentType;
  if (body.reviewStatus !== undefined) {
    if (!ALLOWED_DOCUMENT_STATUSES.has(body.reviewStatus)) throw new Error('Estado documental invalido');
    patch.review_status = body.reviewStatus;
  }
  if (body.isBlocking !== undefined) patch.is_blocking = Boolean(body.isBlocking);
  if (body.expiresAt !== undefined) patch.expires_at = body.expiresAt || null;
  if (body.metadata !== undefined) patch.metadata = body.metadata || {};

  return patch;
}

async function insertDocumentRecord(payload) {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert([payload])
    .select()
    .single();

  if (!error) return data;

  if (!/column|schema cache/i.test(error.message || '')) {
    throw error;
  }

  const {
    document_type,
    review_status,
    version_number,
    is_blocking,
    expires_at,
    file_hash,
    metadata,
    ...legacyPayload
  } = payload;

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from('documents')
    .insert([legacyPayload])
    .select()
    .single();

  if (fallbackError) throw fallbackError;

  return {
    ...fallbackData,
    document_type,
    review_status,
    version_number,
    is_blocking,
    expires_at,
    file_hash,
    metadata
  };
}

function sanitizeFilename(filename = 'documento') {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function validateDocumentFile({ filename, contentType, size }) {
  const extension = String(filename || '').split('.').pop()?.toLowerCase();

  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error('Tipo de archivo no permitido. Usa PDF, DOCX, XLSX, CSV, PNG o JPG.');
  }

  if (!allowedMimeTypes.has(contentType)) {
    throw new Error('Formato de archivo no valido para carga documental.');
  }

  if (size > MAX_DOCUMENT_BYTES) {
    throw new Error(`Archivo demasiado grande. Maximo permitido: ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB.`);
  }
}

async function assertOrderOwner(orderId, userId) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos');
  }
}

async function getNextDocumentVersion(orderId, documentType, filename) {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('filename, document_type, version_number')
    .eq('order_id', orderId);

  if (error?.message?.includes('document_type') || error?.message?.includes('version_number')) {
    return 1;
  }

  if (error) throw error;

  const normalizedFilename = String(filename || '').trim().toLowerCase();
  const matching = (data || []).filter((document) => {
    const sameType = document.document_type && document.document_type === documentType;
    const sameFilename = String(document.filename || '').trim().toLowerCase() === normalizedFilename;
    return sameType || sameFilename;
  });

  const maxVersion = matching.reduce((max, document) => {
    const version = Number(document.version_number || 1);
    return Number.isFinite(version) && version > max ? version : max;
  }, 0);

  return maxVersion + 1;
}

// Función obsoleta reemplazada por runAIReviewCascaded

async function insertDocumentReview(payload) {
  const { data, error } = await supabaseAdmin
    .from('document_reviews')
    .insert([payload])
    .select()
    .single();

  if (!error) return data;

  const missingOptionalReviewColumns =
    error.message?.includes('extracted_data') ||
    error.message?.includes('warnings');

  if (!missingOptionalReviewColumns) {
    throw error;
  }

  const { extracted_data, warnings, ...compatiblePayload } = payload;
  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from('document_reviews')
    .insert([compatiblePayload])
    .select()
    .single();

  if (fallbackError) throw fallbackError;

  return {
    ...fallbackData,
    extracted_data: extracted_data || [],
    warnings: warnings || []
  };
}

async function updateDocumentReview(reviewId, payload) {
  const { error } = await supabaseAdmin
    .from('document_reviews')
    .update(payload)
    .eq('id', reviewId);

  if (!error) return;

  const missingOptionalReviewColumns =
    error.message?.includes('extracted_data') ||
    error.message?.includes('warnings');

  if (!missingOptionalReviewColumns) {
    throw error;
  }

  const { extracted_data, warnings, ...compatiblePayload } = payload;
  const { error: fallbackError } = await supabaseAdmin
    .from('document_reviews')
    .update(compatiblePayload)
    .eq('id', reviewId);

  if (fallbackError) throw fallbackError;
}

// OBTENER URL DE FIRMA PARA SUBIR ARCHIVO
router.post('/signed-upload-url', authMiddleware, requirePermission('document:own:upload'), async (req, res) => {
  const { orderId, filename } = req.body;

  try {
    await assertOrderOwner(orderId, req.userId);

    const filePath = `${orderId}/${sanitizeFilename(filename)}`;

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    res.json({ uploadUrl: data.signedUrl, path: data.path, token: data.token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SUBIR DOCUMENTO REAL AL EXPEDIENTE
router.post(
  '/documents/:orderId/upload',
  authMiddleware,
  requirePermission('document:own:upload'),
  express.raw({ type: 'application/octet-stream', limit: '25mb' }),
  async (req, res) => {
    const { orderId } = req.params;
    const originalFilename = req.headers['x-filename'];
    const contentType = req.headers['x-content-type'] || 'application/octet-stream';
    const requestedDocumentType = req.headers['x-document-type'];

    try {
      if (!req.body?.length) {
        return res.status(400).json({ error: 'Archivo vacio' });
      }

      if (!originalFilename) {
        return res.status(400).json({ error: 'Nombre de archivo requerido' });
      }

      validateDocumentFile({
        filename: String(originalFilename),
        contentType,
        size: req.body.length
      });

      await assertOrderOwner(orderId, req.userId);

      const safeName = sanitizeFilename(String(originalFilename));
      const storagePath = `${orderId}/${Date.now()}-${safeName}`;
      const fileHash = crypto.createHash('sha256').update(req.body).digest('hex');
      const documentType = READINESS_DOCUMENT_TYPES.has(requestedDocumentType)
        ? requestedDocumentType
        : inferDocumentType(String(originalFilename));
      const versionNumber = await getNextDocumentVersion(orderId, documentType, String(originalFilename));

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(storagePath, req.body, {
          contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const document = await insertDocumentRecord({
        order_id: orderId,
        filename: String(originalFilename),
        storage_path: storagePath,
        document_type: documentType,
        review_status: 'uploaded',
        version_number: versionNumber,
        is_blocking: false,
        expires_at: null,
        file_hash: fileHash,
        metadata: {
          contentType,
          size: req.body.length,
          originalFilename: String(originalFilename),
          sha256: fileHash,
          versionNumber,
          versionReason: versionNumber > 1 ? 'Nueva version por tipo documental o nombre de archivo existente' : 'Primera version documental'
        }
      });

      await logAuditEvent({
        userId: req.userId,
        action: 'document_uploaded',
        entityType: 'document',
        entityId: document.id,
        orderId,
        req,
        metadata: {
          filename: document.filename,
          storagePath,
          sha256: fileHash,
          versionNumber,
          contentType,
          size: req.body.length
        }
      });

      res.json(document);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// LISTAR DOCUMENTOS DE UNA ORDEN
router.get('/documents/:orderId', authMiddleware, requirePermission('document:own:read'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select()
      .eq('order_id', req.params.orderId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ACTUALIZAR ESTADO DOCUMENTAL INSTITUCIONAL
router.patch('/documents/:orderId/:documentId', authMiddleware, requirePermission('document:own:update'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const patch = normalizeDocumentPatch(req.body || {});
    const metadataPatch = req.body?.notes ? { institutionalNotes: req.body.notes } : {};

    let { data, error } = await supabaseAdmin
      .from('documents')
      .update({
        ...patch,
        reviewed_by: req.userId,
        reviewed_at: new Date().toISOString(),
        metadata: {
          ...(patch.metadata || {}),
          ...metadataPatch,
          institutionalUpdatedAt: new Date().toISOString()
        }
      })
      .eq('id', req.params.documentId)
      .eq('order_id', req.params.orderId)
      .select()
      .single();

    if (error && /column|schema cache/i.test(error.message || '')) {
      const fallback = await supabaseAdmin
        .from('documents')
        .select()
        .eq('id', req.params.documentId)
        .eq('order_id', req.params.orderId)
        .single();
      data = {
        ...(fallback.data || {}),
        ...patch,
        metadata: {
          ...(fallback.data?.metadata || {}),
          ...metadataPatch,
          institutionalUpdatedAt: new Date().toISOString()
        }
      };
      error = fallback.error;
    }

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'document_institutional_updated',
      entityType: 'document',
      entityId: req.params.documentId,
      orderId: req.params.orderId,
      req,
      metadata: { patch, notes: req.body?.notes || null }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OBTENER URL FIRMADA TEMPORAL DEL DOCUMENTO
router.get('/documents/:orderId/:documentId/url', authMiddleware, requirePermission('document:own:read'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('storage_path')
      .eq('id', req.params.documentId)
      .eq('order_id', req.params.orderId)
      .single();

    if (documentError) throw documentError;

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 60 * 10);

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'document_view_url_created',
      entityType: 'document',
      entityId: req.params.documentId,
      orderId: req.params.orderId,
      req,
      metadata: { expiresInSeconds: 600 }
    });

    res.json({ url: data.signedUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CREAR REVISION IA PRELIMINAR DEL DOCUMENTO
router.post('/documents/:orderId/:documentId/review', authMiddleware, requirePermission('review:own:read'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('id, order_id, filename, storage_path, uploaded_at, document_type')
      .eq('id', req.params.documentId)
      .eq('order_id', req.params.orderId)
      .single();

    if (documentError) throw documentError;

    // 1. Insertar el registro con estatus 'processing' inmediatamente
    const review = await insertDocumentReview({
      document_id: document.id,
      order_id: req.params.orderId,
      status: 'processing',
      score: 0,
      summary: 'Procesando auditoria de IA en segundo plano...',
      findings: [],
      missing_items: [],
      extracted_data: [],
      warnings: []
    });

    // 2. Responder de inmediato al cliente para liberar la peticion HTTP
    res.json({ document, review });

    // 3. Ejecutar el analisis pesado en segundo plano (Background Task)
    (async () => {
      try {
        let extractedText = '';
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('documents')
          .download(document.storage_path);

        if (downloadError) {
          console.error("Error al descargar archivo de storage para auditoria:", downloadError);
        } else if (fileData) {
          try {
            const isPdf = String(document.filename || '').toLowerCase().endsWith('.pdf');
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (isPdf) {
              try {
                const pdfParse = (await import('pdf-parse')).default;
                const parsed = await pdfParse(buffer);
                extractedText = parsed.text || '';
              } catch (pdfErr) {
                console.error("Error al procesar PDF con pdf-parse:", pdfErr);
                extractedText = `[Error parsing PDF content: ${pdfErr.message}]`;
              }
            } else {
              // Decodificar como texto UTF-8 plano si es TXT, CSV, etc.
              extractedText = buffer.toString('utf-8').slice(0, 15000);
            }
          } catch (bufErr) {
            console.error("Error al convertir buffer del archivo:", bufErr);
          }
        }

        let reviewPayload;
        if (String(document.document_type || '').startsWith('READY_')) {
          const { data: order } = await supabaseAdmin
            .from('service_orders')
            .select('id, metadata')
            .eq('id', req.params.orderId)
            .single();
          reviewPayload = await evaluateReadinessDocument({
            documentTypeCode: document.document_type,
            extractedText,
            order
          });
        } else {
          reviewPayload = await runAIReviewCascaded(document, extractedText);
        }

        // 4. Actualizar el registro en base de datos con los resultados finales de la IA
        try {
          await updateDocumentReview(review.id, {
            status: reviewPayload.status,
            score: reviewPayload.score,
            summary: reviewPayload.summary,
            findings: reviewPayload.findings,
            missing_items: reviewPayload.missing_items,
            extracted_data: reviewPayload.extracted_data,
            warnings: reviewPayload.warnings
          });

          await logAuditEvent({
            userId: req.userId,
            action: 'document_ai_review_completed',
            entityType: 'document_review',
            entityId: review.id,
            orderId: req.params.orderId,
            req,
            metadata: {
              documentId: document.id,
              filename: document.filename,
              score: reviewPayload.score
            }
          });

          // Auditoria cruzada automatica (seccion 8.2 del plan: el diagrama la
          // encadena justo despues de la evaluacion por agentes, no como paso
          // manual). Antes solo corria si el usuario apretaba "Verificar
          // consistencia" -- ahora se dispara sola cada vez que termina de
          // revisarse un documento READY_*, sin bloquear la respuesta HTTP ya
          // enviada. Errores aqui no deben tumbar la revision que ya se guardo.
          if (String(document.document_type || '').startsWith('READY_')) {
            try {
              await runReadinessCrossReferences(req.params.orderId);
            } catch (crossRefError) {
              console.error("Error en auditoria cruzada automatica:", crossRefError);
            }
          }
        } catch (updateError) {
          console.error("Error al actualizar la revision en segundo plano:", updateError);
        }
      } catch (bgError) {
        console.error("Error critico en la ejecucion de la auditoria en segundo plano:", bgError);
        await supabaseAdmin
          .from('document_reviews')
          .update({
            status: 'red',
            summary: `Error critico en la ejecucion del analisis de IA: ${bgError.message}`
          })
          .eq('id', review.id);
      }
    })();

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LISTAR REVISIONES IA DEL EXPEDIENTE
router.get('/documents/:orderId/reviews', authMiddleware, requirePermission('review:own:read'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const { data, error } = await supabaseAdmin
      .from('document_reviews')
      .select('*, documents(filename)')
      .eq('order_id', req.params.orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
