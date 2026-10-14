/**
 * The student's journey, in order. One list drives the route on the dashboard, the mobile progress bar, the sign-in
 * page and the "next step" card. Each step knows where its button goes.
 */
import { formComplete } from './progress';

export type StepState = 'done' | 'current' | 'upcoming';

export interface JourneyStep {
  key: 'profile' | 'matches' | 'apply' | 'documents' | 'fee' | 'review';
  label: string;
  title: string;
  description: string;
  cta?: string;
}

export const JOURNEY: JourneyStep[] = [
  {
    key: 'profile',
    label: 'Profile',
    title: 'Answer 10 quick questions',
    description: 'What you want to study, your results and your English. It takes about two minutes.',
    cta: 'Start the quiz',
  },
  {
    key: 'matches',
    label: 'Matches',
    title: 'Pick a programme that fits you',
    description: 'We check every programme against your answers and show the best ones first, with the reasons.',
    cta: 'See my matches',
  },
  {
    key: 'apply',
    label: 'Apply',
    title: 'Fill in your application',
    description: 'Your passport details, education and family, one short part at a time.',
    cta: 'Continue my application',
  },
  {
    key: 'documents',
    label: 'Documents',
    title: 'Upload your documents',
    description: 'Passport, photo, certificates and the two forms, with a sample of each so you know exactly what we need.',
    cta: 'Upload my documents',
  },
  {
    key: 'fee',
    label: 'Fee',
    title: 'Pay the application fee',
    description: 'Sign your application, scan the QR code, pay from your banking app, then send us the transaction ID.',
    cta: 'Sign and pay',
  },
  {
    key: 'review',
    label: 'Review',
    title: 'IFFI reviews your application',
    description: 'We check your documents and send your application to the university.',
  },
];

export interface JourneyFacts {
  profileComplete: boolean;
  /** the student's most recent application, if any */
  application: { id: string; form: Record<string, unknown>; status: string } | null;
  /** every required document of that application is uploaded */
  documentsReady?: boolean;
}

/** past the student's part: signed, paid and with IFFI (or further) */
const submitted = (status: string) => !['draft', 'action_needed'].includes(status);

function isDone(key: JourneyStep['key'], f: JourneyFacts): boolean {
  const app = f.application;
  switch (key) {
    case 'profile':
      return f.profileComplete;
    case 'matches':
      return Boolean(app);
    case 'apply':
      return Boolean(app) && (formComplete(app!.form) || submitted(app!.status));
    case 'documents':
      return Boolean(app) && (Boolean(f.documentsReady) || submitted(app!.status));
    case 'fee':
      return Boolean(app) && app!.status !== 'draft';
    case 'review':
      return Boolean(app) && !['draft', 'payment_submitted', 'under_review', 'action_needed'].includes(app!.status);
  }
}

/** Where each step's button goes. */
export function hrefFor(key: JourneyStep['key'], f: JourneyFacts): string | undefined {
  if (key === 'profile') return '/portal/start';
  if (key === 'matches') return '/portal/matches';
  if (!f.application) return undefined;
  const base = `/portal/applications/${f.application.id}`;
  return key === 'documents' ? `${base}/documents` : key === 'fee' ? `${base}/review` : base;
}

export function journeyFor(f: JourneyFacts) {
  const done = JOURNEY.map((s) => isDone(s.key, f));
  const currentIndex = done.findIndex((d) => !d);
  const steps = JOURNEY.map((step, i) => ({
    ...step,
    number: i + 1,
    href: hrefFor(step.key, f),
    state: (done[i] ? 'done' : i === currentIndex ? 'current' : 'upcoming') as StepState,
  }));
  return {
    steps,
    current: currentIndex === -1 ? null : steps[currentIndex],
    completed: done.filter(Boolean).length,
    total: JOURNEY.length,
  };
}
