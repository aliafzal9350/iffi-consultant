/**
 * Read-only helpers derived from programs.json / provinces.json / tools.json.
 * Nothing here adds facts: every string is built from fields in src/data.
 */
import { programs, provinces, provinceByName, tools } from '@/data';
import type { Program, Province } from '@/types/data';
import { fmtCNY, fmtNumber, joinList, plural } from './format';

export const LEVEL_ORDER = ['Bachelor', 'MBBS', 'Master', 'PhD', 'Language'] as const;
export type Level = (typeof LEVEL_ORDER)[number];

export const LEVEL_LABEL: Record<string, string> = {
  Bachelor: 'Bachelor',
  MBBS: 'MBBS',
  Master: 'Master',
  PhD: 'PhD',
  Language: 'Chinese language',
};

export function provinceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}
export function provinceBySlug(slug: string): Province | undefined {
  return provinces.find((p) => provinceSlug(p.name) === slug);
}
export function provincePath(name: string): string {
  return `/provinces/${provinceSlug(name)}`;
}
export function programPath(p: Program): string {
  return `/programmes/${p.slug}`;
}

export const isEnglishTaught = (p: Program) => !!p.teachingLanguages?.includes('English');
export const isChineseTaught = (p: Program) =>
  p.chineseTaught || !!p.teachingLanguages?.some((l) => l === 'Chinese' || l === 'Bilingual');
export const hasStipend = (p: Program) => (p.stipendCNYPerMonth ?? 0) > 0;
export const hasTuitionFreeOption = (p: Program) => p.tuitionMinCNYPerYear === 0;
export const isTop50 = (p: Program) => (p.ranking?.china ?? Infinity) <= 50;
export const needsInterviewOrVideo = (p: Program) => !!p.interview || p.introVideoRequired;

export function locationLabel(p: Program): string {
  return p.city ? `${p.city}, ${p.province}` : `${p.province} (province-wide)`;
}

export function provinceZh(name: string): string {
  return provinceByName.get(name)?.nameZh ?? '';
}

export function teachingLabel(p: Program): string {
  if (!p.teachingLanguages?.length) return p.chineseTaught ? 'Chinese-taught' : 'Language not stated';
  const langs = p.teachingLanguages;
  if (langs.includes('English') && langs.includes('Chinese')) return 'English or Chinese';
  if (langs.includes('Bilingual')) return 'Bilingual';
  return `${langs[0]}-taught`;
}

/** Plain-English status, e.g. "211 · 985 · C9" -> chips */
export function statusTags(p: Program): string[] {
  if (!p.status) return [];
  return ['C9', '985', '211'].filter((t) => p.status!.includes(t)).reverse();
}

/** Upper tuition bound used by the max-tuition filter (null = unknown). */
export function effectiveMaxTuition(p: Program): number | null {
  if (p.courseTotalCNY != null) return null;
  if (p.tuitionMaxListedCNYPerYear != null) return p.tuitionMaxListedCNYPerYear;
  if (p.tuitionAndDormCombinedCNYPerYear != null) return p.tuitionAndDormCombinedCNYPerYear;
  if (p.fullyFunded && p.tuitionMinCNYPerYear === 0) return 0;
  return null;
}

/** "Tuition 0-30,000 CNY/yr depending on scholarship" */
export function tuitionLine(p: Program): string {
  if (p.courseTotalCNY != null) return `${fmtCNY(p.courseTotalCNY)} for the whole course, hostel included`;
  if (p.tuitionAndDormCombinedCNYPerYear != null && p.tuitionMaxListedCNYPerYear == null)
    return `Tuition + dorm ${fmtCNY(p.tuitionAndDormCombinedCNYPerYear)}/yr`;
  const max = p.tuitionMaxListedCNYPerYear ?? p.tuitionStandardCNYPerYear;
  const min = p.tuitionMinCNYPerYear;
  const est = p.tuitionStandardEstimated && max === p.tuitionStandardCNYPerYear ? ' (est.)' : '';
  if (min != null && max != null && min !== max)
    return `Tuition ${fmtNumber(min)}–${fmtNumber(max)} CNY/yr${est}, depending on scholarship`;
  if (max != null) return `Tuition ${fmtCNY(max)}/yr${est}`;
  if (min === 0) return p.fullyFunded ? 'Tuition-free (fully funded)' : 'Tuition-free scholarship option';
  if (min != null) return `Tuition ${fmtCNY(min)}/yr`;
  return 'Tuition on request';
}

export function stipendLine(p: Program): string | null {
  return hasStipend(p) ? `${fmtNumber(p.stipendCNYPerMonth!)} CNY/month stipend` : null;
}

