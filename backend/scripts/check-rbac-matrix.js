import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authFile = resolve(process.cwd(), 'src/middleware/auth.js');
const content = readFileSync(authFile, 'utf8');

const expectations = [
  ['administrador', '*'],
  ['solicitante', 'case:own:create'],
  ['solicitante', 'document:own:upload'],
  ['solicitante', 'payment:own:create'],
  ['solicitante', 'payment:own:confirm'],
  ['solicitante', 'regulatory:own:validate'],
  ['solicitante', 'data_room:own:share'],
  ['solicitante', 'contact_request:own:decide'],
  ['otorgante', 'data_room:authorized:read'],
  ['otorgante', 'funder:interest:create'],
  ['otorgante', 'funder:contact:create'],
  ['otorgante', 'information_request:create'],
  ['inversionista', 'data_room:authorized:read'],
  ['compliance_officer', 'regulatory:assigned:validate'],
  ['auditor_interno', 'audit:read']
];

const forbidden = [
  ['otorgante', 'case:own:create'],
  ['otorgante', 'payment:own:create'],
  ['auditor_interno', 'case:own:update'],
  ['solicitante', 'audit:read']
];

function extractPermissions(role) {
  const match = content.match(new RegExp(`${role}: \\[(.*?)\\]`, 's'));
  if (!match) return [];

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

let failures = 0;

for (const [role, permission] of expectations) {
  const permissions = extractPermissions(role);
  const ok = permissions.includes('*') || permissions.includes(permission);

  if (!ok) {
    failures += 1;
    console.error(`ERROR - ${role} missing ${permission}`);
    continue;
  }

  console.log(`OK - ${role} has ${permission}`);
}

for (const [role, permission] of forbidden) {
  const permissions = extractPermissions(role);
  const hasForbidden = permissions.includes('*') || permissions.includes(permission);

  if (hasForbidden) {
    failures += 1;
    console.error(`ERROR - ${role} should not have ${permission}`);
    continue;
  }

  console.log(`OK - ${role} does not have ${permission}`);
}

if (failures > 0) {
  console.error(`\nRBAC matrix check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nRBAC matrix check passed.');
