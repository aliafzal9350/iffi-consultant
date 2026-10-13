import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { fmtNumber } from '@/lib/format';
import { LEVEL_LABEL, programPath } from '@/lib/programs';
import { ageOn } from '@/lib/portal/study';
import { ENGLISH_TESTS } from '@/lib/portal/quiz';
import { STATUS_LABEL } from '@/lib/portal/application';
import { ALL_STATUSES, TRANSITIONS } from '@/lib/portal/transitions';
import { getApplicationDetail } from '@/lib/staff/queries';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Avatar } from '@/components/portal/Avatar';
import { PortalBand } from '@/components/portal/PortalBand';
import { StatusPill, StudentWhatsApp, shortDate } from '@/components/staff/StaffBits';
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

export default async function StaffApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const detail = await getApplicationDetail(id);
  if (!detail) notFound();
  const { app, study, events, otherApplications } = detail;
  const s = app.student;
  const p = app.program_snapshot;

  const english = !study
    ? null
    : study.english_test === 'none'
      ? 'No test yet'
      : study.english_test === 'moi'
        ? 'English-medium letter'
        : `${ENGLISH_TESTS.find((t) => t.id === study.english_test)?.label} ${study.english_score ?? ''}`;
  const result = !study
    ? null
    : study.grade_mode === 'cgpa'
      ? `CGPA ${study.cgpa ?? '?'} out of ${fmtNumber(Number(study.cgpa_scale), 1)}`
      : study.percent != null
        ? `${study.percent}%`
        : 'Not given';

  return (
    <>
      <PortalBand
        lead={<Avatar name={s?.full_name ?? null} src={s?.avatar_url ?? null} size={56} />}
        title={s?.full_name ?? s?.email ?? 'Student'}
        lede={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              {p.displayName} <span className="tabular text-mist/80">({app.program_id})</span>
            </span>
            <StatusPill status={app.status} />
          </span>
        }
      />

      <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6 lg:px-8">
        <Link to="/staff/applications" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-gold-deep">
          <ArrowLeft size={16} aria-hidden="true" /> All applications
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="student-h" className="rounded-card border border-line bg-white p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="student-h" className="text-[1.25rem]">
                Student
              </h2>
              {s?.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/^\+/, '')}?text=${encodeURIComponent(`Hello ${s.full_name?.split(' ')[0] ?? ''}, this is ${site.brand.name} about your application for ${p.displayName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass('whatsapp', 'sm')}
                >
                  <WhatsAppIcon size={16} /> Message on WhatsApp
                </a>
              )}
            </div>
            <div className="mt-5">
              <Facts
                items={[
                  ['Name', s?.full_name ?? 'Not given'],
                  ['Email', <span key="e" className="break-all">{s?.email}</span>],
                  ['WhatsApp', s ? <StudentWhatsApp key="w" student={s} about={p.displayName} /> : '—'],
                  ['Country', study?.country ?? 'Not given'],
                  ['Joined', s ? shortDate(s.created_at) : '—'],
                  ['Applied', shortDate(app.created_at)],
                ]}
              />
            </div>
          </section>

          <section aria-labelledby="quiz-h" className="rounded-card border border-line bg-white p-6 sm:p-7">
            <h2 id="quiz-h" className="text-[1.25rem]">
              Quiz answers
            </h2>
            <div className="mt-5">
              {study ? (
                <Facts
                  items={[
                    ['Wants to study', LEVEL_LABEL[study.level]],
                    ['Subject', study.field ?? 'Not sure yet'],
                    ['Age', ageOn(study.date_of_birth) ?? 'Not given'],
                    ['Last result', result],
                    ['English', english],
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
          </section>

          <section aria-labelledby="programme-h" className="rounded-card border border-line bg-white p-6 sm:p-7">
            <h2 id="programme-h" className="text-[1.25rem]">
              Programme
            </h2>
            <p className="mt-4 font-medium text-navy">{p.displayName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted">
              <MapPin size={15} aria-hidden="true" className="text-gold-deep" />
              {[p.city, p.province].filter(Boolean).join(', ')} <span className="tabular">({app.program_id})</span>
            </p>
            <Link to={programPath(p)} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
              Programme page <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[13px] text-muted">Saved as it was when the student applied, so later brochure updates do not change it.</p>
          </section>

          <section aria-labelledby="form-h" className="rounded-card border border-line bg-white p-6 sm:p-7">
            <h2 id="form-h" className="text-[1.25rem]">
              Application form
            </h2>
            <p className="mt-3 text-[15px] text-muted">
              {Object.keys(app.form ?? {}).length ? 'The student has started the form.' : 'Nothing filled in yet. The online form sections (passport, education, family, documents) arrive in the next portal update.'}
            </p>
          </section>

          {otherApplications.length > 0 && (
            <section aria-labelledby="other-h" className="rounded-card border border-line bg-white p-6 sm:p-7">
              <h2 id="other-h" className="text-[1.25rem]">
                Other applications by this student
              </h2>
              <ul className="mt-3 space-y-2">
                {otherApplications.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/staff/applications/${o.id}`} className="font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                      {o.program_snapshot.displayName}
                    </Link>
                    <StatusPill status={o.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
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

          <section aria-labelledby="history-h" className="rounded-card border border-line bg-white p-6">
            <h2 id="history-h" className="text-[1.15rem]">
              History
            </h2>
            <ol className="mt-4 space-y-4">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-gold/50 pl-4">
                  <StatusPill status={e.to_status} />
                  {e.note && <p className="mt-2 text-[14px] text-ink">{e.note}</p>}
                  <p className="mt-1.5 text-[12.5px] text-muted">
                    {e.actor?.full_name ?? e.actor?.email ?? 'IFFI'}, {shortDate(e.created_at)}
                  </p>
                </li>
              ))}
              <li className="border-l-2 border-line pl-4">
                <p className="text-[14px] font-medium text-navy">Application started</p>
                <p className="mt-1 text-[12.5px] text-muted">by the student, {shortDate(app.created_at)}</p>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
