import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

const KEY_PREFIX = 'nag_';
const KEY_BYTES = 32;

function generateRawKey() {
  return KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString('hex');
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// Returns { id, name, key_prefix, permissions, created_at, expires_at, raw_key }
// raw_key solo se devuelve en creación — nunca se vuelve a mostrar
export async function createApiKey(userId, name, permissions = ['*'], expiresAt = null) {
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12) + '...';

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({ user_id: userId, name, key_hash: keyHash, key_prefix: keyPrefix, permissions, is_active: true, expires_at: expiresAt })
    .select('id, name, key_prefix, permissions, created_at, expires_at')
    .single();

  if (error) throw error;
  return { ...data, raw_key: rawKey };
}

export async function validateApiKey(rawKey) {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, permissions, is_active, expires_at')
    .eq('key_hash', hashKey(rawKey))
    .single();

  if (error || !data || !data.is_active) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // fire-and-forget
  supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then(() => {});

  return data;
}

export async function listApiKeys(userId) {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, permissions, is_active, last_used_at, created_at, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function revokeApiKey(keyId, userId) {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteApiKey(keyId, userId) {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) throw error;
}
