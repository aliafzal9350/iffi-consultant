'use client';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

/** WAI-ARIA tabs with roving tabindex and arrow-key navigation. */
export function Tabs({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      setActive(items[next].id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-full border border-line bg-white p-1">
          {items.map((t, i) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                role="tab"
                id={`${uid}-${t.id}-tab`}
                aria-selected={selected}
                aria-controls={`${uid}-${t.id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  'min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-200',
                  selected ? 'bg-navy text-white' : 'text-ink hover:bg-paper',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-${t.id}-panel`}
          aria-labelledby={`${uid}-${t.id}-tab`}
          hidden={t.id !== active}
          tabIndex={0}
          className="mt-8 focus-visible:outline-offset-4"
        >
          {/* only the open panel is rendered: less HTML and less to hydrate */}
          {t.id === active && t.content}
        </div>
      ))}
    </div>
  );
}
