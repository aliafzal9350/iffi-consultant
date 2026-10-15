'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useIsClient } from '@/hooks/useIsClient';
import { FOCUSABLE, usePresence } from './Drawer';

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  /** accessible name of the dialog */
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  /** e.g. "2 / 4" */
  position?: string;
  caption?: ReactNode;
  children: ReactNode;
}

/**
 * Ref for the viewer's main element when it is keyed per item: stepping to the next item replaces the element, which
 * drops focus to <body>, outside the dialog. Pull it back unless the visitor is on a button (e.g. pressing Next again).
 */
export function keepFocus(el: HTMLElement | null) {
  if (el && document.activeElement === document.body) el.focus({ preventScroll: true });
}

const navButton =
  'inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-[background-color,color,transform] duration-300 hover:scale-105 hover:bg-gold hover:text-navy';

/**
 * Full-screen viewer for the student videos and documents. Esc or a click on the backdrop closes it, the arrow keys step
 * through the set (except while a video's own controls have focus, where they seek), focus stays inside and returns to
 * the card that opened it.
 */
export function Lightbox({ open, onClose, label, onPrev, onNext, position, caption, children }: LightboxProps) {
  const isClient = useIsClient();
  const box = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const handlers = useRef({ onClose, onPrev, onNext });
  handlers.current = { onClose, onPrev, onNext };
  const { mounted, shown } = usePresence(open);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const target = box.current?.querySelector<HTMLElement>('[data-autofocus]') ?? box.current;
      target?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      const h = handlers.current;
      const inVideo = (e.target as HTMLElement | null)?.tagName === 'VIDEO';
      if (e.key === 'Escape') {
        e.stopPropagation();
        h.onClose();
      } else if (e.key === 'ArrowLeft' && h.onPrev && !inVideo) {
        h.onPrev();
      } else if (e.key === 'ArrowRight' && h.onNext && !inVideo) {
        h.onNext();
      } else if (e.key === 'Tab' && box.current) {
        const nodes = Array.from(box.current.parentElement!.querySelectorAll<HTMLElement>(`${FOCUSABLE},video[controls]`)).filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open]);

  if (!isClient || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110]" data-noprint>
      <div
        className={cn('absolute inset-0 bg-[#050d1f]/[0.93] backdrop-blur-md transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 pb-24 pt-16 outline-none transition-[opacity,transform] duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-24 sm:pb-8',
          shown ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0',
        )}
      >
        <div className="pointer-events-auto flex min-h-0 max-w-full flex-col items-center">{children}</div>
        {caption && <div className="pointer-events-auto mt-4 max-w-xl text-center text-mist">{caption}</div>}
      </div>

      <div className={cn('pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}>
        <span className="tabular text-sm text-mist/80">{position}</span>
        <button type="button" onClick={onClose} aria-label="Close" className={cn(navButton, 'pointer-events-auto')}>
          <X size={22} />
        </button>
      </div>

      {onPrev && onNext && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center pl-5 sm:flex">
            <button type="button" onClick={onPrev} aria-label="Previous" className={cn(navButton, 'pointer-events-auto')}>
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-5 sm:flex">
            <button type="button" onClick={onNext} aria-label="Next" className={cn(navButton, 'pointer-events-auto')}>
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:hidden">
            <button type="button" onClick={onPrev} aria-label="Previous" className={navButton}>
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={onNext} aria-label="Next" className={navButton}>
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
