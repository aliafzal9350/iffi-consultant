/**
 * Build-time flags. Drafts (unapproved FAQ, marketing stats, unverified offices) are hidden everywhere, so local
 * development looks exactly like the live site. To review them, run with NEXT_PUBLIC_SHOW_DRAFTS=1 (never in production).
 */
export const IS_DEV = process.env.NODE_ENV !== 'production';
export const SHOW_DRAFTS = IS_DEV && process.env.NEXT_PUBLIC_SHOW_DRAFTS === '1';
export const GA4_ID: string | undefined =
  process.env.NEXT_PUBLIC_GA4_ID || process.env.VITE_GA4_ID || undefined;
export const FORM_ENDPOINT: string | undefined =
  process.env.NEXT_PUBLIC_FORM_ENDPOINT || process.env.VITE_FORM_ENDPOINT || undefined;
/** The About page has a team section, but there is no team data yet. */
export const FEATURE_TEAM = false;
