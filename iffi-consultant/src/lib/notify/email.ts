/**
 * Emails from IFFI: service messages to students (a new status, a file to replace, a payment checked) and alerts to
 * the IFFI inbox (a new application, a payment to check). Sent over SMTP, by default Gmail with an app password for
 * ifficonsultant@gmail.com, so it works on any host and costs nothing.
 *
 * Mail goes out after the response (next/server `after`), so a slow mail server never slows down a click. Without
 * SMTP_USER and SMTP_PASS nothing is sent and the portal works exactly the same.
 */
import 'server-only';
import { after } from 'next/server';
import nodemailer, { type Transporter } from 'nodemailer';
import { site } from '@/data/content';
import { SITE_URL } from '@/lib/seo';

export interface Mail {
  to: string;
  subject: string;
  /** first line inside the email, e.g. "Hello Ali," */
  greeting?: string;
  heading: string;
  paragraphs: string[];
  /** a message from an IFFI adviser, shown in a highlighted box */
  note?: string | null;
  cta?: { label: string; url: string };
}

function config() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    transport: { host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } },
    from: process.env.MAIL_FROM || `${site.brand.name} <${user}>`,
  };
}

/** Where IFFI's own alerts go: STAFF_NOTIFY_EMAIL, else the public contact address. */
export const staffInbox = () => process.env.STAFF_NOTIFY_EMAIL || site.contact.email || process.env.SMTP_USER || null;

/** The site's address for links in emails. APP_URL wins (a preview or local URL while the domain is not live). */
export function appUrl(path: string): string {
  const base = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : SITE_URL);
  return `${base.replace(/\/$/, '')}${path}`;
}

let transporter: Transporter | null = null;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(m: Mail): string {
  const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1d2738">${esc(t)}</p>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f8fc;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fc;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7eaf1">
<tr><td style="background:#0d1f3f;padding:20px 28px;border-bottom:3px solid #c8a24c">
<span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px">IFFI</span>
<span style="font-size:11px;color:#e0bd6b;letter-spacing:3px;margin-left:6px">CONSULTANT</span></td></tr>
<tr><td style="padding:28px">
${m.greeting ? p(m.greeting) : ''}
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:21px;line-height:1.3;color:#0d1f3f">${esc(m.heading)}</h1>
${m.paragraphs.map(p).join('')}
${m.note ? `<div style="margin:6px 0 18px;padding:14px 16px;background:#f7efdd;border-left:3px solid #c8a24c;border-radius:8px;font-size:15px;line-height:1.6;color:#1d2738;white-space:pre-line">${esc(m.note)}</div>` : ''}
${m.cta ? `<a href="${esc(m.cta.url)}" style="display:inline-block;margin-top:6px;padding:12px 22px;background:#c8a24c;color:#0d1f3f;text-decoration:none;font-weight:bold;font-size:15px;border-radius:999px">${esc(m.cta.label)}</a>` : ''}
</td></tr>
<tr><td style="padding:18px 28px;background:#f6f8fc;font-size:12.5px;line-height:1.6;color:#5f6779">
${esc(site.brand.name)} · WhatsApp ${esc(site.contact.phoneDisplay)}${site.contact.email ? ` · ${esc(site.contact.email)}` : ''}<br>
You receive this email because you have an account in the ${esc(site.brand.name)} student portal.
</td></tr></table></td></tr></table></body></html>`;
}

function text(m: Mail): string {
  return [m.greeting, m.heading, '', ...m.paragraphs, m.note ? `\nMessage from IFFI:\n${m.note}\n` : '', m.cta ? `${m.cta.label}: ${m.cta.url}` : '', '', `${site.brand.name} · WhatsApp ${site.contact.phoneDisplay}`]
    .filter((x) => x !== undefined)
    .join('\n');
}

/** The finished email (for previews and tests). */
export const renderEmail = (m: Mail) => ({ html: html(m), text: text(m) });

async function send(m: Mail): Promise<void> {
  const c = config();
  if (!c) {
    console.info('[email] SMTP_USER / SMTP_PASS not set, not sent:', m.subject);
    return;
  }
  try {
    transporter ??= nodemailer.createTransport(c.transport);
    await transporter.sendMail({ from: c.from, to: m.to, replyTo: site.contact.email ?? undefined, subject: m.subject, text: text(m), html: html(m) });
  } catch (e) {
    console.error('[email] could not send', m.subject, e instanceof Error ? e.message : e);
  }
}

/**
 * Build and send emails once the response has been sent: the lookups (student's address, programme) happen there
 * too, so the person who clicked never waits. Never throws.
 */
export function sendLater(build: () => Promise<Mail | null | (Mail | null)[]>): void {
  after(async () => {
    try {
      const built = await build();
      for (const m of (Array.isArray(built) ? built : [built]).filter((x): x is Mail => Boolean(x?.to))) await send(m);
    } catch (e) {
      console.error('[email] could not prepare', e instanceof Error ? e.message : e);
    }
  });
}
