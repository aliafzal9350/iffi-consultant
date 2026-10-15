'use server';
/**
 * Server Functions for filling in an application. Every one starts with requireUser() and checks the application is
 * the caller's own. Form answers are written through the student's session (RLS + the `form` column grant); files,
 * signatures, payments and the activity log need the secret key, after these checks.
 *
 * Uploads never pass through this server: requestUpload() hands the browser a one-time signed URL for a path the
 * server chose, the browser PUTs the file straight to storage, then confirmUpload() checks what arrived.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Program } from '@/types/data';
import {
  FORM_SECTION_KEYS,
  REPLACE_REJECTED_STATUSES,
  isEditable,
  isFormSection,
  sectionDone,
  stepPath,
  type ApplicationStatus,
  type FormSectionKey,
} from './application';
import { DOCS, FILE_TYPES, MB, fmtBytes, isDocKind, type DocKind } from './documents';
import { logEvent } from './events';
import { BUCKET, cleanFileName, isUploadPathFor, uploadPath, UUID } from './files';
import { SECTIONS, passportName, sanitizeSection, savedSection, validateSection, type Errors } from './form';
import { formContextFor, loadApplication } from './load';
import { PAYMENT_CURRENCY, latestPayment, type PaymentPurpose } from './payment';
import { DECLARATION, REFUND_POLICY } from './policy';
import { emailPaymentSubmitted, emailStaffStudentFixed } from '@/lib/notify/application';

export interface ActionResult {
  ok: boolean;
  message?: string;
  errors?: Errors;
}

const fail = (message: string, errors?: Errors): ActionResult => ({ ok: false, message, ...(errors ? { errors } : {}) });

const CLOSED: readonly ApplicationStatus[] = ['completed', 'not_admitted', 'withdrawn'];

/** The application's id, owner, status and form, read through the student's own session. */
async function ownApp(id: string, userId: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('applications').select('id, user_id, status, form, signed_at, program_snapshot').eq('id', id).maybeSingle();
  if (!data || data.user_id !== userId) return null;
  return data as { id: string; user_id: string; status: ApplicationStatus; form: Record<string, unknown> | null; signed_at: string | null; program_snapshot: Program };
}

function refresh(id: string) {
  revalidatePath(`/portal/applications/${id}`, 'layout');
  revalidatePath('/portal');
  revalidatePath('/staff', 'layout');
}

// ------------------------------------------------------------------------------------------------ form parts

export interface SaveResult extends ActionResult {
  savedAt?: string;
  completed?: boolean;
}

/**
 * Save one part of the form. `finish` = "Save and continue": every check must pass, then the part is marked done and
 * the student moves on. Without it (autosave) the answers are kept as they are, and the part stays done only while
 * its answers still pass.
 */
export async function saveSection(id: string, key: string, raw: unknown, finish: boolean): Promise<SaveResult> {
  const me = await requireUser();
  if (!isFormSection(key)) return fail('This part of the form does not exist.');
  const app = await ownApp(id, me.id);
  if (!app) return fail('This application could not be found.');
  if (!isEditable(app.status)) return fail('IFFI is working on your application, so it cannot be changed now. Message your adviser if something needs fixing.');

  const ctx = formContextFor(app.program_snapshot);
  const values = sanitizeSection(key, raw);
  const errors = validateSection(key, values, ctx);
  const valid = Object.keys(errors).length === 0;
  if (finish && !valid) return fail('Some answers need fixing.', errors);

  const form = app.form ?? {};
  const wasDone = sectionDone(form, key);
  const completed = valid && (finish || wasDone);
  const changed = JSON.stringify(savedSection(form, key)) !== JSON.stringify(values);

  const savedAt = new Date().toISOString();
  if (changed || completed !== wasDone) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('applications')
      .update({ form: { ...form, [key]: { ...values, completed, savedAt } } })
      .eq('id', id);
    if (error) {
      console.error('[apply/save]', error.message);
      return fail('Your answers could not be saved. Check your connection and try again.');
    }

    const db = createAdminClient();
    if (completed && !wasDone) await logEvent(db, { application_id: id, type: 'form', actor: me.id, meta: { section: key } });
    // a signed form that changes is no longer the form that was signed
    if (changed && app.signed_at) {
      await db.from('applications').update({ signed_name: null, signed_at: null }).eq('id', id);
      await logEvent(db, { application_id: id, type: 'signature', actor: me.id, note: 'Signature removed because the answers changed. Sign again in "Review and sign".', meta: { cleared: true, section: key } });
    }
  }

  if (finish) {
    refresh(id);
    // the next unfinished part after this one, then any skipped before it, then the documents
    const at = FORM_SECTION_KEYS.indexOf(key);
    const open = (k: FormSectionKey) => !sectionDone(form, k);
    redirect(stepPath(id, FORM_SECTION_KEYS.slice(at + 1).find(open) ?? FORM_SECTION_KEYS.slice(0, at).find(open) ?? 'documents'));
  }
  return { ok: true, savedAt, completed };
}

