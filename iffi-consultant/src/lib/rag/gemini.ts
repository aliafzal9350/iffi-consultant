/**
 * Minimal Gemini REST client (no SDK): one embedding call per question and one generation call per answer.
 * The key stays on the server (GEMINI_API_KEY); every call has a timeout so a slow API cannot hang a request.
 */
import 'server-only';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
export const CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-2';

export class GeminiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('GEMINI_API_KEY is not set', 503);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const json = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok) throw new GeminiError(json.error?.message ?? `HTTP ${res.status}`, res.status);
    return json;
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new GeminiError(ctrl.signal.aborted ? 'timeout' : String(e), 504);
  } finally {
    clearTimeout(timer);
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const r = await call<{ embedding: { values: number[] } }>(
    `${EMBED_MODEL}:embedContent`,
    { content: { parts: [{ text }] }, taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 },
    5000,
  );
  return r.embedding.values;
}

export interface Turn {
  role: 'user' | 'model';
  text: string;
}

export interface Generation {
  text: string;
  finishReason: string;
  tokens?: number;
}

export async function generate(system: string, turns: Turn[]): Promise<Generation> {
  const r = await call<{
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
    usageMetadata?: { totalTokenCount?: number };
  }>(
    `${CHAT_MODEL}:generateContent`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 900,
        thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING || 'low' },
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    },
    25000,
  );
  if (r.promptFeedback?.blockReason) return { text: '', finishReason: `BLOCKED_${r.promptFeedback.blockReason}` };
  const c = r.candidates?.[0];
  const text = (c?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  return { text, finishReason: c?.finishReason ?? 'UNKNOWN', tokens: r.usageMetadata?.totalTokenCount };
}
