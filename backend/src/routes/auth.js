import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

// Roles a public visitor may self-assign at signup. Internal/privileged
// roles (analista, administrador, compliance_officer, auditor_interno,
// inversionista) can only be granted by an administrator through an
// authenticated admin route, never from this public endpoint.
const PUBLIC_PROFILE_TYPES = new Set(['solicitante', 'otorgante']);

async function upsertPublicUser(user, profileType = null) {
  if (!user?.id || !user?.email) return;

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('profile_type')
    .eq('id', user.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      profile_type: profileType || existing?.profile_type || 'solicitante',
    }, { onConflict: 'id' });

  if (error) {
    console.warn(`Public user sync skipped: ${error.message}`);
  }
}

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, profileType } = req.body;

  const requestedRole = String(profileType || '').trim().toLowerCase();
  const isAllowedPublicRole = PUBLIC_PROFILE_TYPES.has(requestedRole);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (profileType && !isAllowedPublicRole) {
      await logAuditEvent({
        userId: data.user?.id || null,
        action: 'signup_privileged_role_rejected',
        entityType: 'user',
        entityId: data.user?.id || null,
        req,
        metadata: { requestedRole, email },
        complianceRelevant: true
      });
    }

    await upsertPublicUser(data.user, isAllowedPublicRole ? requestedRole : null);

    res.json({
      user: data.user,
      token: data.session?.access_token || null,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;

    await upsertPublicUser(data.user);

    await logAuditEvent({
      userId: data.user.id,
      action: 'login',
      entityType: 'user',
      entityId: data.user.id,
      req,
      metadata: { email: data.user.email },
      complianceRelevant: false
    });
    
    res.json({ 
      user: data.user,
      token: data.session.access_token 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CURRENT USER
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
      profile: req.userProfile,
      role: req.userRole
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// LOGOUT AUDIT EVENT
router.post('/logout', authMiddleware, async (req, res) => {
  await logAuditEvent({
    userId: req.userId,
    action: 'logout',
    entityType: 'user',
    entityId: req.userId,
    req,
    complianceRelevant: false
  });

  res.json({ ok: true });
});

export default router;
