/** Build-time flags. Drafts (unapproved FAQ, marketing stats, unverified offices) render only in development. */
export const IS_DEV = process.env.NODE_ENV !== 'production';
export const SHOW_DRAFTS = IS_DEV;
export const GA4_ID: string | undefined =
  process.env.NEXT_PUBLIC_GA4_ID || process.env.VITE_GA4_ID || undefined;
export const FORM_ENDPOINT: string | undefined =
  process.env.NEXT_PUBLIC_FORM_ENDPOINT || process.env.VITE_FORM_ENDPOINT || undefined;
/** The About page has a team section, but there is no team data yet. */
export const FEATURE_TEAM = false;
