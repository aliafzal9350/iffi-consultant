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
// events sent before analytics loaded on this page (e.g. a component effect that runs before the consent check);
// sent once the visitor's consent loads analytics, dropped with the page otherwise
const pending: [string, Record<string, unknown>][] = [];

export function loadAnalytics(): void {
  loadMetaPixel();
  loadGa4();
  for (const [event, params] of pending.splice(0)) track(event, params);
}

function loadGa4(): void {
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
  sign_up: 'CompleteRegistration',
};

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (!loaded && !pixelLoaded) {
    if (pending.length < 20) pending.push([event, params]);
    return;
  }
  if (loaded && window.gtag) window.gtag('event', event, params);
  const metaEvent = META_EVENTS[event];
  if (metaEvent && pixelLoaded && window.fbq) window.fbq('track', metaEvent);
}

export function trackPageView(path: string): void {
  if (pixelLoaded && window.fbq) window.fbq('track', 'PageView');
  if (loaded && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}
