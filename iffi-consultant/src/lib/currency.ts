/**
 * Exchange rates for the cost calculator (base CNY).
 * Order: sessionStorage cache (12 h) -> live CDN -> live fallback host -> rates bundled in tools.json.
 */
import { tools } from '@/data/config';
import { KEYS, readJSON, writeJSON } from './storage';

export interface Rates {
  rates: Record<string, number>;
  date: string;
  source: 'live' | 'fallback';
}

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export const CURRENCIES = tools.currency.currencies.map((c) => ({
  code: c.currency,
  country: c.country,
  countryCode: c.countryCode,
}));

export const FALLBACK: Rates = {
  rates: tools.currency.fallbackRates as Record<string, number>,
  date: tools.currency.fallbackRatesDate,
  source: 'fallback',
};

async function fetchFrom(url: string): Promise<Rates> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { date?: string; cny?: Record<string, number> };
    if (!json.cny) throw new Error('Unexpected response');
    const rates: Record<string, number> = {};
    for (const c of CURRENCIES) {
      const v = json.cny[c.code.toLowerCase()];
      if (typeof v === 'number' && v > 0) rates[c.code] = v;
    }
    rates.CNY = 1;
    if (Object.keys(rates).length < 5) throw new Error('Too few rates');
    return { rates: { ...FALLBACK.rates, ...rates }, date: json.date ?? '', source: 'live' };
  } finally {
    window.clearTimeout(t);
  }
}

export async function loadRates(): Promise<Rates> {
  const cached = readJSON<{ at: number; data: Rates } | null>(KEYS.rates, null, 'session');
  if (cached && Date.now() - cached.at < TWELVE_HOURS) return cached.data;
  for (const url of [tools.currency.liveRatesUrl, tools.currency.liveRatesFallbackUrl]) {
    try {
      const data = await fetchFrom(url);
      writeJSON(KEYS.rates, { at: Date.now(), data }, 'session');
      return data;
    } catch {
      /* try the next source */
    }
  }
  return FALLBACK;
}

export function guessCurrency(): string {
  try {
    const stored = readJSON<string | null>(KEYS.currency, null);
    if (stored && CURRENCIES.some((c) => c.code === stored)) return stored;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hint = (tools.currency.defaultByTimezoneHint as Record<string, string>)[tz];
    if (hint) return hint;
  } catch {
    /* ignore */
  }
  return tools.currency.defaultCurrency;
}

export function rememberCurrency(code: string) {
  writeJSON(KEYS.currency, code);
}

export function convert(cny: number, code: string, r: Rates): number {
  return cny * (r.rates[code] ?? 1);
}

export function currencyLabel(code: string): string {
  const c = CURRENCIES.find((x) => x.code === code);
  return c ? `${c.code}, ${c.country}` : code;
}
