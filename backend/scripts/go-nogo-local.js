import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const frontendRoot = 'E:\\CODEX\\ulitron34-code-nsd-https-github-com';

function run(name, command, args, cwd = root) {
  try {
    const useWindowsCmd = process.platform === 'win32' && command.endsWith('.cmd');
    const executable = useWindowsCmd ? process.env.ComSpec : command;
    const executableArgs = useWindowsCmd ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args;

    execFileSync(executable, executableArgs, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { name, status: 'GO', detail: 'ok' };
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}${error.message || ''}`.trim();
    return { name, status: 'NO-GO', detail: output.split('\n').slice(-3).join(' ') };
  }
}

function fileContains(name, file, patterns) {
  if (!existsSync(file)) {
    return { name, status: 'NO-GO', detail: `missing ${file}` };
  }

  const content = readFileSync(file, 'utf8');
  const missing = patterns.filter((pattern) => !content.includes(pattern));

  return {
    name,
    status: missing.length ? 'NO-GO' : 'GO',
    detail: missing.length ? `missing ${missing.join(', ')}` : 'ok'
  };
}

const checks = [
  run('Fase 7 local', 'npm.cmd', ['run', 'check:phase7']),
  run('Fase 8 local', 'npm.cmd', ['run', 'check:phase8']),
  run('Fase 9 local', 'npm.cmd', ['run', 'check:phase9']),
  run('Fase 10 local', 'npm.cmd', ['run', 'check:phase10']),
  run('Fase 11 local', 'npm.cmd', ['run', 'check:phase11']),
  run('Fase 12 local', 'npm.cmd', ['run', 'check:phase12']),
  run('Fase 13 local', 'npm.cmd', ['run', 'check:phase13']),
  run('Fase 14 local', 'npm.cmd', ['run', 'check:phase14']),
  run('Fase 15 local', 'npm.cmd', ['run', 'check:phase15']),
  run('Fase 16 local', 'npm.cmd', ['run', 'check:phase16']),
  run('Fase 17 local', 'npm.cmd', ['run', 'check:phase17']),
  run('Solicitante local', 'npm.cmd', ['run', 'check:solicitante']),
  run('International local', 'npm.cmd', ['run', 'check:international']),
  run('Public pages local', 'npm.cmd', ['run', 'check:public-pages']),
  run('RBAC matrix', 'npm.cmd', ['run', 'check:rbac']),
  run('Backend syntax payments', process.execPath, ['--check', 'src/routes/payments.js']),
  run('Backend syntax scoring', process.execPath, ['--check', 'src/routes/scoring.js']),
  run('Frontend production build', 'npm.cmd', ['run', 'build'], frontendRoot),
  fileContains('Document hash SQL', resolve(root, 'supabase_fase9_document_hash.sql'), ['file_hash', 'idx_documents_order_hash']),
  run('Supabase pending SQL package', 'npm.cmd', ['run', 'check:supabase-pending']),
  fileContains('QA report exists', 'E:\\CODEX\\fase9_qa_local_310526.md', ['Go/No-Go', 'Riesgos abiertos'])
];

const failed = checks.filter((check) => check.status !== 'GO');

console.log('# NSD IF - Go/No-Go local');
console.log(`Fecha: ${new Date().toISOString()}`);
console.log('');
console.log('| Check | Resultado | Detalle |');
console.log('|---|---|---|');

for (const check of checks) {
  console.log(`| ${check.name} | ${check.status} | ${String(check.detail || '').replace(/\|/g, '/')} |`);
}

console.log('');
console.log(`Resultado local: ${failed.length ? 'NO-GO' : 'GO'}`);

if (failed.length) {
  process.exitCode = 1;
}