// ---------------------------------------------------------------------------------------------------- uploads

export interface UploadTicket extends ActionResult {
  url?: string;
  path?: string;
}

interface FileMeta {
  name: string;
  type: string;
  size: number;
}

/** Can the student add a file of this kind now? Returns the reason when not. */
async function uploadCheck(app: { id: string; status: ApplicationStatus }, kind: DocKind, replaces: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.from('application_documents').select('id, status').eq('application_id', app.id).eq('kind', kind);
  const existing = (data ?? []) as { id: string; status: string }[];
  const replacing = replaces ? existing.find((d) => d.id === replaces && d.status === 'rejected') : undefined;
  if (replaces && !replacing) return { error: 'The file you are replacing was not found. Refresh the page and try again.' };

  // while IFFI reviews, students can still replace a rejected file or send a document that is missing altogether
  const missing = !existing.some((d) => d.status !== 'rejected');
  if (kind === 'payment_proof') {
    if (CLOSED.includes(app.status)) return { error: 'This application is closed.' };
    if (existing.length >= 10) return { error: 'Too many payment screenshots. Message IFFI on WhatsApp.' };
  } else if (!isEditable(app.status) && !((replacing || missing) && REPLACE_REJECTED_STATUSES.includes(app.status))) {
    return { error: 'IFFI is working on your application, so files cannot be added now. Message your adviser if you need to send something.' };
  } else if (!replacing && existing.filter((d) => d.status !== 'rejected').length >= DOCS[kind].maxFiles) {
    return { error: `You can upload up to ${DOCS[kind].maxFiles} file${DOCS[kind].maxFiles > 1 ? 's' : ''} here. Delete one first.` };
  }
  return { replacing };
}

function fileProblem(kind: DocKind, type: string, size: number): string | null {
  const t = FILE_TYPES[DOCS[kind].files];
  if (!(t.mime as readonly string[]).includes(type)) return `Upload a ${t.label} file.`;
  if (!(size > 0)) return 'This file is empty.';
  if (size > t.maxMB * MB) return `This file is ${fmtBytes(size)}. The limit is ${t.maxMB} MB.`;
  return null;
}

/** Step 1 of an upload: check everything, then hand out a one-time signed URL for a path the server chose. */
export async function requestUpload(id: string, kind: string, file: FileMeta, replaces: string | null = null): Promise<UploadTicket> {
  const me = await requireUser();
  if (!isDocKind(kind)) return fail('Unknown document.');
  const problem = fileProblem(kind, String(file?.type ?? ''), Number(file?.size));
  if (problem) return fail(problem);
  const app = await ownApp(id, me.id);
  if (!app) return fail('This application could not be found.');
  const check = await uploadCheck(app, kind, replaces);
  if (check.error) return fail(check.error);

  const path = uploadPath(me.id, id, kind, file.type);
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[apply/upload] signed url', error?.message, /bucket/i.test(error?.message ?? '') ? '-> run supabase/migrations/0004_application_wizard.sql' : '');
    return fail('Uploads are not working right now. Please try again in a minute.');
  }
  return { ok: true, url: data.signedUrl, path };
}

