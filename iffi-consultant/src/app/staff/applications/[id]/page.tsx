import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, CircleAlert, Download, ExternalLink, Lock, MapPin, Printer } from 'lucide-react';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { fmtNumber } from '@/lib/format';
import { LEVEL_LABEL, programPath } from '@/lib/programs';
import { ageOn } from '@/lib/portal/study';
import { ENGLISH_TESTS } from '@/lib/portal/quiz';
import { STATUS_LABEL, applicationRef } from '@/lib/portal/application';
import { DOCS, docState, fmtBytes, isDocKind, type DocRequirement } from '@/lib/portal/documents';
import { PAYMENT_CURRENCY, PAYMENT_STATUS_LABEL, PURPOSE_LABEL, amountDue, fmtMoney } from '@/lib/portal/payment';
import { percentDone } from '@/lib/portal/progress';
import { getPaymentSettings } from '@/lib/portal/settings';
import { ALL_STATUSES, TRANSITIONS } from '@/lib/portal/transitions';
import { getApplicationDetail } from '@/lib/staff/queries';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { AnswersView } from '@/components/portal/apply/AnswersView';
import { FileIcon } from '@/components/portal/apply/DocFiles';
import { Timeline } from '@/components/portal/apply/Timeline';
import { StatusPill, StudentWhatsApp, shortDate } from '@/components/staff/StaffBits';
import { CaseForm, DocReview, NoteForm, PaymentReview } from '@/components/staff/CaseTools';
import { UpdateStatus } from '@/components/staff/UpdateStatus';

export const metadata: Metadata = { title: { absolute: `Application | ${site.brand.name} staff` } };

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[13px] text-muted">{k}</dt>
          <dd className="mt-0.5 text-[15px] text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Card({ id, title, aside, children, className }: { id: string; title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('rounded-card border border-line bg-white p-6 sm:p-7', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="text-[1.25rem]">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const NEED_LABEL = { required: 'Required', recommended: 'Recommended', optional: 'Optional' } as const;
const FILE_STATE = {
  pending: 'bg-gold-soft text-gold-deep ring-gold/40',
  accepted: 'bg-good/10 text-good ring-good/30',
  rejected: 'bg-danger/10 text-danger ring-danger/25',
} as const;
const FILE_WORDS = { pending: 'To check', accepted: 'Accepted', rejected: 'New file asked' } as const;

