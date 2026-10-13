/**
 * Programme matching for the portal: the eligibility checker's rules decide WHO qualifies (classify), then
 * scoreMatch decides the ORDER. Server-only: it imports the full catalogue, which must stay out of browser bundles.
 */
import 'server-only';
import { runEligibility, type Classified, type Profile } from '@/lib/eligibility';
import { fmtNumber } from '@/lib/format';
import { hasStipend, hasTuitionFreeOption, isEnglishTaught } from '@/lib/programs';
import type { Program } from '@/types/data';

/**
 * How well a programme suits this student - higher is better. Only called for programmes the rules already
 * accept, so this is about preference, not eligibility.
 *
 * These weights are a starting point: tune them to how IFFI advisers actually rank options for a student.
 */
export function scoreMatch(p: Program, pr: Profile): number {
  let score = 0;
  if (p.fullyFunded) score += pr.funding === 'self' ? 15 : 40;
  else if (hasTuitionFreeOption(p)) score += 20;
  if (hasStipend(p)) score += Math.min(30, (p.stipendCNYPerMonth ?? 0) / 100);
  if (pr.field && p.fields.includes(pr.field)) score += 25;
  if (pr.teaching !== 'either') score += 10; // classify() already removed programmes in the other language
  if (p.noIeltsRequired && (pr.englishTest === 'none' || pr.englishTest === 'moi')) score += 15;
  if (p.ranking?.china) score += Math.max(0, 20 - p.ranking.china / 10);
  return score;
}

/** Plain-language reasons from the data itself: shown as chips, and as the explanation when AI is unavailable. */
export function reasonsFor(p: Program, pr: Profile): string[] {
  const out: string[] = [];
  if (p.fullyFunded) out.push('Full scholarship listed');
  else if (hasTuitionFreeOption(p)) out.push('Tuition-free scholarship option');
  if (hasStipend(p)) out.push(`Stipend of ${fmtNumber(p.stipendCNYPerMonth!)} CNY a month`);
  if (pr.field && p.fields.includes(pr.field)) out.push(`Has ${pr.field} majors`);
  if (isEnglishTaught(p)) out.push('Taught in English');
  if (p.noIeltsRequired) out.push('No IELTS needed');
  if (p.ranking?.china) out.push(`Ranked #${p.ranking.china} in China (as stated)`);
  return out.slice(0, 4);
}

export interface MatchResult {
  /** qualifies on every rule, best first */
  matches: Classified[];
  /** one thing short (e.g. half an IELTS band) */
  near: Classified[];
}

export function findMatches(pr: Profile): MatchResult {
  const r = runEligibility(pr);
  const byScore = (a: Classified, b: Classified) => scoreMatch(b.program, pr) - scoreMatch(a.program, pr);
  return { matches: [...r.matched].sort(byScore), near: [...r.near].sort(byScore) };
}
