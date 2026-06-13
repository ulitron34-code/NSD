import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Document upload stores SHA-256 hash',
    file: resolve(root, 'src/routes/documents.js'),
    patterns: [
      "import crypto from 'node:crypto'",
      "crypto.createHash('sha256')",
      'async function getNextDocumentVersion',
      'version_number: versionNumber',
      'file_hash: fileHash',
      'sha256: fileHash',
      "action: 'document_uploaded'"
    ]
  },
  {
    name: 'Institutional SQL includes document hash',
    file: resolve(root, 'supabase_institutional_expansion.sql'),
    patterns: [
      'add column if not exists file_hash',
      'idx_documents_file_hash'
    ]
  },
  {
    name: 'Fase 9 document hash SQL exists',
    file: resolve(root, 'supabase_fase9_document_hash.sql'),
    patterns: [
      'Fase 9 Document Hash',
      'file_hash',
      'idx_documents_order_hash'
    ]
  },
  {
    name: 'Institutional memo downloadable route exists',
    file: resolve(root, 'src/routes/scoring.js'),
    patterns: [
      "institutional-memo.md",
      'institutional_memo_downloaded',
      'Content-Disposition',
      'text/markdown'
    ]
  },
  {
    name: 'Audit package downloadable routes exist',
    file: resolve(root, 'src/routes/audit.js'),
    patterns: [
      'export.md',
      'export.csv',
      'buildAuditMarkdown',
      'buildAuditCsv',
      'Content-Disposition'
    ]
  },
  {
    name: 'Frontend exposes report and audit downloads',
    file: resolve('E:\\CODEX\\ulitron34-code-nsd-https-github-com', 'src/components/Services/ServiceOrderDetailPanel.jsx'),
    patterns: [
      'downloadInstitutionalMemo',
      'downloadAuditPackage',
      'Descargar memo',
      'Descargar MD',
      'Descargar CSV'
    ]
  },
  {
    name: 'Frontend API supports binary downloads',
    file: resolve('E:\\CODEX\\ulitron34-code-nsd-https-github-com', 'src/services/api.js'),
    patterns: [
      'downloadInstitutionalMemo',
      'exportMarkdown',
      'exportCsv',
      "responseType: 'blob'"
    ]
  },
  {
    name: 'Fase 9 source plan exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 9\\NSD_International_Finance_Fase_9_Backlog_Sprint_Tecnico_4_Semanas.xlsx'),
    patterns: []
  }
];

let failures = 0;

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${check.file}`);
    continue;
  }

  if (check.patterns.length) {
    const content = readFileSync(check.file, 'utf8');
    const missing = check.patterns.filter((pattern) => !content.includes(pattern));

    if (missing.length) {
      failures += 1;
      console.error(`ERROR - ${check.name}: missing ${missing.join(', ')}`);
      continue;
    }
  }

  console.log(`OK - ${check.name}`);
}

if (failures > 0) {
  console.error(`\nFase 9 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 9 local check passed.');
