/**
 * Auth for the local programme editor (/admin + /api/admin/*).
 *
 * The editor writes src/data/programs.json, so it only makes sense on a developer machine: in production
 * (Vercel's disk is read-only) every admin route answers 404. Locally it needs ADMIN_PASSWORD and
 * ADMIN_SECRET in .env.local; the session cookie is "<expiry>.<HMAC(expiry)>", so it cannot be forged
 * without the secret.
 */
import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'iffi_admin_session';
export const SESSION_SECONDS = 60 * 60 * 8;

export function adminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function secrets(): { password: string; secret: string } | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;
  return password && secret && secret.length >= 32 ? { password, secret } : null;
}

const sameText = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

const sign = (value: string, secret: string) => createHmac('sha256', secret).update(value).digest('hex');

export function checkPassword(input: unknown): boolean {
  const s = secrets();
  return !!s && typeof input === 'string' && sameText(input, s.password);
}

export function createSessionToken(): string {
  const s = secrets();
  if (!s) throw new Error('ADMIN_PASSWORD / ADMIN_SECRET are not set');
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${sign(expires, s.secret)}`;
}

function validToken(token: string | undefined): boolean {
  const s = secrets();
  if (!s || !token) return false;
  const [expires, mac] = token.split('.');
  if (!expires || !mac || Number(expires) < Date.now() / 1000) return false;
  return sameText(mac, sign(expires, s.secret));
}

/** null when the request may continue, otherwise the response to send. */
export async function guardAdmin(): Promise<NextResponse | null> {
  if (!adminEnabled()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  if (!secrets())
    return NextResponse.json(
      { success: false, error: 'Set ADMIN_PASSWORD and ADMIN_SECRET (32+ characters) in .env.local, then restart the dev server.' },
      { status: 503 },
    );
  const jar = await cookies();
  if (!validToken(jar.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ success: false, error: 'Please sign in again.' }, { status: 401 });
  return null;
}
