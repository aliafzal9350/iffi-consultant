/** Where people land around sign-in. Pure functions, shared by proxy.ts and the auth callback. */

export const SIGN_IN_PATH = '/portal/sign-in';
export const PORTAL_HOME = '/portal';
export const STAFF_HOME = '/staff';

/**
 * Only same-site paths are allowed as ?next= targets. Without this, a link like
 * /portal/sign-in?next=https://evil.example sends a student to a look-alike site straight after Google sign-in.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  if (next.startsWith(SIGN_IN_PATH) || next.startsWith('/auth/')) return null;
  return next;
}

export const QUIZ_PATH = '/portal/start';
/** signed in, tried to open the staff portal, not on the team */
export const NO_TEAM_ACCESS = '/portal/team-access';
export const MATCHES_PATH = '/portal/matches';

export interface SignInContext {
  role: 'student' | 'staff' | 'admin';
  /** the page they were trying to open before signing in (already passed through safeNext), or null */
  requested: string | null;
  /** true once the student has finished the profile quiz */
  profileComplete: boolean;
  /** true once the student has started at least one application */
  hasApplication: boolean;
}

/**
 * The first page after Google sign-in. The funnel always moves forward:
 *  - staff and admins -> the staff portal (or the staff page they asked for)
 *  - students who tried to open the staff portal -> a page explaining how to get team access
 *  - students without a profile -> the quiz, remembering the page they wanted (e.g. "Apply" on a programme)
 *  - students with a profile -> the page they wanted, else their application, else their matches
 */
export function nextPathAfterSignIn(ctx: SignInContext): string {
  if (ctx.role !== 'student') return ctx.requested?.startsWith(STAFF_HOME) ? ctx.requested : STAFF_HOME;
  if (ctx.requested?.startsWith(STAFF_HOME)) return NO_TEAM_ACCESS;
  if (!ctx.profileComplete) return ctx.requested ? `${QUIZ_PATH}?next=${encodeURIComponent(ctx.requested)}` : QUIZ_PATH;
  if (ctx.requested && ctx.requested !== PORTAL_HOME) return ctx.requested;
  return ctx.hasApplication ? PORTAL_HOME : MATCHES_PATH;
}
