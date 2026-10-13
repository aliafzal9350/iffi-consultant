/**
 * Scholarship Eligibility Checker - implements tools.eligibilityChecker.rules.
 * Pure and deterministic: (profile, programmes) -> classification. No network, no storage.
 */
import { programs } from '@/data/catalog';
import { tools } from '@/data/config';
import type { Program } from '@/types/data';
import { isChineseTaught, isEnglishTaught } from './programs';

export type EnglishTest = 'ielts' | 'toefl' | 'duolingo' | 'pte' | 'moi' | 'none';
export type TeachingPref = 'English' | 'Chinese' | 'either';
export type FundingPref = 'full' | 'partial' | 'self';

export interface Profile {
  level: string;
  age: number | null;
  gradeMode: 'percentage' | 'cgpa';
  percent: number | null;
  cgpa: number | null;
  scale: number;
  englishTest: EnglishTest;
  englishScore: number | null;
  hsk: number;
  teaching: TeachingPref;
  funding: FundingPref;
  field: string;
  bank: number;
  country: string;
}

export const EMPTY_PROFILE: Profile = {
  level: '',
  age: null,
  gradeMode: 'percentage',
  percent: null,
  cgpa: null,
  scale: 4,
  englishTest: 'none',
  englishScore: null,
  hsk: 0,
  teaching: 'either',
  funding: 'partial',
  field: '',
  bank: 0,
  country: 'PK',
};

export type Status = 'match' | 'near' | 'not' | 'pref';
export interface Verdict {
  status: Status;
  reasons: string[];
  notes: string[];
}
export interface Classified {
  program: Program;
  verdict: Verdict;
}

/** approxPercent = cgpa / scale * 100 (an approximation - the UI labels it so) */
export function approxPercent(pr: Profile): number | null {
  if (pr.gradeMode === 'percentage') return pr.percent;
  if (pr.cgpa == null || !pr.scale) return null;
  return Math.round((pr.cgpa / pr.scale) * 1000) / 10;
}

export function scoreBand(percent: number | null) {
  const bands = [...tools.eligibilityChecker.scoreBands].sort((a, b) => b.minPercent - a.minPercent);
  return bands.find((b) => (percent ?? 0) >= b.minPercent) ?? bands[bands.length - 1];
}

const NEAR_MARGIN: Record<string, number> = { ielts: 0.5, toefl: 10, duolingo: 10, pte: 5 };
const TEST_LABEL: Record<string, string> = { ielts: 'IELTS', toefl: 'TOEFL', duolingo: 'Duolingo', pte: 'PTE' };

type Check = { result: 'pass' | 'near' | 'fail'; reason?: string; note?: string };

function requiredTests(p: Program): string {
  const lp = p.languagePolicy;
  return (['ielts', 'toefl', 'duolingo', 'pte'] as const)
    .filter((k) => lp[k] != null)
    .map((k) => `${TEST_LABEL[k]} ${k === 'ielts' ? lp[k]!.toFixed(1) : lp[k]}`)
    .join(' / ');
}

function checkLanguage(p: Program, pr: Profile): Check {
  const lp = p.languagePolicy;
  switch (lp.type) {
    case 'none':
      return { result: 'pass' };
    case 'internal-test':
      return { result: 'pass', note: 'The university sets its own English test' };
    case 'any-english':
      return pr.englishTest === 'none'
        ? { result: 'fail', reason: 'Needs an English certificate or an English-medium letter' }
        : { result: 'pass' };
    case 'hsk': {
      const need = lp.hsk ?? 4;
      if (pr.hsk >= need) return { result: 'pass' };
      if (pr.hsk === need - 1) return { result: 'near', reason: `Needs HSK ${need} (you have HSK ${pr.hsk})` };
      return { result: 'fail', reason: `Taught in Chinese: needs HSK ${need}` };
    }
    case 'english-test': {
      if (lp.hsk && pr.hsk >= lp.hsk && pr.teaching !== 'English') return { result: 'pass', note: 'Chinese-taught track with your HSK' };
      const t = pr.englishTest;
      if (t === 'none') return { result: 'fail', reason: `Needs ${requiredTests(p)}` };
      if (t === 'moi') return { result: 'near', reason: `Asks for ${requiredTests(p)}; an English-medium letter may not be accepted` };
      const threshold = lp[t as 'ielts' | 'toefl' | 'duolingo' | 'pte'];
      if (threshold == null) return { result: 'near', reason: `Brochure lists ${requiredTests(p)}; ask if ${TEST_LABEL[t]} is accepted` };
      const score = pr.englishScore ?? 0;
      if (score >= threshold) return { result: 'pass' };
      if (threshold - score <= NEAR_MARGIN[t]) return { result: 'near', reason: `${TEST_LABEL[t]} ${t === 'ielts' ? threshold.toFixed(1) : threshold} needed (you have ${score})` };
      return { result: 'fail', reason: `Needs ${requiredTests(p)}` };
    }
    default:
      return { result: 'pass', note: 'May ask for proof of English' };
  }
}

