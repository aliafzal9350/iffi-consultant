'use client';
import { useId, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface Props {
  items: AccordionItem[];
  defaultOpen?: string[];
  dark?: boolean;
  /** allow several panels open at once */
  multiple?: boolean;
  headingLevel?: 'h3' | 'h4';
}

/** Buttons with aria-expanded; panels animate with the grid-rows trick (no height measuring). */
export function Accordion({ items, defaultOpen = [], dark, multiple = true, headingLevel = 'h3' }: Props) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const uid = useId();
  const H = headingLevel;
  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : multiple ? [...cur, id] : [id]));

  return (
    <div className={cn('divide-y', dark ? 'divide-white/10 border-y border-white/10' : 'divide-line border-y border-line')}>
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        const bid = `${uid}-${it.id}-b`;
        const pid = `${uid}-${it.id}-p`;
        return (
          <div key={it.id}>
            <H className="font-sans text-base font-medium">
              <button
                id={bid}
                type="button"
                aria-expanded={isOpen}
                aria-controls={pid}
                onClick={() => toggle(it.id)}
                className={cn(
                  'flex w-full items-start justify-between gap-6 py-5 text-left text-[16.5px] leading-snug transition-colors',
                  dark ? 'text-white hover:text-gold-2' : 'text-navy hover:text-navy-3',
                )}
              >
                <span>{it.title}</span>
                <Plus
                  size={20}
                  aria-hidden="true"
                  className={cn('mt-0.5 shrink-0 transition-transform duration-300', isOpen && 'rotate-45', dark ? 'text-gold-2' : 'text-gold-deep')}
                />
              </button>
            </H>
            <div
              id={pid}
              role="region"
              aria-labelledby={bid}
              className={cn('grid transition-[grid-template-rows] duration-300 ease-[var(--ease-premium)]', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <div className={cn('pb-6 pr-10 leading-relaxed', dark ? 'text-mist' : 'text-ink/85')}>{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
