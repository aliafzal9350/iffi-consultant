import type { Metadata } from 'next';
import { site } from '@/data/content';
import { requireStaff } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { STATUS_GROUPS } from '@/lib/portal/transitions';
import { listApplications } from '@/lib/staff/queries';
import { PortalBand } from '@/components/portal/PortalBand';
import { ApplicationList } from '@/components/staff/StaffBits';

export const metadata: Metadata = { title: { absolute: `Applications | ${site.brand.name} staff` } };

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await requireStaff();
  const { group } = await searchParams;
  const all = await listApplications();
  const active = STATUS_GROUPS.find((g) => g.key === group);
  const shown = active ? all.filter((a) => active.statuses.includes(a.status)) : all;

  const chips = [{ key: '', label: 'All', count: all.length }, ...STATUS_GROUPS.map((g) => ({ key: g.key, label: g.label, count: all.filter((a) => g.statuses.includes(a.status)).length }))];

  return (
    <>
      <PortalBand title="Applications" lede="Most recently updated first. Open one to see the student, their answers and the programme." />
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <nav aria-label="Filter applications" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {chips.map((c) => {
            const on = (c.key || undefined) === active?.key;
            return (
              <Link
                key={c.key || 'all'}
                to={c.key ? `/staff/applications?group=${c.key}` : '/staff/applications'}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors',
                  on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy/35'
                )}
              >
                {c.label}
                <span className={cn('tabular rounded-full px-1.5 text-[12px]', on ? 'bg-white/15' : 'bg-paper text-muted')}>{c.count}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-5">
          <ApplicationList apps={shown} empty={active ? `Nothing in "${active.label}" right now.` : 'No applications yet.'} />
        </div>
      </div>
    </>
  );
}
