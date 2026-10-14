/**
 * POST /api/chat - the website assistant (retrieval-augmented, Gemini).
 *
 * Request:  { messages: [{ role: 'user' | 'assistant', content: string, sig?: string }] }  (last one from the user)
 * Response: { answer, sources: [{ n, title, url }], sig }
 *
 * Defences, in order: rate limit -> size and shape checks -> input normalisation -> assistant turns must carry the
 * server's signature (so a client cannot invent earlier "assistant" messages) -> high-confidence injection phrases
 * get a fixed reply without the model -> grounded system prompt with a canary -> output guard on every answer.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { site } from '@/data/content';
import { GeminiError, generate, type Turn } from '@/lib/rag/gemini';
import { MAX_ASSISTANT_CHARS, MAX_USER_CHARS, detectInjection, guardOutput, sanitizeInput } from '@/lib/rag/guard';
import { CANARY, REPLIES, buildSystemPrompt } from '@/lib/rag/prompt';
import { rateLimit } from '@/lib/rag/ratelimit';
import { retrieve } from '@/lib/rag/retrieve';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 24_000;
const MAX_TURNS = 12;
const HISTORY_TURNS = 6;
const ALLOWED_HOSTS = [new URL(site.seo.siteUrl).hostname.replace(/^www\./, ''), 'wa.me'];

function signingKey(): string {
  return process.env.CHAT_SIGNING_SECRET || createHash('sha256').update(`chat-signing:${process.env.GEMINI_API_KEY ?? ''}`).digest('hex');
}
const sign = (text: string) => createHmac('sha256', signingKey()).update(text).digest('base64url');
function verified(text: string, sig: unknown): boolean {
  if (typeof sig !== 'string') return false;
  const a = Buffer.from(sign(text));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

const reply = (answer: string, extra: Record<string, unknown> = {}, status = 200) =>
  NextResponse.json({ answer, sources: [], sig: sign(answer), ...extra }, { status, headers: { 'cache-control': 'no-store' } });
const fail = (error: string, status: number, headers: Record<string, string> = {}) =>
  NextResponse.json({ error, fallback: site.contact.whatsappUrl }, { status, headers: { 'cache-control': 'no-store', ...headers } });

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

interface InMessage {
  role: 'user' | 'assistant';
  content: string;
  sig?: string;
}

export async function POST(req: Request) {
  const started = Date.now();
  const limit = rateLimit(clientIp(req));
  if (!limit.ok) return fail('Too many questions. Please wait a little or continue on WhatsApp.', 429, { 'retry-after': String(limit.retryAfter) });
  if (!process.env.GEMINI_API_KEY) return fail('Answers are not available right now.', 503);
  if (!req.headers.get('content-type')?.includes('application/json')) return fail('Expected JSON.', 415);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return fail('Message too long.', 413);
  let body: { messages?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail('Invalid JSON.', 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_TURNS) return fail('Invalid conversation.', 400);

  const flags: string[] = [];
  const messages: InMessage[] = [];
  for (const m of body.messages as Record<string, unknown>[]) {
    if (!m || typeof m.content !== 'string' || (m.role !== 'user' && m.role !== 'assistant')) return fail('Invalid message.', 400);
    if (m.role === 'assistant') {
      // only answers this server produced (and signed) may appear as earlier assistant turns
      if (m.content.length > MAX_ASSISTANT_CHARS || !verified(m.content, m.sig)) {
        flags.push('forged-assistant-turn');
        continue;
      }
      messages.push({ role: 'assistant', content: m.content });
    } else {
      if (m.content.length > MAX_USER_CHARS * 2) return fail('Message too long.', 413);
      const content = sanitizeInput(m.content);
      if (content) messages.push({ role: 'user', content });
    }
  }
  const last = messages.at(-1);
  if (!last || last.role !== 'user') return fail('The last message must be a question.', 400);

  const injection = detectInjection(last.content);
  if (injection) {
    console.info('[chat] injection-filter', injection);
    return reply(REPLIES.injection, { filtered: true });
  }

  // follow-ups ("and the fees?") need the previous question to retrieve the right programme
  const userTurns = messages.filter((m) => m.role === 'user');
  const query = userTurns.slice(-2).map((m) => m.content).join('\n');
  const { sources, semantic } = await retrieve(query);

  const history = messages.slice(-HISTORY_TURNS);
  while (history.length && history[0].role !== 'user') history.shift(); // Gemini wants the user to speak first
  const turns: Turn[] = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.content }));

  let answer: string;
  try {
    const g = await generate(buildSystemPrompt(sources), turns);
    if (!g.text || g.finishReason.startsWith('BLOCKED') || g.finishReason === 'SAFETY' || g.finishReason === 'PROHIBITED_CONTENT') {
      flags.push(`finish-${g.finishReason}`);
      answer = REPLIES.blocked;
    } else {
      const guarded = guardOutput(g.text, { canary: CANARY, allowedHosts: ALLOWED_HOSTS, mbbsNote: site.disclaimers.mbbsRecognition });
      flags.push(...guarded.flags);
      answer = guarded.blocked ? REPLIES.blocked : guarded.text;
    }
  } catch (e) {
    const status = e instanceof GeminiError ? e.status : 500;
    console.error('[chat] generation failed', status, e instanceof Error ? e.message : e);
    return fail(REPLIES.unavailable, status === 429 ? 429 : 502);
  }

  // keep only the sources the answer cites, renumbered in order of first use
  const cited: number[] = [];
  for (const m of answer.matchAll(/\[(\d{1,2})\]/g)) {
    const i = Number(m[1]);
    if (i >= 1 && i <= sources.length && !cited.includes(i)) cited.push(i);
  }
  answer = answer.replace(/\[(\d{1,2})\]/g, (all, d: string) => {
    const pos = cited.indexOf(Number(d));
    return pos >= 0 ? `[${pos + 1}]` : '';
  });
  const out = cited.map((i, k) => ({ n: k + 1, title: sources[i - 1].title, url: sources[i - 1].url }));

  console.info('[chat]', JSON.stringify({ ms: Date.now() - started, sources: sources.length, cited: out.length, semantic, flags }));
  return NextResponse.json({ answer, sources: out, sig: sign(answer) }, { headers: { 'cache-control': 'no-store' } });
}
