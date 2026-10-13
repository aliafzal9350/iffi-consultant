'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocation } from '@/lib/router';

// The chat panel (and its code) loads only when someone opens it, so the assistant costs nothing on page load.
const ChatPanel = dynamic(() => import('./ChatPanel'), { ssr: false });

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { pathname } = useLocation();
  // programme pages have a sticky apply bar at the bottom on phones
  const raised = /^\/programmes\/[^/]+$/.test(pathname);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        onMouseEnter={() => setLoaded(true)}
        aria-haspopup="dialog"
        className={cn(
          'fixed left-4 z-40 mb-[env(safe-area-inset-bottom)] inline-flex h-12 items-center gap-2 rounded-full border border-gold/40 bg-navy px-4 text-sm font-medium text-white shadow-[0_10px_30px_rgba(13,31,63,0.35)] transition-[transform,opacity] duration-300 hover:border-gold-2 md:bottom-6 md:left-6',
          raised ? 'bottom-24' : 'bottom-5',
          open && 'pointer-events-none opacity-0',
        )}
        data-noprint
      >
        <Sparkles size={17} aria-hidden="true" className="text-gold-2" />
        Ask our assistant
      </button>
      {loaded && <ChatPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
