/**
 * Where an application stands, step by step. Pure: the student hub, the step bar on every step page and the staff
 * view all read the same answer.
 */
import { APPLICATION_STEPS, FORM_SECTION_KEYS, sectionDone, type ApplicationStatus, type StepKey } from './application';
import type { PaymentStatus } from './payment';

export type StepState = 'done' | 'todo' | 'attention' | 'locked';

export interface ProgressFacts {
  form: Record<string, unknown>;
  status: ApplicationStatus;
  signedAt: string | null;
  /** required documents still missing (or all of their files were rejected) */
  missingDocs: number;
  /** missing documents that stop signing (see submissionBlockers) */
  blockingDocs: number;
  rejectedDocs: number;
  /** the latest application-fee payment */
  feeStatus: PaymentStatus | null;
}

export interface StepProgress {
  key: StepKey;
  title: string;
  description: string;
  number: number;
  state: StepState;
}

export function formComplete(form: Record<string, unknown>): boolean {
  return FORM_SECTION_KEYS.every((k) => sectionDone(form, k));
}

export function stepsFor(f: ProgressFacts): StepProgress[] {
  const formDone = formComplete(f.form);
  const paid = f.status !== 'draft' && f.status !== 'action_needed' ? true : f.feeStatus === 'submitted' || f.feeStatus === 'verified';

  const state = (key: StepKey): StepState => {
    switch (key) {
      case 'documents':
        if (f.rejectedDocs > 0) return 'attention';
        return f.missingDocs === 0 ? 'done' : 'todo';
      case 'review':
        if (f.signedAt) return 'done';
        return formDone && f.blockingDocs === 0 ? 'todo' : 'locked';
      case 'fee':
        if (paid) return 'done';
        if (f.feeStatus === 'rejected') return 'attention';
        return f.signedAt ? 'todo' : 'locked';
      default:
        return sectionDone(f.form, key) ? 'done' : 'todo';
    }
  };

  return APPLICATION_STEPS.map((s, i) => ({ key: s.key, title: s.title, description: s.description, number: i + 1, state: state(s.key) }));
}

/** The step to open next: anything that needs attention first, then the first step not done. */
export function nextStep(steps: StepProgress[]): StepProgress | null {
  return steps.find((s) => s.state === 'attention') ?? steps.find((s) => s.state === 'todo') ?? null;
}

export function percentDone(steps: StepProgress[]): number {
  return Math.round((steps.filter((s) => s.state === 'done').length / steps.length) * 100);
}
