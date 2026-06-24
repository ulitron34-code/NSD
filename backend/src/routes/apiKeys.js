import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from '../services/apiKeyService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();

// GET /api-keys — listar keys del usuario autenticado
router.get('/api-keys', authMiddleware, async (req, res) => {
  try {
    const keys = await listApiKeys(req.userId);
    res.json({ data: keys });
  } catch (err) {
    console.error('[ApiKeys] list error:', err.message);
    res.status(500).json({ error: 'Error al obtener API keys' });
  }
});

// POST /api-keys — crear nueva key
router.post('/api-keys', authMiddleware, async (req, res) => {
  const { name, permissions, expiresAt } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la API key es requerido' });
  }

  const allowedPermissions = ['*', 'orders:read', 'documents:read', 'compliance:read', 'checklist:read'];
  const perms = Array.isArray(permissions) && permissions.length
    ? permissions.filter((p) => allowedPermissions.includes(p))
    : ['*'];

  if (!perms.length) {
    return res.status(400).json({ error: 'Permisos inválidos' });
  }

  try {
    const keyData = await createApiKey(req.userId, name.trim(), perms, expiresAt || null);

    await logAuditEvent({
      userId: req.userId,
      action: 'api_key_created',
      resourceType: 'api_key',
      resourceId: keyData.id,
      details: { name: keyData.name, permissions: keyData.permissions }
    });

    res.status(201).json({ data: keyData });
  } catch (err) {
    console.error('[ApiKeys] create error:', err.message);
    res.status(500).json({ error: 'Error al crear API key' });
  }
});

// PATCH /api-keys/:id/revoke — desactivar key sin borrarla
router.patch('/api-keys/:id/revoke', authMiddleware, async (req, res) => {
  try {
    await revokeApiKey(req.params.id, req.userId);

    await logAuditEvent({
      userId: req.userId,
      action: 'api_key_revoked',
      resourceType: 'api_key',
      resourceId: req.params.id
    });

    res.json({ message: 'API key revocada' });
  } catch (err) {
    console.error('[ApiKeys] revoke error:', err.message);
    res.status(500).json({ error: 'Error al revocar API key' });
  }
});

// DELETE /api-keys/:id — borrar key permanentemente
router.delete('/api-keys/:id', authMiddleware, async (req, res) => {
  try {
    await deleteApiKey(req.params.id, req.userId);

    await logAuditEvent({
      userId: req.userId,
      action: 'api_key_deleted',
      resourceType: 'api_key',
      resourceId: req.params.id
    });

    res.json({ message: 'API key eliminada' });
  } catch (err) {
    console.error('[ApiKeys] delete error:', err.message);
    res.status(500).json({ error: 'Error al eliminar API key' });
  }
});

export default router;
