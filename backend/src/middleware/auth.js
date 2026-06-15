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

/**
 * Validate JWT token and attach user to request
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No authorization token provided',
      code: 'AUTH_MISSING'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Invalid authorization format',
      code: 'AUTH_INVALID_FORMAT'
    });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    // Attach user info to request
    req.userId = data.user.id;
    req.user = data.user;
    req.token = token; // Keep token reference for logging

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, profile_type, created_at')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Set user role with fallback
    req.userRole = normalizeRole(
      profile?.profile_type || 
      data.user.user_metadata?.profile_type || 
      'solicitante'
    );
    req.userProfile = profile || null;

    // Log authenticated request (dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH] User ${req.userId} (${req.userRole}) -> ${req.method} ${req.path}`);
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Check if user has required role(s)
 */
export function requireRole(allowedRoles = []) {
  const allowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowed.includes(req.userRole)) {
      console.warn(`[AUTH] Access denied for role '${req.userRole}' on ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        code: 'ROLE_REQUIRED',
        requiredRoles: allowed,
        currentRole: req.userRole
      });
    }

    next();
  };
}

/**
 * Check if user has specific permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasPermission(req.userRole, permission)) {
      console.warn(`[AUTH] Permission denied: '${permission}' for role '${req.userRole}' on ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Permiso insuficiente',
        code: 'PERMISSION_DENIED',
        requiredPermission: permission,
        currentRole: req.userRole
      });
    }

    next();
  };
}

/**
 * Check multiple permissions (OR logic)
 */
export function requireAnyPermission(permissions = []) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasAnyPermission = permissions.some(p => hasPermission(req.userRole, p));
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        error: 'Permiso insuficiente',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
        currentRole: req.userRole
      });
    }

    next();
  };
}

/**
 * Check all permissions (AND logic)
 */
export function requireAllPermissions(permissions = []) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasAllPermissions = permissions.every(p => hasPermission(req.userRole, p));
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Permiso insuficiente',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
        currentRole: req.userRole
      });
    }

    next();
  };
}

/**
 * Admin-only route guard
 */
export const requireAdmin = requireRole([NSD_ROLES.ADMIN]);

/**
 * Payment admin route guard (for refunds, etc)
 */
export function requirePaymentAdmin(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Only administrators can process refunds
  const isAdmin = req.userRole === NSD_ROLES.ADMIN;
  
  if (!isAdmin) {
    return res.status(403).json({
      error: 'Admin access required for payment operations',
      code: 'PAYMENT_ADMIN_REQUIRED'
    });
  }
  
  next();
}
