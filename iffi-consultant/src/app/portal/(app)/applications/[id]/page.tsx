import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, CircleAlert, CircleCheck, Clock, Lock, MapPin, PartyPopper } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { LEVEL_LABEL } from '@/lib/programs';
import { STATUS_LABEL, applicationRef, stepPath, type ApplicationStatus } from '@/lib/portal/application';
import { DOCS } from '@/lib/portal/documents';
import { loadApplication } from '@/lib/portal/load';
import { fmtMoney, latestPayment } from '@/lib/portal/payment';
import { nextStep, percentDone } from '@/lib/portal/progress';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { PortalBand } from '@/components/portal/PortalBand';
import { MarkFixed } from '@/components/portal/apply/MarkFixed';
import { Timeline } from '@/components/portal/apply/Timeline';

export const metadata: Metadata = { title: { absolute: `My application | ${site.brand.name}` } };

type Tone = 'gold' | 'good' | 'navy' | 'muted';
const STATUS_COPY: Partial<Record<ApplicationStatus, { title: string; body: string; tone: Tone }>> = {
  payment_submitted: {
    title: 'We are checking your payment',
    body: 'IFFI matches your transaction ID with its account, usually within one working day. Then we start reviewing your application.',
    tone: 'gold',
  },
  under_review: {
    title: 'IFFI is reviewing your application',
    body: 'An adviser is checking your form and documents. If anything needs changing you will see it here, and we message you on WhatsApp.',
    tone: 'gold',
  },
  sent_to_university: { title: 'Sent to the university', body: 'The university is assessing your application. IFFI follows up and tells you as soon as there is a decision.', tone: 'navy' },
  admitted: { title: 'Congratulations, you are admitted!', body: 'Next the university issues your JW202, the form you need for your student visa. IFFI tells you when it arrives.', tone: 'good' },
  jw202_issued: { title: 'Your JW202 is issued', body: 'With your admission letter and JW202 you can apply for your X1/X2 student visa. IFFI guides you through it.', tone: 'good' },
  visa: { title: 'Visa stage', body: 'IFFI is helping you with your student visa and your travel to China.', tone: 'good' },
  completed: { title: 'All done', body: 'Your application is complete. Have a wonderful time studying in China!', tone: 'good' },
  not_admitted: {
    title: 'Not admitted this time',
    body: 'If you did not qualify, your application fee is refunded under the refund policy you accepted. Message your adviser about other programmes that fit you.',
    tone: 'muted',
  },
  withdrawn: { title: 'Application withdrawn', body: 'This application is closed. Message IFFI if you want to apply again.', tone: 'muted' },
};
const TONE: Record<Tone, string> = {
  gold: 'border-gold/50 bg-gold-soft/50',
  good: 'border-good/30 bg-good/[0.07]',
  navy: 'border-navy/15 bg-navy/[0.04]',
  muted: 'border-line bg-white',
};

