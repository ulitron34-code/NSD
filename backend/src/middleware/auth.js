import { supabase, supabaseAdmin } from '../config/supabase.js';

const ROLE_ALIASES = {
  admin: 'administrador',
  administrator: 'administrador',
  applicant: 'solicitante',
  funder: 'otorgante',
  investor: 'inversionista'
};

export const NSD_ROLES = {
  ADMIN: 'administrador',
  SOLICITANTE: 'solicitante',
  AGENTE_INTERNO: 'agente_interno',
  ANALISTA: 'analista',
  COMPLIANCE_OFFICER: 'compliance_officer',
  AUDITOR_INTERNO: 'auditor_interno',
  OTORGANTE: 'otorgante',
  INVERSIONISTA: 'inversionista'
};

export const ROLE_PERMISSIONS = {
  administrador: ['*'],
  solicitante: ['case:own:read', 'case:own:create', 'case:own:update', 'document:own:upload', 'document:own:read', 'document:own:update', 'review:own:read', 'score:own:read', 'report:own:create', 'audit:own:read', 'data_room:own:read', 'data_room:own:share', 'payment:own:create', 'payment:own:confirm', 'regulatory:own:validate', 'information_request:own:read', 'information_request:own:update', 'contact_request:own:decide'],
  agente_interno: ['case:assigned:read', 'case:assigned:update', 'document:assigned:review', 'regulatory:assigned:validate', 'information_request:assigned:read', 'contact_request:assigned:read', 'audit:case:read'],
  analista: ['case:assigned:read', 'score:read', 'score:update', 'report:create', 'regulatory:assigned:validate', 'information_request:assigned:read', 'audit:case:read'],
  compliance_officer: ['case:assigned:read', 'compliance:review', 'case:status:update', 'regulatory:assigned:validate', 'contact_request:assigned:decide', 'audit:case:read'],
  auditor_interno: ['audit:read', 'case:read', 'report:read'],
  otorgante: ['data_room:authorized:read', 'funder:interest:create', 'funder:contact:create', 'information_request:create', 'information_request:own:read', 'information_request:own:update'],
  inversionista: ['data_room:authorized:read', 'funder:interest:create', 'funder:contact:create', 'information_request:create', 'information_request:own:read', 'information_request:own:update']
};

function normalizeRole(role = 'solicitante') {
  const normalized = String(role || 'solicitante').trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
}

function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[normalizeRole(role)] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = data.user.id;
    req.user = data.user;

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id,email,profile_type')
      .eq('id', data.user.id)
      .maybeSingle();

    req.userRole = normalizeRole(profile?.profile_type || data.user.user_metadata?.profile_type || 'solicitante');
    req.userProfile = profile || null;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(allowedRoles = []) {
  const allowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.userRole || !allowed.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        requiredRoles: allowed,
        currentRole: req.userRole || null
      });
    }

    next();
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.userRole, permission)) {
      return res.status(403).json({
        error: 'Permiso insuficiente',
        requiredPermission: permission,
        currentRole: req.userRole || null
      });
    }

    next();
  };
}