/** Step 2: the browser says the file arrived. Check what storage actually holds, then record it. */
export async function confirmUpload(id: string, kind: string, path: string, name: string, replaces: string | null = null): Promise<ActionResult & { docId?: string }> {
  const me = await requireUser();
  if (!isDocKind(kind) || !isUploadPathFor(String(path), me.id, id, kind)) return fail('This upload could not be checked.');
  const app = await ownApp(id, me.id);
  if (!app) return fail('This application could not be found.');
  const check = await uploadCheck(app, kind, replaces);
  const db = createAdminClient();
  const bucket = db.storage.from(BUCKET);
  if (check.error) {
    await bucket.remove([path]);
    return fail(check.error);
  }

  const { data: info, error: infoError } = await bucket.info(path);
  if (infoError || !info) return fail('The file did not arrive. Please upload it again.');
  const mime = String(info.contentType ?? '').split(';')[0].trim().toLowerCase();
  const size = Number(info.size ?? 0);
  const problem = fileProblem(kind, mime, size);
  if (problem) {
    await bucket.remove([path]);
    return fail(problem);
  }

  const fileName = cleanFileName(String(name ?? ''));
  const { data: row, error } = await db
    .from('application_documents')
    .insert({ application_id: id, user_id: me.id, kind, storage_path: path, file_name: fileName, mime_type: mime, size_bytes: size })
    .select('id')
    .single();
  if (error || !row) {
    console.error('[apply/upload] record', error?.message);
    await bucket.remove([path]);
    return fail('The file could not be saved. Please try again.');
  }

  if (check.replacing) await removeDocument(db, check.replacing.id);
  if (kind !== 'payment_proof') {
    await logEvent(db, { application_id: id, type: 'document', actor: me.id, meta: { kind, file: fileName, action: check.replacing ? 'replaced' : 'uploaded' } });
  }
  refresh(id);
  return { ok: true, docId: row.id };
}

async function removeDocument(db: ReturnType<typeof createAdminClient>, docId: string) {
  const { data } = await db.from('application_documents').delete().eq('id', docId).select('storage_path').maybeSingle();
  if (data?.storage_path) await db.storage.from(BUCKET).remove([data.storage_path]);
}

export async function deleteDocument(docId: string): Promise<ActionResult> {
  const me = await requireUser();
  if (!UUID.test(docId)) return fail('File not found.');
  const supabase = await createClient();
  const { data: doc } = await supabase.from('application_documents').select('id, application_id, user_id, kind, status, file_name').eq('id', docId).maybeSingle();
  if (!doc || doc.user_id !== me.id) return fail('File not found.');
  if (doc.status === 'accepted') return fail('IFFI has already accepted this file. Message your adviser if it needs changing.');
  if (doc.kind === 'payment_proof') return fail('Payment screenshots stay with the payment.');
  const app = await ownApp(doc.application_id, me.id);
  if (!app) return fail('This application could not be found.');
  if (!isEditable(app.status) && !(doc.status === 'rejected' && REPLACE_REJECTED_STATUSES.includes(app.status))) {
    return fail('IFFI is working on your application, so files cannot be removed now.');
  }

  const db = createAdminClient();
  await removeDocument(db, doc.id);
  await logEvent(db, { application_id: doc.application_id, type: 'document', actor: me.id, meta: { kind: doc.kind, file: doc.file_name, action: 'deleted' } });
  refresh(doc.application_id);
  return { ok: true };
}

// ----------------------------------------------------------------------------------------------- sign and pay

