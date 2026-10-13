/** Reads for the staff portal. They run as the signed-in staff member; the "staff read ..." RLS policies allow them. */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ApplicationStatus } from '@/lib/portal/application';
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
  student: StudentSummary | null;
}

export interface ApplicationEvent {
  id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note: string | null;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
}

const APP_COLUMNS = 'id, user_id, program_id, program_snapshot, status, form, created_at, updated_at, student:profiles(id, full_name, email, whatsapp, avatar_url, created_at)';

export async function listApplications(statuses?: ApplicationStatus[], limit = 200): Promise<StaffApplication[]> {
  const supabase = await createClient();
  let q = supabase.from('applications').select(APP_COLUMNS).order('updated_at', { ascending: false }).limit(limit);
  if (statuses?.length) q = q.in('status', statuses);
  const { data } = await q;
  return (data ?? []) as unknown as StaffApplication[];
}

export async function getApplicationDetail(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('applications').select(APP_COLUMNS).eq('id', id).maybeSingle();
  if (!data) return null;
  const app = data as unknown as StaffApplication;
  const [{ data: study }, { data: events }, { data: others }] = await Promise.all([
    supabase.from('study_profiles').select('*').eq('user_id', app.user_id).maybeSingle(),
    supabase
      .from('application_events')
      .select('id, from_status, to_status, note, created_at, actor:profiles(full_name, email)')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('applications').select('id, program_snapshot, status').eq('user_id', app.user_id).neq('id', id),
  ]);
  return {
    app,
    study: study as StudyProfile | null,
    events: (events ?? []) as unknown as ApplicationEvent[],
    otherApplications: (others ?? []) as { id: string; program_snapshot: { displayName: string }; status: ApplicationStatus }[],
  };
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
