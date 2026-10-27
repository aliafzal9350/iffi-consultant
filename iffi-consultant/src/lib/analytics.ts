/**
 * Google Analytics 4 and the Meta Pixel, each loaded only when its id is set AND the visitor accepted analytics
 * cookies. Until then nothing is requested from Google or Meta and track() is a no-op.
 */
import { GA4_ID, META_PIXEL_ID } from './env';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbQueue;
    _fbq?: FbQueue;
  }
}

interface FbQueue {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbQueue;
  loaded: boolean;
  version: string;
}

let loaded = false;
let pixelLoaded = false;

export function loadAnalytics(): void {
  loadMetaPixel();
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

/** Meta's standard base code, typed: calls queue until fbevents.js arrives, which then replays them. */
function loadMetaPixel(): void {
  if (pixelLoaded || !META_PIXEL_ID || typeof window === 'undefined') return;
  pixelLoaded = true;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as FbQueue;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq ??= fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

/** Site events that also count as Meta standard events, so adverts can be measured by enquiries, not just visits. */
const META_EVENTS: Record<string, string> = {
  contact_form_sent: 'Lead',
  contact_form_whatsapp: 'Lead',
  whatsapp_click: 'Contact',
  application_started: 'SubmitApplication',
};

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (loaded && window.gtag) window.gtag('event', event, params);
  const metaEvent = META_EVENTS[event];
  if (metaEvent && pixelLoaded && window.fbq) window.fbq('track', metaEvent);
}

export function trackPageView(path: string): void {
  if (pixelLoaded && window.fbq) window.fbq('track', 'PageView');
  if (loaded && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}