const normaliseName = (s: string) => s.toUpperCase().replace(/[^A-Z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3400-\u9FFF]+/g, ' ').trim();

/** "Review and sign": every part done, nothing blocking, the declaration ticked and the passport name typed. */
export async function signApplication(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const id = String(data.get('id') ?? '');
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) return fail('This application could not be found.');
  const { app, ctx, blockers } = loaded;
  if (!isEditable(app.status)) return fail('This application has already been sent to IFFI.');

  for (const key of FORM_SECTION_KEYS) {
    const errors = validateSection(key, savedSection(app.form ?? {}, key), ctx);
    if (!sectionDone(app.form ?? {}, key) || Object.keys(errors).length) return fail(`Finish "${SECTIONS[key].title}" first.`);
  }
  if (blockers.length) return fail(`Upload these first: ${blockers.map((b) => DOCS[b.kind].title).join(', ')}.`);
  if (DECLARATION.points.some((_, i) => data.get(`agree${i}`) !== 'on')) return fail('Tick each statement to confirm it.');

  const typed = normaliseName(String(data.get('name') ?? ''));
  const personal = savedSection(app.form ?? {}, 'personal');
  const surname = normaliseName(String(personal.surname ?? ''));
  const given = normaliseName(String(personal.givenName ?? ''));
  const accepted = [normaliseName(passportName(personal)), normaliseName(`${given} ${surname}`)].filter(Boolean);
  if (!typed || !accepted.includes(typed)) return fail(`Type your name exactly as in your passport: ${passportName(personal) || 'your full name'}.`);

  const db = createAdminClient();
  const { data: signed, error } = await db
    .from('applications')
    .update({ signed_name: String(data.get('name')).trim().slice(0, 200), signed_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['draft', 'action_needed'])
    .select('id');
  if (error || !signed?.length) return fail('Your signature could not be saved. Please try again.');
  await logEvent(db, { application_id: id, type: 'signature', actor: me.id, meta: { declaration: DECLARATION.version } });

  refresh(id);
  redirect(stepPath(id, 'fee'));
}

export async function acceptRefundPolicy(data: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(data.get('id') ?? '');
  const purpose = data.get('purpose') === 'service_charge' ? 'service' : '';
  const app = await ownApp(id, me.id);
  if (!app || data.get('accept') !== 'on') redirect(`${stepPath(id, 'fee')}${purpose ? '?for=service' : ''}`);

  const db = createAdminClient();
  await db.from('applications').update({ refund_policy_version: REFUND_POLICY.version, refund_policy_accepted_at: new Date().toISOString() }).eq('id', id);
  await logEvent(db, { application_id: id, type: 'signature', actor: me.id, meta: { refundPolicy: REFUND_POLICY.version } });
  refresh(id);
  redirect(`${stepPath(id, 'fee')}${purpose ? '?for=service' : ''}`);
}

