/** Application steps and statuses, in the words students and staff see. */

/** The five parts of the online form (lib/portal/form.ts has their fields). */
export const FORM_SECTION_KEYS = ['personal', 'contact', 'education', 'study', 'family'] as const;
export type FormSectionKey = (typeof FORM_SECTION_KEYS)[number];
export const isFormSection = (key: string): key is FormSectionKey => (FORM_SECTION_KEYS as readonly string[]).includes(key);

/** Every step of an application, in order. Each one is a page under /portal/applications/:id/:key. */
export const APPLICATION_STEPS = [
  { key: 'personal', title: 'About you', description: 'Your name as in your passport, passport details, birth and nationality.' },
  { key: 'contact', title: 'Contact and address', description: 'Phone, email, and the address where your admission letter is posted.' },
  { key: 'education', title: 'Education and languages', description: 'Your schools from high school onwards, any work, and your English or Chinese tests.' },
  { key: 'study', title: 'Study plan in China', description: 'The major you want, the teaching language and how you will pay.' },
  { key: 'family', title: 'Family and guarantor', description: "Your parents' details and who supports you financially." },
  { key: 'documents', title: 'Documents', description: 'Upload your passport, photo, certificates and the two forms. Every document has a sample.' },
  { key: 'review', title: 'Review and sign', description: 'Check everything, download your filled-in form and sign the declaration.' },
  { key: 'fee', title: 'Pay the application fee', description: 'Scan the QR code, pay in your banking app and send us the transaction ID.' },
] as const;

export type StepKey = (typeof APPLICATION_STEPS)[number]['key'];
export const stepPath = (id: string, key: StepKey) => `/portal/applications/${id}/${key}`;

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

/** The student can change the form and upload files only while IFFI is not working on it. */
export const EDITABLE_STATUSES: readonly ApplicationStatus[] = ['draft', 'action_needed'];
export const isEditable = (status: ApplicationStatus) => EDITABLE_STATUSES.includes(status);

/** A document IFFI rejected can be replaced until the application goes to the university. */
export const REPLACE_REJECTED_STATUSES: readonly ApplicationStatus[] = ['draft', 'action_needed', 'payment_submitted', 'under_review'];

export interface ApplicationRow {
  id: string;
  program_id: string;
  program_snapshot: { displayName: string; city: string | null; province: string; level: string };
  status: ApplicationStatus;
  form: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** The columns the application pages read (0004 added the signature, policy, fee and adviser columns). */
export const APPLICATION_COLUMNS =
  'id, user_id, program_id, program_snapshot, status, form, created_at, updated_at, signed_name, signed_at, refund_policy_version, refund_policy_accepted_at, application_fee_usd, service_charge_usd, assigned_to';

export interface ApplicationFull extends ApplicationRow {
  user_id: string;
  signed_name: string | null;
  signed_at: string | null;
  refund_policy_version: string | null;
  refund_policy_accepted_at: string | null;
  application_fee_usd: number | null;
  service_charge_usd: number | null;
  assigned_to: string | null;
}

/** "IFFI-1A2B3C4D": what students quote on WhatsApp and in the payment reference. */
export const applicationRef = (id: string) => `IFFI-${id.slice(0, 8).toUpperCase()}`;

/** Whether a form part was finished (its answers passed every check when it was saved). */
export const sectionDone = (form: Record<string, unknown>, key: string) => Boolean((form[key] as { completed?: boolean } | undefined)?.completed);
