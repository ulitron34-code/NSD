import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.cwd(), 'supabase_pendiente_010626.sql');

const required = [
  'document_reviews',
  'extracted_data',
  'warnings',
  'recipient_user_id',
  'funder_contact_requests',
  'information_requests',
  'information_request_events',
  'file_hash',
  'notify pgrst'
];

if (!existsSync(file)) {
  console.error(`ERROR - missing ${file}`);
  process.exit(1);
}

const content = readFileSync(file, 'utf8');
const missing = required.filter((pattern) => !content.includes(pattern));

if (missing.length) {
  console.error(`ERROR - pending SQL missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('OK - supabase_pendiente_010626.sql covers current missing schema items.');
