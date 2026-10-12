'use client';
import { useEffect, useState } from 'react';
import { Check, Printer } from 'lucide-react';
import { KEYS, readJSON, writeJSON } from '@/lib/storage';
import { cn } from '@/lib/cn';

/** Tickable checklist; ticks are remembered per list in this browser. */
export function DocumentChecklist({ id, items, title = 'Documents checklist' }: { id: string; items: string[]; title?: string }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const all = readJSON<Record<string, string[]>>(KEYS.checklist, {});
    if (all[id]?.length) setDone(all[id]);
  }, [id]);
  const toggle = (item: string) => {
    const next = done.includes(item) ? done.filter((x) => x !== item) : [...done, item];
    setDone(next);
    const all = readJSON<Record<string, string[]>>(KEYS.checklist, {});
    writeJSON(KEYS.checklist, { ...all, [id]: next });
  };
  return (
    <div className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h3">{title}</h3>
        <span className="text-sm text-muted">
          {done.length} of {items.length} ready
        </span>
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((item) => {
          const checked = done.includes(item);
          return (
            <li key={item}>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-paper">
                <input type="checkbox" checked={checked} onChange={() => toggle(item)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold',
                    checked ? 'border-navy bg-navy text-white' : 'border-navy/30 bg-white',
                  )}
                >
                  {checked && <Check size={14} />}
                </span>
                <span className={cn('text-[15px] leading-snug', checked && 'text-muted line-through decoration-gold/70')}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => window.print()} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-navy hover:underline" data-noprint>
        <Printer size={16} aria-hidden="true" />
        Print this page
      </button>
    </div>
  );
}
