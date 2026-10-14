/**
 * Opens one uploaded file: /portal/files/<document id> (add ?download to save it). The row is read as the visitor,
 * so row-level security decides who may open it (the student who uploaded it, or staff); then a signed link that
 * works for two minutes is made with the secret key. Links in pages never expire, because they point here.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getProfile } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET, UUID } from '@/lib/portal/files';

export const dynamic = 'force-dynamic';

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse('Not found', { status: 404, headers: PRIVATE });
  if (!(await getProfile())) return new NextResponse('Sign in to open this file.', { status: 401, headers: PRIVATE });

  const supabase = await createClient();
  const { data: doc } = await supabase.from('application_documents').select('storage_path, file_name').eq('id', id).maybeSingle();
  if (!doc) return new NextResponse('Not found', { status: 404, headers: PRIVATE });

  const download = request.nextUrl.searchParams.has('download');
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrl(doc.storage_path, 120, download ? { download: doc.file_name } : undefined);
  if (error || !data) return new NextResponse('This file could not be opened. Please try again.', { status: 502, headers: PRIVATE });
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: PRIVATE });
}
