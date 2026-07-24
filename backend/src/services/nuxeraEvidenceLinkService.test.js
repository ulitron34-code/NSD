import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  orders: [],
  evidenceLinks: [],
  dataRoomShares: []
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
      in: vi.fn((field, values) => {
        filters.push({ type: 'in', field, values });
        return builder;
      }),
      or: vi.fn((expression) => {
        filters.push({ type: 'or', expression });
        return builder;
      }),
      maybeSingle: vi.fn(() => Promise.resolve(resolveMaybeSingle(table, filters))),
      then: (resolve, reject) => Promise.resolve(resolveList(table, filters)).then(resolve, reject)
    };
    return builder;
  }

  function matchesOrExpression(row, expression) {
    return expression.split(',').some((clause) => {
      const [field, op, ...rest] = clause.split('.');
      const rawValue = rest.join('.');
      if (op === 'eq') return String(row[field]) === rawValue;
      if (op === 'ilike') return String(row[field] || '').toLowerCase() === rawValue.toLowerCase();
      return false;
    });
  }

  function matches(row, filters) {
    return filters.every((filter) => {
      if (filter.type === 'eq') return row[filter.field] === filter.value;
      if (filter.type === 'is') return row[filter.field] === filter.value;
      if (filter.type === 'in') return filter.values.includes(row[filter.field]);
      if (filter.type === 'or') return matchesOrExpression(row, filter.expression);
      return true;
    });
  }

  function resolveMaybeSingle(table, filters) {
    if (table === 'service_orders') {
      return { data: state.orders.find((row) => matches(row, filters)) || null, error: null };
    }
    if (table === 'data_room_shares') {
      return { data: state.dataRoomShares.find((row) => matches(row, filters)) || null, error: null };
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
  getAuthorizedGrantorEvidenceLinks,
  getOwnerEvidenceLinks
} from './nuxeraEvidenceLinkService.js';

describe('nuxeraEvidenceLinkService', () => {
  beforeEach(() => {
    state.orders = [{ id: 'order-1', user_id: 'user-1' }];
    state.evidenceLinks = [];
    state.dataRoomShares = [];
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

  it('rejects grantor evidence reads without an accepted data_room_shares record', async () => {
    await expect(
      getAuthorizedGrantorEvidenceLinks({ orderId: 'order-1', userId: 'grantor-1', email: 'grantor@example.com' })
    ).rejects.toThrow('Expediente no encontrado o sin permisos para revision de otorgante');
  });

  it('rejects grantor evidence reads when the requester has no email', async () => {
    await expect(
      getAuthorizedGrantorEvidenceLinks({ orderId: 'order-1', userId: 'grantor-1', email: undefined })
    ).rejects.toThrow('Usuario autenticado sin email');
  });

  it('rejects grantor evidence reads when the share is still pending', async () => {
    state.dataRoomShares = [
      { id: 'share-1', order_id: 'order-1', recipient_user_id: 'grantor-1', status: 'invited' }
    ];

    await expect(
      getAuthorizedGrantorEvidenceLinks({ orderId: 'order-1', userId: 'grantor-1', email: 'grantor@example.com' })
    ).rejects.toThrow('Expediente no encontrado o sin permisos para revision de otorgante');
  });

  it('returns a guarded default when an authorized grantor has no evidence links yet', async () => {
    state.dataRoomShares = [
      { id: 'share-1', order_id: 'order-1', recipient_user_id: 'grantor-1', status: 'accepted' }
    ];

    const result = await getAuthorizedGrantorEvidenceLinks({
      orderId: 'order-1',
      userId: 'grantor-1',
      email: 'grantor@example.com'
    });

    expect(result).toEqual(buildDefaultEvidenceLinks('order-1'));
  });

  it('maps authorized-grantor evidence links for a share accepted by user id', async () => {
    state.dataRoomShares = [
      { id: 'share-1', order_id: 'order-1', recipient_user_id: 'grantor-1', status: 'accepted' }
    ];
    state.evidenceLinks = [
      {
        id: 'link-2',
        order_id: 'order-1',
        engine: 'strategy',
        label: 'Decision package evidence',
        visibility: 'authorized_grantor',
        provenance: { source: 'strategy-workspace' },
        archived_at: null
      },
      {
        id: 'link-1',
        order_id: 'order-1',
        engine: 'intelligence',
        label: 'Owner-only evidence',
        visibility: 'owner',
        provenance: {},
        archived_at: null
      }
    ];

    const result = await getAuthorizedGrantorEvidenceLinks({
      orderId: 'order-1',
      userId: 'grantor-1',
      email: 'grantor@example.com'
    });

    expect(result.persisted).toBe(true);
    expect(result.summary).toMatchObject({ total: 1, engines: ['strategy'], visibility: ['authorized_grantor'] });
    expect(result.links[0]).toMatchObject({ id: 'link-2', engine: 'strategy' });
    expect(result.links[0].guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('no otorga acceso documental')])
    );
  });

  it('maps authorized-grantor evidence links for a share matched by email via recipient_email', async () => {
    state.dataRoomShares = [
      { id: 'share-1', order_id: 'order-1', recipient_email: 'grantor@example.com', status: 'shared' }
    ];
    state.evidenceLinks = [
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

    const result = await getAuthorizedGrantorEvidenceLinks({
      orderId: 'order-1',
      userId: 'grantor-does-not-match',
      email: 'GRANTOR@example.com'
    });

    expect(result.persisted).toBe(true);
    expect(result.links[0]).toMatchObject({ id: 'link-2' });
  });
});