import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseAdmin } from '../config/supabase.js';
import { processDocument, saveExtraction, logAgentAction } from '../services/documentIntelligenceService.js';
import * as XLSX from 'xlsx';

// Modelo de idioma empaquetado localmente para que el OCR no dependa de
// descargar el CDN de jsdelivr en cada ejecucion (causa del cuelgue original).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Forward slashes siempre, tesseract.js concatena "${langPath}/${lang}.traineddata.gz" tal cual.
const TESSDATA_PATH = path.join(__dirname, '..', '..', 'tessdata').split(path.sep).join('/');

// Función para descargar el archivo de Supabase Storage
async function downloadFileFromStorage(storagePath) {
  const { data, error } = await supabaseAdmin.storage
    .from('documents')
    .download(storagePath);

  if (error) throw error;
  
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Evita que una extracción cuelgue el lote completo (Tesseract puede quedarse
// esperando indefinidamente al descargar su modelo de lenguaje si la red es lenta).
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} excedio el tiempo limite de ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Función principal de extracción de texto
export async function extractText(filename, buffer) {
  const ext = String(filename || '').split('.').pop()?.toLowerCase();
  let text = '';

  try {
    if (ext === 'pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await withTimeout(pdfParse(buffer), 20000, 'pdf-parse');
        text = parsed.text || '';
      } catch (pdfError) {
        console.error('pdf-parse failed or timed out, falling back to empty string:', pdfError);
        text = `[PDF Extraction Failed: ${pdfError.message}]`;
      }
    }
    else if (['png', 'jpg', 'jpeg', 'webp', 'tiff'].includes(ext)) {
      try {
        const Tesseract = (await import('tesseract.js')).default;
        const { data: { text: ocrText } } = await withTimeout(
          Tesseract.recognize(buffer, 'spa+eng', { langPath: TESSDATA_PATH, cacheMethod: 'none' }),
          45000,
          'Tesseract OCR'
        );
        text = ocrText || '';
      } catch (ocrError) {
        console.error('OCR failed or timed out, falling back to empty string:', ocrError);
        text = `[OCR Extraction Failed: ${ocrError.message}]`;
      }
    } 
    else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let excelText = [];
      
      // Limitar a máximo 5 hojas y 60 filas por hoja para evitar consumo excesivo
      const sheetsToProcess = workbook.SheetNames.slice(0, 5);
      
      for (const sheetName of sheetsToProcess) {
        const sheet = workbook.Sheets[sheetName];
        // Convertir a formato texto delimitado
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        
        // Limitar filas por hoja
        const lines = sheetText.split('\n').slice(0, 60);
        excelText.push(`--- Sheet: ${sheetName} ---\n` + lines.join('\n'));
      }
      text = excelText.join('\n\n');
    } 
    else {
      // Texto plano UTF-8 para otros formatos (txt, csv, etc.)
      text = buffer.toString('utf-8').slice(0, 30000);
    }
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    text = `[Error extracting text: ${error.message}]`;
  }

  return text;
}

// Ejecutar clasificación para un documento específico
export async function runClassifierForDocument(documentId) {
  const startTime = Date.now();
  
  // 1. Obtener documento
  const { data: document, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error || !document) {
    throw new Error(`Documento con ID ${documentId} no encontrado`);
  }

  // 2. Descargar archivo
  const buffer = await downloadFileFromStorage(document.storage_path);

  // 3. Extraer texto y metadatos
  let textContent = '';
  let pdfMetadata = null;
  const ext = String(document.filename || '').split('.').pop()?.toLowerCase();
  
  if (ext === 'pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const parsed = await withTimeout(pdfParse(buffer), 20000, 'pdf-parse');
      textContent = parsed.text || '';
      pdfMetadata = parsed.info || null;
    } catch (e) {
      console.error(`Error parsing PDF ${document.filename}:`, e);
      textContent = `[PDF Parsing Failed: ${e.message}]`;
    }
  } else {
    textContent = await extractText(document.filename, buffer);
  }

  // 4. Procesar clasificación y guardar en base de datos
  const result = await processDocument(documentId, document.filename, textContent);

  // 5. Guardar el texto extraído para el validador
  await saveExtraction(documentId, {
    filename: document.filename,
    textContent,
    pdfMetadata,
    extracted_at: new Date().toISOString()
  }, result.classification.confidence);

  const duration = (Date.now() - startTime) / 1000;
  await logAgentAction(
    'AgentClassifier',
    'run_complete',
    { documentId, filename: document.filename, durationSeconds: duration },
    0.005 // estimación de costo por procesamiento
  );

  return result;
}

// Procesar todos los documentos pendientes de un expediente
export async function runClassifierBatch(expedienteId) {
  // Buscar documentos en la orden
  const { data: documents, error } = await supabaseAdmin
    .from('documents')
    .select('id, review_status')
    .eq('order_id', expedienteId);

  if (error) throw error;
  if (!documents || !documents.length) return [];

  const results = [];
  for (const doc of documents) {
    // Si aún no está clasificado o procesado
    if (doc.review_status === 'uploaded' || !doc.review_status) {
      try {
        const res = await runClassifierForDocument(doc.id);
        results.push({ id: doc.id, success: true, classification: res.classification });
      } catch (err) {
        console.error(`Error procesando documento ${doc.id} en lote:`, err);
        results.push({ id: doc.id, success: false, error: err.message });
      }
    }
  }

  return results;
}
