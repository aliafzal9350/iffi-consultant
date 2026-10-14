import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CircleAlert, CircleCheck, Clock, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { cn } from '@/lib/cn';
import { CURRENCIES } from '@/lib/currency';
import { Link } from '@/lib/router';
import { applicationRef, stepPath } from '@/lib/portal/application';
import { acceptRefundPolicy } from '@/lib/portal/apply-actions';
import { loadApplication } from '@/lib/portal/load';
import { PAYMENT_STATUS_LABEL, PURPOSE_LABEL, amountDue, fmtMoney, latestPayment, type PaymentPurpose } from '@/lib/portal/payment';
import { REFUND_POLICY } from '@/lib/portal/policy';
import { getPaymentSettings, paymentReady } from '@/lib/portal/settings';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { SubmitButton } from '@/components/portal/SubmitButton';
import { CopyButton, PaymentForm } from '@/components/portal/apply/PaymentForm';
import { StepShell } from '@/components/portal/apply/StepShell';

export const metadata: Metadata = { title: { absolute: `Application fee | ${site.brand.name}` } };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function FeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ for?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const purpose: PaymentPurpose = (await searchParams).for === 'service' ? 'service_charge' : 'application_fee';
  const loaded = await loadApplication(id);
  if (!loaded || loaded.app.user_id !== me.id) notFound();
  const { app, payments, docs } = loaded;
  const settings = await getPaymentSettings();

  const last = latestPayment(payments, purpose);
  const due = amountDue(purpose, app, settings);
  const policyOk = app.refund_policy_version === REFUND_POLICY.version;
  const ref = applicationRef(app.id);
  const isService = purpose === 'service_charge';
  const open = isService ? ['jw202_issued', 'visa'].includes(app.status) : Boolean(app.signed_at);
  const usedProofs = new Set(payments.map((p) => p.proof_document_id));
  const spare = [...docs].reverse().find((d) => d.kind === 'payment_proof' && !usedProofs.has(d.id));
  const currencies = [...new Set([settings.currency, 'USD', 'PKR', 'CNY', ...CURRENCIES.map((c) => c.code)])];
  const wa = `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(`Hello IFFI, I am paying the ${PURPOSE_LABEL[purpose].toLowerCase()} for application ${ref}. Can you confirm the amount and payment details?`)}`;

  const details = [
    ['Account title', settings.accountTitle],
    ['Bank', settings.bankName],
    ['Account number', settings.accountNumber],
    ['IBAN', settings.iban],
  ].filter(([, v]) => v);

  return (
    <StepShell
      loaded={loaded}
      current="fee"
      title={isService ? 'Pay the service charge' : undefined}
      lede={isService ? 'Your JW202 is issued. The service charge is paid now, the same way as the application fee.' : 'Pay with the QR code, then send us the transaction ID. IFFI checks it and starts reviewing your application.'}
    >
      <div className="space-y-6">
        {!open ? (
          <section className="rounded-card border border-line bg-white p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-[1.25rem]">
              <Lock size={19} aria-hidden="true" className="text-muted" /> {isService ? 'Not yet' : 'Sign your application first'}
            </h2>
            <p className="mt-2 text-[15px] text-muted">
              {isService ? 'The service charge is paid after your JW202 is issued. IFFI tells you when.' : 'The fee step opens once your application is complete and signed.'}
            </p>
            {!isService && (
              <Link to={stepPath(app.id, 'review')} className={buttonClass('navy', 'md', 'mt-5')}>
                Go to review and sign
              </Link>
            )}
          </section>
        ) : last && last.status !== 'rejected' ? (
          <section className="rounded-card border border-line bg-white p-6 sm:p-8">
            {last.status === 'verified' ? (
              <h2 className="flex items-center gap-2 text-[1.35rem]">
                <CircleCheck size={22} aria-hidden="true" className="text-good" /> Payment received
              </h2>
            ) : (
              <h2 className="flex items-center gap-2 text-[1.35rem]">
                <Clock size={21} aria-hidden="true" className="text-gold-deep" /> We are checking your payment
              </h2>
            )}
            <p className="mt-2 text-[15px] text-muted">
              {last.status === 'verified'
                ? `IFFI confirmed your ${PURPOSE_LABEL[purpose].toLowerCase()} on ${shortDate(last.reviewed_at ?? last.created_at)}.`
                : 'IFFI matches the transaction ID with its account, usually within one working day. You will see the result here.'}
            </p>
            <dl className="mt-5 grid gap-4 rounded-2xl bg-paper/70 p-4 text-[14px] sm:grid-cols-3">
              <div>
                <dt className="text-muted">Amount</dt>
                <dd className="tabular font-medium text-ink">{fmtMoney(last.amount, last.currency)}</dd>
              </div>
              <div>
                <dt className="text-muted">Transaction ID</dt>
                <dd className="tabular break-all font-medium text-ink">{last.transaction_id}</dd>
              </div>
              <div>
                <dt className="text-muted">Paid on</dt>
                <dd className="font-medium text-ink">{shortDate(last.paid_on)}</dd>
              </div>
            </dl>
            <Link to={`/portal/applications/${app.id}`} className={buttonClass('navy', 'md', 'mt-6')}>
              Back to my application
            </Link>
          </section>
        ) : (
          <>
            {last?.status === 'rejected' && (
              <p role="alert" className="flex gap-3 rounded-card border border-danger/30 bg-danger/[0.05] px-5 py-4 text-[14.5px] text-ink">
                <CircleAlert size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
                <span>
                  <span className="font-medium">IFFI could not find your last payment ({last.transaction_id}).</span> {last.review_note}
                  <span className="mt-1 block text-muted">Check the details and send them again below.</span>
                </span>
              </p>
            )}

            {/* 1. the refund policy, accepted before the QR code appears */}
            <section aria-labelledby="policy-h" className={cn('rounded-card border bg-white p-5 sm:p-7', policyOk ? 'border-line' : 'border-gold/50 shadow-lift')}>
              <h2 id="policy-h" className="flex items-center gap-2 text-[1.2rem]">
                <ShieldCheck size={20} aria-hidden="true" className="text-gold-deep" /> 1. Refund policy
              </h2>
              <ul className="mt-4 space-y-2.5">
                {REFUND_POLICY.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[14.5px] text-ink">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              {policyOk ? (
                <p className="mt-4 flex items-center gap-2 text-[13.5px] text-muted">
                  <CircleCheck size={15} aria-hidden="true" className="text-good" /> You accepted this on {shortDate(app.refund_policy_accepted_at!)}.
                </p>
              ) : (
                <form action={acceptRefundPolicy} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={app.id} />
                  <input type="hidden" name="purpose" value={purpose} />
                  <label className="flex cursor-pointer gap-3 text-[14.5px] text-ink">
                    <input type="checkbox" name="accept" required className="mt-0.5 h-5 w-5 shrink-0 accent-navy" />I have read the refund policy and I accept it.
                  </label>
                  <SubmitButton variant="navy" pending="Saving…">
                    Accept and show the payment details
                  </SubmitButton>
                </form>
              )}
            </section>

            {policyOk && (
              <>
                {/* 2. how to pay */}
                <section aria-labelledby="pay-h" className="rounded-card border border-line bg-white p-5 sm:p-7">
                  <h2 id="pay-h" className="flex items-center gap-2 text-[1.2rem]">
                    <QrCode size={20} aria-hidden="true" className="text-gold-deep" /> 2. Pay {PURPOSE_LABEL[purpose].toLowerCase()}
                  </h2>
                  <div className="mt-5 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                      {settings.qrPath ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived link from a private bucket
                        <img src="/portal/payment-qr" alt="IFFI payment QR code" width={220} height={220} className="h-auto w-full max-w-[220px] rounded-2xl border border-line bg-white p-2" />
                      ) : (
                        <div className="grid aspect-square w-full max-w-[220px] place-items-center rounded-2xl border border-dashed border-navy/25 bg-paper p-4 text-center text-[13px] text-muted">
                          The QR code is not online yet. Ask your adviser on WhatsApp for the payment details.
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-navy p-4 text-mist">
                        <p className="text-[13px]">Amount to pay</p>
                        <p className="tabular mt-1 font-display text-[1.9rem] font-semibold leading-none text-gold-2">{due != null ? fmtMoney(due, 'USD') : 'Ask IFFI'}</p>
                        <p className="mt-2 text-[13px]">
                          {due != null ? `Paying in ${settings.currency}? Ask your adviser for the exact figure first.` : 'Your adviser confirms the exact amount on WhatsApp before you pay.'}
                        </p>
                      </div>
                      {details.length > 0 && (
                        <dl className="divide-y divide-line rounded-2xl border border-line">
                          {details.map(([k, v]) => (
                            <div key={k} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                              <dt className="text-[13px] text-muted">{k}</dt>
                              <dd className="tabular flex items-center gap-1 text-[14.5px] font-medium text-ink">
                                {v}
                                <CopyButton value={v} label={k} />
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <p className="flex flex-wrap items-center gap-x-1 rounded-xl bg-gold-soft/60 px-4 py-3 text-[14px] text-ink">
                        Write this reference in the payment note: <span className="tabular font-semibold text-navy">{ref}</span>
                        <CopyButton value={ref} label="reference" />
                      </p>
                      {settings.instructions && <p className="whitespace-pre-line text-[14px] text-muted">{settings.instructions}</p>}
                      {!paymentReady(settings) && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md')}>
                          <WhatsAppIcon size={18} /> Ask for the payment details
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. tell IFFI */}
                <section aria-labelledby="sent-h" className="rounded-card border border-gold/50 bg-white p-5 shadow-lift sm:p-7">
                  <h2 id="sent-h" className="text-[1.2rem]">
                    3. Send us the transaction details
                  </h2>
                  <p className="mt-1 mb-5 text-[14px] text-muted">From the confirmation screen in your banking app. Take a screenshot of it too.</p>
                  <PaymentForm appId={app.id} purpose={purpose} currencies={currencies} defaultCurrency={settings.currency} pendingProof={spare ? { id: spare.id, name: spare.file_name } : null} />
                </section>
              </>
            )}
          </>
        )}

        {payments.length > 0 && (
          <section aria-labelledby="hist-h" className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 id="hist-h" className="text-[1.1rem]">
              Your payments
            </h2>
            <ul className="mt-3 divide-y divide-line text-[14px]">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    {PURPOSE_LABEL[p.purpose]} · <span className="tabular">{fmtMoney(p.amount, p.currency)}</span> · <span className="tabular text-muted">{p.transaction_id}</span>
                  </span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-medium', p.status === 'verified' ? 'bg-good/10 text-good' : p.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-gold-soft text-gold-deep')}>
                    {PAYMENT_STATUS_LABEL[p.status]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </StepShell>
  );
}
