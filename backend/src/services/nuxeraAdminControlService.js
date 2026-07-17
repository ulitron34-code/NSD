import { supabaseAdmin } from '../config/supabase.js';

const ALLOWED_CONTROL_TYPES = new Set(['release_gate', 'incident', 'readiness', 'policy']);
const ALLOWED_SCOPES = new Set(['global', 'applicant', 'grantor', 'admin', 'engine']);
const ALLOWED_SEVERITY = new Set(['low', 'medium', 'high', 'critical']);

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function normalizeSeverity(value) {
  if (value === null || value === undefined || value === '') return null;
  if (!ALLOWED_SEVERITY.has(value)) throw new Error('Severidad NUXERA admin control invalida');
  return value;
}

function validateControl(row) {
  if (!ALLOWED_CONTROL_TYPES.has(row.control_type)) throw new Error('Tipo NUXERA admin control invalido');
  if (!ALLOWED_SCOPES.has(row.scope)) throw new Error('Scope NUXERA admin control invalido');
  normalizeSeverity(row.severity);
}

function mapControl(row) {
  validateControl(row);

  return {
    id: row.id,
    controlType: row.control_type,
    scope: row.scope,
    status: row.status,
    severity: normalizeSeverity(row.severity),
    payload: normalizeObject(row.payload),
    createdBy: row.created_by || null,
    updatedBy: row.updated_by || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    archivedAt: row.archived_at || null,
    guardrails: [
      'Admin control read-only en NU-ADM-CTRL-001.',
      'No activa automatizaciones, permisos ni datos de mercado licenciados.',
      'Cambios de control requieren ruta write dedicada y auditoria aprobada.'
    ]
  };
}

export function buildDefaultAdminControls() {
  return {
    persisted: false,
    controls: [
      {
        id: 'default-feature-flag',
        controlType: 'release_gate',
        scope: 'global',
        status: 'blocked_until_review',
        severity: 'medium',
        payload: {
          label: 'NUXERA feature flag',
          requirement: 'Mantener VITE_NUXERA_EXPERIENCE_ENABLED como compuerta de rollout.',
          rollback: 'Volver a classic/current dashboard sin tocar datos.'
        },
        guardrails: ['Default local; no escribe nuxera_admin_controls.']
      },
      {
        id: 'default-browser-e2e',
        controlType: 'incident',
        scope: 'global',
        status: 'open_environment_blocker',
        severity: 'high',
        payload: {
          label: 'Browser/E2E bloqueado por entorno',
          signal: 'Local browser launch puede fallar con spawn EPERM.',
          response: 'Mantener validacion por lint/build/unit hasta disponer de entorno controlado.'
        },
        guardrails: ['Default local; no cambia pipeline ni permisos.']
      },
      {
        id: 'default-sql-verification',
        controlType: 'readiness',
        scope: 'admin',
        status: 'blocked_by_sql_review',
        severity: 'medium',
        payload: {
          label: 'SQL drafts pendientes',
          requirement: 'Aplicar/verificar SQL en Supabase controlado antes de writes UI.',
          tables: ['nuxera_workspace_states', 'nuxera_evidence_links', 'nuxera_admin_controls']
        },
        guardrails: ['Default local; no aplica migraciones.']
      }
    ],
    guardrails: [
      'No hay nuxera_admin_controls persistidos o la tabla no esta aplicada.',
      'La consola admin puede mostrar controles default read-only.',
      'No existe ruta PATCH/POST para controles en este slice.'
    ]
  };
}

function summarizeControls(controls) {
  return {
    total: controls.length,
    byType: controls.reduce((acc, control) => ({
      ...acc,
      [control.controlType]: (acc[control.controlType] || 0) + 1
    }), {}),
    severities: [...new Set(controls.map((control) => control.severity).filter(Boolean))],
    scopes: [...new Set(controls.map((control) => control.scope))]
  };
}

export async function getAdminControls() {
  const { data, error } = await supabaseAdmin
    .from('nuxera_admin_controls')
    .select('*')
    .is('archived_at', null);

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return buildDefaultAdminControls();

  const controls = rows.map(mapControl);

  return {
    persisted: true,
    controls,
    summary: summarizeControls(controls),
    guardrails: [
      'Admin controls read-only en NU-ADM-CTRL-001.',
      'No write endpoint is exposed for admin controls.',
      'Controls do not directly enable automation, permissions or licensed market data.'
    ]
  };
}