export default async function StaffApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  const detail = await getApplicationDetail(id);
  if (!detail) notFound();
  const { app, program, ctx, summary, payments, events, steps, student: s, study, otherApplications, team } = detail;
  const settings = await getPaymentSettings();
  const pct = percentDone(steps);
  const form = app.form ?? {};

  const englishLetter = (study?.english_letter && typeof study.english_letter === 'object') ? study.english_letter as { storage_path?: string; file_name?: string } : null;
  const english = !study
    ? null
    : study.english_test === 'none'
      ? 'No test yet'
      : study.english_test === 'moi'
        ? 'English-medium school letter'
        : `${ENGLISH_TESTS.find((t) => t.id === study.english_test)?.label} ${study.english_score ?? ''}`;
  const result = !study ? null : study.grade_mode === 'cgpa' ? `CGPA ${study.cgpa ?? '?'} out of ${fmtNumber(Number(study.cgpa_scale), 1)}` : study.percent != null ? `${study.percent}%` : 'Not given';

  // every listed requirement that is required or has files, then any uploaded kind the requirements do not list
  const shownReqs: DocRequirement[] = [
    ...summary.requirements.filter((r) => r.need === 'required' || (summary.byKind.get(r.kind)?.length ?? 0) > 0),
    ...[...summary.byKind.keys()]
      .filter((k) => k !== 'payment_proof' && isDocKind(k) && !summary.requirements.some((r) => r.kind === k))
      .map((k) => ({ kind: k as DocRequirement['kind'], need: 'optional' as const })),
  ];
  const proofOf = new Map(detail.docs.filter((d) => d.kind === 'payment_proof').map((d) => [d.id, d]));
  const feeDue = amountDue('application_fee', app, settings);
  const tiles: [string, React.ReactNode, string?][] = [
    ['Progress', `${pct}%`],
    ['Documents', `${summary.accepted} accepted · ${summary.pending} to check`, summary.missing.length ? `${summary.missing.length} required missing` : 'All required in'],
    ['Application fee', payments.find((p) => p.purpose === 'application_fee') ? PAYMENT_STATUS_LABEL[payments.find((p) => p.purpose === 'application_fee')!.status] : 'Not paid', feeDue != null ? `Due ${fmtMoney(feeDue, PAYMENT_CURRENCY)}` : 'Amount not set'],
    ['Signed', app.signed_at ? shortDate(app.signed_at) : 'Not yet', app.signed_name ?? undefined],
  ];

  return (
    <>
      <PortalBand
        lead={<Avatar name={s?.full_name ?? null} src={s?.avatar_url ?? null} size={56} />}
        title={s?.full_name ?? s?.email ?? 'Student'}
        lede={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              {program.displayName} <span className="tabular text-mist/80">({app.program_id})</span>
            </span>
            <StatusPill status={app.status} />
            <span className="tabular text-mist/80">{applicationRef(app.id)}</span>
          </span>
        }
      >
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(([k, v, sub]) => (
            <li key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="block text-[12.5px] text-mist/80">{k}</span>
              <span className="mt-1 block font-medium text-white">{v}</span>
              {sub && <span className="mt-0.5 block text-[12.5px] text-mist/80">{sub}</span>}
            </li>
          ))}
        </ul>
      </PortalBand>

      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6 lg:px-8">
        <Link to="/staff/applications" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-gold-deep">
          <ArrowLeft size={16} aria-hidden="true" /> All applications
        </Link>
        <div className="flex flex-wrap gap-2">
          <a href={`/portal/print/${app.id}`} target="_blank" rel="noopener" className={buttonClass('outline', 'sm')}>
            <Printer size={15} aria-hidden="true" /> Filled-in application form
          </a>
          {s?.whatsapp && (
            <a
              href={`https://wa.me/${s.whatsapp.replace(/^\+/, '')}?text=${encodeURIComponent(`Hello ${s.full_name?.split(' ')[0] ?? ''}, this is ${site.brand.name} about your application ${applicationRef(app.id)} for ${program.displayName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('whatsapp', 'sm')}
            >
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="min-w-0 space-y-6">
          <Card id="steps-h" title="Where the student is">
            <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {steps.map((st) => (
                <li
                  key={st.key}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px]',
                    st.state === 'done' ? 'border-good/30 bg-good/[0.05]' : st.state === 'attention' ? 'border-danger/30 bg-danger/[0.04]' : 'border-line'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold',
                      st.state === 'done' ? 'bg-good text-white' : st.state === 'attention' ? 'bg-danger text-white' : st.state === 'locked' ? 'bg-paper text-muted' : 'bg-white text-navy ring-1 ring-navy/20'
                    )}
                    aria-hidden="true"
                  >
                    {st.state === 'done' ? <Check size={13} strokeWidth={3} /> : st.state === 'attention' ? <CircleAlert size={13} /> : st.state === 'locked' ? <Lock size={11} /> : st.number}
                  </span>
                  <span className="text-ink">{st.title}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card
            id="docs-h"
            title="Documents"
            aside={
              <span className="text-[13px] text-muted">
                {summary.pending} to check · {summary.missing.length} required missing
              </span>
            }
          >
            <ul className="divide-y divide-line">
              {shownReqs.map((r) => {
                const files = summary.byKind.get(r.kind) ?? [];
                const state = docState(files);
                return (
                  <li key={r.kind} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="font-sans text-[15.5px] font-medium text-navy">{DOCS[r.kind].title}</h3>
                      <span className="text-[12px] text-muted">{NEED_LABEL[r.need]}</span>
                      {state === 'missing' && <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-[12px] font-medium text-danger">Missing</span>}
                    </div>
                    {r.note && <p className="mt-1 text-[13px] text-gold-deep">Brochure: {r.note}</p>}
                    {files.length > 0 && (
                      <ul className="mt-3 space-y-3">
                        {files.map((f) => (
                          <li key={f.id} className="rounded-2xl border border-line p-3">
                            <div className="flex flex-wrap items-start gap-3">
                              <a href={`/portal/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-line">
                                {f.mime_type.startsWith('image/') ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- private file through a short signed link
                                  <img src={`/portal/files/${f.id}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <FileIcon mime={f.mime_type} className="text-navy" />
                                )}
                              </a>
                              <div className="min-w-0 flex-1">
                                <a href={`/portal/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-medium text-navy underline decoration-line underline-offset-4 hover:decoration-gold">
                                  {f.file_name} <ExternalLink size={12} aria-hidden="true" className="inline" />
                                </a>
                                <p className="mt-0.5 text-[12.5px] text-muted">
                                  {fmtBytes(f.size_bytes)} · uploaded {shortDate(f.created_at)}
                                  {f.reviewed_at && ` · checked ${shortDate(f.reviewed_at)}`}
                                </p>
                                {f.review_note && <p className="mt-1.5 rounded-lg bg-danger/[0.05] px-2.5 py-1.5 text-[13px] text-ink">Asked: {f.review_note}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1', FILE_STATE[f.status])}>{FILE_WORDS[f.status]}</span>
                                <a href={`/portal/files/${f.id}?download`} aria-label={`Download ${f.file_name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-navy hover:bg-paper">
                                  <Download size={15} aria-hidden="true" />
                                </a>
                              </div>
                            </div>
                            <div className="mt-3 border-t border-line pt-3">
                              <DocReview id={f.id} status={f.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            {summary.requirements.some((r) => r.need !== 'required' && !(summary.byKind.get(r.kind)?.length ?? 0)) && (
              <p className="mt-4 text-[12.5px] text-muted">
                Not uploaded (not required):{' '}
                {summary.requirements
                  .filter((r) => r.need !== 'required' && !(summary.byKind.get(r.kind)?.length ?? 0))
                  .map((r) => DOCS[r.kind].title)
                  .join(', ')}
                .
              </p>
            )}
          </Card>

          <Card id="pay-h" title="Payments" aside={<span className="text-[13px] text-muted">{feeDue != null ? `Application fee due ${fmtMoney(feeDue, PAYMENT_CURRENCY)}` : 'Fee not set'}</span>}>
            {payments.length ? (
              <ul className="space-y-3">
                {payments.map((p) => {
                  const proof = p.proof_document_id ? proofOf.get(p.proof_document_id) : undefined;
                  return (
                    <li key={p.id} className={cn('rounded-2xl border p-4', p.status === 'submitted' ? 'border-gold/50 bg-gold-soft/30' : 'border-line')}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-navy">
                            {PURPOSE_LABEL[p.purpose]} · <span className="tabular">{fmtMoney(p.amount, p.currency)}</span>
                          </p>
                          <p className="mt-0.5 text-[13.5px] text-muted">
                            Transaction <span className="tabular font-medium text-ink">{p.transaction_id}</span> · paid {shortDate(p.paid_on)} · sent {shortDate(p.created_at)}
                          </p>
                          {proof && (
                            <a href={`/portal/files/${proof.id}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-medium text-navy underline underline-offset-4">
                              Screenshot <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          )}
                          {p.review_note && <p className="mt-1.5 text-[13px] text-ink">Note: {p.review_note}</p>}
                        </div>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1', p.status === 'verified' ? FILE_STATE.accepted : p.status === 'rejected' ? FILE_STATE.rejected : FILE_STATE.pending)}>
                          {PAYMENT_STATUS_LABEL[p.status]}
                        </span>
                      </div>
                      {p.status === 'submitted' && (
                        <div className="mt-3 border-t border-line/80 pt-3">
                          <PaymentReview id={p.id} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[15px] text-muted">No payment yet. The student pays after signing the application.</p>
            )}
          </Card>

          <Card id="form-h" title="Application form" aside={<span className="text-[13px] text-muted">{app.signed_at ? `Signed by ${app.signed_name}, ${shortDate(app.signed_at)}` : 'Not signed yet'}</span>}>
            <AnswersView form={form} ctx={ctx} />
          </Card>

          <Card id="student-h" title="Student">
            <Facts
              items={[
                ['Name', s?.full_name ?? 'Not given'],
                ['Email', <span key="e" className="break-all">{s?.email}</span>],
                ['WhatsApp', s ? <StudentWhatsApp key="w" student={s} about={program.displayName} /> : '—'],
                ['Country', study?.country ?? 'Not given'],
                ['Joined', s ? shortDate(s.created_at) : '—'],
                ['Applied', shortDate(app.created_at)],
              ]}
            />
            <details className="mt-5 rounded-2xl border border-line">
              <summary className="cursor-pointer px-4 py-3 text-[14px] font-medium text-navy">Profile quiz answers</summary>
              <div className="border-t border-line p-4">
                {study ? (
                  <Facts
                    items={[
                      ['Wants to study', LEVEL_LABEL[study.level]],
                      ['Subject', study.field ?? 'Not sure yet'],
                      ['Age', ageOn(study.date_of_birth) ?? 'Not given'],
                      ['Last result', result],
                      ['English', (
                        <span key="eng" className="flex flex-wrap items-center gap-2">
                          <span>{english}</span>
                          {englishLetter?.storage_path && (
                            <a
                              href={`/portal/files/${study.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-navy/20 bg-navy/[0.04] px-2 py-0.5 text-[12px] font-medium text-navy hover:bg-navy/10"
                            >
                              <Download size={11} aria-hidden="true" /> View letter
                            </a>
                          )}
                        </span>
                      )],
                      ['Chinese', study.hsk ? `HSK ${study.hsk}` : 'None'],
                      ['Funding', { full: 'Needs a full scholarship', partial: 'Partial scholarship is fine', self: 'Family can pay' }[study.funding]],
                      ['Teaching language', study.teaching === 'either' ? 'Either' : study.teaching],
                      ['Bank statement', study.bank_usd >= 5000 ? 'USD 5,000 or more' : study.bank_usd >= 2500 ? 'USD 2,500 to 4,999' : 'Under USD 2,500'],
                    ]}
                  />
                ) : (
                  <p className="text-[15px] text-muted">The student has not finished the quiz.</p>
                )}
              </div>
            </details>
          </Card>

          <Card id="programme-h" title="Programme">
            <p className="font-medium text-navy">{program.displayName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted">
              <MapPin size={15} aria-hidden="true" className="text-gold-deep" />
              {[program.city, program.province].filter(Boolean).join(', ')} <span className="tabular">({app.program_id})</span>
            </p>
            <Link to={programPath(program)} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
              Programme page <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[13px] text-muted">Saved as it was when the student applied, so later brochure updates do not change it.</p>
            {otherApplications.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[14px] font-medium text-navy">Other applications by this student</p>
                <ul className="mt-2 space-y-2">
                  {otherApplications.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/staff/applications/${o.id}`} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                        {o.program_snapshot.displayName}
                      </Link>
                      <StatusPill status={o.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section aria-labelledby="update-h" className="rounded-card border border-gold/50 bg-white p-6 shadow-lift">
            <h2 id="update-h" className="text-[1.25rem]">
              Update the status
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">
              Now: <span className="font-medium text-ink">{STATUS_LABEL[app.status]}</span>
            </p>
            <div className="mt-5">
              <UpdateStatus id={app.id} status={app.status} actions={TRANSITIONS[app.status]} isAdmin={me.role === 'admin'} allStatuses={ALL_STATUSES} />
            </div>
          </section>

          <section aria-labelledby="case-h" className="rounded-card border border-line bg-white p-6">
            <h2 id="case-h" className="text-[1.15rem]">
              Adviser and fees
            </h2>
            <div className="mt-4">
              <CaseForm
                id={app.id}
                team={team}
                assignedTo={app.assigned_to}
                applicationFee={app.application_fee_usd}
                serviceCharge={app.service_charge_usd}
                defaultFee={settings.applicationFeeUsd[program.level] ?? null}
              />
            </div>
          </section>

          <section aria-labelledby="note-h" className="rounded-card border border-line bg-white p-6">
            <h2 id="note-h" className="text-[1.15rem]">
              Add a note
            </h2>
            <div className="mt-4">
              <NoteForm id={app.id} />
            </div>
          </section>

          <section aria-labelledby="activity-h" className="rounded-card border border-line bg-white p-6">
            <h2 id="activity-h" className="text-[1.15rem]">
              Activity
            </h2>
            <p className="mt-1 text-[13px] text-muted">Everything the student and the team did, newest first.</p>
            <div className="mt-4 max-h-[640px] overflow-y-auto pr-1">
              <Timeline events={events} viewer="staff" studentEmail={s?.email} started={app.created_at} />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
