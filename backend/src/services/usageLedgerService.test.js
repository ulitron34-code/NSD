import { beforeEach, describe, expect, it, vi } from 'vitest';

const rows = [];
const upsert = vi.fn();

function builder() {
  let filtered = [...rows];
  const chain = {
    select: () => chain,
    eq: (column, value) => { filtered = filtered.filter((row) => row[column] === value); return chain; },
    upsert: (value, options) => { upsert(value, options); filtered = [value]; return chain; },
    maybeSingle: () => Promise.resolve({ data: filtered[0] || null, error: null }),
    then: (resolve) => resolve({ data: filtered, error: null })
  };
  return chain;
}

vi.mock('../config/supabase.js', () => ({ supabaseAdmin: { from: vi.fn(() => builder()) } }));

describe('usageLedgerService', () => {
  beforeEach(() => { rows.length = 0; upsert.mockClear(); vi.resetModules(); });

  it('is fail-closed when the ledger flag is disabled', async () => {
    process.env.USAGE_LEDGER_ENABLED = 'false';
    const { recordAnalysisUnitDebit } = await import('./usageLedgerService.js');
    await expect(recordAnalysisUnitDebit({ billingAccountId: 'a', source: { type: 'subscription', id: 's' }, operationKey: 'op', units: 1, reason: 'analysis' }))
      .rejects.toMatchObject({ code: 'USAGE_LEDGER_DISABLED' });
  });

  it('calculates net debited units for one entitlement source', async () => {
    process.env.USAGE_LEDGER_ENABLED = 'true';
    rows.push(
      { billing_account_id: 'a', source_type: 'subscription', source_id: 's', units: -3, entry_type: 'debit' },
      { billing_account_id: 'a', source_type: 'subscription', source_id: 's', units: 1, entry_type: 'refund' },
      { billing_account_id: 'other', source_type: 'subscription', source_id: 's', units: -9, entry_type: 'debit' }
    );
    const { getAnalysisUnitUsage } = await import('./usageLedgerService.js');
    await expect(getAnalysisUnitUsage('a', { type: 'subscription', id: 's' })).resolves.toBe(2);
  });

  it('records an idempotent negative debit keyed by account and operation', async () => {
    process.env.USAGE_LEDGER_ENABLED = 'true';
    const { recordAnalysisUnitDebit } = await import('./usageLedgerService.js');
    await recordAnalysisUnitDebit({ billingAccountId: 'a', source: { type: 'package_purchase', id: 'p' }, operationKey: 'analysis:123', units: 2, reason: 'document_analysis' });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ units: -2, entry_type: 'debit', operation_key: 'analysis:123' }), { onConflict: 'billing_account_id,operation_key', ignoreDuplicates: true });
  });
});
