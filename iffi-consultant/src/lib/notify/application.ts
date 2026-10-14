/**
 * The emails an application sends, in one place: what the student is told when IFFI acts, and what the IFFI inbox
 * is told when a student acts. Call these after the change is saved; they return at once and send in the background.
 */
import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { STATUS_LABEL, applicationRef, type ApplicationStatus } from '@/lib/portal/application';
import { DOCS, isDocKind } from '@/lib/portal/documents';
import { PURPOSE_LABEL, fmtMoney, type PaymentPurpose } from '@/lib/portal/payment';
import { appUrl, sendLater, staffInbox, type Mail } from './email';

interface Facts {
  id: string;
  ref: string;
  email: string;
  name: string | null;
  firstName: string | null;
  programme: string;
}

async function facts(applicationId: string): Promise<Facts | null> {
  const { data } = await createAdminClient()
    .from('applications')
    .select('id, program_snapshot, student:profiles!applications_user_id_fkey(email, full_name)')
    .eq('id', applicationId)
    .maybeSingle();
  const student = (data?.student ?? null) as { email: string; full_name: string | null } | null;
  if (!data || !student?.email) return null;
  return {
    id: data.id,
    ref: applicationRef(data.id),
    email: student.email,
    name: student.full_name,
    firstName: student.full_name?.split(' ')[0] ?? null,
    programme: (data.program_snapshot as { displayName?: string })?.displayName ?? 'your programme',
  };
}

const hello = (f: Facts) => (f.firstName ? `Hello ${f.firstName},` : 'Hello,');
const openApp = (f: Facts) => ({ label: 'Open my application', url: appUrl(`/portal/applications/${f.id}`) });
const openCase = (f: Facts) => ({ label: 'Open in the staff portal', url: appUrl(`/staff/applications/${f.id}`) });

const STATUS_WORDS: Partial<Record<ApplicationStatus, { heading: string; text: string }>> = {
  under_review: { heading: 'IFFI is reviewing your application', text: 'An adviser is checking your form and documents. If anything needs changing, we will tell you.' },
  action_needed: { heading: 'IFFI needs something from you', text: 'Open your application, make the change, then tell IFFI it is done.' },
  sent_to_university: { heading: 'Your application has been sent to the university', text: 'The university is assessing it now. We will tell you as soon as there is a decision.' },
  admitted: { heading: 'Congratulations, you are admitted!', text: 'Next the university issues your JW202, the form you need for your student visa. We will tell you when it arrives.' },
  not_admitted: { heading: 'An update on your application', text: 'Unfortunately the application was not successful this time. Your adviser can suggest other programmes that fit you.' },
  jw202_issued: { heading: 'Your JW202 is issued', text: 'With your admission letter and JW202 you can apply for your student visa. The service charge is now due, the same way as the application fee.' },
  visa: { heading: 'Your visa stage has started', text: 'IFFI is helping you with your student visa and your travel to China.' },
  completed: { heading: 'Your application is complete', text: 'Everything is done. We wish you a wonderful time studying in China.' },
  withdrawn: { heading: 'Your application was withdrawn', text: 'This application is now closed. Message us if you want to apply again.' },
};

// ------------------------------------------------------------------------------------------------ to students

/** IFFI changed the status (with the note the student also sees in the portal). */
export function emailStatusChange(applicationId: string, to: ApplicationStatus, note: string | null) {
  sendLater(async () => {
    const f = await facts(applicationId);
    if (!f) return null;
    const words = STATUS_WORDS[to] ?? { heading: `Your application is now: ${STATUS_LABEL[to]}`, text: 'Open your application to see the details.' };
    return {
      to: f.email,
      subject: `${words.heading} (${f.ref})`,
      greeting: hello(f),
      heading: words.heading,
      paragraphs: [`Application ${f.ref}: ${f.programme}.`, words.text],
      note,
      cta: openApp(f),
    } satisfies Mail;
  });
}

/** IFFI asked for a new file. */
export function emailDocumentRejected(applicationId: string, kind: string, note: string) {
  sendLater(async () => {
    const f = await facts(applicationId);
    if (!f) return null;
    const title = isDocKind(kind) ? DOCS[kind].title : 'A document';
    return {
      to: f.email,
      subject: `Please upload a new file: ${title} (${f.ref})`,
      greeting: hello(f),
      heading: `IFFI needs a new ${title.toLowerCase()}`,
      paragraphs: [`Your adviser checked the file you uploaded for application ${f.ref} and needs a new one. Open the Documents step to upload it.`],
      note,
      cta: { label: 'Upload the new file', url: appUrl(`/portal/applications/${f.id}/documents#doc-${kind}`) },
    } satisfies Mail;
  });
}

