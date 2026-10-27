import { Link } from '@/lib/router';
import { site } from '@/data/content';
import { SHOW_DRAFTS } from '@/lib/env';
import { DraftBadge } from '@/components/ui/primitives';
import { LegalPage } from './LegalPage';

export default function Privacy() {
  const l = site.legal;
  const contact = site.social.email ? <a href={site.social.email}>{site.contact.email}</a> : <a href={site.social.whatsapp}>WhatsApp {site.contact.phoneDisplay}</a>;
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      intro="How we collect, use and protect your personal data, including the documents you upload in the student portal, and the rights you have over it."
    >
      <h2>Who we are</h2>
      <p>
        This website and the student portal are run by {site.brand.name}
        {l.companyName ? `, operated by ${l.companyName}${l.registeredIn ? `, registered in ${l.registeredIn}` : ''}${l.companyNumber ? ` (company no. ${l.companyNumber})` : ''}` : ''}, with an
        offices in {site.contact.offices.map((o) => `${o.city} (${o.country})`).join(' and ')}. We are the controller of the personal data described here. Contact us about privacy at {contact}.
        {SHOW_DRAFTS && !l.companyName && <DraftBadge note={l.note} />}
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
          anonymisation, and by the Meta Pixel to measure our Facebook and Instagram adverts.
        </li>
      </ul>
      <p>
        Your shortlist, compare list, document checklist ticks, currency choice and eligibility-checker answers are stored only in your own browser. They are
        not sent to us unless you choose to send them on WhatsApp.
      </p>

      <h3>In the student portal</h3>
      <ul>
        <li>
          <strong>Your account:</strong> when you sign in with Google, Google gives us your name, email address and profile photo. We never see your Google
          password.
        </li>
        <li>
          <strong>Your profile:</strong> the answers to the profile questions (what you want to study, your results, English and Chinese tests, budget, country)
          and your WhatsApp number.
        </li>
        <li>
          <strong>Your application form:</strong> your name as in your passport, passport number and expiry date, date and place of birth, nationality,
          addresses, education and work history, family members and your financial guarantor.
        </li>
        <li>
          <strong>Documents you upload:</strong> for example your passport, photo, certificates and transcripts, police clearance, bank statement and the medical
          examination form with your test results. The medical form is health data, which the law treats as especially sensitive.
        </li>
        <li>
          <strong>Payments:</strong> the amount, currency, transaction ID, payment date and the screenshot you upload. We do not receive your card number or your
          banking app login.
        </li>
        <li>
          <strong>Your signature and choices:</strong> the name you type to sign the declaration, the date you signed and the version of the refund policy you
          accepted.
        </li>
        <li>
          <strong>The history of your application:</strong> when you finish a step, upload or replace a file, and the status changes and notes from IFFI.
        </li>
      </ul>

      <h2>How and why we use it</h2>
      <ul>
        <li>To answer your questions and give you counselling (legitimate interests, or steps you ask us to take before a contract).</li>
        <li>To check your documents and prepare and submit the admission, scholarship and visa applications you ask us to make (contract).</li>
        <li>To email you about your application, for example a new status or a file we need. These are service messages, not marketing (contract).</li>
        <li>
          To use your medical examination form only for your application and student visa, because universities and the visa process require it (your
          explicit consent, which you give when you upload it and can withdraw by asking us to delete it).
        </li>
        <li>To understand which pages help students and improve the site (consent, for analytics).</li>
        <li>To meet legal, tax and accounting obligations (legal obligation).</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>You, when you are signed in to your own account.</li>
        <li>
          {site.brand.name} advisers. Only team members we approve can open applications, each with their own account, and changes to your application are
          recorded in its history.
        </li>
        <li>Universities, scholarship bodies and visa authorities, only for the applications you ask us to make.</li>
        <li>
          Service providers that run the website and portal for us: Supabase (database and file storage), Google (sign-in, and Gmail for our emails), our
          hosting provider, WhatsApp (Meta) and, if you accept analytics, Google Analytics and the Meta Pixel.
        </li>
        <li>
          Google Gemini, in two places only: the question box sends your question to write an answer, and the portal sends your profile answers (study level,
          subject, age, test scores and budget, never your name or contact details) to explain why a programme fits you.
        </li>
        <li>Authorities, where the law requires it.</li>
      </ul>
      <p>We never sell your personal data.</p>

      <h2>How we protect it</h2>
      <ul>
        <li>Your documents are kept in private storage. They open only for you and approved advisers, through links that stop working after a few minutes.</li>
        <li>Each person can see only their own account and applications; the database itself enforces this.</li>
        <li>Everything is sent over encrypted connections (HTTPS).</li>
      </ul>
      <p>Please do not send passport or ID numbers in the question box or the contact form.</p>

      <h2>International transfers</h2>
      <p>
        Applications to Chinese universities mean your data is sent to China. The student portal stores your account, answers and documents with Supabase on
        servers in Japan, and our team works from Pakistan and China. We only send what an application needs.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiries for as long as we need to answer them and for up to two years afterwards. If you apply through the portal, we keep your account,
        application and documents while your application is active and for as long as needed to support your studies and visa, and to meet legal and
        accounting requirements. Then we delete them. You can ask us to delete your account and documents earlier at any time: we will do so unless the law
        requires us to keep a record, for example of a payment.
      </p>

      <h2>Your rights</h2>
      <p>Depending on where you live, data protection law gives you the right to ask us to:</p>
      <ul>
        <li>give you a copy of your personal data</li>
        <li>correct data that is wrong or incomplete</li>
        <li>delete your data, or restrict how we use it</li>
        <li>stop using your data for a purpose you object to</li>
        <li>send your data to you or another organisation in a portable format</li>
      </ul>
      <p>
        Where we rely on consent, such as analytics or your medical form, you can withdraw it at any time; for analytics, use the <Link to="/cookies">Cookie Policy</Link> page.
        Contact us at {contact} to use any of these rights. If you are unhappy with our answer you can complain to the data protection authority in your country.
      </p>

      <h2>Changes to this policy</h2>
      <p>We will update this page when our practices change. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
