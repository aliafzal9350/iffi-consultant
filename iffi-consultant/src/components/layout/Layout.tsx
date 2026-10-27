'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from '@/lib/router';
import { track, trackPageView } from '@/lib/analytics';
import { TopBar, Header } from './Header';
import { BackToTop, FloatingWhatsApp, Toast } from './Floating';
import { ConsentedAnalytics, CookieConsent } from './CookieConsent';
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

/** /auth/callback sets this cookie when a Google sign-in created a new account; count it once, then clear it. */
const SIGNUP_COOKIE = 'iffi_signup';
function SignupTracker() {
  useEffect(() => {
    if (!document.cookie.split('; ').includes(`${SIGNUP_COOKIE}=1`)) return;
    document.cookie = `${SIGNUP_COOKIE}=; Max-Age=0; Path=/`;
    track('sign_up', { method: 'Google' });
  }, []);
  return null;
}

/** Client shell. The footer arrives as a prop so it stays a Server Component (no JS for it). */
export function Layout({ children, footer, assistant = false }: { children: ReactNode; footer: ReactNode; assistant?: boolean }) {
  const { pathname } = useLocation();
  // signed-in areas bring their own chrome (PortalShell); the sign-in page keeps the public header
  const inArea = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  const isPortalApp = (inArea('/portal') && pathname !== '/portal/sign-in') || inArea('/staff');

  if (isPortalApp) {
    return (
      <>
        <a
          href="#content"
          className="sr-only z-[100] rounded-full bg-gold px-5 py-3 font-medium text-navy focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <FocusOnNavigate />
        <ConsentedAnalytics />
        <SignupTracker />
        {children /* PortalShell renders <main id="content"> after its own header */}
        <Toast />
      </>
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
      {/* the sign-in page has its own WhatsApp link, and floating buttons would cover its content */}
      {pathname !== '/portal/sign-in' && <FloatingWhatsApp />}
      <BackToTop />
      <Toast />
      <CookieConsent />
      <SignupTracker />
      <ListsHost />
      {assistant && pathname !== '/portal/sign-in' && <ChatLauncher />}
    </>
  );
}
