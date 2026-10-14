import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleAlert, FileText, Stethoscope } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { REPLACE_REJECTED_STATUSES, isEditable, stepPath } from '@/lib/portal/application';
import { DOCS } from '@/lib/portal/documents';
import { loadApplication } from '@/lib/portal/load';
import { buttonClass } from '@/components/ui/buttonStyles';
import { DocCard, TemplateLinks } from '@/components/portal/apply/DocCard';
import { StepShell } from '@/components/portal/apply/StepShell';

export const metadata: Metadata = { title: { absolute: `Documents | ${site.brand.name}` } };

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) notFound();
  const { app, program, summary } = loaded;

  const canUpload = isEditable(app.status);
  const canReplace = REPLACE_REJECTED_STATUSES.includes(app.status);
  const required = summary.requirements.filter((r) => r.need === 'required');
  const ready = required.length - summary.missing.length;
  const rejected = summary.requirements.filter((r) => (summary.byKind.get(r.kind) ?? []).some((f) => f.status === 'rejected'));
  const card = (r: (typeof summary.requirements)[number]) => (
    <DocCard key={r.kind} req={r} files={summary.byKind.get(r.kind) ?? []} appId={app.id} level={program.level} canUpload={canUpload} canReplace={canReplace} />
  );

  return (
    <StepShell loaded={loaded} current="documents" lede="Upload each document as a clear scan or photo. Tap “See a sample” to see exactly what IFFI needs.">
      <div className="space-y-6">
        <section aria-labelledby="docs-progress" className="rounded-card border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="docs-progress" className="text-[1.25rem]">
                {ready} of {required.length} required documents uploaded
              </h2>
              <p className="mt-1 text-[14px] text-muted">IFFI checks every file and tells you here if one needs to be changed.</p>
            </div>
            <span className="tabular font-display text-[2rem] font-semibold leading-none text-navy">{required.length ? Math.round((ready / required.length) * 100) : 100}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gold" style={{ width: `${required.length ? (ready / required.length) * 100 : 100}%` }} />
          </div>
          {rejected.length > 0 && (
            <p className="mt-4 flex gap-2 rounded-xl bg-danger/10 px-4 py-3 text-[14px] text-ink">
              <CircleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
              <span>
                IFFI asked for a new file:{' '}
                {rejected.map((r, i) => (
                  <span key={r.kind}>
                    {i > 0 && ', '}
                    <a href={`#doc-${r.kind}`} className="font-medium text-navy underline underline-offset-4">
                      {DOCS[r.kind].title}
                    </a>
                  </span>
                ))}
                .
              </span>
            </p>
          )}
          {!canUpload && !canReplace && <p className="mt-4 text-[14px] text-muted">Your application is with IFFI or the university, so files are locked. Message your adviser to send something new.</p>}
        </section>

        <section aria-labelledby="forms-h" className="rounded-card bg-navy p-5 text-mist sm:p-6">
          <h2 id="forms-h" className="text-[1.2rem] text-white">
            Two forms to fill in
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="flex items-center gap-2 font-medium text-white">
                <FileText size={17} aria-hidden="true" className="text-gold-2" /> Application form
              </p>
              <p className="mt-1.5 text-[13.5px]">Already filled in from your online answers. Print it, sign it, and upload the scan below.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TemplateLinks template="application_form" appId={app.id} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="flex items-center gap-2 font-medium text-white">
                <Stethoscope size={17} aria-hidden="true" className="text-gold-2" /> Medical examination form
              </p>
              <p className="mt-1.5 text-[13.5px]">Take it to a hospital. The doctor fills it in, adds your blood test and chest X-ray, and stamps it.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TemplateLinks template="health_form" appId={app.id} />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="req-h">
          <h2 id="req-h" className="mb-3 text-[1.25rem]">
            Required
          </h2>
          <ul className="space-y-4">{summary.requirements.filter((r) => r.need === 'required').map(card)}</ul>
        </section>

        {summary.requirements.some((r) => r.need === 'recommended') && (
          <section aria-labelledby="rec-h">
            <h2 id="rec-h" className="mb-1 text-[1.25rem]">
              Recommended
            </h2>
            <p className="mb-3 text-[14px] text-muted">Not required to apply, but they make your application and scholarship chances stronger.</p>
            <ul className="space-y-4">{summary.requirements.filter((r) => r.need === 'recommended').map(card)}</ul>
          </section>
        )}

        <details className="group rounded-card border border-line bg-white" open={summary.requirements.some((r) => r.need === 'optional' && (summary.byKind.get(r.kind)?.length ?? 0) > 0)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-navy sm:px-6">
            Optional documents
            <span className="text-[13px] font-normal text-muted group-open:hidden">Show</span>
          </summary>
          <ul className="space-y-4 border-t border-line p-4 sm:p-5">{summary.requirements.filter((r) => r.need === 'optional').map(card)}</ul>
        </details>

        <div className={cn('flex flex-wrap items-center gap-4 rounded-card border border-line bg-white px-5 py-4 sm:px-6')}>
          <Link to={stepPath(app.id, 'review')} className={buttonClass('gold', 'lg')}>
            Continue to review and sign <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="text-[13px] text-muted">{summary.missing.length ? `${summary.missing.length} required document${summary.missing.length > 1 ? 's' : ''} still missing.` : 'Every required document is uploaded.'}</p>
        </div>
      </div>
    </StepShell>
  );
}
