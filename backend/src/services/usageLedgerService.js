import { supabaseAdmin } from '../config/supabase.js';

const USAGE_LEDGER_ENABLED = String(process.env.USAGE_LEDGER_ENABLED || 'false').toLowerCase() === 'true';

export async function getAnalysisUnitUsage(billingAccountId, source) {
  if (!billingAccountId || !source?.type || !source?.id || !USAGE_LEDGER_ENABLED) return 0;
  const { data, error } = await supabaseAdmin.from('analysis_unit_ledger').select('units, entry_type')
    .eq('billing_account_id', billingAccountId).eq('source_type', source.type).eq('source_id', source.id);
  if (error) throw error;
  return (data || []).reduce((total, row) => {
    const units = Math.abs(Number(row.units || 0));
    return total + (row.entry_type === 'debit' ? units : -units);
  }, 0);
}

export async function recordAnalysisUnitDebit({ billingAccountId, source, orderId = null, operationKey, units, reason, userId = null, metadata = {} }) {
  if (!USAGE_LEDGER_ENABLED) {
    const error = new Error('Usage ledger is disabled');
    error.code = 'USAGE_LEDGER_DISABLED';
    throw error;
  }
  if (!billingAccountId || !source?.type || !source?.id || !operationKey || !reason || !(Number(units) > 0)) {
    const error = new Error('Invalid analysis-unit debit');
    error.code = 'INVALID_USAGE_DEBIT';
    throw error;
  }
  const { data, error } = await supabaseAdmin.from('analysis_unit_ledger').upsert({
    billing_account_id: billingAccountId, source_type: source.type, source_id: source.id, order_id: orderId,
    operation_key: operationKey, units: -Math.abs(Number(units)), entry_type: 'debit', reason, metadata, created_by: userId
  }, { onConflict: 'billing_account_id,operation_key', ignoreDuplicates: true }).select().maybeSingle();
  if (error) throw error;
  return data;
}
