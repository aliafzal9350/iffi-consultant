'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useIsClient } from '@/hooks/useIsClient';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** right = side panel, bottom = bottom sheet (mobile filters), full = full-height sheet */
  side?: 'right' | 'bottom' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  dark?: boolean;
  widthClass?: string;
  labelId?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const EXIT_MS = 380;

/**
 * Keep the dialog mounted for the exit transition: `mounted` adds it to the page, `shown` (set one frame
 * later) slides it in, so the CSS transition runs both ways without an animation library.
 */
function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);
  return { mounted, shown };
}

/** Modal dialog that traps focus, closes on Esc / backdrop and restores focus on close. */
export function Drawer({ open, onClose, title, side = 'right', children, footer, dark, widthClass = 'sm:max-w-md', labelId = 'drawer-title' }: DrawerProps) {
  const isClient = useIsClient();
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const { mounted, shown } = usePresence(open);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && panel.current) {
        const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
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

  const hidden = side === 'right' ? 'translate-x-full' : 'translate-y-full';

  return createPortal(
    <div className="fixed inset-0 z-[70]" data-noprint>
      <div
        className={cn('absolute inset-0 bg-navy/55 backdrop-blur-[2px] transition-opacity duration-250', shown ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col outline-none transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          shown ? 'translate-x-0 translate-y-0' : hidden,
          dark ? 'bg-navy text-mist' : 'bg-white text-ink',
          side === 'right' && cn('inset-y-0 right-0 w-full shadow-2xl', widthClass),
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88svh] rounded-t-[22px] shadow-2xl',
          side === 'full' && 'inset-0',
        )}
      >
        <div className={cn('flex items-center justify-between gap-4 border-b px-5 py-4', dark ? 'border-white/10' : 'border-line')}>
          <h2 id={labelId} className={cn('font-display text-xl', dark && 'text-white')}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn('-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full', dark ? 'text-mist hover:bg-white/10' : 'text-navy hover:bg-paper')}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <div className={cn('border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]', dark ? 'border-white/10' : 'border-line')}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
