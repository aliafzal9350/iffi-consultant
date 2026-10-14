import { ArrowRight, GraduationCap, Settings, Users } from 'lucide-react';
import type { Profile } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { DOCS, isDocKind } from '@/lib/portal/documents';
import { STATUS_GROUPS } from '@/lib/portal/transitions';
import type { StaffApplication, listPendingDocuments } from '@/lib/staff/queries';
import { buttonClass } from '@/components/ui/buttonStyles';
import { PortalBand } from '@/components/portal/PortalBand';
import { FileIcon } from '@/components/portal/apply/DocFiles';
import { ApplicationList, shortDate } from '@/components/staff/StaffBits';

// the groups that need someone at IFFI to act, in the order to check them
const ATTENTION = ['payment', 'waiting', 'review', 'new'];

type Queue = Awaited<ReturnType<typeof listPendingDocuments>>;

export default function Dashboard({
  me,
  apps,
  queue,
  studentCount,
  programCount = 72,
}: {
  me: Profile;
  apps: StaffApplication[];
  queue: Queue;
  studentCount: number;
  programCount?: number;
}) {
  const firstName = me.full_name?.split(' ')[0];
  const filesToCheck = apps.reduce((n, a) => n + a.pendingDocs, 0);
  const mine = apps.filter((a) => a.assigned_to === me.id && !['completed', 'not_admitted', 'withdrawn'].includes(a.status));
  const tiles = [
    { key: 'files', label: 'Files to check', count: filesToCheck, to: '/staff/applications?view=files' },
    ...ATTENTION.map((k) => STATUS_GROUPS.find((g) => g.key === k)!).map((g) => ({
      key: g.key,
      label: g.label,
      count: apps.filter((a) => g.statuses.includes(a.status)).length,
      to: `/staff/applications?group=${g.key}`,
    })),
  ];

  return (
    <>
      <PortalBand title={firstName ? `Hello, ${firstName}` : 'Hello'} lede="Here is what needs the IFFI team today.">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {tiles.map((t) => (
            <li key={t.key}>
              <Link to={t.to} className="block h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-gold-2/50 hover:bg-white/[0.07]">
                <span className={`tabular block font-display text-[2rem] font-semibold leading-none ${t.count ? 'text-gold-2' : 'text-white/60'}`}>{t.count}</span>
                <span className="mt-2 block text-[13.5px] text-mist">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PortalBand>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0 space-y-8">
          {queue.length > 0 && (
            <section aria-labelledby="queue">
              <div className="flex items-end justify-between gap-4">
                <h2 id="queue" className="text-h3">
                  Files waiting to be checked
                </h2>
                <Link to="/staff/applications?view=files" className="inline-flex items-center gap-1 text-[14px] font-medium text-navy hover:text-gold-deep">
                  All <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-1 text-[14px] text-muted">Oldest first. Open one to accept it or ask the student for a new file.</p>
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
                {queue.map((d) => (
                  <li key={d.id}>
                    <Link to={`/staff/applications/${d.application_id}#docs-h`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper/70 sm:px-6">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-paper text-navy">
                        <FileIcon mime={d.mime_type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-navy">{isDocKind(d.kind) ? DOCS[d.kind].title : d.kind}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {d.student?.full_name ?? d.student?.email ?? 'Student'} · {d.file_name}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-[12.5px] text-muted">{shortDate(d.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mine.length > 0 && (
            <section aria-labelledby="mine">
              <h2 id="mine" className="text-h3">
                Your students
              </h2>
              <div className="mt-4">
                <ApplicationList apps={mine.slice(0, 8)} empty="" />
              </div>
            </section>
          )}

          <section aria-labelledby="latest">
            <div className="flex items-end justify-between gap-4">
              <h2 id="latest" className="text-h3">
                Latest applications
              </h2>
              <Link to="/staff/applications" className="inline-flex items-center gap-1 text-[14px] font-medium text-navy hover:text-gold-deep">
                See all <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4">
              <ApplicationList apps={apps.slice(0, 8)} empty="No applications yet. They appear here the moment a student clicks Apply." />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="how" className="rounded-card border border-line bg-white p-6">
            <h2 id="how" className="text-[1.15rem]">
              How it works
            </h2>
            <ol className="mt-4 space-y-4 text-[14px]">
              {[
                ['Check what is waiting', 'Files and payments first: students cannot move on until you check them.'],
                ['Open the application', 'Answers, documents, payments and the full activity log are on one page.'],
                ['Accept or ask', 'Accept each file, or ask for a new one with a note. Students see it straight away.'],
                ['Update the status', 'Pick what happened and add a note. Message the student on WhatsApp from the same page.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy font-display text-[14px] font-semibold text-gold-2">{i + 1}</span>
                  <span>
                    <span className="block font-medium text-navy">{t}</span>
                    <span className="mt-0.5 block text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-card border border-line bg-white p-6">
            <p className="tabular font-display text-[2rem] font-semibold leading-none text-navy">{studentCount}</p>
            <p className="mt-1.5 text-[14px] text-muted">students have signed up</p>
            <Link to="/staff/students" className={buttonClass('outline', 'sm', 'mt-4')}>
              <Users size={16} aria-hidden="true" /> See all students
            </Link>
          </section>

          <section className="rounded-card border border-line bg-white p-6">
            <p className="tabular font-display text-[2rem] font-semibold leading-none text-navy">{programCount}</p>
            <p className="mt-1.5 text-[14px] text-muted">active degree programmes</p>
            <Link to="/staff/programmes" className={buttonClass('outline', 'sm', 'mt-4')}>
              <GraduationCap size={16} aria-hidden="true" /> Manage programmes
            </Link>
          </section>

          {me.role === 'admin' && (
            <section className="rounded-card bg-navy p-6 text-mist">
              <h2 className="text-[1.15rem] text-white">Admin</h2>
              <p className="mt-1.5 text-[14px]">Add advisers by their Google email, and set the payment QR code and default fees.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/staff/team" className={buttonClass('gold', 'sm')}>
                  Manage the team
                </Link>
                <Link to="/staff/settings" className={buttonClass('outline-light', 'sm')}>
                  <Settings size={15} aria-hidden="true" /> Payment settings
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
