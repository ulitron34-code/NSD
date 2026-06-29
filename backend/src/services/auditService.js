import { supabaseAdmin } from '../config/supabase.js';

export async function logAuditEvent({ userId, action, resourceType, resourceId, details = {} }) {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId ? String(resourceId) : null,
      details,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.warn('[Audit] insert failed (table may not exist yet):', error.message);
    }
  } catch (err) {
    console.warn('[Audit] logAuditEvent error:', err.message);
  }
}
