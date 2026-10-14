'use server';
/**
 * Server Functions for the staff portal. Every one re-checks the caller's role (requireStaff / requireAdmin) and
 * then writes with the secret key, because students' row-level security does not allow these changes.
 * Every change is written to the application's activity log.
 */
import { revalidatePath } from 'next/cache';
import { isOwnerEmail, requireAdmin, requireStaff } from '@/lib/auth/dal';
import { createAdminClient } from '@/lib/supabase/admin';
import { canMove } from '@/lib/portal/transitions';
import { STATUS_LABEL, type ApplicationStatus } from '@/lib/portal/application';
import { DOCS, isDocKind } from '@/lib/portal/documents';
import { logEvent } from '@/lib/portal/events';
import { BUCKET, UUID, settingsPath } from '@/lib/portal/files';
import { LEVEL_ORDER } from '@/lib/programs';
import { EMPTY_PAYMENT_SETTINGS, PURPOSE_LABEL, type PaymentPurpose, type PaymentSettings } from '@/lib/portal/payment';
import { getPaymentSettings } from '@/lib/portal/settings';
import { emailDocumentRejected, emailNoteToStudent, emailPaymentChecked, emailStatusChange } from '@/lib/notify/application';

export interface ActionState {
  ok: boolean;
  message: string | null;
}

const fail = (message: string): ActionState => ({ ok: false, message });

function refresh(applicationId?: string) {
  revalidatePath('/staff', 'layout');
  if (applicationId) revalidatePath(`/portal/applications/${applicationId}`, 'layout');
}

/** Move an application to a new status, with an optional note the student will read. */
export async function updateStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const id = String(form.get('id') ?? '');
  const to = String(form.get('to') ?? '') as ApplicationStatus;
  const note = String(form.get('note') ?? '').trim().slice(0, 1000);
  if (!to) return fail('Choose what happened.');

  const db = createAdminClient();
  const { data: app } = await db.from('applications').select('id, status').eq('id', id).maybeSingle();
  if (!app) return fail('This application no longer exists.');
  const from = app.status as ApplicationStatus;

  const action = canMove(from, to, me.role === 'admin' ? 'admin' : 'staff');
  if (!action) return fail(`An application that is "${STATUS_LABEL[from]}" cannot move to "${STATUS_LABEL[to]}".`);
  if (action.needsNote && !note) return fail('Write a short note for the student: they will see it on their application.');

  // only if nobody changed it meanwhile (two staff working on the same application)
  const { data: moved, error } = await db.from('applications').update({ status: to }).eq('id', id).eq('status', from).select('id');
  if (error) return fail('The status could not be saved. Please try again.');
  if (!moved?.length) return fail('Someone else just updated this application. Refresh the page to see the latest status.');

  await logEvent(db, { application_id: id, type: 'status', actor: me.id, from_status: from, to_status: to, note: note || null });
  emailStatusChange(id, to, note || null);

  // the status buttons for a submitted payment also settle the payment itself
  if (from === 'payment_submitted' && (to === 'under_review' || to === 'action_needed')) {
    const verdict = to === 'under_review' ? 'verified' : 'rejected';
    const { data: paid } = await db
      .from('application_payments')
      .update({ status: verdict, review_note: verdict === 'rejected' ? note : null, reviewed_by: me.id, reviewed_at: new Date().toISOString() })
      .eq('application_id', id)
      .eq('purpose', 'application_fee')
      .eq('status', 'submitted')
      .select('amount, currency, transaction_id');
    if (paid?.length) await logEvent(db, { application_id: id, type: 'payment', actor: me.id, meta: { purpose: 'application_fee', action: verdict, transactionId: paid[0].transaction_id } });
  }

  refresh(id);
  return { ok: true, message: `Saved. The student now sees "${STATUS_LABEL[to]}".` };
}

// ------------------------------------------------------------------------------------------------ documents

