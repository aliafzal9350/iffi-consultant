/**
 * Sliding-window rate limits for the assistant: per visitor (IP) per minute and per day, plus a site-wide
 * daily cap that protects the Gemini quota and bill.
 *
 * In memory, so on Vercel each serverless instance counts separately: fine as a first line, but for real
 * traffic move the counters to a shared store (Upstash Redis or Vercel KV) with the same interface.
 */
import 'server-only';

const PER_MINUTE = Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 8);
const PER_DAY = Number(process.env.CHAT_RATE_LIMIT_PER_DAY || 60);
const GLOBAL_PER_DAY = Number(process.env.CHAT_GLOBAL_DAILY_CAP || 1500);

const hits = new Map<string, number[]>();
let global: number[] = [];

export interface Limit {
  ok: boolean;
  retryAfter: number;
  reason?: 'minute' | 'day' | 'global';
}

export function rateLimit(ip: string, now = Date.now()): Limit {
  const day = 86_400_000;
  global = global.filter((t) => now - t < day);
  if (global.length >= GLOBAL_PER_DAY) return { ok: false, retryAfter: 3600, reason: 'global' };

  const list = (hits.get(ip) ?? []).filter((t) => now - t < day);
  const lastMinute = list.filter((t) => now - t < 60_000);
  if (lastMinute.length >= PER_MINUTE) return { ok: false, retryAfter: Math.ceil((60_000 - (now - lastMinute[0])) / 1000), reason: 'minute' };
  if (list.length >= PER_DAY) return { ok: false, retryAfter: Math.ceil((day - (now - list[0])) / 1000), reason: 'day' };

  list.push(now);
  global.push(now);
  hits.set(ip, list);
  if (hits.size > 10_000) hits.delete(hits.keys().next().value!); // bound memory
  return { ok: true, retryAfter: 0 };
}
