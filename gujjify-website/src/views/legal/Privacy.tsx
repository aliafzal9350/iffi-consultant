'use client';
import { Link } from '@/lib/router';
import { site } from '@/data';
import { LegalPage } from './LegalPage';

export default function Privacy() {
  const l = site.legal;
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      seoTitle="Privacy Policy | IFFI Global Education Consultants"
      description="How IFFI Global Education Consultants Ltd collects, uses and protects your personal data when you use iffiglobal.com, our tools and WhatsApp, and your rights under UK GDPR."
      intro="How we collect, use and protect your personal data, and the rights you have over it."
    >
      <h2>Who we are</h2>
      <p>
        This website is run by {l.companyName}, trading as {site.brand.name}, a company registered in {l.registeredIn} (company no. {l.companyNumber}). Registered
        office: {l.registeredOffice}. We are the controller of the personal data described here. Contact us about privacy at{' '}
        <a href={site.social.email}>{site.contact.email}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Contact form:</strong> your name, email address, phone or WhatsApp number, country, study level and message.
        </li>
        <li>
          <strong>WhatsApp, phone and email:</strong> the details and documents you choose to send us, such as your marks, passport details and certificates
          when we help with an application.
        </li>
        <li>
          <strong>Your cookie choice:</strong> whether you accepted or rejected analytics.
        </li>
        <li>
          <strong>Analytics, only if you accept:</strong> pages visited, device and browser type and an approximate location, collected by Google Analytics with IP
          anonymisation.
        </li>
      </ul>
      <p>
        Your shortlist, compare list, document checklist ticks, currency choice and eligibility-checker answers are stored only in your own browser. They are
        not sent to us unless you choose to send them on WhatsApp.
      </p>

      <h2>How and why we use it</h2>
      <ul>
        <li>To answer your questions and give you counselling (legitimate interests, or steps you ask us to take before a contract).</li>
        <li>To prepare and submit admission, scholarship and visa applications you ask us to make (contract).</li>
        <li>To understand which pages help students and improve the site (consent, for analytics).</li>
        <li>To meet legal, tax and accounting obligations (legal obligation).</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li>Universities, scholarship bodies and visa authorities, only for applications you ask us to make.</li>
        <li>Service providers that help us run the business, such as email, hosting, WhatsApp (Meta) and, if you accept analytics, Google.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
      <p>We never sell your personal data.</p>

      <h2>International transfers</h2>
      <p>
        Applications to Chinese universities mean your data is sent to China, and our team works from the United Kingdom and Pakistan. Where data leaves the
        UK we take steps to protect it, and we only send what an application needs.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiries for as long as we need to answer them and for up to two years afterwards. If you become a client, we keep your application file for
        as long as needed to support your studies and to meet legal and accounting requirements, then delete it.
      </p>

      <h2>Your rights</h2>
      <p>Under UK data protection law you can ask us to:</p>
      <ul>
        <li>give you a copy of your personal data</li>
        <li>correct data that is wrong or incomplete</li>
        <li>delete your data, or restrict how we use it</li>
        <li>stop using your data for a purpose you object to</li>
        <li>send your data to you or another organisation in a portable format</li>
      </ul>
      <p>
        Where we rely on consent, such as analytics, you can withdraw it at any time on the <Link to="/cookies">Cookie Policy</Link> page. Email{' '}
        <a href={site.social.email}>{site.contact.email}</a> to use any of these rights. If you are unhappy with our answer you can complain to the UK Information
        Commissioner&apos;s Office at <a href="https://ico.org.uk">ico.org.uk</a>.
      </p>

      <h2>Changes to this policy</h2>
      <p>We will update this page when our practices change. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
