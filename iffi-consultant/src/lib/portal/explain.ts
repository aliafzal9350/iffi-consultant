/**
 * "Why this fits you" notes from Gemini, for the top matches only. Gemini never chooses programmes - it only
 * explains ones the rules already picked, using facts we hand it. Results are cached on the study profile, keyed by
 * the answers and programme ids they were written for.
 */
import 'server-only';
import { createHash } from 'node:crypto';
import { generate } from '@/lib/rag/gemini';
import { UNIVERSITY_NAME } from '@/lib/rag/guard';
import { LEVEL_LABEL, durationLabel, languagePlain, teachingLabel, tuitionLine } from '@/lib/programs';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/eligibility';
import type { Program } from '@/types/data';
import type { StudyProfile } from './study';

const MAX_NOTE = 260;

export function cacheKey(sp: StudyProfile, ids: string[]): string {
  const answers = [sp.level, sp.field, sp.date_of_birth, sp.grade_mode, sp.percent, sp.cgpa, sp.cgpa_scale, sp.english_test, sp.english_score, sp.hsk, sp.teaching, sp.funding, sp.bank_usd];
  return createHash('sha256').update(JSON.stringify([answers, ids])).digest('hex').slice(0, 32);
}

function facts(p: Program) {
  return {
    id: p.id,
    name: p.displayName,
    location: [p.city, p.province].filter(Boolean).join(', '),
    level: LEVEL_LABEL[p.level],
    duration: durationLabel(p),
    teaching: teachingLabel(p),
    language: languagePlain(p),
    tuition: tuitionLine(p),
    fullyFunded: p.fullyFunded,
    stipendCNYPerMonth: p.stipendCNYPerMonth,
    fields: p.fields,
    someMajors: p.majors.slice(0, 8),
    rankingInChina: p.ranking?.china ?? null,
  };
}

function student(pr: Profile) {
  return {
    wants: LEVEL_LABEL[pr.level],
    field: pr.field || 'not decided',
    age: pr.age,
    english: pr.englishTest === 'none' ? 'no English test yet' : pr.englishTest === 'moi' ? 'English-medium letter' : `${pr.englishTest.toUpperCase()} ${pr.englishScore}`,
    hsk: pr.hsk,
    teachingPreference: pr.teaching,
    funding: { full: 'needs a full scholarship', partial: 'partial scholarship is fine', self: 'can self-fund' }[pr.funding],
  };
}

const SYSTEM = `You are an adviser at IFFI Consultant, a study-in-China consultancy, writing for a student aged 16 to 30.
For each programme in PROGRAMMES, write one or two short sentences (under 40 words) telling the student why it suits THEM.
Rules:
- Use only facts given in STUDENT and PROGRAMMES. Never invent numbers, rankings, deadlines or recognitions.
- Never name a university or institution. Refer to "this programme".
- Plain, warm, simple English a 12-year-old understands. No hype, no exclamation marks, no emojis.
- Reply with JSON only: {"<programme id>": "<sentence>", ...} with exactly the ids given.`;

/** id -> note. Empty object when Gemini is unavailable or its answer fails the checks (the page then uses reasonsFor). */
export async function explainMatches(sp: StudyProfile, pr: Profile, programs: Program[]): Promise<Record<string, string>> {
  if (!programs.length || !process.env.GEMINI_API_KEY) return {};
  const ids = programs.map((p) => p.id);
  const key = cacheKey(sp, ids);
  if (sp.ai_matches_key === key && sp.ai_matches) return sp.ai_matches;

  let notes: Record<string, string> = {};
  try {
    const { text } = await generate(SYSTEM, [{ role: 'user', text: JSON.stringify({ STUDENT: student(pr), PROGRAMMES: programs.map(facts) }) }]);
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    for (const id of ids) {
      const note = parsed[id];
      if (typeof note !== 'string') continue;
      const clean = note.replace(/<[^>]*>/g, '').replace(/\bhttps?:\/\/\S+/g, '').trim();
      UNIVERSITY_NAME.lastIndex = 0;
      if (!clean || clean.length > MAX_NOTE || UNIVERSITY_NAME.test(clean) || /PM\s?&?\s?DC|medical council/i.test(clean)) continue;
      notes[id] = clean;
    }
  } catch (e) {
    console.error('[portal/explain] Gemini notes failed', e instanceof Error ? e.message : e);
    notes = {};
  }

  if (Object.keys(notes).length) {
    const supabase = await createClient();
    await supabase.from('study_profiles').update({ ai_matches: notes, ai_matches_key: key }).eq('user_id', sp.user_id);
  }
  return notes;
}
