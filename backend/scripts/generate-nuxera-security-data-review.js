import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const now = new Date();
const stamp = now.toISOString().slice(0, 10);
const backendRoot = process.cwd();
const repoRoot = resolve(backendRoot, '..');
const outputPath = resolve(repoRoot, 'docs/nuxera-migration/docs/migration', `NUXERA_SECURITY_DATA_REVERIFICATION_${stamp}.md`);

function runNodeScript(script, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [resolve(backendRoot, script), ...args], {
      cwd: backendRoot,
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || '').trim()
    };
  }
}

function readGitHead() {
  try {
    return execFileSync('git', ['log', '-1', '--oneline'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return 'unavailable';
  }
}

function statusLine(result) {
  return result.ok ? 'OK' : 'NO-GO';
}

function fenced(text) {
  return `\`\`\`\n${text || '(sin salida)'}\n\`\`\``;
}

function envStatus(names) {
  return names.map((name) => `- ${name}: ${process.env[name] ? 'presente' : 'faltante'}`).join('\n');
}

function summarizeGate(gate) {
  const rows = (gate.domains || []).map((domain) => (
    `| ${domain.label} | ${domain.ready ? 'ready' : 'blocked'} | ${(domain.blockers || []).join('<br>') || 'Sin blockers'} | ${domain.nextAction || ''} |`
  ));
  return [
    `Estado: ${gate.status}`,
    `Readiness: ${gate.summary?.readinessPercent ?? gate.readinessPercent ?? 'n/a'}%`,
    '',
    '| Dominio | Estado | Blockers | Siguiente accion |',
    '|---|---|---|---|',
    ...rows
  ].join('\n');
}

const sqlDrafts = runNodeScript('scripts/check-nuxera-sql-drafts.js');
const identity = runNodeScript('scripts/check-nuxera-public-identity.js');
const httpPlan = runNodeScript('scripts/verify-nuxera-http-readiness.js', ['--plan']);
async function loadProductionGate() {
  try {
    const { getNuxeraProductionReadinessGate } = await import('../src/services/nuxeraProductionReadinessGateService.js');
    return await getNuxeraProductionReadinessGate();
  } catch (error) {
    return {
      status: 'production-readiness-not-evaluated-local-env-missing',
      readinessPercent: 0,
      summary: { readinessPercent: 0 },
      domains: [{
        label: 'Production readiness gate',
        ready: false,
        blockers: [String(error?.message || error)],
        nextAction: 'Run with backend environment variables or query the protected admin endpoint with an admin token.'
      }]
    };
  }
}

const gate = await loadProductionGate();

const requiredHttpEnv = [
  'NUXERA_HTTP_BASE_URL',
  'NUXERA_APPLICANT_TOKEN',
  'NUXERA_APPLICANT_ORDER_ID',
  'NUXERA_GRANTOR_TOKEN',
  'NUXERA_GRANTOR_ORDER_ID',
  'NUXERA_ADMIN_TOKEN',
  'NUXERA_FOREIGN_ORDER_ID'
];

const sections = [
  '# NUXERA - Security/Data Reverification Pack',
  '',
  `Fecha: ${stamp}`,
  `Commit local: ${readGitHead()}`,
  'Modo: no destructivo, sin writes, sin activar delivery, sin cambiar RLS y sin llamar proveedores IA.',
  '',
  '## Resultado ejecutivo',
  '',
  [
    `- SQL drafts locales: ${statusLine(sqlDrafts)}.`,
    `- Identidad publica local: ${statusLine(identity)}.`,
    `- Plan HTTP por rol: ${statusLine(httpPlan)}.`,
    `- Production readiness gate local: ${gate.status}.`,
    '- La evidencia HTTP real por rol requiere tokens de solicitante, otorgante, admin y un order ajeno controlado.',
    '- Mientras falten tokens/ambiente de prueba, este paquete no declara cerrado RLS productivo observado.'
  ].join('\n'),
  '',
  '## Production readiness gate',
  '',
  summarizeGate(gate),
  '',
  '## Variables requeridas para prueba HTTP/RLS observada',
  '',
  envStatus(requiredHttpEnv),
  '',
  '## SQL/RLS draft check',
  '',
  fenced([sqlDrafts.stdout, sqlDrafts.stderr].filter(Boolean).join('\n')),
  '',
  '## Public identity local check',
  '',
  fenced([identity.stdout, identity.stderr].filter(Boolean).join('\n')),
  '',
  '## HTTP/RLS verification plan',
  '',
  fenced([httpPlan.stdout, httpPlan.stderr].filter(Boolean).join('\n')),
  '',
  '## Criterio para cerrar Bloque 2',
  '',
  [
    '1. Ejecutar este paquete con tokens reales controlados en un entorno no productivo o sandbox autorizado.',
    '2. Confirmar mustAllow para solicitante, otorgante autorizado y admin.',
    '3. Confirmar mustDeny para solicitante ajeno, otorgante no autorizado y roles sin admin.',
    '4. Adjuntar salida de `npm run verify:nuxera-http` al release dossier.',
    '5. Mantener writes, delivery y runtime amplio de agente apagados hasta aprobacion humana separada.'
  ].join('\n'),
  '',
  '## Guardrails',
  '',
  [
    '- Este reporte no aplica SQL.',
    '- Este reporte no modifica RLS.',
    '- Este reporte no inserta filas.',
    '- Este reporte no envia notificaciones.',
    '- Este reporte no ejecuta proveedores IA externos.',
    '- Un resultado OK local no reemplaza evidencia observada con identidades reales.'
  ].join('\n'),
  ''
];

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sections.join('\n'), 'utf8');

if (!existsSync(outputPath) || !readFileSync(outputPath, 'utf8').includes('Security/Data Reverification Pack')) {
  throw new Error('Failed to write NUXERA security/data reverification pack.');
}

console.log(`Wrote ${outputPath}`);


