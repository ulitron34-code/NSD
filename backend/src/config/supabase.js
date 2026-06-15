import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables at startup
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase configuration: SUPABASE_URL and SUPABASE_KEY are required');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase configuration: SUPABASE_SERVICE_ROLE_KEY is required for backend operations');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