const STEP_STATE = {
  done: { icon: Check, cls: 'bg-good text-white', words: 'Done' },
  attention: { icon: CircleAlert, cls: 'bg-danger text-white', words: 'Needs attention' },
  locked: { icon: Lock, cls: 'bg-paper text-muted ring-1 ring-line', words: 'Opens later' },
  todo: { icon: null, cls: 'bg-white text-navy ring-1 ring-navy/20', words: '' },
} as const;

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) notFound();
  const { app, program, steps, events, summary, payments } = loaded;

  const pct = percentDone(steps);
  const next = nextStep(steps);
  const ref = applicationRef(app.id);
  const copy = STATUS_COPY[app.status];
  const askedFor = app.status === 'action_needed' ? events.find((e) => e.type === 'status' && e.to_status === 'action_needed') : undefined;
  const rejectedDocs = summary.requirements.filter((r) => (summary.byKind.get(r.kind) ?? []).some((f) => f.status === 'rejected'));
  const feeRejected = latestPayment(payments, 'application_fee')?.status === 'rejected';
  const service = latestPayment(payments, 'service_charge');
  const serviceDue = ['jw202_issued', 'visa'].includes(app.status) && service?.status !== 'verified';
  const waText = `Hello IFFI, this is ${me.full_name ?? ''} about my application ${ref} for ${program.displayName}.`;

  return (
    <>
      <PortalBand
        title={program.displayName}
        lede={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} aria-hidden="true" className="text-gold-2" />
              {[program.city, program.province].filter(Boolean).join(', ')}
            </span>
            <span>{LEVEL_LABEL[program.level] ?? program.level}</span>
            <span className="rounded-full bg-gold/15 px-3 py-0.5 text-[13px] font-medium text-gold-2 ring-1 ring-gold/40">{STATUS_LABEL[app.status]}</span>
          </span>
        }
      >
        <div className="max-w-xl">
          <p className="flex items-baseline justify-between text-[14px]">
            <span className="text-white">{pct === 100 ? 'Every step is done' : `Your application is ${pct}% complete`}</span>
            <span className="tabular text-mist/80">{ref}</span>
          </p>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Application progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-full rounded-full bg-gold-2 transition-[width] duration-500" style={{ width: `${Math.max(3, pct)}%` }} />
          </div>
        </div>
      </PortalBand>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0 space-y-6">
          {app.status === 'action_needed' && (
            <section aria-labelledby="action-h" className="rounded-card border border-danger/35 bg-white p-6 shadow-lift sm:p-7">
              <h2 id="action-h" className="flex items-center gap-2 text-[1.35rem]">
                <CircleAlert size={22} aria-hidden="true" className="text-danger" /> IFFI needs something from you
              </h2>
              {askedFor?.note && <p className="mt-3 whitespace-pre-line rounded-xl bg-danger/[0.06] px-4 py-3 text-[15px] text-ink">{askedFor.note}</p>}
              {rejectedDocs.length > 0 && (
                <p className="mt-3 text-[14.5px] text-ink">
                  Upload a new file for:{' '}
                  {rejectedDocs.map((r, i) => (
                    <span key={r.kind}>
                      {i > 0 && ', '}
                      <Link to={`${stepPath(app.id, 'documents')}#doc-${r.kind}`} className="font-medium text-navy underline underline-offset-4">
                        {DOCS[r.kind].title}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {feeRejected ? (
                <Link to={stepPath(app.id, 'fee')} className={buttonClass('gold', 'md', 'mt-5')}>
                  Check and send the payment again <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <p className="mt-3 text-[14px] text-muted">You can change your answers and documents now. When it is done, tell IFFI here.</p>
                  <div className="mt-5 border-t border-line pt-5">
                    <MarkFixed appId={app.id} />
                  </div>
                </>
              )}
            </section>
          )}

          {copy && (
            <section className={cn('rounded-card border p-6 sm:p-7', TONE[copy.tone])}>
              <h2 className="flex items-center gap-2 text-[1.35rem]">
                {copy.tone === 'good' ? <PartyPopper size={22} aria-hidden="true" className="text-good" /> : copy.tone === 'gold' ? <Clock size={21} aria-hidden="true" className="text-gold-deep" /> : <CircleCheck size={21} aria-hidden="true" className="text-navy" />}
                {copy.title}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] text-ink">{copy.body}</p>
              {serviceDue && (
                <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">Service charge {app.service_charge_usd != null && <span className="tabular">· {fmtMoney(app.service_charge_usd, 'USD')}</span>}</p>
                    <p className="text-[13.5px] text-muted">{service?.status === 'submitted' ? 'Your payment is being checked.' : 'Paid after the JW202, the same way as the application fee.'}</p>
                  </div>
                  {service?.status !== 'submitted' && (
                    <Link to={`${stepPath(app.id, 'fee')}?for=service`} className={buttonClass('gold', 'md')}>
                      Pay the service charge
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {next && ['draft', 'action_needed'].includes(app.status) && (
            <section aria-labelledby="next-h" className="rounded-card border border-line bg-white p-6 shadow-lift sm:p-8">
              <span className="rounded-full bg-gold-soft px-3 py-1 text-[13px] font-medium text-gold-deep">
                Step {next.number} of {steps.length}
              </span>
              <h2 id="next-h" className="text-h3 mt-4">
                {next.title}
              </h2>
              <p className="mt-2 max-w-xl text-[15px] text-muted">{next.description}</p>
              <Link to={stepPath(app.id, next.key)} className={buttonClass(next.number === 1 && pct === 0 ? 'gold' : 'navy', 'lg', 'mt-6')}>
                {pct === 0 ? 'Start my application' : 'Continue'} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </section>
          )}

          <section aria-labelledby="steps-h" className="rounded-card border border-line bg-white p-6 sm:p-8">
            <h2 id="steps-h" className="text-h3">
              Your application in {steps.length} steps
            </h2>
            <p className="mt-1 text-[15px] text-muted">Everything saves as you go. Do them in any order; signing opens once the form and documents are ready.</p>
            <ol className="mt-6 space-y-3">
              {steps.map((s) => {
                const st = STEP_STATE[s.state];
                const isNext = next?.key === s.key;
                return (
                  <li key={s.key}>
                    <Link
                      to={stepPath(app.id, s.key)}
                      className={cn(
                        'group flex gap-4 rounded-2xl border p-4 transition-colors sm:p-5',
                        isNext ? 'border-gold/60 bg-gold-soft/40' : s.state === 'attention' ? 'border-danger/35 bg-danger/[0.03]' : 'border-line hover:border-navy/30'
                      )}
                    >
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[16px] font-semibold', st.cls, s.state === 'todo' && isNext && 'bg-navy text-gold-2 ring-0')}>
                        {st.icon ? <st.icon size={17} aria-hidden="true" /> : s.number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-navy">
                          {s.title}
                          {st.words && <span className={cn('ml-2 text-[12.5px] font-normal', s.state === 'attention' ? 'text-danger' : 'text-muted')}>{st.words}</span>}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-muted">{s.description}</span>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" className="mt-2 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="help-h" className="rounded-card bg-navy p-6 text-mist">
            <h2 id="help-h" className="text-[1.3rem] text-white">
              Questions? Ask your adviser
            </h2>
            <p className="mt-2 text-[14px]">IFFI can see this application. Quote your reference <span className="tabular font-medium text-gold-2">{ref}</span>.</p>
            <a href={`https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md', 'mt-5 w-full')}>
              <WhatsAppIcon size={18} /> Message on WhatsApp
            </a>
          </section>

          <section aria-labelledby="hist-h" className="rounded-card border border-line bg-white p-6">
            <h2 id="hist-h" className="text-[1.15rem]">
              History
            </h2>
            <div className="mt-4">
              <Timeline events={events.slice(0, 25)} viewer="student" started={app.created_at} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
