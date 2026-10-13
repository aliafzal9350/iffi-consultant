'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { inputClass } from '@/components/ui/Form';

/** Majors of one programme, with a filter box once the list gets long. */
export function MajorsList({ majors }: { majors: string[] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const shown = term ? majors.filter((m) => m.toLowerCase().includes(term)) : majors;
  return (
    <>
      {majors.length > 8 && (
        <div className="relative mb-4 max-w-sm">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search these majors" aria-label="Search majors" className={cn(inputClass, 'pl-10')} />
        </div>
      )}
      {shown.length ? (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {shown.map((m) => (
            <li key={m} className="flex gap-2.5 border-b border-line py-2 text-[15px]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
              {m}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No major matches “{q}”.</p>
      )}
    </>
  );
}
