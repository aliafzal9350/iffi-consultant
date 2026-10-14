/** Reads for the staff portal. They run as the signed-in staff member; the "staff read ..." RLS policies allow them. */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Program } from '@/types/data';
import type { ApplicationStatus } from '@/lib/portal/application';
import { requiredDocuments, submissionBlockers, summariseDocs, type UploadedDoc } from '@/lib/portal/documents';
import { loadApplication } from '@/lib/portal/load';
import { latestPayment, type PaymentRow } from '@/lib/portal/payment';
import { percentDone, stepsFor } from '@/lib/portal/progress';
import type { StudyProfile } from '@/lib/portal/study';

export interface StudentSummary {
  id: string;
  full_name: string | null;
  email: string;
  whatsapp: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface StaffApplication {
  id: string;
  user_id: string;
  program_id: string;
  program_snapshot: { displayName: string; city: string | null; province: string; level: string; slug: string };
  status: ApplicationStatus;
  form: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  assigned_to: string | null;
  student: StudentSummary | null;
  /** filled in by listApplications */
  progress: number;
  pendingDocs: number;
  missingDocs: number;
  paymentToCheck: boolean;
}

export interface ApplicationEvent {
  id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
}

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

const APP_COLUMNS =
  'id, user_id, program_id, program_snapshot, status, form, created_at, updated_at, signed_at, assigned_to, student:profiles!applications_user_id_fkey(id, full_name, email, whatsapp, avatar_url, created_at)';

/**
 * Applications, newest activity first, each with its progress and what is waiting for staff (files to check, a
 * payment to verify). Two extra reads cover every listed application at once.
 */
export async function listApplications(statuses?: ApplicationStatus[], limit = 200): Promise<StaffApplication[]> {
  const supabase = await createClient();
  let q = supabase.from('applications').select(APP_COLUMNS).order('updated_at', { ascending: false }).limit(limit);
  if (statuses?.length) q = q.in('status', statuses);
  const { data, error } = await q;
  if (error) console.error('[staff/applications]', error.message);
  const apps = (data ?? []) as unknown as Omit<StaffApplication, 'progress' | 'pendingDocs' | 'missingDocs' | 'paymentToCheck'>[];
  if (!apps.length) return [];

  const ids = apps.map((a) => a.id);
  const [{ data: docs }, { data: pays }] = await Promise.all([
    supabase.from('application_documents').select('id, application_id, kind, status, file_name, mime_type, size_bytes, review_note, reviewed_at, created_at').in('application_id', ids),
    supabase.from('application_payments').select('id, application_id, purpose, status, created_at').in('application_id', ids).order('created_at', { ascending: false }),
  ]);
  const docsOf = new Map<string, UploadedDoc[]>();
  for (const d of (docs ?? []) as (UploadedDoc & { application_id: string })[]) docsOf.set(d.application_id, [...(docsOf.get(d.application_id) ?? []), d]);
  const paysOf = new Map<string, PaymentRow[]>();
  for (const p of (pays ?? []) as (PaymentRow & { application_id: string })[]) paysOf.set(p.application_id, [...(paysOf.get(p.application_id) ?? []), p]);

  return apps.map((a) => {
    const files = docsOf.get(a.id) ?? [];
    const payments = paysOf.get(a.id) ?? [];
    const summary = summariseDocs(requiredDocuments(a.program_snapshot as unknown as Program), files);
    const steps = stepsFor({
      form: a.form ?? {},
      status: a.status,
      signedAt: a.signed_at,
      missingDocs: summary.missing.length,
      blockingDocs: submissionBlockers(summary).length,
      rejectedDocs: summary.rejected,
      feeStatus: latestPayment(payments, 'application_fee')?.status ?? null,
    });
    return {
      ...a,
      progress: percentDone(steps),
      pendingDocs: summary.pending,
      missingDocs: summary.missing.length,
      paymentToCheck: payments.some((p) => p.status === 'submitted'),
    };
  });
}

export async function getApplicationDetail(id: string) {
  const loaded = await loadApplication(id);
  if (!loaded) return null;
  const supabase = await createClient();
  const [{ data: student }, { data: study }, { data: others }, team] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, whatsapp, avatar_url, created_at').eq('id', loaded.app.user_id).maybeSingle(),
    supabase.from('study_profiles').select('*').eq('user_id', loaded.app.user_id).maybeSingle(),
    supabase.from('applications').select('id, program_snapshot, status').eq('user_id', loaded.app.user_id).neq('id', id),
    listTeamMembers(),
  ]);
  return {
    ...loaded,
    student: student as StudentSummary | null,
    study: study as StudyProfile | null,
    otherApplications: (others ?? []) as { id: string; program_snapshot: { displayName: string }; status: ApplicationStatus }[],
    team,
  };
}

/** Everyone who can be put in charge of an application. */
export async function listTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('id, full_name, email, avatar_url').in('role', ['staff', 'admin']).order('full_name');
  return (data ?? []) as TeamMember[];
}

/** Files waiting to be checked, oldest first: the staff document queue. */
export async function listPendingDocuments(limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('application_documents')
    .select('id, application_id, kind, file_name, mime_type, size_bytes, created_at, student:profiles!application_documents_user_id_fkey(full_name, email)')
    .eq('status', 'pending')
    .neq('kind', 'payment_proof')
    .order('created_at')
    .limit(limit);
  return (data ?? []) as unknown as {
    id: string;
    application_id: string;
    kind: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
    student: { full_name: string | null; email: string } | null;
  }[];
}

export async function listStudents(limit = 300) {
  const supabase = await createClient();
  const [{ data, count }, { data: studies }, { data: apps }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, whatsapp, avatar_url, created_at', { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('study_profiles').select('user_id, level, completed_at'),
    supabase.from('applications').select('id, user_id'),
  ]);
  const levelOf = new Map((studies ?? []).filter((s) => s.completed_at).map((s) => [s.user_id as string, s.level as string]));
  const appsOf = new Map<string, string[]>();
  for (const a of apps ?? []) appsOf.set(a.user_id as string, [...(appsOf.get(a.user_id as string) ?? []), a.id as string]);
  return {
    count: count ?? 0,
    students: ((data ?? []) as StudentSummary[]).map((s) => ({ ...s, level: levelOf.get(s.id) ?? null, applicationIds: appsOf.get(s.id) ?? [] })),
  };
}

export async function listTeam() {
  const supabase = await createClient();
  const [{ data: members }, { data: staffProfiles }] = await Promise.all([
    supabase.from('team_members').select('email, role, created_at').order('created_at'),
    supabase.from('profiles').select('email, full_name, avatar_url, role').in('role', ['staff', 'admin']),
  ]);
  return {
    members: (members ?? []) as { email: string; role: 'staff' | 'admin'; created_at: string }[],
    profiles: (staffProfiles ?? []) as { email: string; full_name: string | null; avatar_url: string | null; role: string }[],
  };
}
