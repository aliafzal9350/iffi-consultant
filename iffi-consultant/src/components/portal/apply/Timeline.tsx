/** The activity log as a vertical line of events, newest first. Used by the student and staff application pages. */
import { CircleDot, CreditCard, EyeOff, FileText, ListChecks, MessageSquare, PenLine, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { describeEvent } from '@/lib/portal/describe';
import type { EventRow, EventType } from '@/lib/portal/events';

const ICON: Record<EventType, typeof CircleDot> = {
  status: CircleDot,
  form: ListChecks,
  document: FileText,
  payment: CreditCard,
  signature: PenLine,
  note: MessageSquare,
  assignment: UserRound,
};

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function Timeline({ events, viewer, studentEmail, started, empty = 'Nothing yet.' }: { events: EventRow[]; viewer: 'student' | 'staff'; studentEmail?: string | null; started?: string; empty?: string }) {
  if (!events.length && !started) return <p className="text-[14px] text-muted">{empty}</p>;
  return (
    <ol className="space-y-4">
      {events.map((e) => {
        const Icon = ICON[e.type] ?? CircleDot;
        const byStudent = viewer === 'staff' ? Boolean(studentEmail) && e.actor?.email === studentEmail : false;
        const who = viewer === 'student' ? (e.actor ? 'You' : 'IFFI') : (e.actor?.full_name ?? e.actor?.email ?? 'System');
        const staffOnly = !e.visible_to_student;
        return (
          <li key={e.id} className="flex gap-3">
            <span
              className={cn(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
                e.type === 'status' ? 'bg-navy text-gold-2' : staffOnly ? 'bg-gold-soft text-gold-deep' : byStudent ? 'bg-paper text-navy ring-1 ring-line' : 'bg-navy/[0.06] text-navy'
              )}
              aria-hidden="true"
            >
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">
                {describeEvent(e)}
                {staffOnly && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 align-middle text-[11px] font-medium text-gold-deep">
                    <EyeOff size={11} aria-hidden="true" /> Staff only
                  </span>
                )}
              </p>
              {e.note && <p className="mt-1 whitespace-pre-line rounded-xl bg-paper/80 px-3 py-2 text-[13.5px] text-ink">{e.note}</p>}
              <p className="mt-1 text-[12.5px] text-muted">
                {who} · {when(e.created_at)}
              </p>
            </div>
          </li>
        );
      })}
      {started && (
        <li className="flex gap-3">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-muted ring-1 ring-line" aria-hidden="true">
            <CircleDot size={14} />
          </span>
          <div>
            <p className="text-[14px] font-medium text-ink">Application started</p>
            <p className="mt-1 text-[12.5px] text-muted">{when(started)}</p>
          </div>
        </li>
      )}
    </ol>
  );
}
