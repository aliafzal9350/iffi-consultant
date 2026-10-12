'use client';
import { Share2 } from 'lucide-react';
import { useLists } from '@/hooks/useLists';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

/** Native share sheet, or copy the link where sharing is not supported. */
export function ShareButton({ title }: { title: string }) {
  const { notify } = useLists();
  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify('Link copied');
      }
    } catch {
      /* share sheet dismissed */
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-mist hover:border-gold-2 hover:text-gold-2"
    >
      <Share2 size={16} aria-hidden="true" />
      Share
    </button>
  );
}

/** Phones: sticky apply bar (the compare tray takes its place when it is open). */
export function StickyApplyBar({ vars, label }: { vars: Record<string, string>; label: string }) {
  const { compare } = useLists();
  return (
    <div
      hidden={compare.length > 0}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      data-noprint
    >
      <WhatsAppButton messageKey="programInterest" vars={vars} className="w-full">
        {label}
      </WhatsAppButton>
    </div>
  );
}
