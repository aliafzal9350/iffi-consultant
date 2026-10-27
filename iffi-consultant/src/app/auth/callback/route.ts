/**
 * GET /auth/callback?code=...&next=... - Google -> Supabase -> here.
 * Swaps the one-time code for a session cookie, sets the role (owners in ADMIN_EMAILS, then the Team list), then redirects.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerEmail } from '@/lib/auth/dal';
import { SIGN_IN_PATH, nextPathAfterSignIn, safeNext, siteUrl } from '@/lib/auth/redirects';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const back = (reason: string) => NextResponse.redirect(siteUrl(`${SIGN_IN_PATH}?error=${reason}`, request));

  if (!code) return back(searchParams.get('error') ? 'cancelled' : 'missing-code');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return back('exchange-failed');

  const admin = createAdminClient();
  const meta = data.user.user_metadata ?? {};
  // The database trigger normally creates the row; this covers accounts made before the trigger existed.
  // ignoreDuplicates = never overwrite a name the student has already corrected.
  await admin.from('profiles').upsert(
    { id: data.user.id, email: data.user.email ?? '', full_name: meta.full_name ?? meta.name ?? null, avatar_url: meta.avatar_url ?? meta.picture ?? null },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // Role is decided at every sign-in: owners (ADMIN_EMAILS) are admins, then the Team list, else student.
  const email = (data.user.email ?? '').toLowerCase();
  const { data: member } = await admin.from('team_members').select('role').eq('email', email).maybeSingle();
  const role: 'student' | 'staff' | 'admin' = isOwnerEmail(email) ? 'admin' : ((member?.role as 'staff' | 'admin' | undefined) ?? 'student');
  const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', data.user.id);
  if (roleError) console.error('[auth/callback] role sync failed', roleError.message);

  const [{ data: study }, { count: applications }] = await Promise.all([
    supabase.from('study_profiles').select('completed_at').eq('user_id', data.user.id).maybeSingle(),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id),
  ]);

  const path = nextPathAfterSignIn({
    role,
    requested: safeNext(searchParams.get('next')),
    profileComplete: Boolean(study?.completed_at),
    hasApplication: (applications ?? 0) > 0,
  });
  const response = NextResponse.redirect(siteUrl(path, request));
  // A brand-new student account: let the browser count one sign-up (Meta CompleteRegistration) on the next page.
  // Supabase stamps created_at and last_sign_in_at together on the first sign-in only.
  const { created_at, last_sign_in_at } = data.user;
  const firstSignIn = Boolean(last_sign_in_at) && Date.parse(last_sign_in_at!) - Date.parse(created_at) < 60_000;
  if (firstSignIn && role === 'student') {
    response.cookies.set('iffi_signup', '1', { path: '/', maxAge: 600, sameSite: 'lax', secure: true });
  }
  return response;
}
