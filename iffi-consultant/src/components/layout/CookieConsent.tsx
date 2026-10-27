'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { Cookie } from 'lucide-react';
import { KEYS, readJSON, writeJSON } from '@/lib/storage';
import { loadAnalytics } from '@/lib/analytics';
import { GA4_ID, META_PIXEL_ID } from '@/lib/env';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface Consent {
  analytics: boolean;
  ts: number;
}
const TWELVE_MONTHS = 365 * 24 * 60 * 60 * 1000;
export const OPEN_CONSENT_EVENT = 'gj:open-consent';

export function readConsent(): Consent | null {
  const c = readJSON<Consent | null>(KEYS.consent, null);
  if (!c || typeof c.ts !== 'number' || Date.now() - c.ts > TWELVE_MONTHS) return null;
  return c;
}

/** Analytics stays blocked until the visitor clicks Accept (or enables it in Settings). */
export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (c) {
      setAnalytics(c.analytics);
      if (c.analytics) loadAnalytics();
    } else if (GA4_ID || META_PIXEL_ID) {
      // nothing to consent to until analytics is configured, so no banner without a GA4 or Pixel id
      setOpen(true);
    }
    const reopen = () => {
      setSettings(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const save = (value: boolean) => {
    writeJSON(KEYS.consent, { analytics: value, ts: Date.now() });
    setAnalytics(value);
    setOpen(false);
    setSettings(false);
    if (value) loadAnalytics();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      data-noprint
      className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-line bg-white p-5 shadow-[0_20px_60px_rgba(13,31,63,0.22)] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[380px]"
    >
      <div className="flex items-start gap-3">
        <Cookie size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
        <div>
          <h2 id="cookie-title" className="font-sans text-[15px] font-semibold text-navy">
            Cookies on this site
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
            We remember your shortlist and settings on this device. With your permission we also use analytics to see which pages help
            students. <Link to="/cookies" className="text-navy underline decoration-gold underline-offset-2">Cookie Policy</Link>
          </p>
        </div>
      </div>

      {settings && (
        <div className="mt-4 space-y-2 rounded-xl border border-line bg-paper p-3 text-[13.5px]">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-medium text-navy">Essential</span>
              <span className="text-muted">Shortlist, compare and this choice. Always on.</span>
            </span>
            <input type="checkbox" checked disabled className="h-5 w-5 accent-navy" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block font-medium text-navy">Analytics</span>
              <span className="text-muted">Google Analytics (anonymised) and Meta Pixel.</span>
            </span>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-5 w-5 accent-navy" />
          </label>
        </div>
      )}

      <div className={cn('mt-4 flex flex-wrap gap-2', settings && 'justify-end')}>
        {settings ? (
          <Button size="sm" variant="navy" onClick={() => save(analytics)}>
            Save choices
          </Button>
        ) : (
          <>
            <Button size="sm" variant="navy" onClick={() => save(true)}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => save(false)}>
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSettings(true)}>
              Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
