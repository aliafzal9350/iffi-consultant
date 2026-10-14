/**
 * The activity log (application_events). Status changes, finished form parts, uploads, reviews, signatures,
 * payments and staff notes all land here, so staff can see everything that happened to an application in one list.
 */
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApplicationStatus } from './application';

export type EventType = 'status' | 'form' | 'document' | 'payment' | 'signature' | 'note' | 'assignment';

export interface NewEvent {
  application_id: string;
  type: EventType;
  actor: string;
  from_status?: ApplicationStatus | null;
  to_status?: ApplicationStatus | null;
  note?: string | null;
  /** what the event is about, e.g. { kind: 'passport', file: 'scan.pdf' } */
  meta?: Record<string, unknown> | null;
  /** false = staff only (internal notes) */
  visible_to_student?: boolean;
}

/** Log one event with the secret-key client. Never throws: a lost log line must not undo the change it describes. */
export async function logEvent(db: SupabaseClient, e: NewEvent): Promise<void> {
  const { error } = await db.from('application_events').insert({
    application_id: e.application_id,
    type: e.type,
    actor: e.actor,
    from_status: e.from_status ?? null,
    to_status: e.to_status ?? null,
    note: e.note ? e.note.slice(0, 1000) : null,
    meta: e.meta ?? null,
    visible_to_student: e.visible_to_student ?? true,
  });
  if (error) console.error('[events] could not log', e.type, error.message, error.code === '42703' ? '-> run supabase/migrations/0004_application_wizard.sql' : '');
}

export interface EventRow {
  id: number;
  type: EventType;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  note: string | null;
  meta: Record<string, unknown> | null;
  visible_to_student: boolean;
  created_at: string;
  actor: { full_name: string | null; email: string } | null;
}

export const EVENT_COLUMNS = 'id, type, from_status, to_status, note, meta, visible_to_student, created_at, actor:profiles(full_name, email)';
