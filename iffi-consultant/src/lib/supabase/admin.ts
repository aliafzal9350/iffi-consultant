/**
 * Supabase with the SECRET key: bypasses row-level security. Server-only, and only for jobs the visitor must not
 * be able to do themselves (setting a staff role, later: verifying a payment). Never import from a client file.
 */
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseKeys } from './keys';

export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('SUPABASE_SECRET_KEY is not set.');
  return createSupabaseClient(supabaseKeys().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
