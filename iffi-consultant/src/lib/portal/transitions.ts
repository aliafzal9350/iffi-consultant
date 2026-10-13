/**
 * Which status changes staff can make, and what the button says. Admins can also correct any status by hand.
 *
 * This is IFFI's process written as data - review it with the team. Two rows matter for the refund rule
 * ("not qualifying = refund, backing off after paying = no refund"): `not_admitted` and `withdrawn`.
 */
import type { ApplicationStatus } from './application';

export interface StatusAction {
  to: ApplicationStatus;
  /** the button, as an action */
  label: string;
  /** staff must write a note the student will read */
  needsNote?: boolean;
}

export const TRANSITIONS: Record<ApplicationStatus, StatusAction[]> = {
  // until the online fee step exists, staff can start a review straight from a draft
  draft: [
    { to: 'under_review', label: 'Start reviewing' },
    { to: 'action_needed', label: 'Ask the student for something', needsNote: true },
    { to: 'withdrawn', label: 'Withdraw (student backed off)', needsNote: true },
  ],
  payment_submitted: [
    { to: 'under_review', label: 'Payment received: start reviewing' },
    { to: 'action_needed', label: 'Problem with the payment', needsNote: true },
  ],
  under_review: [
    { to: 'sent_to_university', label: 'Sent to the university' },
    { to: 'action_needed', label: 'Ask the student for something', needsNote: true },
    { to: 'not_admitted', label: 'Does not qualify', needsNote: true },
    { to: 'withdrawn', label: 'Withdraw (student backed off)', needsNote: true },
  ],
  action_needed: [
    { to: 'under_review', label: 'Student fixed it: continue reviewing' },
    { to: 'withdrawn', label: 'Withdraw (student backed off)', needsNote: true },
  ],
  sent_to_university: [
    { to: 'admitted', label: 'Admitted' },
    { to: 'not_admitted', label: 'Not admitted', needsNote: true },
  ],
  admitted: [
    { to: 'jw202_issued', label: 'JW202 issued' },
    { to: 'withdrawn', label: 'Withdraw (student declined)', needsNote: true },
  ],
  jw202_issued: [{ to: 'visa', label: 'Visa stage started' }],
  visa: [{ to: 'completed', label: 'Visa done: completed' }],
  not_admitted: [],
  completed: [],
  withdrawn: [],
};

export const ALL_STATUSES = Object.keys(TRANSITIONS) as ApplicationStatus[];

/** Can this role move an application from `from` to `to`? */
export function canMove(from: ApplicationStatus, to: ApplicationStatus, role: 'staff' | 'admin'): StatusAction | null {
  const action = TRANSITIONS[from]?.find((a) => a.to === to);
  if (action) return action;
  // admins can correct mistakes (any status -> any other), always with a note
  return role === 'admin' && from !== to && ALL_STATUSES.includes(to) ? { to, label: 'Correct status', needsNote: true } : null;
}

/** Groups for the staff dashboard and the application filters. */
export const STATUS_GROUPS: { key: string; label: string; statuses: ApplicationStatus[] }[] = [
  { key: 'new', label: 'New (in progress)', statuses: ['draft'] },
  { key: 'payment', label: 'Payment to check', statuses: ['payment_submitted'] },
  { key: 'review', label: 'Reviewing', statuses: ['under_review'] },
  { key: 'waiting', label: 'Waiting on student', statuses: ['action_needed'] },
  { key: 'university', label: 'With the university', statuses: ['sent_to_university'] },
  { key: 'admitted', label: 'Admitted and visa', statuses: ['admitted', 'jw202_issued', 'visa'] },
  { key: 'closed', label: 'Closed', statuses: ['completed', 'not_admitted', 'withdrawn'] },
];
