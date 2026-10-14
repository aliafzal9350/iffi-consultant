'use client';
import { useEffect, useState } from 'react';
import { useLocation } from '@/lib/router';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { site } from '@/data/core';
import { waHref } from '@/lib/whatsapp';
import { track } from '@/lib/analytics';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { useLists } from '@/hooks/useLists';

/** Pages with their own sticky mobile CTA bar push the floating buttons up on phones. */
function useHasStickyCta() {
  const { pathname } = useLocation();
  return /^\/programmes\/[^/]+$/.test(pathname);
}

export function FloatingWhatsApp() {
  const [hidden, setHidden] = useState(false);
  const raised = useHasStickyCta();
  const { compare } = useLists();
  const { pathname } = useLocation();

  useEffect(() => {
    const target = document.getElementById('footer-cta');
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.1 });
    io.observe(target);
    return () => io.disconnect();
  }, [pathname]);

  const lift = compare.length > 0 ? 'bottom-24' : 'bottom-5 md:bottom-6';

  return (
    <a
      href={waHref('default')}
      target="_blank"
      rel="noopener"
      aria-label={`Chat with ${site.brand.name} on WhatsApp`}
      onClick={() => track('whatsapp_click', { context: 'floating' })}
      data-noprint
      className={cn(
        'fixed right-4 z-40 mb-[env(safe-area-inset-bottom)] inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition-[opacity,transform,bottom] duration-300 md:right-6',
        lift,
        // programme pages already have WhatsApp in their sticky apply bar on phones
        raised && compare.length === 0 && 'max-md:hidden',
        hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100',
      )}
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp animate-pulse-ring" aria-hidden="true" />
      <WhatsAppIcon size={28} className="relative" />
    </a>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  const raised = useHasStickyCta();
  const { compare } = useLists();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const lift = compare.length > 0 ? 'bottom-[104px]' : raised ? 'bottom-[88px] max-md:right-4 md:bottom-8' : 'bottom-[26px] md:bottom-8';
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      data-noprint
      className={cn(
        'fixed right-[84px] z-40 mb-[env(safe-area-inset-bottom)] inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-navy shadow-soft transition-[opacity,transform] duration-300 hover:border-navy/40 md:right-[96px]',
        lift,
        show ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}

/** Short confirmation messages (shortlist, compare, copy link). Also announced to screen readers. */
export function Toast() {
  const { notice } = useLists();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(t);
  }, [notice]);
  return (
    // bottom centre: clear of the sticky header, the finder's filter bar and any open drawer's content
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-32 z-[80] flex justify-center px-6 md:bottom-8" data-noprint>
      <div
        className={cn(
          'rounded-full bg-navy px-5 py-2.5 text-center text-sm text-white shadow-lift ring-1 ring-gold/30 transition-[opacity,transform] duration-300',
          visible && notice ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {notice}
      </div>
    </div>
  );
}
