import { ChevronRight } from 'lucide-react';
import { site } from '@/data/content';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { STATUS_LABEL, type ApplicationStatus } from '@/lib/portal/application';
import type { StaffApplication } from '@/lib/staff/queries';
import { Avatar } from '@/components/portal/Avatar';

// warm = staff need to act, navy = in progress elsewhere, green = good news, grey = closed
const TONE: Record<ApplicationStatus, string> = {
  draft: 'bg-paper text-ink ring-line',
  payment_submitted: 'bg-gold-soft text-gold-deep ring-gold/40',
  under_review: 'bg-gold-soft text-gold-deep ring-gold/40',
  action_needed: 'bg-danger/10 text-danger ring-danger/25',
  sent_to_university: 'bg-navy/[0.06] text-navy ring-navy/15',
  admitted: 'bg-good/10 text-good ring-good/30',
  jw202_issued: 'bg-good/10 text-good ring-good/30',
  visa: 'bg-good/10 text-good ring-good/30',
  completed: 'bg-good/10 text-good ring-good/30',
  not_admitted: 'bg-paper text-muted ring-line',
  withdrawn: 'bg-paper text-muted ring-line',
};

export function StatusPill({ status, className }: { status: ApplicationStatus; className?: string }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[12.5px] font-medium ring-1', TONE[status], className)}>{STATUS_LABEL[status]}</span>;
}

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The student's WhatsApp number as a link that opens a chat with a polite first line. */
export function StudentWhatsApp({ student, about, className }: { student: { full_name: string | null; whatsapp: string | null }; about?: string; className?: string }) {
  if (!student.whatsapp) return <span className={cn('text-muted', className)}>No WhatsApp yet</span>;
  const first = student.full_name?.split(' ')[0];
  const message = `Hello${first ? ` ${first}` : ''}, this is ${site.brand.name} about your ${about ? `application for ${about}` : 'student portal account'}.`;
  return (
    <a
      href={`https://wa.me/${student.whatsapp.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('tabular font-medium text-navy underline decoration-line underline-offset-4 hover:decoration-gold', className)}
    >
      {student.whatsapp}
    </a>
  );
}

/** What is waiting for staff on one application, as small chips. */
function Waiting({ a }: { a: StaffApplication }) {
  const chips = [
    a.paymentToCheck && 'Payment to check',
    a.pendingDocs > 0 && `${a.pendingDocs} file${a.pendingDocs > 1 ? 's' : ''} to check`,
  ].filter(Boolean) as string[];
  if (!chips.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c} className="rounded-full bg-gold-soft px-2 py-0.5 text-[11.5px] font-medium text-gold-deep">
          {c}
        </span>
      ))}
    </span>
  );
}

/** One application per row; the whole row opens the application. */
export function ApplicationList({ apps, empty }: { apps: StaffApplication[]; empty: string }) {
  if (!apps.length) return <p className="rounded-card border border-line bg-white p-6 text-[15px] text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
      {apps.map((a) => (
        <li key={a.id}>
          <Link to={`/staff/applications/${a.id}`} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-paper/70 sm:gap-4 sm:px-6">
            <Avatar name={a.student?.full_name ?? null} src={a.student?.avatar_url ?? null} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-navy">{a.student?.full_name ?? a.student?.email ?? 'Unknown student'}</p>
              <p className="truncate text-[13.5px] text-muted">
                {a.program_snapshot.displayName} <span className="tabular">({a.program_id})</span>
              </p>
              <Waiting a={a} />
            </div>
            <div className="hidden w-28 shrink-0 md:block" aria-label={`${a.progress}% complete`}>
              <span className="tabular block text-right text-[12px] text-muted">{a.progress}%</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${a.progress}%` }} />
              </span>
            </div>
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <StatusPill status={a.status} />
              <span className="tabular text-[12.5px] text-muted">Updated {shortDate(a.updated_at)}</span>
            </div>
            <StatusPill status={a.status} className="sm:hidden" />
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
