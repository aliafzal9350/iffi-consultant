/** Safe wrappers: storage can be unavailable (private mode, blocked cookies) or absent (server render). */

type Area = 'local' | 'session';

function area(kind: Area): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Area = 'local'): T {
  try {
    const raw = area(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = 'local'): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked - the feature keeps working for this page view */
  }
}

export function removeKey(key: string, kind: Area = 'local'): void {
  try {
    area(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  shortlist: 'gj:shortlist',
  compare: 'gj:compare',
  consent: 'gj:consent',
  eligibility: 'gj:eligibility',
  checklist: 'gj:checklist',
  portalQuiz: 'gj:portal-quiz',
} as const;
