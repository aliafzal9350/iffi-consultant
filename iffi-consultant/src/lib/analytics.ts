/**
 * Google Analytics 4, loaded only when VITE_GA4_ID is set AND the visitor accepted analytics cookies.
 * Until then nothing is requested from Google and track() is a no-op.
 */
import { GA4_ID } from './env';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

export function loadAnalytics(): void {
  if (loaded || !GA4_ID || typeof window === 'undefined') return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(s);
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (loaded && window.gtag) window.gtag('event', event, params);
}

export function trackPageView(path: string): void {
  if (loaded && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}
