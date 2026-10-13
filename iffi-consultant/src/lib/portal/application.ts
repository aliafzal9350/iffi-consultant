/** Application sections and statuses, in the words students and staff see. */

export const APPLICATION_SECTIONS = [
  { key: 'personal', title: 'Personal details', description: 'Your name as in your passport, passport number, date and place of birth, and address.' },
  { key: 'education', title: 'Education', description: 'Your schools and results, from high school onwards.' },
  { key: 'family', title: 'Family and guarantor', description: "Your parents' details and who supports you financially." },
  { key: 'documents', title: 'Documents', description: 'Upload your passport, photo, certificates and the rest, with a sample for each.' },
  { key: 'review', title: 'Review and sign', description: 'Check everything, then sign the declaration.' },
  { key: 'fee', title: 'Pay the application fee', description: 'Scan the QR code, pay in your banking app and send us the transaction ID.' },
] as const;

export type ApplicationStatus =
  | 'draft'
  | 'payment_submitted'
  | 'under_review'
  | 'action_needed'
  | 'sent_to_university'
  | 'admitted'
  | 'not_admitted'
  | 'jw202_issued'
  | 'visa'
  | 'completed'
  | 'withdrawn';

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: 'In progress',
  payment_submitted: 'Payment being checked',
  under_review: 'IFFI is reviewing',
  action_needed: 'Action needed',
  sent_to_university: 'Sent to the university',
  admitted: 'Admitted',
  not_admitted: 'Not admitted',
  jw202_issued: 'JW202 issued',
  visa: 'Visa stage',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

export interface ApplicationRow {
  id: string;
  program_id: string;
  program_snapshot: { displayName: string; city: string | null; province: string; level: string };
  status: ApplicationStatus;
  form: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
