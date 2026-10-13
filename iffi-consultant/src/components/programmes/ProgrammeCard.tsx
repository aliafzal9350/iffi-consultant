import { Link } from '@/lib/router';
import { CalendarClock, MapPin } from 'lucide-react';
import type { Program } from '@/types/data';
import { cn } from '@/lib/cn';
import { fmtNumber } from '@/lib/format';
import {
  LEVEL_LABEL,
  hasStipend,
  hasTuitionFreeOption,
  isEnglishTaught,
  provinceZh,
  programPath,
  statusTags,
  teachingLabel,
  tuitionLine,
} from '@/lib/programs';
import { Badge } from '@/components/ui/primitives';
import { ListToggles } from './ListToggles';

export { ListToggles };

export function ProgrammeBadges({ p, max = 6, className, dark }: { p: Program; max?: number; className?: string; dark?: boolean }) {
  const items: { key: string; node: React.ReactNode }[] = [];
  const gold = dark ? 'gold-dark' : 'gold';
  const plain = dark ? 'light' : 'outline';
  if (p.fullyFunded) items.push({ key: 'ff', node: <Badge tone={gold}>Fully funded</Badge> });
  if (hasStipend(p)) items.push({ key: 'st', node: <Badge tone={gold}>Stipend {fmtNumber(p.stipendCNYPerMonth!)} CNY/mo</Badge> });
  if (!p.fullyFunded && hasTuitionFreeOption(p)) items.push({ key: 'tf', node: <Badge tone={dark ? 'light' : 'good'}>Tuition-free option</Badge> });
  if (p.noIeltsRequired) items.push({ key: 'ni', node: <Badge tone={plain}>No IELTS</Badge> });
  if (p.ranking?.china) items.push({ key: 'rk', node: <Badge tone={plain}>China rank #{p.ranking.china}</Badge> });
  const tags = statusTags(p);
  if (tags.length) items.push({ key: 'ss', node: <Badge tone={dark ? 'light' : 'navy'}>{tags.join(' / ')}</Badge> });
  if (!items.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {items.slice(0, max).map((i) => (
        <span key={i.key}>{i.node}</span>
      ))}
    </div>
  );
}

function Highlight({ text, q }: { text: string; q?: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-gold-soft px-0.5 text-navy">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

interface CardProps {
  p: Program;
  q?: string;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

export function ProgrammeCard({ p, q, headingLevel = 'h3', className }: CardProps) {
  const H = headingLevel;
  const ql = q?.trim().toLowerCase();
  const majors = ql ? [...p.majors].sort((a, b) => Number(b.toLowerCase().includes(ql)) - Number(a.toLowerCase().includes(ql))) : p.majors;
  const shown = majors.slice(0, 4);
  const more = p.majors.length - shown.length;
  const deadline = p.typicalDeadlineMonth;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-card border border-line bg-white p-5 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span className="font-medium text-navy">{LEVEL_LABEL[p.level] ?? p.level}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold" />
          <span>{teachingLabel(p)}</span>
          <span className="tabular text-muted">{p.id}</span>
        </div>
        <div className="relative z-10">
          <ListToggles id={p.id} />
        </div>
      </div>

      <H className="mt-2 text-[1.28rem] leading-snug">
        <Link to={programPath(p)} className="after:absolute after:inset-0 after:rounded-card hover:text-navy-3 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-gold">
          {p.displayName}
        </Link>
      </H>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
        <MapPin size={15} aria-hidden="true" className="text-gold-deep" />
        {p.city ? `${p.city}, ` : ''}
        {p.province}
        <span className="font-cjk text-[13px] text-muted" lang="zh">
          {provinceZh(p.province)}
        </span>
        {!p.city && <span className="text-muted">(province-wide)</span>}
      </p>

      <ProgrammeBadges p={p} max={5} className="mt-4" />

      <p className="mt-4 text-[14px] leading-relaxed text-ink/85">
        {shown.map((m, i) => (
          <span key={m}>
            {i > 0 && ', '}
            <Highlight text={m} q={q?.trim()} />
          </span>
        ))}
        {more > 0 && <span className="text-muted"> and {more} more</span>}
      </p>

      <div className="mt-auto pt-5">
        <div className="space-y-1.5 border-t border-line pt-4 text-[13.5px]">
          <p className="font-medium text-navy">{tuitionLine(p)}</p>
          {deadline && (
            <p className="flex items-center gap-1.5 text-muted">
              <CalendarClock size={14} aria-hidden="true" />
              Usually closes: {deadline}
            </p>
          )}
        </div>
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <Link to={programPath(p)} className="inline-flex min-h-10 items-center rounded-full bg-navy px-4 text-sm font-medium text-white hover:bg-navy-3">
            Details
          </Link>
          {p.level !== 'Language' && (
            <Link to={`/tools/cost-calculator?program=${p.id}`} className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-medium text-navy hover:border-navy/40">
              Estimate cost
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Compact row used in the shortlist drawer and compare tray. */
export function ProgrammeRow({ p, action }: { p: Program; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-3.5">
      <div className="min-w-0">
        <Link to={programPath(p)} className="font-medium leading-snug text-navy hover:underline">
          {p.displayName}
        </Link>
        <p className="mt-0.5 text-[13px] text-muted">
          {p.id}, {LEVEL_LABEL[p.level]}, {isEnglishTaught(p) ? 'English-taught' : teachingLabel(p)}
        </p>
        <p className="mt-0.5 text-[13px] text-ink/80">{tuitionLine(p)}</p>
      </div>
      {action}
    </div>
  );
}
