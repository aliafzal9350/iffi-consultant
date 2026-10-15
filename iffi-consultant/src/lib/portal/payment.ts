/**
 * Payments by static QR: the student pays from their banking app, then sends the transaction ID and a screenshot;
 * staff verify it against IFFI's account. The account details and default fees are settings admins edit in the
 * staff portal (app_settings 'payment'), because IFFI has not fixed them yet: nothing here is a price.
 */
import { LEVEL_ORDER } from '@/lib/programs';

export type PaymentPurpose = 'application_fee' | 'service_charge';

/** Every fee and payment is in Chinese yuan (ISO code CNY), shown as "RMB" (client decision, 2026-10-14). */
export const PAYMENT_CURRENCY = 'CNY';
export type PaymentStatus = 'submitted' | 'verified' | 'rejected';

export const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  application_fee: 'Application fee',
  service_charge: 'Service charge (after JW202)',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  submitted: 'Being checked',
  verified: 'Received',
  rejected: 'Not found',
};

export interface PaymentSettings {
  accountTitle: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  /** shown under the QR code, e.g. "Raast QR: works with every Pakistani banking app" */
  instructions: string;
  /** always PAYMENT_CURRENCY; getPaymentSettings overrides any older saved value */
  currency: string;
  /** storage path of the QR image in the private bucket, or null before an admin uploads it */
  qrPath: string | null;
  /** default application fee by level in RMB; null = not set (staff then set it per application). The key and the
   *  applications.*_usd columns keep their names from before the switch from USD to RMB. */
  applicationFeeUsd: Record<string, number | null>;
}

export const EMPTY_PAYMENT_SETTINGS: PaymentSettings = {
  accountTitle: '',
  bankName: '',
  accountNumber: '',
  iban: '',
  instructions: '',
  currency: PAYMENT_CURRENCY,
  qrPath: null,
  applicationFeeUsd: Object.fromEntries(LEVEL_ORDER.map((l) => [l, null])),
};

export interface PaymentRow {
  id: string;
  purpose: PaymentPurpose;
  amount: number;
  currency: string;
  transaction_id: string;
  paid_on: string;
  proof_document_id: string | null;
  status: PaymentStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const PAYMENT_COLUMNS = 'id, purpose, amount, currency, transaction_id, paid_on, proof_document_id, status, review_note, reviewed_at, created_at';

/** The amount due for one purpose: what staff set on this application, else the default for its level. */
export function amountDue(
  purpose: PaymentPurpose,
  app: { application_fee_usd: number | null; service_charge_usd: number | null; program_snapshot: { level: string } },
  settings: PaymentSettings
): number | null {
  if (purpose === 'service_charge') return app.service_charge_usd;
  return app.application_fee_usd ?? settings.applicationFeeUsd[app.program_snapshot.level] ?? null;
}

/** The latest payment for a purpose (payments arrive newest first). */
export const latestPayment = (payments: PaymentRow[], purpose: PaymentPurpose) => payments.find((p) => p.purpose === purpose) ?? null;

/** "RMB 2,000"; a payment recorded in another currency before the switch keeps its own code. */
export const fmtMoney = (amount: number, currency: string) =>
  `${currency === 'CNY' ? 'RMB' : currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
