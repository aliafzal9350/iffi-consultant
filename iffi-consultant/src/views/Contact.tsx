'use client';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/router';
import { CircleCheck, Mail, MapPin, Phone } from 'lucide-react';
import { site, whatsappLink } from '@/data/core';
import { cn } from '@/lib/cn';
import { FORM_ENDPOINT, SHOW_DRAFTS } from '@/lib/env';
import { LEVEL_LABEL, LEVEL_ORDER } from '@/lib/programs';
import { CURRENCIES } from '@/lib/currency';
import { track } from '@/lib/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, DraftBadge } from '@/components/ui/primitives';
import { Field, Select, inputClass } from '@/components/ui/Form';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { FacebookIcon, InstagramIcon, WeChatIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';

const crumbs = [{ name: 'Contact', path: '/contact' }];
const COUNTRIES = CURRENCIES.filter((c) => !['USD', 'GBP', 'EUR', 'CNY'].includes(c.code)).sort((a, b) => a.country.localeCompare(b.country));

interface FormState {
  name: string;
  email: string;
  phone: string;
  country: string;
  level: string;
  message: string;
  consent: boolean;
  website: string; // honeypot
}
const EMPTY: FormState = { name: '', email: '', phone: '', country: 'Pakistan', level: '', message: '', consent: false, website: '' };

function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.message.trim().length < 10) e.message = 'Tell us a little more (at least 10 characters).';
  if (!f.consent) e.consent = 'Please agree so we can reply to you.';
  return e;
}

