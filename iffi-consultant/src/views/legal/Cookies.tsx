'use client';
import { Link } from '@/lib/router';
import { site } from '@/data/core';
import { GA4_ID } from '@/lib/env';
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
              <td>gj:checklist, gj:currency</td>
              <td>Document ticks and your currency</td>
              <td>Until you clear it</td>
            </tr>
            <tr>
              <td>gj:compare, gj:eligibility, gj:fx</td>
              <td>Compare list, eligibility answers, exchange rates</td>
              <td>Until you close the tab</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Analytics cookies (only with your consent)</h2>
      <p>
        {GA4_ID ? 'We use' : 'If enabled, we use'} Google Analytics 4 to count visits and see which pages help students. It sets cookies named _ga and _ga_
        followed by an ID, kept for up to 2 years. IP addresses are anonymised.
      </p>

      <h2>Other services</h2>
      <ul>
        <li>Fonts are served from this website itself; no request goes to Google Fonts.</li>
        <li>The cost calculator loads exchange rates from a public currency service; no personal data is sent.</li>
        <li>WhatsApp, Facebook and Instagram links take you to those services, where their own cookie policies apply.</li>
      </ul>

      <h2>Questions</h2>
      <p>
        Contact us on {site.social.email ? <a href={site.social.email}>{site.contact.email}</a> : <a href={site.social.whatsapp}>WhatsApp {site.contact.phoneDisplay}</a>} or read our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
