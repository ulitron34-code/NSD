import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Auth sync does not force solicitante on login',
    file: resolve(root, 'src/routes/auth.js'),
    patterns: [
      'async function upsertPublicUser(user, profileType = null)',
      "select('profile_type')",
      "profileType || existing?.profile_type || user.user_metadata?.profile_type || 'solicitante'",
      'await upsertPublicUser(data.user);'
    ]
  },
  {
    name: 'RBAC role map includes institutional roles and phase 7 permissions',
    file: resolve(root, 'src/middleware/auth.js'),
    patterns: [
      'export const NSD_ROLES',
      'AGENTE_INTERNO',
      'COMPLIANCE_OFFICER',
      'AUDITOR_INTERNO',
      'contact_request:own:decide',
      'data_room:own:share',
      'payment:own:create',
      'regulatory:own:validate',
      'funder:contact:create',
      'information_request:create',
      'export function requirePermission'
    ]
  },
  {
    name: 'Critical routes apply RBAC middleware',
    file: resolve(root, 'src/routes/shares.js'),
    patterns: [
      'requirePermission',
      "requirePermission('data_room:own:share')",
      "requirePermission('data_room:authorized:read')"
    ]
  },
  {
    name: 'Funder routes apply RBAC middleware',
    file: resolve(root, 'src/routes/otorgante.js'),
    patterns: [
      'requirePermission',
      "requirePermission('data_room:authorized:read')",
      "requirePermission('funder:interest:create')",
      "requirePermission('funder:contact:create')"
    ]
  },
  {
    name: 'Information request routes apply RBAC middleware',
    file: resolve(root, 'src/routes/informationRequests.js'),
    patterns: [
      'requirePermission',
      "requirePermission('information_request:own:read')",
      "requirePermission('information_request:create')",
      "requirePermission('information_request:own:update')"
    ]
  },
  {
    name: 'Payment routes apply RBAC middleware and audit events',
    file: resolve(root, 'src/routes/payments.js'),
    patterns: [
      'requirePermission',
      "requirePermission('payment:own:create')",
      "requirePermission('payment:own:confirm')",
      'payment_intent_created',
      'payment_confirmed'
    ]
  },
  {
    name: 'Regulatory routes apply RBAC middleware',
    file: resolve(root, 'src/routes/regulatory.js'),
    patterns: [
      'requirePermission',
      "requirePermission('regulatory:own:validate')"
    ]
  },
  {
    name: 'Fase 8 implementation diagnosis exists',
    file: resolve(codexRoot, 'fase8_diagnostico_implementacion_ia.md'),
    patterns: [
      'Diagnostico',
      'Backlog P0',
      'Backlog P1',
      'Plan 4 semanas'
    ]
  },
  {
    name: 'Fase 8 RBAC matrix exists',
    file: resolve(codexRoot, 'matriz_rbac_nsd_fase8.md'),
    patterns: [
      'Matriz RBAC',
      'Permisos tecnicos',
      'Criterio de cierre RBAC'
    ]
  }
];

let failures = 0;

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${check.file}`);
    continue;
  }

  const content = readFileSync(check.file, 'utf8');
  const missing = check.patterns.filter((pattern) => !content.includes(pattern));

  if (missing.length) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${missing.join(', ')}`);
    continue;
  }

  console.log(`OK - ${check.name}`);
}

if (failures > 0) {
  console.error(`\nFase 8 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 8 local check passed.');
