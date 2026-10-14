/**
 * The blank forms students download, fill in and upload: IFFI's application form (Word) and the Foreigner Physical
 * Examination Form (PDF). Signed-in students only: the application form carries IFFI's China contact details.
 * The files live in private/forms (next.config.mjs traces them into the server bundle).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth/dal';
import { TEMPLATES } from '@/lib/portal/documents';

const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const known = Object.values(TEMPLATES).find((t) => t.file === file);
  if (!known) return new NextResponse('Not found', { status: 404 });
  if (!(await getProfile())) return new NextResponse('Sign in to download this form.', { status: 401 });

  try {
    const body = await readFile(path.join(process.cwd(), 'private', 'forms', known.file));
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': TYPES[known.file.split('.').pop() ?? ''] ?? 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${known.file}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[portal/forms] missing file', known.file, e instanceof Error ? e.message : e);
    return new NextResponse('This form is not available right now.', { status: 500 });
  }
}
