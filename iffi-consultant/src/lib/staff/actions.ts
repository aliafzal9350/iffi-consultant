'use server';
/**
 * Server Functions for the staff portal. Every one re-checks the caller's role (requireStaff / requireAdmin) and
 * then writes with the secret key, because students' row-level security does not allow these changes.
 */
import { revalidatePath } from 'next/cache';
import { isOwnerEmail, requireAdmin, requireStaff } from '@/lib/auth/dal';
import { createAdminClient } from '@/lib/supabase/admin';
import { canMove } from '@/lib/portal/transitions';
import { STATUS_LABEL, type ApplicationStatus } from '@/lib/portal/application';

export interface ActionState {
  ok: boolean;
  message: string | null;
}

const fail = (message: string): ActionState => ({ ok: false, message });

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

  await db.from('application_events').insert({ application_id: id, from_status: from, to_status: to, note: note || null, actor: me.id });

  revalidatePath('/staff', 'layout');
  revalidatePath(`/portal/applications/${id}`);
  return { ok: true, message: `Saved. The student now sees "${STATUS_LABEL[to]}".` };
}

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
