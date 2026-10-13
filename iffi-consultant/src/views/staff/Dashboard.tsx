import { ArrowRight, GraduationCap, Users } from 'lucide-react';
import type { Profile } from '@/lib/auth/dal';
import { Link } from '@/lib/router';
import { STATUS_GROUPS } from '@/lib/portal/transitions';
import type { StaffApplication } from '@/lib/staff/queries';
import { buttonClass } from '@/components/ui/buttonStyles';
import { PortalBand } from '@/components/portal/PortalBand';
import { ApplicationList } from '@/components/staff/StaffBits';

// the groups that need someone at IFFI to act, in the order to check them
const ATTENTION = ['payment', 'waiting', 'review', 'new'];

export default function Dashboard({
  me,
  apps,
  studentCount,
  programCount = 72,
}: {
  me: Profile;
  apps: StaffApplication[];
  studentCount: number;
  programCount?: number;
}) {
  const firstName = me.full_name?.split(' ')[0];
  const groups = ATTENTION.map((k) => STATUS_GROUPS.find((g) => g.key === k)!).map((g) => ({
    ...g,
    count: apps.filter((a) => g.statuses.includes(a.status)).length,
  }));

  return (
    <>
      <PortalBand title={firstName ? `Hello, ${firstName}` : 'Hello'} lede="Here is what needs the IFFI team today.">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {groups.map((g) => (
            <li key={g.key}>
              <Link
                to={`/staff/applications?group=${g.key}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-gold-2/50 hover:bg-white/[0.07]"
              >
                <span className={`tabular block font-display text-[2rem] font-semibold leading-none ${g.count ? 'text-gold-2' : 'text-white/60'}`}>{g.count}</span>
                <span className="mt-2 block text-[13.5px] text-mist">{g.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PortalBand>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
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

        <aside className="space-y-6">
          <section aria-labelledby="how" className="rounded-card border border-line bg-white p-6">
            <h2 id="how" className="text-[1.15rem]">
              How it works
            </h2>
            <ol className="mt-4 space-y-4 text-[14px]">
              {[
                ['Open an application', 'Start with the boxes above: payments to check, then students waiting on you.'],
                ['Message the student', 'Their WhatsApp number is on every application, with the first line written for you.'],
                ['Update the status', 'Pick what happened and add a note. The student sees both straight away in their portal.'],
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
              <h2 className="text-[1.15rem] text-white">Your team</h2>
              <p className="mt-1.5 text-[14px]">Add advisers by their Google email. They sign in and land here.</p>
              <Link to="/staff/team" className={buttonClass('gold', 'sm', 'mt-4')}>
                Manage the team
              </Link>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
