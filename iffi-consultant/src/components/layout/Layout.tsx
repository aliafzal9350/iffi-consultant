'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from '@/lib/router';
import { trackPageView } from '@/lib/analytics';
import { TopBar, Header } from './Header';
import { BackToTop, FloatingWhatsApp, Toast } from './Floating';
import { CookieConsent } from './CookieConsent';
import { ListsHost } from '@/components/programmes/ListsHost';
import { ChatLauncher } from '@/components/chat/ChatLauncher';

/** Scroll to top on page change, or to the #hash target when there is one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
    trackPageView(pathname);
  }, [pathname, hash]);
  return null;
}

/** Move focus to the main landmark after client-side navigation (screen-reader friendly). */
function FocusOnNavigate() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('content')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

/** Client shell. The footer arrives as a prop so it stays a Server Component (no JS for it). */
export function Layout({ children, footer, assistant = false }: { children: ReactNode; footer: ReactNode; assistant?: boolean }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <main id="content" tabIndex={-1} className="outline-none min-h-screen bg-[#071124] text-slate-100">
        {children}
        <Toast />
      </main>
    );
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only z-[100] rounded-full bg-gold px-5 py-3 font-medium text-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <ScrollManager />
      <FocusOnNavigate />
      <TopBar />
      <Header />
      <main id="content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {footer}
      <FloatingWhatsApp />
      <BackToTop />
      <Toast />
      <CookieConsent />
      <ListsHost />
      {assistant && <ChatLauncher />}
    </>
  );
}
