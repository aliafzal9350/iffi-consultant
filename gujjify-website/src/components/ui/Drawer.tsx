'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
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

/** Modal dialog that traps focus, closes on Esc / backdrop and restores focus on close. */
export function Drawer({ open, onClose, title, side = 'right', children, footer, dark, widthClass = 'sm:max-w-md', labelId = 'drawer-title' }: DrawerProps) {
  const isClient = useIsClient();
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

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

  if (!isClient) return null;

  const variants =
    side === 'right'
      ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" data-noprint>
          <motion.div
            className="absolute inset-0 bg-navy/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            tabIndex={-1}
            {...variants}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute flex flex-col outline-none',
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
