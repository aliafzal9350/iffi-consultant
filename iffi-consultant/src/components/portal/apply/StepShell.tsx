/**
 * The frame around every step of an application: a navy band with the programme and status, the list of steps
 * (a column on wide screens, a sideways strip on phones), then the step itself.
 */
import type { ReactNode } from 'react';
import { ArrowLeft, Check, CircleAlert, Lock, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { LEVEL_LABEL } from '@/lib/programs';
import { STATUS_LABEL, applicationRef, stepPath, type StepKey } from '@/lib/portal/application';
import type { LoadedApplication } from '@/lib/portal/load';
import { percentDone, type StepProgress } from '@/lib/portal/progress';
import { PortalBand } from '@/components/portal/PortalBand';

function StepMarker({ s, active }: { s: StepProgress; active: boolean }) {
  return (
    <span
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold',
        s.state === 'done' && 'bg-good text-white',
        s.state === 'attention' && 'bg-danger text-white',
        s.state === 'locked' && 'bg-paper text-muted ring-1 ring-line',
        s.state === 'todo' && (active ? 'bg-navy text-gold-2' : 'bg-white text-navy ring-1 ring-navy/20')
      )}
      aria-hidden="true"
    >
      {s.state === 'done' ? <Check size={15} strokeWidth={3} /> : s.state === 'attention' ? <CircleAlert size={15} /> : s.state === 'locked' ? <Lock size={13} /> : s.number}
    </span>
  );
}

const STATE_WORDS: Record<StepProgress['state'], string> = { done: 'done', todo: 'to do', attention: 'needs attention', locked: 'not open yet' };

export function StepNav({ appId, steps, current }: { appId: string; steps: StepProgress[]; current?: StepKey }) {
  return (
    <nav aria-label="Application steps">
      <ol className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {steps.map((s) => {
          const active = s.key === current;
          return (
            <li key={s.key} className="shrink-0">
              <Link
                to={stepPath(appId, s.key)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-[14px] transition-colors lg:border-transparent',
                  active ? 'border-navy bg-white font-medium text-navy shadow-soft lg:border-line' : 'border-line bg-white text-ink hover:border-navy/30 lg:bg-transparent lg:hover:bg-white'
                )}
              >
                <StepMarker s={s} active={active} />
                <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                <span className="sr-only">({STATE_WORDS[s.state]})</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepShell({ loaded, current, title, lede, children }: { loaded: LoadedApplication; current: StepKey; title?: string; lede?: ReactNode; children: ReactNode }) {
  const { app, program, steps } = loaded;
  const step = steps.find((s) => s.key === current)!;
  const pct = percentDone(steps);
  return (
    <>
      <PortalBand
        title={title ?? step.title}
        lede={
          <span className="block">
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} aria-hidden="true" className="text-gold-2" />
                {program.displayName}
              </span>
              <span>{LEVEL_LABEL[program.level] ?? program.level}</span>
              <span className="rounded-full bg-gold/15 px-3 py-0.5 text-[13px] font-medium text-gold-2 ring-1 ring-gold/40">{STATUS_LABEL[app.status]}</span>
            </span>
            {lede && <span className="mt-2 block">{lede}</span>}
          </span>
        }
      />
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6 lg:px-8">
        <Link to={`/portal/applications/${app.id}`} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-gold-deep">
          <ArrowLeft size={16} aria-hidden="true" /> Application overview
        </Link>
        <span className="flex items-center gap-3 text-[13px] text-muted">
          <span className="tabular">{applicationRef(app.id)}</span>
          <span className="flex items-center gap-2" aria-label={`${pct}% done`}>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular">{pct}%</span>
          </span>
        </span>
      </div>
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 pb-14 pt-4 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <StepNav appId={app.id} steps={steps} current={current} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
