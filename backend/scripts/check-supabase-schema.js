import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

const requiredTables = {
  users: ['id', 'email', 'profile_type', 'created_at'],
  service_orders: ['id', 'user_id', 'service_type', 'status', 'amount', 'created_at', 'completed_at', 'metadata'],
  documents: ['id', 'order_id', 'filename', 'storage_path', 'uploaded_at'],
  document_reviews: ['id', 'document_id', 'order_id', 'status', 'score', 'summary', 'findings', 'missing_items', 'extracted_data', 'warnings', 'created_at'],
  data_room_shares: ['id', 'order_id', 'owner_user_id', 'recipient_user_id', 'recipient_name', 'recipient_email', 'status', 'access_token', 'created_at', 'accepted_at', 'expires_at', 'last_viewed_at'],
  audit_logs: ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'order_id', 'ip_address', 'user_agent', 'metadata', 'compliance_relevant', 'created_at'],
  commissions: ['id', 'order_id', 'amount', 'status', 'paid_at', 'created_at'],
  funder_interests: ['id', 'order_id', 'funder_user_id', 'status', 'notes', 'created_at'],
  funder_contact_requests: ['id', 'order_id', 'funder_user_id', 'funder_email', 'share_id', 'status', 'reason', 'notes', 'created_at', 'updated_at'],
  information_requests: ['id', 'order_id', 'requester_user_id', 'requester_email', 'title', 'description', 'priority', 'status', 'document_type', 'response', 'evidence_document_id', 'created_at'],
  information_request_events: ['id', 'request_id', 'order_id', 'actor_user_id', 'action', 'status', 'note', 'metadata', 'created_at']
};

let hasError = false;

function report(ok, message) {
  console.log(`${ok ? 'OK' : 'ERROR'} - ${message}`);
  if (!ok) hasError = true;
}

async function checkTable(table, requiredColumns) {
  const { error } = await supabaseAdmin
    .from(table)
    .select(requiredColumns.join(','))
    .limit(1);

  report(!error, `${table}${error ? `: ${error.message}` : ''}`);
}

async function checkStorageBucket(bucketId) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucketId);
  report(!error && data?.id === bucketId, `storage bucket ${bucketId}${error ? `: ${error.message}` : ''}`);
}

for (const [table, columns] of Object.entries(requiredTables)) {
  await checkTable(table, columns);
}

await checkStorageBucket('documents');

if (hasError) {
  console.log('\nRun these SQL files in Supabase SQL Editor, then retry this check:');
  console.log('- supabase_production_ready.sql');
  console.log('- supabase_institutional_expansion.sql');
  console.log('- supabase_information_requests.sql');
  console.log('- supabase_fase7_otorgantes.sql');
  console.log('- supabase_fase9_document_hash.sql');
  console.log('\nFast path for the current missing items:');
  console.log('- supabase_pendiente_010626.sql');
  process.exit(1);
}

console.log('\nSupabase schema looks ready for NSD production flow.');
