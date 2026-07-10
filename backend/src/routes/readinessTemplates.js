// Plantillas descargables (sección 31 del plan). Contenido genérico (no
// depende de ningún expediente/orden), por eso solo requiere sesión iniciada
// -- mismo criterio de acceso que GET /reference-sources.
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import { listReadinessTemplates, buildReadinessTemplateMarkdown } from '../services/readinessTemplateService.js';

const router = express.Router();

router.get('/readiness-templates', authMiddleware, (req, res) => {
  res.json({ templates: listReadinessTemplates() });
});

router.get('/readiness-templates/:code', authMiddleware, async (req, res) => {
  const template = buildReadinessTemplateMarkdown(req.params.code);
  if (!template) {
    return res.status(404).json({ error: `Plantilla desconocida: "${req.params.code}"` });
  }

  await logAuditEvent({
    userId: req.userId,
    action: 'readiness_template_downloaded',
    entityType: 'readiness_template',
    entityId: req.params.code,
    req,
    metadata: { title: template.title }
  });

  const filename = `plantilla-${req.params.code}.md`.replace(/[^a-zA-Z0-9._-]/g, '-');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(template.content);
});

export default router;
