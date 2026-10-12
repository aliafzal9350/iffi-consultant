'use client';
import { useCallback, useEffect, useState } from 'react';
import { tools } from '@/data';
import { FALLBACK, convert, guessCurrency, loadRates, rememberCurrency, type Rates } from '@/lib/currency';

/** Selected display currency (remembered, defaulted from the time zone) + exchange rates from CNY. */
export function useCurrency() {
  const [code, setCodeState] = useState<string>(tools.currency.defaultCurrency);
  const [rates, setRates] = useState<Rates>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setCodeState(guessCurrency());
    loadRates().then((r) => {
      if (!alive) return;
      setRates(r);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setCode = useCallback((c: string) => {
    setCodeState(c);
    rememberCurrency(c);
  }, []);

  return { code, setCode, rates, loading, toLocal: (cny: number) => convert(cny, code, rates) };
}
