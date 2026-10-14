import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { STATUS_GROUPS } from '@/lib/portal/transitions';
import { listApplications, type StaffApplication } from '@/lib/staff/queries';
import { inputClass } from '@/components/ui/Form';
import { PortalBand } from '@/components/portal/PortalBand';
import { ApplicationList } from '@/components/staff/StaffBits';

export const metadata: Metadata = { title: { absolute: `Applications | ${site.brand.name} staff` } };

/** Filters beyond the status groups: my cases, and the two kinds of waiting work. */
const VIEWS: { key: string; label: string; test: (a: StaffApplication, me: string) => boolean }[] = [
  { key: 'mine', label: 'Assigned to me', test: (a, me) => a.assigned_to === me },
  { key: 'files', label: 'Files to check', test: (a) => a.pendingDocs > 0 },
  { key: 'unassigned', label: 'No adviser yet', test: (a) => !a.assigned_to && !['completed', 'not_admitted', 'withdrawn'].includes(a.status) },
];

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ group?: string; view?: string; q?: string }> }) {
  const me = await requireStaff();
  const { group, view, q } = await searchParams;
  const all = await listApplications();
  const activeGroup = STATUS_GROUPS.find((g) => g.key === group);
  const activeView = VIEWS.find((v) => v.key === view);
  const needle = (q ?? '').trim().toLowerCase();

  const shown = all
    .filter((a) => !activeGroup || activeGroup.statuses.includes(a.status))
    .filter((a) => !activeView || activeView.test(a, me.id))
    .filter(
      (a) =>
        !needle ||
        [a.student?.full_name, a.student?.email, a.student?.whatsapp, a.program_snapshot.displayName, a.program_id, `iffi-${a.id.slice(0, 8)}`].some((t) => t?.toLowerCase().includes(needle))
    );

  const href = (p: { group?: string; view?: string }) => {
    const sp = new URLSearchParams();
    if (p.group) sp.set('group', p.group);
    if (p.view) sp.set('view', p.view);
    if (q) sp.set('q', q);
    const s = sp.toString();
    return s ? `/staff/applications?${s}` : '/staff/applications';
  };
  const chip = (on: boolean) =>
    cn('inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors', on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy/35');
  const count = (on: boolean, n: number) => <span className={cn('tabular rounded-full px-1.5 text-[12px]', on ? 'bg-white/15' : 'bg-paper text-muted')}>{n}</span>;

  return (
    <>
      <PortalBand title="Applications" lede="Most recently updated first. Open one to see the student's answers, documents, payments and everything that happened." />
      <div className="mx-auto max-w-[1240px] space-y-4 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <form action="/staff/applications" className="relative max-w-md">
          {group && <input type="hidden" name="group" value={group} />}
          {view && <input type="hidden" name="view" value={view} />}
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" name="q" defaultValue={q} placeholder="Search name, email, WhatsApp, programme or IFFI- reference" aria-label="Search applications" className={cn(inputClass, 'pl-10')} />
        </form>

        <nav aria-label="Filter by status" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link to={href({ view })} aria-current={!activeGroup ? 'page' : undefined} className={chip(!activeGroup)}>
            All {count(!activeGroup, all.length)}
          </Link>
          {STATUS_GROUPS.map((g) => {
            const on = g.key === activeGroup?.key;
            return (
              <Link key={g.key} to={href({ group: g.key, view })} aria-current={on ? 'page' : undefined} className={chip(on)}>
                {g.label} {count(on, all.filter((a) => g.statuses.includes(a.status)).length)}
              </Link>
            );
          })}
        </nav>
        <nav aria-label="Quick views" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {VIEWS.map((v) => {
            const on = v.key === activeView?.key;
            return (
              <Link key={v.key} to={href({ group, view: on ? undefined : v.key })} aria-current={on ? 'page' : undefined} className={cn(chip(on), 'py-1.5 text-[13px]')}>
                {v.label} {count(on, all.filter((a) => v.test(a, me.id)).length)}
              </Link>
            );
          })}
        </nav>

        <ApplicationList apps={shown} empty={needle ? `Nothing matches “${q}”.` : activeGroup || activeView ? 'Nothing here right now.' : 'No applications yet.'} />
      </div>
    </>
  );
}