/** Accept a file, or ask for a new one (with a note the student reads). */
export async function reviewDocument(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const id = String(form.get('id') ?? '');
  const verdict = form.get('verdict') === 'accepted' ? 'accepted' : 'rejected';
  const note = String(form.get('note') ?? '').trim().slice(0, 1000);
  if (!UUID.test(id)) return fail('File not found.');
  if (verdict === 'rejected' && !note) return fail('Tell the student what is wrong, so they can fix it.');

  const db = createAdminClient();
  const { data: doc } = await db
    .from('application_documents')
    .update({ status: verdict, review_note: verdict === 'rejected' ? note : null, reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('application_id, kind, file_name')
    .maybeSingle();
  if (!doc) return fail('This file no longer exists. The student may have replaced it.');

  await logEvent(db, {
    application_id: doc.application_id,
    type: 'document',
    actor: me.id,
    note: verdict === 'rejected' ? note : null,
    meta: { kind: doc.kind, file: doc.file_name, action: verdict },
  });
  if (verdict === 'rejected') emailDocumentRejected(doc.application_id, doc.kind, note);
  refresh(doc.application_id);
  const title = isDocKind(doc.kind) ? DOCS[doc.kind].title : 'File';
  return { ok: true, message: verdict === 'accepted' ? `${title}: accepted.` : `${title}: the student is asked for a new file.` };
}

// ------------------------------------------------------------------------------------------------- payments

/** Confirm a payment arrived in IFFI's account, or say it was not found. */
export async function reviewPayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const id = String(form.get('id') ?? '');
  const verdict = form.get('verdict') === 'verified' ? 'verified' : 'rejected';
  const note = String(form.get('note') ?? '').trim().slice(0, 1000);
  if (!UUID.test(id)) return fail('Payment not found.');
  if (verdict === 'rejected' && !note) return fail('Tell the student what did not match (amount, ID, account).');

  const db = createAdminClient();
  const { data: pay } = await db
    .from('application_payments')
    .update({ status: verdict, review_note: verdict === 'rejected' ? note : null, reviewed_by: me.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'submitted')
    .select('application_id, purpose, transaction_id')
    .maybeSingle();
  if (!pay) return fail('This payment was already checked. Refresh the page.');
  const purpose = pay.purpose as PaymentPurpose;
  await logEvent(db, { application_id: pay.application_id, type: 'payment', actor: me.id, note: verdict === 'rejected' ? note : null, meta: { purpose, action: verdict, transactionId: pay.transaction_id } });
  emailPaymentChecked(pay.application_id, purpose, verdict, verdict === 'rejected' ? note : null);

  // the application fee moves the application on: reviewing when received, back to the student when not
  if (purpose === 'application_fee') {
    const to: ApplicationStatus = verdict === 'verified' ? 'under_review' : 'action_needed';
    const { data: moved } = await db.from('applications').update({ status: to }).eq('id', pay.application_id).eq('status', 'payment_submitted').select('id');
    if (moved?.length) await logEvent(db, { application_id: pay.application_id, type: 'status', actor: me.id, from_status: 'payment_submitted', to_status: to, note: verdict === 'rejected' ? note : null });
  }
  refresh(pay.application_id);
  return { ok: true, message: verdict === 'verified' ? `${PURPOSE_LABEL[purpose]} confirmed.` : 'The student is asked to check the payment.' };
}

// ------------------------------------------------------------------------------------ case: adviser and fees

const money = (raw: FormDataEntryValue | null): number | null | 'bad' => {
  const s = String(raw ?? '').trim().replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1e6 ? Math.round(n * 100) / 100 : 'bad';
};

/** Who is in charge of this application, and what IFFI charges for it. */
export async function saveCase(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const id = String(form.get('id') ?? '');
  const assignee = String(form.get('assigned_to') ?? '');
  const fee = money(form.get('application_fee_usd'));
  const service = money(form.get('service_charge_usd'));
  if (!UUID.test(id)) return fail('Application not found.');
  if (assignee && !UUID.test(assignee)) return fail('Choose someone from the team.');
  if (fee === 'bad' || service === 'bad') return fail('Fees are amounts in US dollars, for example 150.');

  const db = createAdminClient();
  const { data: before } = await db.from('applications').select('assigned_to, application_fee_usd, service_charge_usd').eq('id', id).maybeSingle();
  if (!before) return fail('Application not found.');
  let adviserName: string | null = null;
  if (assignee) {
    const { data: person } = await db.from('profiles').select('full_name, email, role').eq('id', assignee).maybeSingle();
    if (!person || !['staff', 'admin'].includes(person.role)) return fail('That person is not on the team.');
    adviserName = person.full_name ?? person.email;
  }

  const { error } = await db.from('applications').update({ assigned_to: assignee || null, application_fee_usd: fee, service_charge_usd: service }).eq('id', id);
  if (error) return fail('Could not save. Please try again.');

  if ((before.assigned_to ?? '') !== assignee) {
    await logEvent(db, { application_id: id, type: 'assignment', actor: me.id, meta: { name: adviserName }, visible_to_student: false });
  }
  const num = (v: unknown) => (v == null ? null : Number(v));
  if (num(before.application_fee_usd) !== fee || num(before.service_charge_usd) !== service) {
    await logEvent(db, { application_id: id, type: 'payment', actor: me.id, meta: { action: 'fees', applicationFeeUsd: fee, serviceChargeUsd: service }, visible_to_student: false });
  }
  refresh(id);
  return { ok: true, message: 'Saved.' };
}

/** A note on the application: staff-only (internal), or a message the student sees in their history. */
export async function addNote(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const id = String(form.get('id') ?? '');
  const note = String(form.get('note') ?? '').trim().slice(0, 1000);
  const toStudent = form.get('visibility') === 'student';
  if (!UUID.test(id)) return fail('Application not found.');
  if (note.length < 2) return fail('Write the note first.');
  const db = createAdminClient();
  const { data: app } = await db.from('applications').select('id').eq('id', id).maybeSingle();
  if (!app) return fail('Application not found.');
  await logEvent(db, { application_id: id, type: 'note', actor: me.id, note, visible_to_student: toStudent });
  if (toStudent) emailNoteToStudent(id, note);
  refresh(id);
  return { ok: true, message: toStudent ? 'Sent: the student sees it in their history.' : 'Saved for the team.' };
}

// --------------------------------------------------------------------------------------- settings (admins)

/** Step 1 of the QR upload: a one-time signed URL for a new image under settings/. */
export async function requestQrUpload(type: string, size: number): Promise<{ ok: boolean; message?: string; url?: string; path?: string }> {
  await requireAdmin();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) return { ok: false, message: 'Upload the QR code as a PNG or JPG image.' };
  if (!(size > 0 && size <= 5 * 1024 * 1024)) return { ok: false, message: 'The image must be under 5 MB.' };
  const path = settingsPath('payment-qr', type);
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: 'Uploads are not working right now. Check that migration 0004 was run.' };
  return { ok: true, url: data.signedUrl, path };
}