function teachingOk(p: Program, pref: TeachingPref): boolean {
  if (pref === 'either') return true;
  const english = isEnglishTaught(p) || p.teachingLanguages?.includes('Bilingual');
  const chinese = isChineseTaught(p) || (!p.teachingLanguages && p.languagePolicy.type === 'hsk');
  return pref === 'English' ? !!english : !!chinese;
}

export function classify(p: Program, pr: Profile): Verdict {
  const reasons: string[] = [];
  const notes: string[] = [];

  // preferences: the student chose to leave these out, so they are not "eligibility" failures
  if (!teachingOk(p, pr.teaching)) return { status: 'pref', reasons: [`Not ${pr.teaching}-taught`], notes };
  if (pr.funding === 'full' && !(p.fullyFunded || p.tuitionMinCNYPerYear === 0))
    return { status: 'pref', reasons: ['No full or tuition-free scholarship listed'], notes };
  if (pr.field && !p.fields.includes(pr.field)) return { status: 'pref', reasons: [`No ${pr.field} majors`], notes };

  let hard = 0;
  let soft = 0;

  const r = p.ageRange;
  if (r && pr.age != null) {
    if ((r.min != null && pr.age < r.min) || (r.max != null && pr.age > r.max)) {
      hard++;
      reasons.push(r.min != null && r.max != null ? `Age limit ${r.min}–${r.max}` : r.max != null ? `Age limit up to ${r.max}` : `Minimum age ${r.min}`);
    }
  }

  const lang = checkLanguage(p, pr);
  if (lang.result === 'fail') hard++;
  if (lang.result === 'near') soft++;
  if (lang.reason) reasons.push(lang.reason);
  if (lang.note) notes.push(lang.note);

  if (p.bankStatementUSD && pr.bank < p.bankStatementUSD) {
    soft++;
    reasons.push(`Needs a bank statement of USD ${p.bankStatementUSD.toLocaleString('en-US')}`);
  }

  // MA-15 asks for at least 70 % in the last degree
  if (p.id === 'MA-15') {
    const pct = approxPercent(pr);
    if (pct == null) notes.push('Needs at least 70% in your last degree');
    else if (pct < 70) {
      if (pct >= 65) soft++;
      else hard++;
      reasons.push('Needs at least 70% in your last degree');
    }
  }

  const status: Status = hard > 0 || soft > 1 ? 'not' : soft === 1 ? 'near' : 'match';
  return { status, reasons, notes };
}

export function runEligibility(pr: Profile, source: Program[] = programs) {
  const sameLevel = source.filter((p) => p.level === pr.level);
  const results: Classified[] = sameLevel.map((program) => ({ program, verdict: classify(program, pr) }));
  const by = (s: Status) => results.filter((r) => r.verdict.status === s);
  const matched = by('match');
  return {
    results,
    matched,
    near: by('near'),
    not: by('not'),
    pref: by('pref'),
    fullyFunded: matched.filter((r) => r.program.fullyFunded).length,
    withStipend: matched.filter((r) => (r.program.stipendCNYPerMonth ?? 0) > 0).length,
  };
}

/** "IELTS 6.0 would unlock 9 more programmes" - the two biggest gains */
export function unlockMore(pr: Profile, source: Program[] = programs) {
  const base = runEligibility(pr, source).matched.length;
  const variants: { label: string; profile: Profile }[] = [];
  if (!(pr.englishTest === 'ielts' && (pr.englishScore ?? 0) >= 6)) variants.push({ label: 'IELTS 6.0', profile: { ...pr, englishTest: 'ielts', englishScore: 6 } });
  if (pr.hsk < 4) variants.push({ label: 'HSK 4', profile: { ...pr, hsk: 4 } });
  if (pr.bank < 5000) variants.push({ label: 'a USD 5,000 bank statement', profile: { ...pr, bank: 5000 } });
  return variants
    .map((v) => ({ label: v.label, gain: runEligibility(v.profile, source).matched.length - base }))
    .filter((v) => v.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 2);
}

export function profileComplete(pr: Profile): boolean {
  return !!pr.level;
}
