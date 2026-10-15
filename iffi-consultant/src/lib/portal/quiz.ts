/**
 * The profile quiz: answer shape, the questions in order, and validation shared by the browser (one screen at a
 * time) and the server (everything again before saving). No server-only imports: the quiz page uses this too.
 */
import { tools } from '@/data/config';
import type { EnglishTest, FundingPref, TeachingPref } from '@/lib/eligibility';

export interface QuizAnswers {
  level: string;
  field: string; // '' = not sure yet / any
  dob: string; // yyyy-mm-dd
  gradeMode: 'percentage' | 'cgpa';
  percent: number | null;
  cgpa: number | null;
  scale: number;
  englishTest: EnglishTest;
  englishScore: number | null;
  hsk: number;
  funding: FundingPref;
  teaching: TeachingPref;
  bank: number;
  country: string;
  whatsapp: string;
}

export const EMPTY_ANSWERS: QuizAnswers = {
  level: '',
  field: '',
  dob: '',
  gradeMode: 'percentage',
  percent: null,
  cgpa: null,
  scale: 4,
  englishTest: 'none',
  englishScore: null,
  hsk: 0,
  funding: 'partial',
  teaching: 'either',
  bank: 0,
  country: 'PK',
  whatsapp: '',
};

/** One question per screen, in this order. */
export const QUESTIONS = ['level', 'field', 'dob', 'grades', 'english', 'hsk', 'funding', 'teaching', 'bank', 'contact'] as const;
export type QuestionId = (typeof QUESTIONS)[number];

export const ENGLISH_TESTS = tools.eligibilityChecker.englishTests as { id: EnglishTest; label: string; max?: number; step?: number }[];

/** "+92 300 1234567", "0092-300-1234567" -> "+923001234567"; null when it cannot be an international number */
export function normaliseWhatsApp(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function ageFrom(dob: string): number | null {
  const d = new Date(dob);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

/** The message to show for one question, or null when its answer is fine. */
export function checkQuestion(q: QuestionId, a: QuizAnswers): string | null {
  switch (q) {
    case 'level':
      return a.level ? null : 'Pick what you want to study.';
    case 'dob': {
      const age = ageFrom(a.dob);
      return age != null && age >= 14 && age <= 65 ? null : 'Enter your date of birth (you need to be 14 to 65).';
    }
    case 'grades':
      if (a.level === 'Language') return null; // no academic requirement
      if (a.gradeMode === 'percentage') return a.percent != null && a.percent > 0 && a.percent <= 100 ? null : 'Enter your percentage (1 to 100).';
      return a.cgpa != null && a.cgpa > 0 && a.cgpa <= a.scale ? null : `Enter your CGPA (up to ${a.scale}).`;
    case 'english': {
      if (a.englishTest === 'none' || a.englishTest === 'moi') return null;
      const t = ENGLISH_TESTS.find((x) => x.id === a.englishTest);
      return a.englishScore != null && a.englishScore > 0 && a.englishScore <= (t?.max ?? 999) ? null : `Enter your ${t?.label ?? 'test'} score.`;
    }
    case 'contact':
      return normaliseWhatsApp(a.whatsapp) ? null : 'Enter your WhatsApp number with the country code, for example +92 300 1234567.';
    default:
      return null;
  }
}

/** Every problem across the whole quiz (the server's final check). */
export function checkAll(a: QuizAnswers): string | null {
  for (const q of QUESTIONS) {
    const err = checkQuestion(q, a);
    if (err) return err;
  }
  return null;
}
