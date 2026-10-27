'use client';
import { Link } from '@/lib/router';
import { site } from '@/data/core';
import { GA4_ID, META_PIXEL_ID } from '@/lib/env';
import { Button } from '@/components/ui/Button';
import { OPEN_CONSENT_EVENT } from '@/components/layout/CookieConsent';
import { LegalPage } from './LegalPage';

export default function Cookies() {
  return (
    <LegalPage
      path="/cookies"
      title="Cookie Policy"
      intro="What this site stores in your browser, and how to change your choice at any time."
    >
      <h2>Your choice</h2>
      <p>
        Analytics runs only after you click Accept in the cookie banner. If you reject it, or ignore the banner, no analytics cookies are set. Your choice is
        remembered for 12 months.
      </p>
      <p className="not-prose">
        <Button variant="navy" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
          Change cookie settings
        </Button>
      </p>

      <h2>Essential storage</h2>
      <p>These keep the site working and never leave your browser:</p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Purpose</th>
              <th scope="col">Kept for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>gj:consent</td>
              <td>Your cookie choice</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td>gj:shortlist</td>
              <td>Programmes you saved</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td>gj:checklist</td>
              <td>Document ticks</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td>gj:compare, gj:eligibility</td>
              <td>Compare list, eligibility answers</td>
              <td>Until you close the tab</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Student portal sign-in</h2>
      <p>
        When you sign in to the student portal with Google, we set cookies whose names start with <code>sb-</code> and end in <code>auth-token</code>. They keep
        you signed in and are strictly necessary, so they do not need your consent. They are set only after you sign in, are removed when you sign out, and
        expire on their own if you stay away. While you answer the profile questions, your answers are kept in your browser tab (<code>gj:portal-quiz</code>) so
        a refresh does not lose them.
      </p>

      <h2>Analytics cookies (only with your consent)</h2>
      <p>
        {GA4_ID ? 'We use' : 'If enabled, we use'} Google Analytics 4 to count visits and see which pages help students. It sets cookies named _ga and _ga_
        followed by an ID, kept for up to 2 years. IP addresses are anonymised.
      </p>
      {META_PIXEL_ID && (
        <p>
          We also use the Meta Pixel to measure visits that come from our Facebook and Instagram adverts. It sets a cookie named _fbp, kept for up to 90 days,
          and tells Meta which pages you visit and when you send us an enquiry, message us on WhatsApp, create an account or start an application (never what you wrote).
        </p>
      )}

      <h2>Other services</h2>
      <ul>
        <li>Fonts are served from this website itself; no request goes to Google Fonts.</li>
        <li>WhatsApp, WeChat, Facebook and Instagram links take you to those services, where their own cookie policies apply.</li>
      </ul>

      <h2>Questions</h2>
      <p>
        Contact us on {site.social.email ? <a href={site.social.email}>{site.contact.email}</a> : <a href={site.social.whatsapp}>WhatsApp {site.contact.phoneDisplay}</a>} or read our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
