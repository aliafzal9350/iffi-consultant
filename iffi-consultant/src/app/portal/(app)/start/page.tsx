import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { safeNext } from '@/lib/auth/redirects';
import { getStudyProfile } from '@/lib/portal/study';
import { EMPTY_ANSWERS, type QuizAnswers } from '@/lib/portal/quiz';
import { Quiz } from '@/components/portal/Quiz';

export const metadata: Metadata = { title: { absolute: `Your profile quiz | ${site.brand.name}` } };

export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireUser();
  const sp = await getStudyProfile(me.id);
  const params = await searchParams;
  const next = safeNext(typeof params.next === 'string' ? params.next : null);

  // coming back to change answers: start from what they said last time
  const initial: QuizAnswers = sp
    ? {
        level: sp.level,
        field: sp.field ?? '',
        dob: sp.date_of_birth ?? '',
        gradeMode: sp.grade_mode,
        percent: sp.percent,
        cgpa: sp.cgpa,
        scale: sp.cgpa_scale,
        englishTest: sp.english_test,
        englishScore: sp.english_score,
        hsk: sp.hsk,
        funding: sp.funding,
        teaching: sp.teaching,
        bank: sp.bank_usd,
        country: sp.country,
        whatsapp: me.whatsapp ?? '',
      }
    : { ...EMPTY_ANSWERS, whatsapp: me.whatsapp ?? '' };

  return <Quiz initial={initial} next={next} firstName={me.full_name?.split(' ')[0] ?? null} />;
}
