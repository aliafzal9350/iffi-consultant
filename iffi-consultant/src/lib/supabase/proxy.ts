/**
 * Runs from src/proxy.ts on /portal and /staff only. Two jobs:
 *  1. refresh the Supabase session cookie (access tokens are short-lived),
 *  2. an optimistic redirect to sign-in for visitors without a valid session.
 * This is NOT the security check - every page and Server Function also calls requireUser()/requireStaff()
 * (src/lib/auth/dal.ts), and row-level security guards the data itself.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseConfigured, supabaseKeys } from './keys';
import { PORTAL_HOME, SIGN_IN_PATH } from '@/lib/auth/redirects';

export async function updateSession(request: NextRequest) {
  // Until Supabase is set up, every portal and staff URL lands on the sign-in page, which explains that online
  // accounts are not open yet and points to WhatsApp - instead of an error page behind every "Get started" button.
  if (!supabaseConfigured()) {
    if (request.nextUrl.pathname === SIGN_IN_PATH) return NextResponse.next({ request });
    const target = request.nextUrl.clone();
    target.pathname = SIGN_IN_PATH;
    target.search = '';
    return NextResponse.redirect(target);
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseKeys();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() verifies the JWT signature; getSession() would trust whatever the cookie says.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;
  const onSignIn = pathname === SIGN_IN_PATH;

  if (!signedIn && !onSignIn) return redirectKeepingCookies(request, response, SIGN_IN_PATH, pathname + search);
  if (signedIn && onSignIn) return redirectKeepingCookies(request, response, PORTAL_HOME);
  return response;
}

/** A redirect must carry the refreshed cookies too, or the browser keeps the stale session. */
function redirectKeepingCookies(request: NextRequest, from: NextResponse, path: string, next?: string) {
  const target = request.nextUrl.clone();
  target.pathname = path;
  target.search = next ? `?next=${encodeURIComponent(next)}` : '';
  const redirect = NextResponse.redirect(target);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