/** The language rule in words a student understands. */
export function languagePlain(p: Program): string {
  const lp = p.languagePolicy;
  const tests: string[] = [];
  if (lp.ielts) tests.push(`IELTS ${lp.ielts.toFixed(1)}`);
  if (lp.toefl) tests.push(`TOEFL ${lp.toefl}`);
  if (lp.duolingo) tests.push(`Duolingo ${lp.duolingo}`);
  if (lp.pte) tests.push(`PTE ${lp.pte}`);
  if (lp.sat) tests.push(`SAT ${lp.sat}`);
  switch (lp.type) {
    case 'none':
      return 'No IELTS, Duolingo or other English test is required, as stated in the brochure.';
    case 'internal-test':
      return 'No IELTS needed: the university sets its own online English test.';
    case 'english-test': {
      let s = `Minimum English score: ${joinList(tests, 'or')}.`;
      if (lp.hsk) s += ` For the Chinese-taught track: HSK ${lp.hsk}${lp.hskScore ? ` (${lp.hskScore}+ points)` : ''}.`;
      return s;
    }
    case 'any-english':
      return 'Any English certificate is accepted: IELTS, TOEFL, Duolingo or similar.';
    case 'hsk':
      return `Taught in Chinese: you need HSK ${lp.hsk}${lp.hskScore ? ` with ${lp.hskScore}+ points` : ''}.`;
    case 'unspecified':
      return 'A language certificate is required, but the brochure does not name the test. Ask us which one this programme accepts.';
    default:
      return 'The brochure does not state a language requirement. Ask us before you apply.';
  }
}

export function ageLine(p: Program): string | null {
  const r = p.ageRange;
  if (!r || (r.min == null && r.max == null)) return p.ageLimit && /no age/i.test(p.ageLimit) ? 'No age limit' : null;
  if (r.min != null && r.max != null) return `Age ${r.min}–${r.max}`;
  if (r.max != null) return `Age up to ${r.max}`;
  return `Age ${r.min} or older`;
}

export function bankLine(p: Program): string | null {
  return p.bankStatementUSD ? `Bank statement of at least USD ${fmtNumber(p.bankStatementUSD)}` : null;
}

export function interviewLine(p: Program): string | null {
  const parts: string[] = [];
  if (p.interview) parts.push(p.interview.replace(/^Yes \(/, 'Interview ('));
  if (p.introVideoRequired) parts.push('Self-introduction video');
  return parts.length ? parts.join(' + ') : null;
}

export function durationLabel(p: Program): string {
  if (p.duration) return p.duration.replace(/Years/, 'years');
  const d = (tools.costCalculator.levelDefaults as Record<string, { durationYears: number }>)[p.level]?.durationYears;
  return d ? `Usually ${d} years` : 'Ask us';
}

export function deadlineLabel(p: Program): string | null {
  return p.typicalDeadlineMonth ? `Usually closes: ${p.typicalDeadlineMonth}` : null;
}

/* City cost tiers ------------------------------------------------------ */
export type Tier = 'tier1' | 'tier2' | 'tier3';
const tierMap = new Map<string, Tier>();
(Object.entries(tools.costCalculator.cityTiers) as [Tier, string[]][]).forEach(([tier, cities]) =>
  cities.forEach((c) => tierMap.set(c, tier)),
);
export function cityTier(city: string | null | undefined): Tier {
  return (city && tierMap.get(city)) || 'tier2';
}
export function programmeCity(p: Program): string {
  return p.city ?? provinceByName.get(p.province)?.capital ?? p.province;
}
export const TIER_LABEL: Record<Tier, string> = {
  tier1: 'Tier-1 city',
  tier2: 'Tier-2 city',
  tier3: 'Tier-3 city',
};

/* Brochure sections we show on programme pages -------------------------- */
const HIDDEN_DETAIL = /important notice|highly recommended|benefits listed|program purpose|recognition/i;
export function detailSections(p: Program): { title: string; lines: string[] }[] {
  return Object.entries(p.details)
    .filter(([title]) => !HIDDEN_DETAIL.test(title))
    .map(([title, lines]) => ({
      title: title
        .replace(/\s*\[img heading\]/i, '')
        .replace(/\s*\((heading|included|as described)[^)]*\)/i, '')
        .replace(/"/g, '')
        .replace(/\b(\d)St\b/g, '$1st')
        .replace(/\b(\d)Nd\b/g, '$1nd')
        .replace(/\bHsk\b/g, 'HSK')
        .replace(/\bIct\b/g, 'ICT')
        .replace(/\bCny\b/g, 'CNY')
        .replace(/\bUsd\b/g, 'USD')
        .trim(),
      lines: (lines ?? []).filter((l) => !/\bphotos?:/i.test(l) && !/stay legal|legal stay/i.test(l)),
    }))
    .filter((s) => s.lines.length > 0);
}
export function recognitionNote(p: Program): string | null {
  const entry = Object.entries(p.details).find(([k]) => /recognition/i.test(k));
  return entry?.[1]?.length ? entry[1].join(', ') : null;
}

/* Collections ------------------------------------------------------------ */
export const programsByLevel = (level: string) => programs.filter((p) => p.level === level);

export function similarProgrammes(p: Program, n = 3): Program[] {
  const scored = programs
    .filter((q) => q.id !== p.id)
    .map((q) => {
      let s = 0;
      if (q.level === p.level) s += 3;
      if (q.province === p.province) s += 2;
      s += q.fields.filter((f) => p.fields.includes(f)).length;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s || a.q.id.localeCompare(b.q.id));
  return scored.slice(0, n).map((x) => x.q);
}

export function programmeSummary(p: Program): string {
  const bits = [teachingLabel(p)];
  if (p.fullyFunded) bits.push('fully funded');
  else if (hasTuitionFreeOption(p)) bits.push('tuition-free scholarship option');
  if (hasStipend(p)) bits.push(`stipend up to ${fmtCNY(p.stipendCNYPerMonth!)}/month`);
  if (p.noIeltsRequired) bits.push('no IELTS required');
  return bits.join(', ');
}

export function majorsCount(p: Program): string {
  return plural(p.majors.length, 'major');
}
