'use client';
import { GitCompareArrows, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLists } from '@/hooks/useLists';

/** Shortlist + compare buttons: the only interactive part of a programme card. */
export function ListToggles({ id, dark }: { id: string; dark?: boolean }) {
  const { shortlist, compare, toggleShortlist, toggleCompare } = useLists();
  const inShort = shortlist.includes(id);
  const inCompare = compare.includes(id);
  const btn = cn(
    'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200',
    dark ? 'border-white/15 text-mist hover:border-gold-2 hover:text-gold-2' : 'border-line text-navy hover:border-navy/40',
  );
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => toggleShortlist(id)}
        aria-pressed={inShort}
        aria-label={inShort ? `Remove ${id} from shortlist` : `Add ${id} to shortlist`}
        title={inShort ? 'Remove from shortlist' : 'Add to shortlist'}
        className={cn(btn, inShort && 'border-gold bg-gold-soft text-gold-deep')}
      >
        <Heart size={17} aria-hidden="true" fill={inShort ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        onClick={() => toggleCompare(id)}
        aria-pressed={inCompare}
        aria-label={inCompare ? `Remove ${id} from compare` : `Add ${id} to compare`}
        title={inCompare ? 'Remove from compare' : 'Compare'}
        className={cn(btn, inCompare && 'border-navy bg-navy text-white')}
      >
        <GitCompareArrows size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
