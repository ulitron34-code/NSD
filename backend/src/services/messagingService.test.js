import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { orders: [], shares: [], messages: [], unreadCount: 0 };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn((...args) => {
        if (table === 'messages' && args[1]?.count === 'exact') {
          builder.__isCount = true;
        }
        return builder;
      }),
      insert: vi.fn((rows) => {
        builder.__inserted = rows[0];
        return builder;
      }),
      update: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      neq: vi.fn(() => builder),
      is: vi.fn(() => builder),
      in: vi.fn(() => builder),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      single: vi.fn(() => Promise.resolve({ data: { id: 'msg-1', ...builder.__inserted }, error: null })),
      then: (resolve, reject) => {
        if (builder.__isCount) {
          return Promise.resolve({ count: state.unreadCount, error: null }).then(resolve, reject);
        }
        if (table === 'service_orders') return Promise.resolve({ data: state.orders, error: null }).then(resolve, reject);
        if (table === 'data_room_shares') return Promise.resolve({ data: state.shares, error: null }).then(resolve, reject);
        return Promise.resolve({ data: state.messages, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import { getUnreadCount } from './messagingService.js';

describe('messagingService.getUnreadCount', () => {
  beforeEach(() => {
    state.orders = [];
    state.shares = [];
    state.unreadCount = 0;
  });

  it('devuelve 0 cuando el usuario no tiene ordenes ni shares', async () => {
    const count = await getUnreadCount('user-1', 'user1@test.com');
    expect(count).toBe(0);
  });

  it('cuenta mensajes no leidos cuando el usuario tiene ordenes propias', async () => {
    state.orders = [{ id: 'order-1' }];
    state.unreadCount = 3;
    const count = await getUnreadCount('user-1', 'user1@test.com');
    expect(count).toBe(3);
  });

  it('cuenta mensajes no leidos cuando el usuario tiene un data_room_share aceptado', async () => {
    state.shares = [{ order_id: 'order-2' }];
    state.unreadCount = 1;
    const count = await getUnreadCount('user-2', 'user2@test.com');
    expect(count).toBe(1);
  });
});