const text = (form: FormData, name: string, max = 120) => String(form.get(name) ?? '').trim().slice(0, max);

export async function savePaymentSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const current = await getPaymentSettings();
  const db = createAdminClient();

  let qrPath = current.qrPath;
  const newQr = text(form, 'qrPath', 200);
  if (form.get('removeQr') === 'on') qrPath = null;
  else if (newQr && newQr !== current.qrPath) {
    if (!/^settings\/payment-qr\/[\w-]+\.(png|jpg|webp)$/.test(newQr)) return fail('That QR upload is not valid. Upload it again.');
    const { data: info } = await db.storage.from(BUCKET).info(newQr);
    if (!info || !String(info.contentType ?? '').startsWith('image/')) return fail('The QR image did not arrive. Upload it again.');
    qrPath = newQr;
  }

  const fees: PaymentSettings['applicationFeeUsd'] = {};
  for (const level of LEVEL_ORDER) {
    const v = money(form.get(`fee_${level}`));
    if (v === 'bad') return fail(`The ${level} fee must be an amount in US dollars.`);
    fees[level] = v;
  }
  const currency = text(form, 'currency', 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return fail('The currency is a 3-letter code, for example PKR.');

  const value: PaymentSettings = {
    ...EMPTY_PAYMENT_SETTINGS,
    accountTitle: text(form, 'accountTitle'),
    bankName: text(form, 'bankName'),
    accountNumber: text(form, 'accountNumber', 60),
    iban: text(form, 'iban', 60),
    instructions: text(form, 'instructions', 600),
    currency,
    qrPath,
    applicationFeeUsd: fees,
  };
  const { error } = await db.from('app_settings').upsert({ key: 'payment', value, updated_by: me.id });
  if (error) return fail(error.code === '42P01' ? 'Run supabase/migrations/0004_application_wizard.sql first.' : 'Could not save the settings.');
  if (current.qrPath && current.qrPath !== qrPath) await db.storage.from(BUCKET).remove([current.qrPath]);

  revalidatePath('/staff/settings');
  revalidatePath('/portal', 'layout');
  return { ok: true, message: 'Saved. Students see the new payment details straight away.' };
}

// ------------------------------------------------------------------------------------------------------ team

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type TeamRole = 'staff' | 'admin';

/** Give an existing account its new role straight away (otherwise it changes at their next sign-in). */
async function syncRole(email: string, role: TeamRole | 'student') {
  await createAdminClient().from('profiles').update({ role }).eq('email', email);
}

export async function addTeamMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const role = (form.get('role') === 'admin' ? 'admin' : 'staff') as TeamRole;
  if (!EMAIL.test(email)) return fail('Enter the Google email address they sign in with.');
  if (isOwnerEmail(email)) return fail('That email is an owner, so it is already an admin.');

  const { error } = await createAdminClient().from('team_members').upsert({ email, role, added_by: me.id });
  if (error) return fail('They could not be added. Please try again.');
  await syncRole(email, role);

  revalidatePath('/staff/team');
  return { ok: true, message: `${email} is now ${role === 'admin' ? 'an admin' : 'on the staff'}. They sign in with Google from the website's Log in button.` };
}

export async function changeTeamRole(form: FormData): Promise<void> {
  const me = await requireAdmin();
  const email = String(form.get('email') ?? '').toLowerCase();
  const role = (form.get('role') === 'admin' ? 'admin' : 'staff') as TeamRole;
  if (email === me.email.toLowerCase() || isOwnerEmail(email)) return; // nobody changes their own access or an owner's
  await createAdminClient().from('team_members').update({ role }).eq('email', email);
  await syncRole(email, role);
  revalidatePath('/staff/team');
}

export async function removeTeamMember(form: FormData): Promise<void> {
  const me = await requireAdmin();
  const email = String(form.get('email') ?? '').toLowerCase();
  if (email === me.email.toLowerCase() || isOwnerEmail(email)) return;
  await createAdminClient().from('team_members').delete().eq('email', email);
  await syncRole(email, 'student');
  revalidatePath('/staff/team');
}
