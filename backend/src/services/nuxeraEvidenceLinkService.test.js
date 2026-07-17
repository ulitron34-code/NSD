import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  orders: [],
  evidenceLinks: []
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const filters = [];
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((field, value) => {
        filters.push({ type: 'eq', field, value });
        return builder;
      }),
      is: vi.fn((field, value) => {
        filters.push({ type: 'is', field, value });
        return builder;
      }),
      maybeSingle: vi.fn(() => Promise.resolve(resolveMaybeSingle(table, filters))),
      then: (resolve, reject) => Promise.resolve(resolveList(table, filters)).then(resolve, reject)
    };
    return builder;
  }

  function matches(row, filters) {
    return filters.every((filter) => {
      if (filter.type === 'eq') return row[filter.field] === filter.value;
      if (filter.type === 'is') return row[filter.field] === filter.value;
      return true;
    });
  }

  function resolveMaybeSingle(table, filters) {
    if (table === 'service_orders') {
      return { data: state.orders.find((row) => matches(row, filters)) || null, error: null };
    }
    return { data: null, error: null };
  }

  function resolveList(table, filters) {
    if (table === 'nuxera_evidence_links') {
      return { data: state.evidenceLinks.filter((row) => matches(row, filters)), error: null };
    }
    return { data: [], error: null };
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import {
  buildDefaultEvidenceLinks,
  getOwnerEvidenceLinks
} from './nuxeraEvidenceLinkService.js';

describe('nuxeraEvidenceLinkService', () => {
  beforeEach(() => {
    state.orders = [{ id: 'order-1', user_id: 'user-1' }];
    state.evidenceLinks = [];
  });

  it('returns a guarded default when no owner evidence links exist', async () => {
    const result = await getOwnerEvidenceLinks({ orderId: 'order-1', userId: 'user-1' });

    expect(result).toEqual(buildDefaultEvidenceLinks('order-1'));
    expect(result.persisted).toBe(false);
    expect(result.guardrails).toEqual(expect.arrayContaining([expect.stringContaining('ledger local')]));
  });

  it('rejects evidence reads when the user does not own the order', async () => {
    await expect(getOwnerEvidenceLinks({ orderId: 'order-1', userId: 'other-user' }))
      .rejects.toThrow('Expediente no encontrado');
  });

  it('maps owner evidence links without granting document access', async () => {
    state.evidenceLinks = [
      {
        id: 'link-1',
        workspace_state_id: 'state-1',
        order_id: 'order-1',
        document_id: 'doc-1',
        document_review_id: 'review-1',
        engine: 'intelligence',
        label: 'Acta constitutiva validada',
        visibility: 'owner',
        provenance: { source: 'document-review', score: 92 },
        created_by: 'user-1',
        created_at: '2026-07-17T10:00:00.000Z',
        archived_at: null
      },
      {
        id: 'link-2',
        order_id: 'order-1',
        engine: 'strategy',
        label: 'Decision package evidence',
        visibility: 'authorized_grantor',
        provenance: {},
        archived_at: null
      }
    ];

    const result = await getOwnerEvidenceLinks({ orderId: 'order-1', userId: 'user-1' });

    expect(result.persisted).toBe(true);
    expect(result.summary).toMatchObject({ total: 1, engines: ['intelligence'], visibility: ['owner'] });
    expect(result.links[0]).toMatchObject({
      id: 'link-1',
      documentId: 'doc-1',
      documentReviewId: 'review-1',
      provenance: { source: 'document-review', score: 92 }
    });
    expect(result.links[0].guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('no otorga acceso documental')])
    );
  });

  it('rejects unknown evidence engines from persisted rows', async () => {
    state.evidenceLinks = [
      {
        id: 'link-1',
        order_id: 'order-1',
        engine: 'credit_approval',
        label: 'Invalid',
        visibility: 'owner',
        provenance: {},
        archived_at: null
      }
    ];

    await expect(getOwnerEvidenceLinks({ orderId: 'order-1', userId: 'user-1' }))
      .rejects.toThrow('Engine NUXERA evidence invalido');
  });
});