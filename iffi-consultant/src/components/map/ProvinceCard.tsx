'use client';
import { Link } from '@/lib/router';
import { MapPin } from 'lucide-react';
import type { Province } from '@/types/data';
import { fmtNumber, plural } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_ORDER, provincePath } from '@/lib/programs';
import { waHref } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { cn } from '@/lib/cn';

/**
 * Info card for the hovered / selected / toured province (shared by the 3D and 2D maps).
 * `compact` is the desktop hero version: short enough that it never covers the eastern provinces it describes.
 */
export function ProvinceCard({ p, className, onNavigate, compact }: { p: Province; className?: string; onNavigate?: () => void; compact?: boolean }) {
  const levels = LEVEL_ORDER.filter((l) => p.programsByLevel[l]);
  return (
    <div className={cn('rounded-2xl border border-white/12 bg-navy-2/95 text-mist', compact ? 'p-4' : 'p-5', 'shadow-[0_24px_60px_rgba(5,12,28,0.5)]', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('font-display font-semibold leading-none text-white', compact ? 'text-[22px]' : 'text-[26px]')}>
          {p.name}
          <span className="font-cjk ml-2 text-[17px] font-semibold text-gold-2" lang="zh">
            {p.nameZh}
          </span>
        </p>
        <p className="tabular shrink-0 text-sm text-gold-2">{plural(p.programCount, 'programme')}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Programmes by level">
        {levels.map((l) => (
          <li key={l} className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-0.5 text-[12.5px] text-white">
            {LEVEL_LABEL[l]} <span className="tabular text-gold-2">{p.programsByLevel[l]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-1.5 text-[13.5px]">
        <MapPin size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-2" />
        <span className={cn(compact && 'min-w-0 truncate')}>{p.cities.length ? p.cities.map((c) => c.name).join(', ') : 'Province-wide programmes'}</span>
      </p>
      {p.maxStipendCNYPerMonth && (
        <p className="mt-1.5 text-[13.5px] text-white">Stipends up to {fmtNumber(p.maxStipendCNYPerMonth)} RMB/month</p>
      )}
      {!compact && p.sampleMajors.length > 0 && <p className="mt-1.5 text-[13px] text-mist/85">{p.sampleMajors.slice(0, 3).join(', ')}</p>}
      <div className={cn('flex gap-2', compact ? 'mt-3.5' : 'mt-4 flex-wrap')}>
        <Link
          to={provincePath(p.name)}
          onClick={onNavigate}
          className="inline-flex min-h-10 items-center rounded-full bg-gold px-4 text-sm font-medium text-navy transition-colors hover:bg-gold-2"
        >
          View programmes
        </Link>
        <a
          href={waHref('provinceInterest', { province: p.name })}
          target="_blank"
          rel="noopener"
          aria-label={compact ? `Ask about ${p.name} on WhatsApp` : undefined}
          className={cn(
            'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 text-sm text-white transition-colors hover:border-gold-2 hover:text-gold-2',
            compact ? 'w-10 justify-center' : 'px-4',
          )}
        >
          <WhatsAppIcon size={compact ? 17 : 15} />
          {!compact && <>Ask about {p.name}</>}
        </a>
      </div>
    </div>
  );
}
