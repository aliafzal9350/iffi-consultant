/**
 * The study profile: what the quiz collects and what matching runs on. A row in `study_profiles`, read through RLS.
 */
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { EMPTY_PROFILE, type EnglishTest, type FundingPref, type Profile as EligibilityProfile, type TeachingPref } from '@/lib/eligibility';

export interface StudyProfile {
  user_id: string;
  level: string;
  field: string | null;
  date_of_birth: string | null;
  grade_mode: 'percentage' | 'cgpa';
  percent: number | null;
  cgpa: number | null;
  cgpa_scale: number;
  english_test: EnglishTest;
  english_score: number | null;
  hsk: number;
  teaching: TeachingPref;
  funding: FundingPref;
  bank_usd: number;
  country: string;
  ai_matches: Record<string, string> | null;
  ai_matches_key: string | null;
  completed_at: string | null;
}

export const getStudyProfile = cache(async (userId: string): Promise<StudyProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from('study_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  // numeric columns arrive as strings from PostgREST
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    ...data,
    percent: num(data.percent),
    cgpa: num(data.cgpa),
    cgpa_scale: Number(data.cgpa_scale),
    english_score: num(data.english_score),
  } as StudyProfile;
});

export const isStudyProfileComplete = (sp: StudyProfile | null): sp is StudyProfile => Boolean(sp?.completed_at);

/** Age in whole years on a given day (default today). */
export function ageOn(dob: string | null, today = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
}

/** Study profile -> the eligibility checker's Profile, so the same rules (classify) run on both. */
export function toEligibilityProfile(sp: StudyProfile): EligibilityProfile {
  return {
    ...EMPTY_PROFILE,
    level: sp.level,
    age: ageOn(sp.date_of_birth),
    gradeMode: sp.grade_mode,
    percent: sp.percent,
    cgpa: sp.cgpa,
    scale: sp.cgpa_scale,
    englishTest: sp.english_test,
    englishScore: sp.english_score,
    hsk: sp.hsk,
    teaching: sp.teaching,
    funding: sp.funding,
    field: sp.field ?? '',
    bank: sp.bank_usd,
    country: sp.country,
  };
}
