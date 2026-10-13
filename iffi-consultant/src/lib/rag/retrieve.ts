/**
 * Hybrid retrieval over src/data/rag-index.json: Gemini embeddings (semantic) + BM25 (exact words, ids,
 * city names), merged with reciprocal-rank fusion. If the embedding call fails the lexical half still answers.
 */
import 'server-only';
import index from '@/data/rag-index.json';
import { embedQuery } from './gemini';

export interface Chunk {
  id: string;
  title: string;
  url: string;
  text: string;
}

interface Indexed extends Chunk {
  vec: Float32Array;
  terms: Map<string, number>;
  len: number;
}

const STOP = new Set('a an and are as at be by can do does for from how i in is it me my of on or the to what which with you your about there their this that'.split(' '));
const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

let cache: { chunks: Indexed[]; df: Map<string, number>; avgLen: number } | null = null;

function load() {
  if (cache) return cache;
  const df = new Map<string, number>();
  const chunks: Indexed[] = (index.chunks as (Chunk & { vec: { scale: number; b64: string } })[]).map((c) => {
    const bytes = Buffer.from(c.vec.b64, 'base64');
    const q = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length);
    const vec = Float32Array.from(q, (x) => x * c.vec.scale);
    const tokens = tokenize(`${c.title} ${c.text}`);
    const terms = new Map<string, number>();
    for (const t of tokens) terms.set(t, (terms.get(t) ?? 0) + 1);
    for (const t of terms.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return { id: c.id, title: c.title, url: c.url, text: c.text, vec, terms, len: tokens.length };
  });
  cache = { chunks, df, avgLen: chunks.reduce((n, c) => n + c.len, 0) / chunks.length };
  return cache;
}

function bm25(query: string): Indexed[] {
  const { chunks, df, avgLen } = load();
  const q = [...new Set(tokenize(query))];
  const N = chunks.length;
  const scored = chunks.map((c) => {
    let s = 0;
    for (const t of q) {
      const f = c.terms.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      s += idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (c.len / avgLen))));
    }
    return { c, s };
  });
  return scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.c);
}

function cosineRank(qv: number[]): Indexed[] {
  const { chunks } = load();
  const norm = Math.hypot(...qv) || 1;
  return chunks
    .map((c) => {
      let dot = 0;
      for (let i = 0; i < c.vec.length; i++) dot += c.vec[i] * qv[i];
      return { c, s: dot / norm };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}

export interface Retrieval {
  sources: Chunk[];
  semantic: boolean;
}

/** Top chunks for a question, within a character budget so the prompt stays small. */
export async function retrieve(query: string, k = 6, budget = 7000): Promise<Retrieval> {
  const lexical = bm25(query).slice(0, 30);
  let semantic: Indexed[] = [];
  try {
    semantic = cosineRank(await embedQuery(query)).slice(0, 30);
  } catch {
    // embedding quota or network trouble: carry on with BM25 only
  }
  const score = new Map<string, number>();
  const byId = new Map<string, Indexed>();
  const fuse = (list: Indexed[], weight: number) =>
    list.forEach((c, rank) => {
      byId.set(c.id, c);
      score.set(c.id, (score.get(c.id) ?? 0) + weight / (60 + rank));
    });
  fuse(semantic, 1);
  fuse(lexical, 1);

  // a programme id in the question ("B-01", "ma 12") pins that programme's chunks to the top
  for (const m of query.matchAll(/\b(B|M|MA|P|L)\s?-?\s?(\d{1,3})\b/gi)) {
    const id = `${m[1].toUpperCase()}-${m[2].padStart(2, '0')}`;
    for (const c of load().chunks) if (c.id.startsWith(`programme-${id}`)) {
      byId.set(c.id, c);
      score.set(c.id, (score.get(c.id) ?? 0) + 1);
    }
  }

  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => byId.get(id)!);
  const out: Chunk[] = [];
  let used = 0;
  for (const c of ranked) {
    if (out.length >= k) break;
    if (used + c.text.length > budget && out.length > 0) continue;
    out.push({ id: c.id, title: c.title, url: c.url, text: c.text });
    used += c.text.length;
  }
  return { sources: out, semantic: semantic.length > 0 };
}
