/**
 * Minimal Groq REST client (OpenAI-compatible chat completions, no SDK) for the website assistant.
 * Answers come from GROQ_MODEL (falling back to GROQ_FALLBACK_MODEL when the first is rate-limited or down), and every
 * question is scored by Llama Prompt Guard 2, a classifier trained to spot prompt-injection and jailbreak attempts.
 * The key stays on the server (GROQ_API_KEY); every call has a timeout so a slow API cannot hang a request.
 */
import 'server-only';
import type { Generation, Turn } from './gemini';

const API = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
const GUARD_MODEL = process.env.GROQ_GUARD_MODEL || 'meta-llama/llama-prompt-guard-2-86m';

export class GroqError extends Error {
  /** seconds Groq asks us to wait before retrying (rate limits), when it says */
  constructor(message: string, readonly status: number, readonly retryAfter: number | null = null) {
    super(message);
  }
}

interface Completion {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

async function complete(body: Record<string, unknown>, timeoutMs: number): Promise<Completion> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqError('GROQ_API_KEY is not set', 503);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const json = (await res.json()) as Completion;
    if (!res.ok) {
      const message = json.error?.message ?? `HTTP ${res.status}`;
      // "Please try again in 5.79s" (tokens-per-minute limit), or the retry-after header
      const wait = Number(message.match(/try again in ([\d.]+)s/)?.[1] ?? res.headers.get('retry-after') ?? NaN);
      throw new GroqError(message, res.status, Number.isFinite(wait) ? wait : null);
    }
    return json;
  } catch (e) {
    if (e instanceof GroqError) throw e;
    throw new GroqError(ctrl.signal.aborted ? 'timeout' : String(e), 504);
  } finally {
    clearTimeout(timer);
  }
}

async function answerWith(model: string, system: string, turns: Turn[]): Promise<Generation> {
  const r = await complete(
    {
      model,
      messages: [{ role: 'system', content: system }, ...turns.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text }))],
      temperature: 0.3,
      // gpt-oss reasons before answering; reasoning tokens count towards this limit, and are not returned
      max_completion_tokens: 1400,
      reasoning_effort: process.env.GROQ_REASONING || 'low',
      include_reasoning: false,
    },
    25000,
  );
  const c = r.choices?.[0];
  const finish = c?.finish_reason ?? 'unknown';
  return { text: c?.message?.content ?? '', finishReason: finish === 'content_filter' ? 'BLOCKED_content_filter' : finish.toUpperCase(), tokens: r.usage?.total_tokens };
}

/**
 * One answer: the main model, then the smaller one if the main model is rate-limited, overloaded or timing out.
 * Each model has its own tokens-per-minute budget (8,000 on Groq's free plan, about 4 questions a minute).
 */
export async function generate(system: string, turns: Turn[]): Promise<Generation> {
  try {
    return await answerWith(GROQ_MODEL, system, turns);
  } catch (e) {
    const retry = e instanceof GroqError && (e.status === 429 || e.status >= 500);
    if (!retry || FALLBACK_MODEL === GROQ_MODEL) throw e;
    return answerWith(FALLBACK_MODEL, system, turns);
  }
}

/** Last attempt after every model failed: wait as long as Groq asked (if that is short), then try the main model again. */
export async function retryAfterWait(system: string, turns: Turn[], error: unknown, maxWaitS = 15): Promise<Generation | null> {
  if (!(error instanceof GroqError) || error.retryAfter == null || error.retryAfter > maxWaitS) return null;
  await new Promise((r) => setTimeout(r, Math.ceil(error.retryAfter! * 1000) + 250));
  return answerWith(GROQ_MODEL, system, turns).catch(() => answerWith(FALLBACK_MODEL, system, turns));
}

/**
 * Probability (0-1) that a message is a prompt-injection or jailbreak attempt, from Llama Prompt Guard 2.
 * Returns null if the classifier is unavailable: the caller then relies on the other defences.
 */
export async function injectionScore(text: string): Promise<number | null> {
  try {
    const r = await complete({ model: GUARD_MODEL, messages: [{ role: 'user', content: text }] }, 4000);
    const score = Number(r.choices?.[0]?.message?.content);
    return Number.isFinite(score) ? score : null;
  } catch {
    return null;
  }
}
