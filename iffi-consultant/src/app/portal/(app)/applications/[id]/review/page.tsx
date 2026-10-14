import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleAlert, CircleCheck, PenLine, Printer } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { FORM_SECTION_KEYS, isEditable, sectionDone, stepPath } from '@/lib/portal/application';
import { DOCS } from '@/lib/portal/documents';
import { SECTIONS, passportName, savedSection } from '@/lib/portal/form';
import { loadApplication } from '@/lib/portal/load';
import { buttonClass } from '@/components/ui/buttonStyles';
import { AnswersView } from '@/components/portal/apply/AnswersView';
import { SignForm } from '@/components/portal/apply/SignForm';
import { StepShell } from '@/components/portal/apply/StepShell';

export const metadata: Metadata = { title: { absolute: `Review and sign | ${site.brand.name}` } };

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) notFound();
  const { app, ctx, blockers, summary } = loaded;
  const form = app.form ?? {};

  const unfinished = FORM_SECTION_KEYS.filter((k) => !sectionDone(form, k));
  const blocked = unfinished.length > 0 || blockers.length > 0;
  const name = passportName(savedSection(form, 'personal'));
  const editable = isEditable(app.status);
  const optionalMissing = summary.missing.filter((m) => !blockers.some((b) => b.kind === m.kind));

  return (
    <StepShell loaded={loaded} current="review" lede="Check your answers once more, then sign. You can still change anything before you pay.">
      <div className="space-y-6">
        {blocked && editable && (
          <section aria-labelledby="todo-h" className="rounded-card border border-gold/50 bg-gold-soft/40 p-5 sm:p-6">
            <h2 id="todo-h" className="flex items-center gap-2 text-[1.2rem]">
              <CircleAlert size={20} aria-hidden="true" className="text-gold-deep" /> Before you can sign
            </h2>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              {unfinished.map((k) => (
                <li key={k}>
                  <Link to={stepPath(app.id, k)} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                    Finish “{SECTIONS[k].title}”
                  </Link>
                </li>
              ))}
              {blockers.map((b) => (
                <li key={b.kind}>
                  <Link to={`${stepPath(app.id, 'documents')}#doc-${b.kind}`} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                    Upload: {DOCS[b.kind].title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="answers-h">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 id="answers-h" className="text-[1.25rem]">
              Your answers
            </h2>
            <a href={`/portal/print/${app.id}`} target="_blank" rel="noopener" className={buttonClass('outline', 'sm')}>
              <Printer size={15} aria-hidden="true" /> See it on the official form
            </a>
          </div>
          <AnswersView form={form} ctx={ctx} editHref={editable ? (k) => stepPath(app.id, k) : undefined} />
        </section>

        {optionalMissing.length > 0 && (
          <p className="rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-muted">
            Still to send later: {optionalMissing.map((m) => DOCS[m.kind].title).join(', ')}. IFFI will remind you before sending your application to the university.
          </p>
        )}

        <section aria-labelledby="sign-h" className="rounded-card border border-line bg-white p-5 shadow-lift sm:p-7">
          <h2 id="sign-h" className="flex items-center gap-2 text-[1.35rem]">
            <PenLine size={20} aria-hidden="true" className="text-gold-deep" /> Declaration and signature
          </h2>
          {app.signed_at ? (
            <div className="mt-4 space-y-4">
              <p className="flex gap-3 rounded-xl bg-good/10 px-4 py-3 text-[14.5px] text-ink">
                <CircleCheck size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />
                <span>
                  Signed by <span className="font-medium">{app.signed_name}</span> on {longDate(app.signed_at)}. If you change an answer, you will be asked to sign again.
                </span>
              </p>
              <Link to={stepPath(app.id, 'fee')} className={buttonClass('gold', 'lg')}>
                Continue to the application fee <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : editable ? (
            <div className="mt-5">
              <SignForm appId={app.id} expectedName={name} disabled={blocked} />
            </div>
          ) : (
            <p className="mt-3 text-[14.5px] text-muted">This application is with IFFI. Message your adviser if something needs to change.</p>
          )}
        </section>
      </div>
    </StepShell>
  );
}
