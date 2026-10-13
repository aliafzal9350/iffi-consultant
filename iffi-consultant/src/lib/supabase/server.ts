/**
 * Supabase for Server Components, Server Functions and Route Handlers, acting as the signed-in visitor
 * (their session cookie, so row-level security applies). Create one per request; never share between users.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseKeys } from './keys';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseKeys();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session on the next request instead.
        }
      },
    },
  });
}
