import { Suspense } from 'react';
import { CalendarClock, Clock, Languages, Lightbulb, MapPin } from 'lucide-react';
import type { Program } from '@/types/data';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { durationLabel, locationLabel, programPath, teachingLabel, tuitionLine } from '@/lib/programs';
import { startApplication } from '@/lib/portal/actions';
import { buttonClass } from '@/components/ui/buttonStyles';
import { SubmitButton } from './SubmitButton';

interface Props {
  program: Program;
  reasons: string[];
  /** one shared Gemini call for all cards; resolves to id -> note */
  notes?: Promise<Record<string, string>>;
  best?: boolean;
  applicationId?: string;
  /** "near" matches: what is missing */
  gap?: string;
}

/** The AI sentence, streamed in when Gemini answers; falls back to the data reasons. */
async function Note({ notes, id, reasons }: { notes: Promise<Record<string, string>>; id: string; reasons: string[] }) {
  const all = await notes;
  const text = all[id] ?? (reasons.length ? `It fits you because: ${reasons.join(', ').toLowerCase()}.` : null);
  return text ? <p className="text-[15px] leading-relaxed text-ink">{text}</p> : null;
}

function NoteSkeleton() {
  return (
    <div className="space-y-2" aria-label="Writing your note">
      <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-gold/20" />
      <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-gold/20" />
    </div>
  );
}

export function MatchCard({ program: p, reasons, notes, best, applicationId, gap }: Props) {
  return (
    <article className={cn('rounded-card border bg-white p-5 sm:p-7', best ? 'border-gold/60 shadow-lift' : 'border-line')}>
      {best && <p className="mb-3 inline-flex rounded-full bg-gold px-3 py-1 text-[12.5px] font-semibold text-navy">Best match for you</p>}
      <h3 className="text-[1.3rem] leading-snug sm:text-[1.45rem]">{p.displayName}</h3>

      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-muted">
        <li className="inline-flex items-center gap-1.5">
          <MapPin size={15} aria-hidden="true" className="text-gold-deep" />
          {locationLabel(p)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Clock size={15} aria-hidden="true" className="text-gold-deep" />
          {durationLabel(p)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Languages size={15} aria-hidden="true" className="text-gold-deep" />
          {teachingLabel(p)}
        </li>
        {p.typicalDeadlineMonth && (
          <li className="inline-flex items-center gap-1.5">
            <CalendarClock size={15} aria-hidden="true" className="text-gold-deep" />
            Usually closes in {p.typicalDeadlineMonth}
          </li>
        )}
      </ul>

      {reasons.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {reasons.map((r) => (
            <li key={r} className="rounded-full bg-paper px-3 py-1 text-[13px] font-medium text-navy ring-1 ring-line">
              {r}
            </li>
          ))}
        </ul>
      )}

      {gap && (
        <p className="mt-4 rounded-xl bg-gold-soft px-4 py-3 text-[14px] text-ink">
          <span className="font-medium text-gold-deep">Almost there: </span>
          {gap}
        </p>
      )}

      {notes && (
        <div className="mt-5 rounded-2xl bg-gold-soft/70 p-4 sm:p-5">
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold-deep">
            <Lightbulb size={15} aria-hidden="true" /> Why it fits you
          </p>
          <Suspense fallback={<NoteSkeleton />}>
            <Note notes={notes} id={p.id} reasons={reasons} />
          </Suspense>
        </div>
      )}

      <p className="mt-4 text-[14px] text-muted">
        <span className="font-medium text-navy">Fees: </span>
        {tuitionLine(p)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {applicationId ? (
          <Link to={`/portal/applications/${applicationId}`} className={buttonClass('navy', 'md')}>
            Open my application
          </Link>
        ) : (
          <form action={startApplication}>
            <input type="hidden" name="programId" value={p.id} />
            <SubmitButton variant={best ? 'gold' : 'navy'} pending="Starting…">
              Apply for this programme
            </SubmitButton>
          </form>
        )}
        <Link to={programPath(p)} className="text-[14px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
          See full details
        </Link>
      </div>
    </article>
  );
}
