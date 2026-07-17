import { supabaseAdmin } from '../config/supabase.js';

const READINESS_TABLES = Object.freeze([
  {
    id: 'workspace-states',
    table: 'nuxera_workspace_states',
    label: 'Applicant workspace states',
    owner: 'backend-persistence',
    requiredFor: ['applicant-checklist-write']
  },
  {
    id: 'evidence-links',
    table: 'nuxera_evidence_links',
    label: 'Owner evidence links',
    owner: 'evidence-ledger',
    requiredFor: ['owner-evidence-read']
  },
  {
    id: 'admin-controls',
    table: 'nuxera_admin_controls',
    label: 'Admin controls',
    owner: 'admin-console',
    requiredFor: ['admin-readiness-read']
  }
]);

function normalizeTableError(error) {
  if (!error) return null;
  return {
    message: error.message || 'Nuxera table unavailable',
    code: error.code || null,
    hint: error.hint || null
  };
}

function buildSignal(definition, result) {
  if (result.error) {
    return {
      id: definition.id,
      table: definition.table,
      label: definition.label,
      owner: definition.owner,
      requiredFor: definition.requiredFor,
      status: 'unavailable',
      ready: false,
      count: null,
      error: normalizeTableError(result.error),
      guardrail: 'Readiness signal only; no aplica SQL ni modifica permisos.'
    };
  }

  return {
    id: definition.id,
    table: definition.table,
    label: definition.label,
    owner: definition.owner,
    requiredFor: definition.requiredFor,
    status: 'available',
    ready: true,
    count: Number.isFinite(result.count) ? result.count : null,
    error: null,
    guardrail: 'Tabla visible para lectura de readiness; no confirma RLS productivo por si sola.'
  };
}

async function checkTable(definition) {
  try {
    const { count, error } = await supabaseAdmin
      .from(definition.table)
      .select('id', { count: 'exact', head: true });

    return buildSignal(definition, { count, error });
  } catch (error) {
    return buildSignal(definition, { count: null, error });
  }
}

export function getNuxeraReadinessDefinitions() {
  return READINESS_TABLES.map((definition) => ({ ...definition }));
}

export async function getNuxeraBackendReadiness() {
  const signals = await Promise.all(READINESS_TABLES.map(checkTable));
  const available = signals.filter((signal) => signal.ready).length;
  const unavailable = signals.length - available;

  return {
    status: unavailable > 0 ? 'blocked-by-backend-readiness' : 'backend-readiness-visible',
    ready: unavailable === 0,
    summary: {
      total: signals.length,
      available,
      unavailable,
      readiness: Math.round((available / signals.length) * 100)
    },
    signals,
    guardrails: [
      'Read-only backend readiness; no aplica SQL ni cambia RLS.',
      'Tabla visible no sustituye verificacion RLS con identidades controladas.',
      'Usar esta senal como preflight antes de habilitar writes productivos.'
    ]
  };
}