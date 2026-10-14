/** Settings admins edit in the staff portal (app_settings). Read by any signed-in user through RLS. */
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { EMPTY_PAYMENT_SETTINGS, type PaymentSettings } from './payment';

export const getPaymentSettings = cache(async (): Promise<PaymentSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'payment').maybeSingle();
  const saved = (data?.value ?? {}) as Partial<PaymentSettings>;
  return {
    ...EMPTY_PAYMENT_SETTINGS,
    ...saved,
    applicationFeeUsd: { ...EMPTY_PAYMENT_SETTINGS.applicationFeeUsd, ...(saved.applicationFeeUsd ?? {}) },
  };
});

/** True once an admin has added at least a QR code or account details. */
export const paymentReady = (s: PaymentSettings) => Boolean(s.qrPath || s.accountNumber || s.iban);