export default function Contact() {
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'whatsapp' | 'error'>('idle');
  const set = (patch: Partial<FormState>) => setF((cur) => ({ ...cur, ...patch }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`cf-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    if (f.website) {
      setStatus('sent'); // bots fill the hidden field; pretend success
      return;
    }
    const payload = {
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      country: f.country,
      level: f.level,
      message: f.message.trim(),
      source: `${site.seo.siteUrl.replace('https://', '')}/contact`,
    };
    if (FORM_ENDPOINT) {
      setStatus('sending');
      try {
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        setStatus('sent');
        track('contact_form_sent');
        setF(EMPTY);
      } catch {
        setStatus('error');
      }
      return;
    }
    const text = [
      `Hello ${site.brand.name}, I am ${payload.name}${payload.country ? ` from ${payload.country}` : ''}.`,
      payload.level ? `I am interested in ${LEVEL_LABEL[payload.level] ?? payload.level} study in China.` : '',
      payload.message,
      `Email: ${payload.email}${payload.phone ? `, phone: ${payload.phone}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener');
    track('contact_form_whatsapp');
    setStatus('whatsapp');
  };

  const err = (k: keyof FormState) => errors[k];

  return (
    <>
      <PageHeader crumbs={crumbs} title={`Contact ${site.brand.name}`} lede="Free counselling for studying in China. WhatsApp is the fastest way to reach us." />

      <Container className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-card bg-navy p-7 text-mist">
              <WhatsAppIcon size={34} className="relative text-whatsapp" />
              <h2 className="relative mt-4 text-h3 text-white">Chat on WhatsApp</h2>
              <p className="relative mt-2">{site.contact.responsePromise}</p>
              <p className="relative mt-1 text-sm text-gold-2">{site.contact.hours.replace(' on WhatsApp', '')}</p>
              <WhatsAppButton messageKey="default" size="lg" className="relative mt-6">
                {site.contact.phoneDisplay}
              </WhatsAppButton>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              <li>
                <a href={site.social.phone} className="flex h-full items-start gap-3 rounded-card border border-line bg-white p-5 hover:border-navy/30">
                  <Phone size={20} aria-hidden="true" className="mt-0.5 text-gold-deep" />
                  <span>
                    <span className="block font-medium text-navy">Call us</span>
                    <span className="text-[15px] text-muted">{site.contact.phoneDisplay}</span>
                  </span>
                </a>
              </li>
              {site.social.email && (
                <li>
                  <a href={site.social.email} className="flex h-full items-start gap-3 rounded-card border border-line bg-white p-5 hover:border-navy/30">
                    <Mail size={20} aria-hidden="true" className="mt-0.5 text-gold-deep" />
                    <span>
                      <span className="block font-medium text-navy">Email</span>
                      <span className="break-all text-[15px] text-muted">{site.contact.email}</span>
                    </span>
                  </a>
                </li>
              )}
            </ul>

            {(site.social.facebook || site.social.instagram) && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {site.social.facebook && (
                  <li>
                    <a
                      href={site.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-full items-start gap-3 rounded-card border border-line bg-white p-5 transition-colors hover:border-navy/30"
                    >
                      <FacebookIcon size={20} className="mt-0.5 text-navy transition-colors group-hover:text-gold-deep" />
                      <span>
                        <span className="block font-medium text-navy">Facebook</span>
                        <span className="text-[15px] text-muted">Official page &amp; updates</span>
                      </span>
                    </a>
                  </li>
                )}
                {site.social.instagram && (
                  <li>
                    <a
                      href={site.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-full items-start gap-3 rounded-card border border-line bg-white p-5 transition-colors hover:border-navy/30"
                    >
                      <InstagramIcon size={20} className="mt-0.5 text-navy transition-colors group-hover:text-gold-deep" />
                      <span>
                        <span className="block font-medium text-navy">Instagram</span>
                        <span className="text-[15px] text-muted">@ifficonsultant</span>
                      </span>
                    </a>
                  </li>
                )}
              </ul>
            )}

            {/* WeChat lives on this page only: the QR code is never shown on the home page */}
            <section id="wechat" aria-labelledby="wechat-h" className="scroll-mt-28 rounded-card border border-line bg-white p-5">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
                <a href={site.contact.wechat.qrImage} target="_blank" rel="noopener" className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  <Image
                    src={site.contact.wechat.qrImage}
                    width={888}
                    height={1191}
                    sizes="200px"
                    alt={`WeChat QR code to add ${site.brand.name}`}
                    className="h-auto w-[200px] rounded-xl border border-line"
                  />
                </a>
                <div>
                  <h2 id="wechat-h" className="flex items-center justify-center gap-2 font-display text-xl sm:justify-start">
                    <WeChatIcon size={22} className="text-gold-deep" /> Add us on WeChat
                  </h2>
                  <p className="mt-2 text-[15px] text-muted">{site.contact.wechat.note} Already in China? WeChat is the quickest way to reach us there.</p>
                  <p className="mt-2 text-[13.5px] text-muted">On your phone, open the QR code, save it, then choose Scan in WeChat and pick it from your photos.</p>
                </div>
              </div>
            </section>

            <div className="rounded-card border border-line bg-white p-5">
              <h2 className="font-display text-xl">Offices</h2>
              <ul className="mt-3 space-y-3 text-[15px]">
                <li className="flex gap-3">
                  <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
                  <span>
                    <strong className="font-medium text-navy">Lahore, Pakistan</strong>
                    <span className="block text-muted">Visits by appointment: message us on WhatsApp.</span>
                  </span>
                </li>
                {site.contact.offices
                  .filter((o) => o.verified || SHOW_DRAFTS)
                  .map((o) => (
                    <li key={o.label} className="flex gap-3">
                      <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
                      <span>
                        <strong className="font-medium text-navy">{o.label}</strong>
                        {!o.verified && <DraftBadge note={o.note} />}
                        <span className="block text-muted">{o.address ?? 'To be confirmed'}</span>
                      </span>
                    </li>
                  ))}
              </ul>
              {(site.social.facebook || site.social.instagram) && (
                <div className="mt-5 flex gap-2 border-t border-line pt-4">
                  {site.social.facebook && (
                    <a href={site.social.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-navy hover:border-navy/40">
                      <FacebookIcon size={18} />
                    </a>
                  )}
                  {site.social.instagram && (
                    <a href={site.social.instagram} target="_blank" rel="noopener" aria-label="Instagram" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-navy hover:border-navy/40">
                      <InstagramIcon size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-h3">Send us a message</h2>
            <p className="mt-1 text-[15px] text-muted">
              {FORM_ENDPOINT ? 'We reply by email or WhatsApp.' : 'Your message opens in WhatsApp, ready to send.'}
            </p>

            {status === 'sent' ? (
              <div role="status" className="mt-8 rounded-xl border border-good/30 bg-good/10 p-6">
                <CircleCheck size={24} aria-hidden="true" className="text-good" />
                <p className="mt-3 font-medium text-navy">Message sent</p>
                <p className="mt-1 text-[15px] text-ink/80">Thank you. We will reply soon, usually the same day.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setStatus('idle')}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field id="cf-name" label="Name" required error={err('name')}>
                  {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} aria-invalid={!!err('name')} autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />}
                </Field>
                <Field id="cf-email" label="Email" required error={err('email')}>
                  {({ id, describedBy }) => (
                    <input id={id} type="email" aria-describedby={describedBy} aria-invalid={!!err('email')} autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} />
                  )}
                </Field>
                <Field id="cf-phone" label="Phone or WhatsApp">
                  {({ id, describedBy }) => <input id={id} type="tel" aria-describedby={describedBy} autoComplete="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} />}
                </Field>
                <Field id="cf-country" label="Country">
                  {({ id }) => (
                    <Select id={id} value={f.country} onChange={(e) => set({ country: e.target.value })}>
                      {COUNTRIES.map((c) => (
                        <option key={c.countryCode} value={c.country}>
                          {c.country}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </Select>
                  )}
                </Field>
                <Field id="cf-level" label="Study level" className="sm:col-span-2">
                  {({ id }) => (
                    <Select id={id} value={f.level} onChange={(e) => set({ level: e.target.value })}>
                      <option value="">Not sure yet</option>
                      {LEVEL_ORDER.map((l) => (
                        <option key={l} value={l}>
                          {LEVEL_LABEL[l]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field id="cf-message" label="Message" required error={err('message')} className="sm:col-span-2">
                  {({ id, describedBy }) => (
                    <textarea
                      id={id}
                      rows={5}
                      aria-describedby={describedBy}
                      aria-invalid={!!err('message')}
                      value={f.message}
                      onChange={(e) => set({ message: e.target.value })}
                      className={cn(inputClass, 'py-3')}
                      placeholder="Your marks, the programme you want and any questions"
                    />
                  )}
                </Field>
                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set({ website: e.target.value })} />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 text-[14.5px]">
                    <input
                      id="cf-consent"
                      type="checkbox"
                      checked={f.consent}
                      onChange={(e) => set({ consent: e.target.checked })}
                      aria-describedby={err('consent') ? 'cf-consent-err' : undefined}
                      aria-invalid={!!err('consent')}
                      className="mt-1 h-5 w-5 shrink-0 accent-navy"
                    />
                    <span>
                      I agree that {site.brand.name} may use these details to reply to me, as described in the{' '}
                      <Link to="/privacy" className="text-navy underline decoration-gold underline-offset-2">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {err('consent') && (
                    <p id="cf-consent-err" className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
                      {err('consent')}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="navy" size="lg" disabled={status === 'sending'} className="w-full sm:w-auto">
                    {status === 'sending' ? 'Sending…' : FORM_ENDPOINT ? 'Send message' : 'Continue in WhatsApp'}
                  </Button>
                  {status === 'error' && (
                    <p role="alert" className="mt-3 text-sm font-medium text-danger">
                      The message could not be sent. Please try again, or message us on WhatsApp.
                    </p>
                  )}
                  {status === 'whatsapp' && (
                    <p role="status" className="mt-3 text-sm text-ink">
                      WhatsApp opened in a new tab with your message. Press send there to reach us.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
