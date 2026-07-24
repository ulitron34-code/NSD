import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), 'sql_migrations_pendientes');
if (!existsSync(directory)) {
  console.error(`ERROR - missing ${directory}`);
  process.exit(1);
}

const files = readdirSync(directory).filter((name) => name.endsWith('.sql')).sort();
const requiredFiles = [
  '2026-07-10_core_tables_rls.sql',
  '2026-07-13_satellite_tables_rls.sql',
  '2026-07-14_rag_vector_embeddings.sql',
  '2026-07-16_nuxera_workspace_states.sql',
  '2026-07-17_nuxera_evidence_links.sql',
  '2026-07-17_nuxera_admin_controls.sql'
];
const missing = requiredFiles.filter((name) => !files.includes(name));

if (missing.length) {
  console.error(`ERROR - pending migration missing: ${missing.join(', ')}`);
  process.exit(1);
}

for (const name of files) {
  const content = readFileSync(resolve(directory, name), 'utf8').trim();
  if (!content || !/\b(create|alter|drop|comment|grant|revoke|insert|update|delete|do)\b/i.test(content)) {
    console.error(`ERROR - invalid or empty SQL migration: ${name}`);
    process.exit(1);
  }
}

console.log(`OK - ${files.length} pending Supabase migration files are present and non-empty.`);
