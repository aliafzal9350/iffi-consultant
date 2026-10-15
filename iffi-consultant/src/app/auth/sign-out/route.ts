/** POST /auth/sign-out - a form button, not a link, so a prefetch or a stray <img src> cannot sign anyone out. */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/auth/redirects';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(siteUrl('/', request), { status: 303 });
}
