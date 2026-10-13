'use server';
/**
 * Server Functions for the portal. Each one starts with requireUser(); writes go through the student's own session
 * (RLS + column grants) except creating an application, which needs the secret key (students have no insert grant).
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { programById } from '@/data/catalog';
import { LEVEL_ORDER } from '@/lib/programs';
import { checkAll, normaliseWhatsApp, type QuizAnswers } from './quiz';
import { safeNext } from '@/lib/auth/redirects';

export interface ProfileFormState {
  ok: boolean;
  errors: Partial<Record<'full_name' | 'whatsapp' | 'form', string>>;
  values: { full_name: string; whatsapp: string };
}

export async function saveProfile(_prev: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const me = await requireUser();
  const values = {
    full_name: String(form.get('full_name') ?? '').trim(),
    whatsapp: String(form.get('whatsapp') ?? '').trim(),
  };

  const errors: ProfileFormState['errors'] = {};
  if (values.full_name.length < 2 || values.full_name.length > 100) errors.full_name = 'Enter your full name.';
  const whatsapp = normaliseWhatsApp(values.whatsapp);
  if (!whatsapp) errors.whatsapp = 'Enter the number with your country code, e.g. +92 300 1234567.';
  if (Object.keys(errors).length) return { ok: false, errors, values };

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ full_name: values.full_name, whatsapp }).eq('id', me.id);
  if (error) {
    console.error('[portal/profile] save failed', error.message);
    return { ok: false, errors: { form: 'Your profile could not be saved. Please try again.' }, values };
  }

  revalidatePath('/portal');
  return { ok: true, errors: {}, values: { full_name: values.full_name, whatsapp: whatsapp! } };
}

/** Save the profile quiz, then go to the matches (or back to the programme the student was applying for). */
export async function saveQuiz(a: QuizAnswers, next: string | null): Promise<{ error: string }> {
  const me = await requireUser();
  const problem = checkAll(a) ?? (LEVEL_ORDER.includes(a.level as (typeof LEVEL_ORDER)[number]) ? null : 'Pick what you want to study.');
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.from('study_profiles').upsert({
    user_id: me.id,
    level: a.level,
    field: a.field || null,
    date_of_birth: a.dob,
    grade_mode: a.gradeMode,
    percent: a.gradeMode === 'percentage' ? a.percent : null,
    cgpa: a.gradeMode === 'cgpa' ? a.cgpa : null,
    cgpa_scale: a.scale,
    english_test: a.englishTest,
    english_score: a.englishTest === 'none' || a.englishTest === 'moi' ? null : a.englishScore,
    hsk: a.hsk,
    funding: a.funding,
    teaching: a.teaching,
    bank_usd: a.bank,
    country: a.country,
    completed_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[portal/quiz] save failed', error.message, error.code === 'PGRST205' ? '-> run supabase/migrations/0002_study_profile_and_applications.sql in the Supabase SQL Editor' : '');
    return { error: 'Your answers could not be saved. Please try again.' };
  }
  await supabase.from('profiles').update({ whatsapp: normaliseWhatsApp(a.whatsapp) }).eq('id', me.id);

  revalidatePath('/portal', 'layout');
  redirect(safeNext(next) ?? '/portal/matches');
}

/** "Apply" on a programme: create the draft application (or reopen the existing one) and open it. */
export async function startApplication(form: FormData): Promise<void> {
  const me = await requireUser();
  const program = programById.get(String(form.get('programId') ?? ''));
  if (!program) redirect('/portal/matches');

  const supabase = await createClient();
  const { data: existing } = await supabase.from('applications').select('id').eq('user_id', me.id).eq('program_id', program.id).maybeSingle();
  if (existing) redirect(`/portal/applications/${existing.id}`);

  const { data, error } = await createAdminClient()
    .from('applications')
    .insert({ user_id: me.id, program_id: program.id, program_snapshot: program })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[portal/apply] could not create application', error?.message, error?.code === 'PGRST205' ? '-> run supabase/migrations/0002_study_profile_and_applications.sql' : '');
    redirect(`/portal/apply/${program.id}?error=1`);
  }

  revalidatePath('/portal', 'layout');
  redirect(`/portal/applications/${data.id}`);
}
