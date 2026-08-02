import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const usersTable = new Map();
const auditEvents = [];

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async (event) => {
    auditEvents.push(event);
  })
}));

let nextSignupUser = null;

vi.mock('../config/supabase.js', () => {
  const supabaseAdmin = {
    from: vi.fn((table) => {
      if (table !== 'users') throw new Error(`Unexpected table ${table}`);
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((_column, value) => {
          builder._id = value;
          return builder;
        }),
        maybeSingle: vi.fn(() =>
          Promise.resolve({ data: usersTable.get(builder._id) || null, error: null })
        ),
        upsert: vi.fn((row) => {
          usersTable.set(row.id, row);
          return Promise.resolve({ error: null });
        })
      };
      return builder;
    })
  };

  const supabase = {
    auth: {
      signUp: vi.fn(() => Promise.resolve({ data: { user: nextSignupUser, session: null }, error: null })),
      signInWithPassword: vi.fn()
    }
  };

  return { supabase, supabaseAdmin };
});

const { default: authRoutes } = await import('./auth.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

describe('POST /api/auth/register', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    usersTable.clear();
    auditEvents.length = 0;
    nextSignupUser = { id: 'user-1', email: 'new@example.com', user_metadata: {} };
    ({ server, baseUrl } = await listen(createApp()));
  });

  afterEach(() => {
    server.close();
  });

  it('allows a public solicitante signup', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'secret123', profileType: 'solicitante' })
    });

    expect(response.status).toBe(200);
    expect(usersTable.get('user-1').profile_type).toBe('solicitante');
    expect(auditEvents).toHaveLength(0);
  });

  it('allows a public otorgante signup', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'secret123', profileType: 'otorgante' })
    });

    expect(response.status).toBe(200);
    expect(usersTable.get('user-1').profile_type).toBe('otorgante');
  });

  it('rejects a self-assigned internal role and falls back to solicitante', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'secret123', profileType: 'administrador' })
    });

    expect(response.status).toBe(200);
    expect(usersTable.get('user-1').profile_type).toBe('solicitante');
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].action).toBe('signup_privileged_role_rejected');
    expect(auditEvents[0].metadata.requestedRole).toBe('administrador');
  });

  it('rejects the internal analista role even though it matches a known RBAC role', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'secret123', profileType: 'analista' })
    });

    expect(response.status).toBe(200);
    expect(usersTable.get('user-1').profile_type).toBe('solicitante');
    expect(auditEvents).toHaveLength(1);
  });
});
