/** IFFI's payment QR code, uploaded by an admin in Staff -> Settings. Signed-in users only, through a short signed link. */
import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth/dal';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET } from '@/lib/portal/files';
import { getPaymentSettings } from '@/lib/portal/settings';

export const dynamic = 'force-dynamic';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  if (!(await getProfile())) return new NextResponse('Sign in to see the payment details.', { status: 401, headers: PRIVATE });
  const { qrPath } = await getPaymentSettings();
  if (!qrPath) return new NextResponse('No QR code yet', { status: 404, headers: PRIVATE });
  const { data } = await createAdminClient().storage.from(BUCKET).createSignedUrl(qrPath, 300);
  if (!data) return new NextResponse('The QR code could not be loaded.', { status: 502, headers: PRIVATE });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: PRIVATE });
}
