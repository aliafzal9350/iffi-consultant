import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SHOW_DRAFTS } from '@/lib/env';
import { Reveal } from './Reveal';

export function Container({ className, children, narrow }: { className?: string; children: ReactNode; narrow?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', narrow ? 'max-w-[880px]' : 'max-w-[1240px]', className)}>
      {children}
    </div>
  );
}

type Tone = 'light' | 'paper' | 'dark' | 'tint';

const toneClass: Record<Tone, string> = {
  light: 'bg-white',
  paper: 'bg-paper',
  dark: 'bg-navy text-mist',
  tint: 'bg-gold-soft/60',
};

interface SectionProps {
  id?: string;
  tone?: Tone;
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
  headingId?: string;
  compact?: boolean;
}

/** Page section with an optional heading block. Dark sections get the dotted grid. */
export function Section({ id, tone = 'paper', eyebrow, title, lede, action, className, children, headingId, compact }: SectionProps) {
  const dark = tone === 'dark';
  const hid = headingId ?? (id ? `${id}-title` : undefined);
  return (
    <section
      id={id}
      aria-labelledby={title ? hid : undefined}
      className={cn('relative', toneClass[tone], compact ? 'py-14 md:py-20' : 'py-16 md:py-24 lg:py-28', className)}
    >
      {dark && <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" aria-hidden="true" />}
      <Container className="relative">
        {(title || eyebrow) && (
          <Reveal className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {eyebrow && <p className={cn('eyebrow mb-3', dark ? 'text-gold-2' : 'text-gold-deep')}>{eyebrow}</p>}
              {title && (
                <h2 id={hid} className={cn('text-h2', dark && 'text-white')}>
                  {title}
                </h2>
              )}
              {lede && <p className={cn('text-lede mt-4', dark ? 'text-mist' : 'text-muted')}>{lede}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </Reveal>
        )}
        {children}
      </Container>
    </section>
  );
}

type BadgeTone = 'neutral' | 'gold' | 'navy' | 'good' | 'light' | 'outline' | 'gold-dark';
const badgeTone: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-ink border border-line',
  gold: 'bg-gold-soft text-navy border border-gold/30',
  navy: 'bg-navy text-white',
  good: 'bg-good/10 text-ink border border-good/30',
  light: 'bg-white/8 text-mist border border-white/12',
  outline: 'border border-navy/15 text-navy bg-white',
  'gold-dark': 'bg-gold/15 text-gold-2 border border-gold/35',
};

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-medium leading-5', badgeTone[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

interface ChipProps {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  dark?: boolean;
  className?: string;
  count?: number;
}

/** Toggle chip (aria-pressed) used by filters. */
export function Chip({ pressed, onClick, children, dark, className, count }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors duration-200',
        dark
          ? pressed
            ? 'border-gold-2 bg-gold-2/15 text-gold-2'
            : 'border-white/15 text-mist hover:border-white/35 hover:text-white'
          : pressed
            ? 'border-navy bg-navy text-white'
            : 'border-line bg-white text-ink hover:border-navy/35',
        className,
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn('tabular text-xs', pressed ? 'opacity-80' : 'text-muted')}>{count}</span>
      )}
    </button>
  );
}

export function Disclaimer({ children, tone = 'info', className, dark }: { children: ReactNode; tone?: 'info' | 'warn'; className?: string; dark?: boolean }) {
  const Icon = tone === 'warn' ? TriangleAlert : Info;
  return (
    <p
      className={cn(
        'flex gap-2.5 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed',
        dark ? 'border border-white/10 bg-white/[0.04] text-mist' : tone === 'warn' ? 'border border-gold/35 bg-gold-soft/70 text-ink' : 'border border-line bg-white text-muted',
        className,
      )}
    >
      <Icon size={16} className={cn('mt-0.5 shrink-0', dark ? 'text-gold-2' : 'text-gold-deep')} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Small amber marker for content waiting for client approval. Renders only in development. */
export function DraftBadge({ note }: { note?: string }) {
  if (!SHOW_DRAFTS) return null;
  return (
    <span title={note} className="ml-2 inline-flex items-center rounded-md border border-amber-400 bg-amber-100 px-1.5 py-px align-middle text-[11px] font-semibold text-amber-900">
      Draft
    </span>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-navy/20 bg-white px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold-deep">{icon}</div>}
      <h3 className="text-h3">{title}</h3>
      {children && <div className="mx-auto mt-3 max-w-lg text-muted">{children}</div>}
    </div>
  );
}

/** Gold-on-navy icon tile */
export function IconTile({ children, className, light }: { children: ReactNode; className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
        light ? 'bg-gold-soft text-gold-deep ring-1 ring-gold/25' : 'bg-navy text-gold-2 ring-1 ring-gold/30',
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