/** IFFI checked a payment against its account. */
export function emailPaymentChecked(applicationId: string, purpose: PaymentPurpose, verdict: 'verified' | 'rejected', note: string | null) {
  sendLater(async () => {
    const f = await facts(applicationId);
    if (!f) return null;
    const what = PURPOSE_LABEL[purpose].toLowerCase();
    return verdict === 'verified'
      ? {
          to: f.email,
          subject: `Payment received (${f.ref})`,
          greeting: hello(f),
          heading: `We received your ${what}`,
          paragraphs: [
            `Thank you. Your ${what} for application ${f.ref} is confirmed in our account.`,
            purpose === 'application_fee' ? 'An adviser now reviews your application and documents.' : 'Your adviser will guide you through the next step.',
          ],
          cta: openApp(f),
        }
      : {
          to: f.email,
          subject: `Please check your payment (${f.ref})`,
          greeting: hello(f),
          heading: 'We could not find your payment',
          paragraphs: [`We could not match your ${what} for application ${f.ref} with our account. Check the details and send them again from the payment step.`],
          note,
          cta: { label: 'Check my payment', url: appUrl(`/portal/applications/${f.id}/fee${purpose === 'service_charge' ? '?for=service' : ''}`) },
        };
  });
}

/** A message an adviser sent to the student from the staff portal. */
export function emailNoteToStudent(applicationId: string, note: string) {
  sendLater(async () => {
    const f = await facts(applicationId);
    if (!f) return null;
    return {
      to: f.email,
      subject: `A message from IFFI about your application (${f.ref})`,
      greeting: hello(f),
      heading: 'A message from your IFFI adviser',
      paragraphs: [`About application ${f.ref}: ${f.programme}.`],
      note,
      cta: openApp(f),
    } satisfies Mail;
  });
}

// ------------------------------------------------------------------------- the student paid (both sides told)

export function emailPaymentSubmitted(applicationId: string, purpose: PaymentPurpose, amount: number, currency: string, transactionId: string) {
  sendLater(async () => {
    const f = await facts(applicationId);
    if (!f) return null;
    const what = PURPOSE_LABEL[purpose].toLowerCase();
    const inbox = staffInbox();
    return [
      {
        to: f.email,
        subject: `We received your payment details (${f.ref})`,
        greeting: hello(f),
        heading: 'Thank you, we are checking your payment',
        paragraphs: [
          `You sent ${fmtMoney(amount, currency)} for the ${what} of application ${f.ref}, transaction ID ${transactionId}.`,
          'IFFI matches it with its account, usually within one working day, and confirms it in the portal and by email.',
        ],
        cta: openApp(f),
      },
      inbox
        ? {
            to: inbox,
            subject: `Payment to check: ${f.name ?? f.email} (${f.ref})`,
            heading: `${PURPOSE_LABEL[purpose]} to check`,
            paragraphs: [`${f.name ?? f.email} sent ${fmtMoney(amount, currency)} for ${f.programme}.`, `Transaction ID: ${transactionId}. Check it in the account, then confirm it in the staff portal.`],
            cta: openCase(f),
          }
        : null,
    ];
  });
}

// ------------------------------------------------------------------------------------------- to the IFFI inbox

export function emailStaffNewApplication(applicationId: string) {
  sendLater(async () => {
    const f = await facts(applicationId);
    const inbox = staffInbox();
    if (!f || !inbox) return null;
    return {
      to: inbox,
      subject: `New application: ${f.name ?? f.email} (${f.ref})`,
      heading: 'A student started an application',
      paragraphs: [`${f.name ?? f.email} started an application for ${f.programme}.`, 'They fill in the form and upload documents next. Message them on WhatsApp from the staff portal if they need help.'],
      cta: openCase(f),
    } satisfies Mail;
  });
}

export function emailStaffStudentFixed(applicationId: string, note: string | null) {
  sendLater(async () => {
    const f = await facts(applicationId);
    const inbox = staffInbox();
    if (!f || !inbox) return null;
    return {
      to: inbox,
      subject: `Student says it is fixed: ${f.name ?? f.email} (${f.ref})`,
      heading: 'The student made the change you asked for',
      paragraphs: [`${f.name ?? f.email} (${f.programme}) says what you asked for is done.`],
      note,
      cta: openCase(f),
    } satisfies Mail;
  });
}
