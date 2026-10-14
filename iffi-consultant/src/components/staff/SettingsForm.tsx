'use client';
/** Payment settings: IFFI's QR code, account details and the default application fee per level. Admins only. */
import { useActionState, useState } from 'react';
import { CircleCheck, Loader2, QrCode, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LEVEL_LABEL, LEVEL_ORDER } from '@/lib/programs';
import { buttonClass } from '@/components/ui/buttonStyles';
import { inputClass } from '@/components/ui/Form';
import { requestQrUpload, savePaymentSettings, type ActionState } from '@/lib/staff/actions';
import type { PaymentSettings } from '@/lib/portal/payment';

function Text({ name, label, value, hint, onChange, wide }: { name: string; label: string; value: string; hint?: string; onChange: (v: string) => void; wide?: boolean }) {
  return (
    <label className={cn('block', wide && 'sm:col-span-2')}>
      <span className="mb-1.5 block text-[14px] font-medium text-navy">{label}</span>
      <input name={name} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {hint && <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>}
    </label>
  );
}

export function SettingsForm({ initial }: { initial: PaymentSettings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePaymentSettings, { ok: false, message: null });
  const [v, setV] = useState({
    accountTitle: initial.accountTitle,
    bankName: initial.bankName,
    accountNumber: initial.accountNumber,
    iban: initial.iban,
    instructions: initial.instructions,
    currency: initial.currency,
  });
  const [fees, setFees] = useState<Record<string, string>>(Object.fromEntries(LEVEL_ORDER.map((l) => [l, initial.applicationFeeUsd[l]?.toString() ?? ''])));
  const [qrPath, setQrPath] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const set = (k: keyof typeof v) => (val: string) => setV((cur) => ({ ...cur, [k]: val }));

  async function pickQr(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const ticket = await requestQrUpload(file.type, file.size);
      if (!ticket.ok || !ticket.url || !ticket.path) throw new Error(ticket.message ?? 'Upload refused.');
      const res = await fetch(ticket.url, { method: 'PUT', body: file, headers: { 'content-type': file.type, 'x-upsert': 'false' } });
      if (!res.ok) throw new Error('The upload failed. Please try again.');
      setQrPath(ticket.path);
      setPreview(URL.createObjectURL(file));
      setRemoveQr(false);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'The upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="qrPath" value={qrPath} />
      {removeQr && <input type="hidden" name="removeQr" value="on" />}

      <section className="rounded-card border border-line bg-white p-6 sm:p-7">
        <h2 className="flex items-center gap-2 text-[1.25rem]">
          <QrCode size={20} aria-hidden="true" className="text-gold-deep" /> Payment QR code
        </h2>
        <p className="mt-1 text-[14px] text-muted">Students see it on the payment step, after they accept the refund policy.</p>
        <div className="mt-5 flex flex-wrap items-start gap-6">
          <div className="grid h-44 w-44 place-items-center overflow-hidden rounded-2xl border border-line bg-paper">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the picked file
              <img src={preview} alt="New QR code" className="h-full w-full object-contain p-2" />
            ) : initial.qrPath && !removeQr ? (
              // eslint-disable-next-line @next/next/no-img-element -- private image through a short signed link
              <img src="/portal/payment-qr" alt="Current QR code" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="px-4 text-center text-[13px] text-muted">No QR code yet</span>
            )}
          </div>
          <div className="space-y-3">
            <label className={cn(buttonClass('outline', 'sm'), 'cursor-pointer', uploading && 'pointer-events-none opacity-60')}>
              {uploading ? <Loader2 size={15} aria-hidden="true" className="animate-spin" /> : <Upload size={15} aria-hidden="true" />}
              {uploading ? 'Uploading…' : initial.qrPath ? 'Replace the QR code' : 'Upload the QR code'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void pickQr(e.target.files?.[0])} />
            </label>
            {initial.qrPath && !preview && (
              <label className="flex items-center gap-2 text-[13.5px] text-ink">
                <input type="checkbox" checked={removeQr} onChange={(e) => setRemoveQr(e.target.checked)} className="h-4 w-4 accent-navy" /> Remove the QR code
              </label>
            )}
            {uploadError && <p className="text-[13px] font-medium text-danger">{uploadError}</p>}
            {preview && <p className="text-[13px] text-muted">Uploaded. Save the settings to publish it.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-6 sm:p-7">
        <h2 className="text-[1.25rem]">Account details</h2>
        <p className="mt-1 text-[14px] text-muted">Optional: shown under the QR code with copy buttons, for students who pay by transfer.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Text name="accountTitle" label="Account title" value={v.accountTitle} onChange={set('accountTitle')} />
          <Text name="bankName" label="Bank or wallet" value={v.bankName} onChange={set('bankName')} />
          <Text name="accountNumber" label="Account number" value={v.accountNumber} onChange={set('accountNumber')} />
          <Text name="iban" label="IBAN" value={v.iban} onChange={set('iban')} />
          <Text name="currency" label="Currency most students pay in" value={v.currency} onChange={(x) => set('currency')(x.toUpperCase())} hint="3 letters, for example PKR." />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[14px] font-medium text-navy">Instructions under the QR code</span>
            <textarea name="instructions" rows={3} maxLength={600} value={v.instructions} onChange={(e) => set('instructions')(e.target.value)} className={cn(inputClass, 'min-h-24 py-3')} />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-6 sm:p-7">
        <h2 className="text-[1.25rem]">Default application fee (USD)</h2>
        <p className="mt-1 text-[14px] text-muted">Used when an application has no fee of its own. Leave empty until IFFI confirms the price: students then see “Ask IFFI”.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {LEVEL_ORDER.map((l) => (
            <label key={l} className="block">
              <span className="mb-1.5 block text-[13.5px] font-medium text-navy">{LEVEL_LABEL[l]}</span>
              <input name={`fee_${l}`} inputMode="decimal" value={fees[l]} onChange={(e) => setFees((f) => ({ ...f, [l]: e.target.value }))} placeholder="Not set" className={cn(inputClass, 'tabular')} />
            </label>
          ))}
        </div>
      </section>

      {state.message && (
        <p role={state.ok ? 'status' : 'alert'} className={cn('flex gap-2 rounded-xl px-4 py-3 text-[14px]', state.ok ? 'bg-good/10 text-ink' : 'bg-danger/10 text-danger')}>
          {state.ok && <CircleCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-good" />}
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending || uploading} className={buttonClass('gold', 'lg')}>
        {pending ? 'Saving…' : 'Save the settings'}
      </button>
    </form>
  );
}
