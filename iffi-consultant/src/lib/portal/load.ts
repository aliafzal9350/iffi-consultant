/**
 * One application with everything around it: the programme snapshot, uploaded documents, payments and history.
 * Reads as the signed-in visitor, so row-level security decides: students get only their own, staff get any.
 */
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Program } from '@/types/data';
import { APPLICATION_COLUMNS, type ApplicationFull } from './application';
import { DOC_COLUMNS, requiredDocuments, submissionBlockers, summariseDocs, type DocSummary, type UploadedDoc } from './documents';
import { EVENT_COLUMNS, type EventRow } from './events';
import type { FormContext } from './form';
import { PAYMENT_COLUMNS, latestPayment, type PaymentRow } from './payment';
import { stepsFor, type StepProgress } from './progress';
import { UUID } from './files';

export interface LoadedApplication {
  app: ApplicationFull;
  /** the programme as it was when the student applied */
  program: Program;
  ctx: FormContext;
  docs: UploadedDoc[];
  summary: DocSummary;
  blockers: ReturnType<typeof submissionBlockers>;
  payments: PaymentRow[];
  events: EventRow[];
  steps: StepProgress[];
}

const num = (v: unknown) => (v == null ? null : Number(v));

export function formContextFor(p: Program): FormContext {
  return { level: p.level, majors: p.majors ?? [], teaching: p.teachingLanguages ?? [], intake: p.intake ?? null, duration: p.duration ?? null };
}

export const loadApplication = cache(async (id: string): Promise<LoadedApplication | null> => {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('applications').select(APPLICATION_COLUMNS).eq('id', id).maybeSingle();
  if (error) console.error('[portal/load]', error.message, error.code === '42703' ? '-> run supabase/migrations/0004_application_wizard.sql' : '');
  if (!data) return null;
  const app = {
    ...(data as unknown as ApplicationFull),
    application_fee_usd: num((data as { application_fee_usd: unknown }).application_fee_usd),
    service_charge_usd: num((data as { service_charge_usd: unknown }).service_charge_usd),
  } as ApplicationFull;

  const [{ data: docs }, { data: payments }, { data: events }] = await Promise.all([
    supabase.from('application_documents').select(DOC_COLUMNS).eq('application_id', id).order('created_at'),
    supabase.from('application_payments').select(PAYMENT_COLUMNS).eq('application_id', id).order('created_at', { ascending: false }),
    supabase.from('application_events').select(EVENT_COLUMNS).eq('application_id', id).order('created_at', { ascending: false }).limit(200),
  ]);

  const program = app.program_snapshot as unknown as Program;
  const files = (docs ?? []) as UploadedDoc[];
  const summary = summariseDocs(requiredDocuments(program), files);
  const blockers = submissionBlockers(summary);
  const pays = ((payments ?? []) as PaymentRow[]).map((p) => ({ ...p, amount: Number(p.amount) }));

  return {
    app,
    program,
    ctx: formContextFor(program),
    docs: files,
    summary,
    blockers,
    payments: pays,
    events: (events ?? []) as unknown as EventRow[],
    steps: stepsFor({
      form: app.form ?? {},
      status: app.status,
      signedAt: app.signed_at,
      missingDocs: summary.missing.length,
      blockingDocs: blockers.length,
      rejectedDocs: summary.rejected,
      feeStatus: latestPayment(pays, 'application_fee')?.status ?? null,
    }),
  };
});
