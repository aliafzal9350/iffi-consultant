import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { journeyFor } from '@/lib/portal/journey';

type Journey = ReturnType<typeof journeyFor>;

/**
 * The student's route to China: numbered stations on a gold line (md and up), and a compact segmented bar on
 * phones. Drawn for a navy background.
 */
export function JourneyRoute({ journey }: { journey: Journey }) {
  const { steps, current, completed, total } = journey;
  // gold runs past the current station, halfway to the next: "in progress" (and visible even at step 1)
  const reached = current ? current.number - 1 + 0.5 : total - 1;
  const fill = total > 1 ? Math.min(100, (reached / (total - 1)) * 100) : 100;

  return (
    <div>
      {/* phones: one line of text + six segments */}
      <div className="md:hidden">
        <p className="flex items-baseline justify-between gap-4 text-[14px]">
          <span className="font-medium text-white">{current ? `Step ${current.number}: ${current.label}` : 'All steps complete'}</span>
          <span className="tabular text-mist/80">
            {completed} of {total} done
          </span>
        </p>
        <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label="Your progress">
          {steps.map((s) => (
            <li
              key={s.key}
              className={cn(
                'h-1.5 rounded-full',
                s.state === 'done' && 'bg-gold',
                s.state === 'current' && 'bg-gold-2/50 ring-1 ring-gold-2',
                s.state === 'upcoming' && 'bg-white/15'
              )}
            >
              <span className="sr-only">
                {s.number}. {s.label}: {s.state === 'done' ? 'done' : s.state === 'current' ? 'current step' : 'not started'}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* md+: the route */}
      <div className="relative hidden md:block">
        {/* track + gold fill, running between the first and last station centres */}
        <div className="pointer-events-none absolute left-[calc(100%/12)] right-[calc(100%/12)] top-5 h-[2px] bg-white/12" aria-hidden="true">
          <div className="animate-route-fill h-full bg-gradient-to-r from-gold to-gold-2" style={{ width: `${fill}%` }} />
        </div>
        <ol className="relative grid grid-cols-6" aria-label="Your progress">
          {steps.map((s) => (
            <li key={s.key} className="relative flex flex-col items-center text-center" aria-current={s.state === 'current' ? 'step' : undefined}>
              <span className="relative grid h-10 w-10 place-items-center">
                {s.state === 'current' && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-gold-2/40" aria-hidden="true" />}
                <span
                  className={cn(
                    'relative grid h-10 w-10 place-items-center rounded-full font-display text-[17px] font-semibold',
                    s.state === 'done' && 'bg-gold text-navy',
                    s.state === 'current' && 'bg-navy-2 text-gold-2 ring-2 ring-gold-2',
                    s.state === 'upcoming' && 'bg-navy text-mist/65 ring-1 ring-white/20'
                  )}
                >
                  {s.state === 'done' ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : s.number}
                </span>
              </span>
              <span
                className={cn(
                  'mt-3 text-[13px] leading-tight',
                  s.state === 'current' ? 'font-medium text-white' : s.state === 'done' ? 'text-mist' : 'text-mist/65'
                )}
              >
                {s.label}
              </span>
              <span className="sr-only">{s.state === 'done' ? ' (done)' : s.state === 'current' ? ' (current step)' : ' (not started)'}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
