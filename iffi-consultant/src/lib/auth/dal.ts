/**
 * Data Access Layer: the real authorisation checks. Every portal page and Server Function starts with
 * requireUser() or requireStaff(). cache() makes repeated calls in one render cost a single lookup.
 */
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NO_TEAM_ACCESS, SIGN_IN_PATH, STAFF_HOME } from './redirects';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  role: Role;
}

export type Role = 'student' | 'staff' | 'admin';
export const isTeam = (role: Role) => role === 'staff' || role === 'admin';

/** The signed-in user's id from a verified JWT (getClaims checks the signature), or null. */
const sessionUserId = cache(async (): Promise<string | null> => {
  const { data } = await (await createClient()).auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** The signed-in visitor's profile, or null. Reads the row through RLS. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await sessionUserId();
  if (!userId) return null;
  const { data: profile } = await (await createClient())
    .from('profiles')
    .select('id, email, full_name, avatar_url, whatsapp, role')
    .eq('id', userId)
    .single();
  return (profile as Profile | null) ?? null;
});

export async function requireUser(): Promise<Profile> {
  const profile = await getProfile();
  if (profile) return profile;
  // Signed in but no profile row (database unreachable, or the migration was not run). Redirecting to sign-in
  // here would loop: proxy.ts sends signed-in visitors on the sign-in page straight back to /portal.
  if (await sessionUserId()) throw new Error('Your account is signed in but its profile could not be loaded.');
  redirect(SIGN_IN_PATH);
}

/** Staff and admins. Anyone else signed in gets a page explaining how to get team access. */
export async function requireStaff(): Promise<Profile> {
  const profile = await requireUser();
  if (!isTeam(profile.role)) redirect(NO_TEAM_ACCESS);
  return profile;
}

/** Admins only (the Team page and anything else that changes who can do what). */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (profile.role !== 'admin') redirect(STAFF_HOME);
  return profile;
}

/**
 * Owners: ADMIN_EMAILS="a@x.com, b@y.com" in the environment. Always admins, cannot be removed from the Team page,
 * so the business can never lock itself out. (STAFF_EMAILS is read too, for setups made before roles existed.)
 */
export function ownerEmails(): string[] {
  return [process.env.ADMIN_EMAILS, process.env.STAFF_EMAILS]
    .join(',')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isOwnerEmail = (email: string | null | undefined) => Boolean(email) && ownerEmails().includes(email!.toLowerCase());
