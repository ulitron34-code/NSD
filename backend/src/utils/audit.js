import { supabaseAdmin } from '../config/supabase.js';

export async function logAuditEvent({
  userId = null,
  action,
  entityType,
  entityId = null,
  orderId = null,
  metadata = {},
  req = null,
  complianceRelevant = true
}) {
  try {
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        order_id: orderId,
        ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
        user_agent: req?.headers?.['user-agent'] || null,
        metadata,
        compliance_relevant: complianceRelevant
      }]);
  } catch (error) {
    console.warn('Audit log skipped:', error.message);
  }
}
