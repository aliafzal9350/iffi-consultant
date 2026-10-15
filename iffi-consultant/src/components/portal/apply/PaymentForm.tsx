'use client';
/** After paying with the QR code: the amount, the transaction ID from the banking app, the date and a screenshot. */
import { useActionState, useState } from 'react';
import { Check, CircleCheck, Copy, Paperclip } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/buttonStyles';
import { inputClass } from '@/components/ui/Form';
import { submitPayment, type ActionResult } from '@/lib/portal/apply-actions';
import type { PaymentPurpose } from '@/lib/portal/payment';
import { DocumentUploader } from './DocumentUploader';

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(value).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          },
          () => undefined
        )
      }
      className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium text-navy hover:bg-paper"
      aria-label={`Copy ${label}`}
    >
      {done ? <Check size={14} aria-hidden="true" className="text-good" /> : <Copy size={14} aria-hidden="true" />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Err({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] font-medium text-danger">
      {text}
    </p>
  );
}

interface Props {
  appId: string;
  purpose: PaymentPurpose;
  /** a screenshot uploaded earlier that no payment uses yet */
  pendingProof: { id: string; name: string } | null;
}

export function PaymentForm({ appId, purpose, pendingProof }: Props) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(submitPayment, { ok: false });
  const [proof, setProof] = useState(pendingProof);
  // controlled: React resets uncontrolled fields after every action, which would wipe them on an error
  const [v, setV] = useState({ amount: '', transactionId: '', paidOn: new Date().toISOString().slice(0, 10) });
  const bind = (name: keyof typeof v) => ({ name, value: v[name], onChange: (ev: { target: { value: string } }) => setV((cur) => ({ ...cur, [name]: ev.target.value })) });
  const e = state.errors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  if (state.ok) {
    return (
      <p role="status" className="flex gap-3 rounded-xl bg-good/10 px-4 py-3 text-[14.5px] text-ink">
        <CircleCheck size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="id" value={appId} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="proofId" value={proof?.id ?? ''} />

      <label className="block sm:max-w-[320px]">
        <span className="mb-1.5 block text-sm font-medium text-navy">Amount you paid (RMB)</span>
        <input {...bind('amount')} inputMode="decimal" required aria-invalid={e.amount ? true : undefined} aria-describedby="pay-amount-err" className={cn(inputClass, 'tabular')} placeholder="0.00" />
        <Err id="pay-amount-err" text={e.amount} />
      </label>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">Transaction ID</span>
          <input {...bind('transactionId')} required autoComplete="off" aria-invalid={e.transactionId ? true : undefined} aria-describedby="pay-txn-hint pay-txn-err" className={cn(inputClass, 'tabular uppercase')} placeholder="From your banking app" />
          <span id="pay-txn-hint" className="mt-1.5 block text-[13px] text-muted">
            Also called reference number or TID. Copy it exactly.
          </span>
          <Err id="pay-txn-err" text={e.transactionId} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">Date paid</span>
          <input type="date" {...bind('paidOn')} max={today} required aria-invalid={e.paidOn ? true : undefined} className={inputClass} />
          <Err id="pay-date-err" text={e.paidOn} />
        </label>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy">Payment screenshot</p>
        {proof ? (
          <p className="flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5 text-[14px] text-ink">
            <Paperclip size={15} aria-hidden="true" className="text-navy" />
            <a href={`/portal/files/${proof.id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate underline underline-offset-4">
              {proof.name}
            </a>
            <button type="button" onClick={() => setProof(null)} className="text-[13px] font-medium text-muted hover:text-navy">
              Change
            </button>
          </p>
        ) : (
          <DocumentUploader appId={appId} kind="payment_proof" slots={1} label="Upload the screenshot" onUploaded={(docId, name) => setProof({ id: docId, name })} />
        )}
        <Err id="pay-proof-err" text={e.proof} />
      </div>

      {state.message && !state.ok && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending || !proof} className={buttonClass('gold', 'lg', 'w-full sm:w-auto')}>
        {pending ? 'Sending…' : 'I have paid: send to IFFI'}
      </button>
    </form>
  );
}