const TXN = /^[A-Za-z0-9][A-Za-z0-9\-_/.# ]{3,79}$/;

/** The student paid with the QR code: record the transaction for staff to check. */
export async function submitPayment(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const id = String(data.get('id') ?? '');
  const purpose: PaymentPurpose = data.get('purpose') === 'service_charge' ? 'service_charge' : 'application_fee';
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) return fail('This application could not be found.');
  const { app, payments } = loaded;

  const last = latestPayment(payments, purpose);
  if (last && last.status !== 'rejected') return fail(last.status === 'verified' ? 'IFFI has already received this payment.' : 'Your payment is already being checked.');
  if (purpose === 'application_fee') {
    if (!app.signed_at) return fail('Sign your application first.');
    if (!isEditable(app.status) && app.status !== 'payment_submitted') return fail('This application is past the payment step.');
  } else if (!['jw202_issued', 'visa'].includes(app.status)) {
    return fail('The service charge is paid after your JW202 is issued.');
  }
  if (app.refund_policy_version !== REFUND_POLICY.version) return fail('Read and accept the refund policy first.');

  const errors: Errors = {};
  const amount = Number(String(data.get('amount') ?? '').replace(/,/g, ''));
  const currency = PAYMENT_CURRENCY;
  const txn = String(data.get('transactionId') ?? '').trim();
  const paidOn = String(data.get('paidOn') ?? '');
  const proofId = String(data.get('proofId') ?? '');
  if (!(amount > 0 && amount < 1e9)) errors.amount = 'Enter the amount you paid.';
  if (!TXN.test(txn)) errors.transactionId = 'Copy the transaction ID (or reference number) from your banking app.';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(paidOn) ? new Date(`${paidOn}T00:00:00Z`) : null;
  const tomorrow = Date.now() + 24 * 3600 * 1000;
  if (!day || Number.isNaN(day.getTime()) || day.getTime() > tomorrow || day.getTime() < tomorrow - 120 * 24 * 3600 * 1000) errors.paidOn = 'Enter the day you paid.';
  const proof = loaded.docs.find((d) => d.id === proofId && d.kind === 'payment_proof');
  if (!proof) errors.proof = 'Upload the screenshot of your payment.';
  if (Object.keys(errors).length) return fail('Some details need fixing.', errors);

  const db = createAdminClient();
  const { data: pay, error } = await db
    .from('application_payments')
    .insert({ application_id: id, user_id: me.id, purpose, amount, currency, transaction_id: txn, paid_on: paidOn, proof_document_id: proof!.id })
    .select('id')
    .single();
  if (error || !pay) {
    if (error?.code === '23505') return fail('This transaction ID has already been sent. Check it, or message IFFI on WhatsApp.', { transactionId: 'Already used.' });
    console.error('[apply/pay]', error?.message);
    return fail('Your payment could not be recorded. Please try again.');
  }
  await logEvent(db, { application_id: id, type: 'payment', actor: me.id, meta: { purpose, amount, currency, transactionId: txn, action: 'submitted' } });
  emailPaymentSubmitted(id, purpose, amount, currency, txn);

  if (purpose === 'application_fee' && isEditable(app.status)) {
    const { data: moved } = await db.from('applications').update({ status: 'payment_submitted' }).eq('id', id).eq('status', app.status).select('id');
    if (moved?.length) await logEvent(db, { application_id: id, type: 'status', actor: me.id, from_status: app.status, to_status: 'payment_submitted' });
  }

  refresh(id);
  return { ok: true, message: 'Thank you. IFFI checks the payment in its account and confirms it here.' };
}

/**
 * "I have fixed it": after IFFI asked for something. Back to IFFI's review when the fee is already paid, otherwise back
 * to the normal steps (sign, then pay).
 */
export async function markFixed(_prev: ActionResult, data: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const id = String(data.get('id') ?? '');
  const note = String(data.get('note') ?? '').trim().slice(0, 1000);
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) return fail('This application could not be found.');
  if (loaded.app.status !== 'action_needed') return fail('Nothing is waiting on you right now.');

  const fee = latestPayment(loaded.payments, 'application_fee');
  const to: ApplicationStatus = fee && fee.status !== 'rejected' ? 'under_review' : 'draft';
  if (to === 'under_review' && !loaded.app.signed_at) return fail('You changed your answers, so sign your application again in “Review and sign” first.');
  const db = createAdminClient();
  const { data: moved } = await db.from('applications').update({ status: to }).eq('id', id).eq('status', 'action_needed').select('id');
  if (!moved?.length) return fail('Your application changed meanwhile. Refresh the page.');
  await logEvent(db, { application_id: id, type: 'status', actor: me.id, from_status: 'action_needed', to_status: to, note: note || 'The student says it is fixed.' });
  emailStaffStudentFixed(id, note || null);

  refresh(id);
  return { ok: true, message: to === 'under_review' ? 'Sent. IFFI is reviewing your application again.' : 'Thanks. Continue with the steps below.' };
}
