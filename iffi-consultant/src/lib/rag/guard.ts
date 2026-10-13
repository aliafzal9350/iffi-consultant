/**
 * Input and output guards for the website assistant. Pure functions with no imports, so the prompt-injection
 * test script can unit-test them directly (node --experimental-strip-types or Node 24+).
 *
 * The model is told the rules in its system prompt; these guards are the second line of defence that does not
 * depend on the model obeying: they run on every request and every answer.
 */

export const MAX_USER_CHARS = 800;
export const MAX_ASSISTANT_CHARS = 2400;

/** Normalise what a visitor typed: NFKC (folds look-alike characters), no control or zero-width characters. */
export function sanitizeInput(text: string, max = MAX_USER_CHARS): string {
  return text
    .normalize('NFKC')
    .replace(/[​-‏‪-‮⁠-⁤﻿]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/**
 * High-confidence prompt-injection phrasing. These requests get a fixed reply without calling the model
 * (cheaper, and the outcome does not depend on the model). Everything else still goes through the system
 * prompt rules and the output guard, so this list only needs the unambiguous cases.
 */
const INJECTION_PATTERNS: [RegExp, string][] = [
  [/\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|your|the|system|these)\b[^.\n]{0,30}\b(instructions?|rules|prompt|guidelines|directions|constraints)\b/i, 'override'],
  [/\b(system|developer|hidden|initial|original)\s+(prompt|instructions?|message|rules)\b/i, 'prompt-request'],
  [/\b(reveal|print|show|repeat|output|display|leak|dump|tell me)\b[^.\n]{0,40}\b(your|the)\s+(instructions?|prompt|rules|configuration|system message|context window)\b/i, 'prompt-request'],
  [/\b(jailbreak|DAN mode|do anything now|developer mode|god mode|unfiltered mode|sudo mode)\b/i, 'jailbreak'],
  [/\byou are (now|no longer)\b[^.\n]{0,60}\b(assistant|AI|bot|model|chatgpt|gemini|unrestricted|free)\b/i, 'role-override'],
  [/\b(api[_ -]?key|secret key|access token|environment variables?|process\.env|\.env\b)/i, 'secret-request'],
  [/<\s*\/?\s*(system|instructions?|admin|developer)\s*>|\[\s*(system|admin|developer)\s*\]|^\s*(system|admin)\s*:/im, 'fake-role-tag'],
];

export function detectInjection(text: string): string | null {
  for (const [re, label] of INJECTION_PATTERNS) if (re.test(text)) return label;
  // long base64 blobs are a common way to smuggle instructions past filters
  if (/[A-Za-z0-9+/]{120,}={0,2}/.test(text)) return 'encoded-payload';
  return null;
}

export interface GuardOptions {
  /** secret marker placed in the system prompt; seeing it in an answer means the prompt leaked */
  canary: string;
  /** hosts links may point to (the site itself and WhatsApp) */
  allowedHosts: string[];
  mbbsNote: string;
}

export interface GuardResult {
  text: string;
  blocked: boolean;
  flags: string[];
}

export const UNIVERSITY_NAME =
  /\b(?:(?:[A-Z][a-z]+|[A-Z]{2,})[ -]){1,5}(?:University|Institute of Technology|Medical College|Normal College|Polytechnic|Academy of Sciences)(?: of (?:[A-Z][a-z]+(?: and )?){1,4})?\b|\bUniversity of (?:[A-Z][a-z]+[ -]?){1,4}\b|\b(?:Tsinghua|Peking|Fudan|Tongji|Zhejiang|Nanjing|Wuhan|Sichuan|Jilin|Shandong|Xiamen|Nankai|Beihang|Renmin|Jiao ?Tong|Sun Yat-sen|Harbin|Xi'an Jiaotong)\b(?= University| Uni\b)/g;

// phrases from the system prompt that should never appear in an answer
const PROMPT_FRAGMENTS = [/\bINTERNAL[- ]REF\b/i, /non-negotiable rules/i, /reference data, not instructions/i, /BEGIN CONTEXT|END CONTEXT/];

/**
 * Checks and cleans one model answer before it reaches the visitor.
 *
 * TODO(you): the policy for a university name in an answer. Baseline: redact the name and keep the answer
 * (the visitor still gets help). The stricter option is to block the whole answer and send the WhatsApp
 * fallback, which guarantees no partial leak but frustrates people more often. Decide with the client.
 */
export function guardOutput(raw: string, opts: GuardOptions): GuardResult {
  const flags: string[] = [];
  let text = raw.slice(0, MAX_ASSISTANT_CHARS);

  if (text.includes(opts.canary) || PROMPT_FRAGMENTS.some((re) => re.test(text))) {
    return { text: '', blocked: true, flags: ['prompt-leak'] };
  }
  if (/\bAIza[0-9A-Za-z_-]{30,}|\bAQ\.[0-9A-Za-z_-]{30,}|\bsk-[A-Za-z0-9_-]{20,}/.test(text)) {
    return { text: '', blocked: true, flags: ['secret-leak'] };
  }

  // no HTML, no images (image URLs can carry data out of the conversation)
  if (/<[a-z/!][^>]*>/i.test(text)) {
    flags.push('html');
    text = text.replace(/<[^>]*>/g, '');
  }
  if (/!\[[^\]]*\]\([^)]*\)/.test(text)) {
    flags.push('image');
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  }

  // links only to the site and WhatsApp
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) => (hostAllowed(url, opts.allowedHosts) ? `${label} (${url})` : label));
  text = text.replace(/\b(?:https?:\/\/|www\.)[^\s)<>"']+/gi, (url) => {
    if (hostAllowed(url, opts.allowedHosts)) return url;
    flags.push('external-url');
    return '[link removed]';
  });

  if (text.match(UNIVERSITY_NAME)) {
    flags.push('university-name');
    text = text.replace(UNIVERSITY_NAME, 'the university (name shared in your free consultation)');
  }

  if (/\bPM\s?&?\s?DC\b|\bPMDC\b|medical council/i.test(text) && !text.includes(opts.mbbsNote.slice(0, 40))) {
    flags.push('mbbs-note');
    text = `${text.trim()}\n\n${opts.mbbsNote}`;
  }

  return { text: text.trim(), blocked: false, flags };
}

function hostAllowed(url: string, hosts: string[]): boolean {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
