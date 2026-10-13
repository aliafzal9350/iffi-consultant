'use client';
/** Supabase in the browser (sign-in button, later the document uploader). createBrowserClient is a singleton. */
import { createBrowserClient } from '@supabase/ssr';
import { supabaseKeys } from './keys';

export function createClient() {
  const { url, publishableKey } = supabaseKeys();
  return createBrowserClient(url, publishableKey);
}
