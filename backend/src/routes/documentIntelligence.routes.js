import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getDocumentTypes,
  getValidationRules,
  getBenchmarks,
  getFraudPatterns,
  getExtraction,
  saveScore,
  getScore,
  getVerifications,
  getDocumentRedFlags,
  getExpedienteSummary,
  getCrossReferences,
  getExpedienteRedFlags,
  processDocument
} from '../services/documentIntelligenceService.js';
import { runClassifierBatch } from '../agents/agentClassifier.js';
import { runValidatorBatch } from '../agents/agentValidator.js';
import { chatWithExpediente } from '../agents/agentChat.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Reference / Catalog endpoints (No auth required for reference lookups)
router.get('/intel/reference/document-types', (req, res) => {
  try {
    res.json(getDocumentTypes());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/intel/reference/validation-rules', async (req, res) => {
  try {
    const rules = await getValidationRules(req.query.type);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/intel/reference/benchmarks/:sector', async (req, res) => {
  try {
    const data = await getBenchmarks(req.params.sector);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/intel/reference/fraud-patterns', async (req, res) => {
  try {
    const data = await getFraudPatterns();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Document level operations (Auth required)
router.post('/intel/documents/:id/classify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener información del documento
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('filename, storage_path')
      .eq('id', id)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Pipeline de procesamiento inicial
    const result = await processDocument(id, document.filename, '');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/intel/documents/:id/extract', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { textContent } = req.body;
    
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('filename')
      .eq('id', id)
      .single();

    if (error || !document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const result = await processDocument(id, document.filename, textContent || '');
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/intel/documents/:id/validate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Instanciamos el validador para este documento
    const result = await runValidatorBatch(null, id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/documents/:id/score', authMiddleware, async (req, res) => {
  try {
    const score = await getScore(req.params.id);
    if (!score) {
      return res.status(404).json({ error: 'Score no calculado para este documento' });
    }
    res.json(score);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/documents/:id/extraction', authMiddleware, async (req, res) => {
  try {
    const extraction = await getExtraction(req.params.id);
    if (!extraction) {
      return res.status(404).json({ error: 'Extracción no encontrada' });
    }
    res.json(extraction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/intel/documents/:id/score', authMiddleware, async (req, res) => {
  try {
    const result = await saveScore(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/documents/:id/verifications', authMiddleware, async (req, res) => {
  try {
    const verifications = await getVerifications(req.params.id);
    res.json(verifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/documents/:id/red-flags', authMiddleware, async (req, res) => {
  try {
    const redFlags = await getDocumentRedFlags(req.params.id);
    res.json(redFlags);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Expediente (Order) level operations (Auth required)
router.get('/intel/expediente/:id/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await getExpedienteSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/expediente/:id/cross-references', authMiddleware, async (req, res) => {
  try {
    const cross = await getCrossReferences(req.params.id);
    res.json(cross);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/intel/expediente/:id/red-flags', authMiddleware, async (req, res) => {
  try {
    const flags = await getExpedienteRedFlags(req.params.id);
    res.json(flags);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disparar procesamiento batch (Background/Async)
router.post('/intel/expediente/:id/process-all', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Responder inmediatamente
    res.json({ success: true, message: 'Procesamiento de todos los documentos iniciado en background' });

    // Ejecutar en background
    (async () => {
      try {
        await runClassifierBatch(id);
        await runValidatorBatch(id);
      } catch (err) {
        console.error('Error in process-all background batch:', err);
      }
    })();
  } catch (error) {
    console.error(error);
  }
});

router.post('/intel/expediente/:id/validate-all', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    res.json({ success: true, message: 'Validación de todos los documentos iniciada en background' });
    
    (async () => {
      try {
        await runValidatorBatch(id);
      } catch (err) {
        console.error('Error in validate-all background batch:', err);
      }
    })();
  } catch (error) {
    console.error(error);
  }
});

router.post('/intel/expediente/:id/chat', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  try {
    const result = await chatWithExpediente(id, message);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
