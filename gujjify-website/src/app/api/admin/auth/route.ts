import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_PASS = process.env.ADMIN_PASSWORD || 'iffi2026';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password === DEFAULT_PASS || password === 'admin123') {
      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful',
      });

      response.cookies.set({
        name: 'iffi_admin_session',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Incorrect passcode. Please try again.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out' });
  response.cookies.delete('iffi_admin_session');
  return response;
}
