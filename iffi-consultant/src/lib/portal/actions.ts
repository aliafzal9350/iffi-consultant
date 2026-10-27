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
import { emailStaffNewApplication } from '@/lib/notify/application';
import { BUCKET, cleanFileName, profileEnglishLetterPath, isProfileEnglishLetterPathFor, uploadPath } from './files';
import type { EnglishLetterMeta } from './documents';

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
export interface EnglishLetterTicket {
  ok: boolean;
  message?: string;
  url?: string;
  path?: string;
}

export async function requestEnglishLetterUpload(file: { name: string; type: string; size: number }): Promise<EnglishLetterTicket> {
  const me = await requireUser();
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const mime = String(file?.type ?? '').toLowerCase();
  if (!allowedMimes.includes(mime)) return { ok: false, message: 'Upload a PDF, JPG or PNG file.' };
  const size = Number(file?.size ?? 0);
  if (!(size > 0)) return { ok: false, message: 'This file is empty.' };
  if (size > 10 * 1024 * 1024) return { ok: false, message: 'This file is larger than 10 MB.' };

  const path = profileEnglishLetterPath(me.id, mime);
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[portal/letter-upload] signed url error', error?.message);
    return { ok: false, message: 'Uploads are not working right now. Please try again in a minute.' };
  }
  return { ok: true, url: data.signedUrl, path };
}

export async function confirmEnglishLetterUpload(path: string, name: string): Promise<{ ok: boolean; letter?: EnglishLetterMeta; message?: string }> {
  const me = await requireUser();
  if (!isProfileEnglishLetterPathFor(path, me.id)) return { ok: false, message: 'Invalid upload path.' };

  const db = createAdminClient();
  const bucket = db.storage.from(BUCKET);
  const { data: info, error: infoError } = await bucket.info(path);
  if (infoError || !info) return { ok: false, message: 'The file did not arrive. Please upload it again.' };

  const mime = String(info.contentType ?? '').split(';')[0].trim().toLowerCase();
  const size = Number(info.size ?? 0);
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(mime) || size <= 0 || size > 10 * 1024 * 1024) {
    await bucket.remove([path]);
    return { ok: false, message: 'Invalid file format or size.' };
  }

  const letter: EnglishLetterMeta = {
    storage_path: path,
    file_name: cleanFileName(name),
    mime_type: mime,
    size_bytes: size,
    uploaded_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { data: existing } = await supabase.from('study_profiles').select('english_letter').eq('user_id', me.id).maybeSingle();
  if (existing?.english_letter && typeof existing.english_letter === 'object') {
    const old = existing.english_letter as EnglishLetterMeta;
    if (old.storage_path && old.storage_path !== path) {
      await bucket.remove([old.storage_path]);
    }
  }

  await supabase.from('study_profiles').update({ english_letter: letter }).eq('user_id', me.id);
  return { ok: true, letter };
}

export async function removeEnglishLetter(): Promise<{ ok: boolean; message?: string }> {
  const me = await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase.from('study_profiles').select('english_letter').eq('user_id', me.id).maybeSingle();
  if (existing?.english_letter && typeof existing.english_letter === 'object') {
    const old = existing.english_letter as EnglishLetterMeta;
    if (old.storage_path) {
      await createAdminClient().storage.from(BUCKET).remove([old.storage_path]);
    }
    await supabase.from('study_profiles').update({ english_letter: null }).eq('user_id', me.id);
  }
  return { ok: true };
}

/** Save the profile quiz, then go to the matches (or back to the programme the student was applying for). */
export async function saveQuiz(a: QuizAnswers, next: string | null): Promise<{ error: string }> {
  const me = await requireUser();
  const problem = checkAll(a) ?? (LEVEL_ORDER.includes(a.level as (typeof LEVEL_ORDER)[number]) ? null : 'Pick what you want to study.');
  if (problem) return { error: problem };

  const supabase = await createClient();
  const letterToSave = a.englishTest === 'moi' ? (a.englishLetter ?? null) : null;
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
    english_letter: letterToSave,
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

  // If student uploaded an English letter and has draft applications, ensure it is mirrored in application_documents
  if (letterToSave?.storage_path) {
    try {
      const { data: drafts } = await supabase.from('applications').select('id').eq('user_id', me.id).eq('status', 'draft');
      if (drafts && drafts.length > 0) {
        const db = createAdminClient();
        for (const app of drafts) {
          const { data: existingDoc } = await db.from('application_documents').select('id').eq('application_id', app.id).eq('kind', 'english').maybeSingle();
          if (!existingDoc) {
            const destPath = uploadPath(me.id, app.id, 'english', letterToSave.mime_type);
            const { error: copyErr } = await db.storage.from(BUCKET).copy(letterToSave.storage_path, destPath);
            if (!copyErr) {
              await db.from('application_documents').insert({
                application_id: app.id,
                user_id: me.id,
                kind: 'english',
                storage_path: destPath,
                file_name: letterToSave.file_name,
                mime_type: letterToSave.mime_type,
                size_bytes: letterToSave.size_bytes,
              });
            }
          }
        }
      }
    } catch (syncErr) {
      console.error('[portal/quiz] mirror letter error', syncErr);
    }
  }

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

  const db = createAdminClient();
  const { data, error } = await db
    .from('applications')
    .insert({ user_id: me.id, program_id: program.id, program_snapshot: program })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[portal/apply] could not create application', error?.message, error?.code === 'PGRST205' ? '-> run supabase/migrations/0002_study_profile_and_applications.sql' : '');
    redirect(`/portal/apply/${program.id}?error=1`);
  }

  // If the student uploaded an English proficiency letter in their profile, attach a copy to this application
  try {
    const { data: sp } = await supabase.from('study_profiles').select('english_test, english_letter').eq('user_id', me.id).maybeSingle();
    if (sp?.english_letter && typeof sp.english_letter === 'object') {
      const letter = sp.english_letter as EnglishLetterMeta;
      if (letter.storage_path) {
        const destPath = uploadPath(me.id, data.id, 'english', letter.mime_type);
        const { error: copyErr } = await db.storage.from(BUCKET).copy(letter.storage_path, destPath);
        if (!copyErr) {
          await db.from('application_documents').insert({
            application_id: data.id,
            user_id: me.id,
            kind: 'english',
            storage_path: destPath,
            file_name: letter.file_name,
            mime_type: letter.mime_type,
            size_bytes: letter.size_bytes,
          });
        }
      }
    }
  } catch (err) {
    console.error('[portal/apply] attaching english letter failed', err);
  }

  emailStaffNewApplication(data.id);
  revalidatePath('/portal', 'layout');
  redirect(`/portal/applications/${data.id}?new=1`);
}
