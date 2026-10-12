import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, adminEnabled, checkPassword, createSessionToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Set ADMIN_PASSWORD and ADMIN_SECRET (32+ characters) in .env.local, then restart the dev server.' },
      { status: 503 },
    );
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ success: false, error: 'Incorrect passcode. Please try again.' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, message: 'Authentication successful' });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out' });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
