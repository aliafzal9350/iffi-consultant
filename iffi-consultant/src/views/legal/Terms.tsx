import { Link } from '@/lib/router';
import { site } from '@/data/content';
import { SHOW_DRAFTS } from '@/lib/env';
import { DraftBadge } from '@/components/ui/primitives';
import { LegalPage } from './LegalPage';

export default function Terms() {
  const l = site.legal;
  return (
    <LegalPage
      path="/terms"
      title="Terms of Service"
      intro="The rules for using this website and our free tools."
    >
      <h2>About these terms</h2>
      <p>
        This website is run by {site.brand.name}
        {l.companyName ? ` (${l.companyName}${l.companyNumber ? `, company no. ${l.companyNumber}` : ''})` : ''}. By using the site you accept these terms. If we
        provide paid services, we agree separate written terms with you first.
      </p>

      <h2>Information only</h2>
      <p>
        Programme details on this site come from university brochures for the 2024 and 2025 intakes. Fees, scholarships, requirements and deadlines change every
        year, so treat them as a guide and confirm the current details with us before you apply. University names are shared during your consultation.
      </p>

      <h2>No guarantee of admission, scholarship or visa</h2>
      <p>
        Universities, scholarship bodies and visa authorities make their own decisions. We help you prepare a strong, complete application, but we cannot
        promise any admission, scholarship or visa outcome.
      </p>

      <h2>Our free tools</h2>
      <ul>
        <li>The cost calculator gives estimates. Living costs are typical student budgets, and every amount is in RMB.</li>
        <li>The eligibility checker is indicative only. It is not an admission or scholarship decision.</li>
        <li>The programme finder lists programmes from our current brochures. Availability is not guaranteed.</li>
      </ul>

      <h2>Your responsibilities</h2>
      <p>
        Please give us accurate information and genuine documents. We cannot submit applications based on false or altered documents, and doing so can lead to
        rejection or cancellation by the university or authorities.
      </p>

      <h2>Links and third parties</h2>
      <p>
        We link to WhatsApp, social networks and other websites we do not control. Their own terms and privacy policies apply when you use them.
      </p>

      <h2>Content and trade marks</h2>
      <p>
        The text, design, logo and tools on this site belong to {l.companyName}. You may share links and print pages for personal use, but not copy the site or
        its data for commercial use without our permission.
      </p>

      <h2>Liability</h2>
      <p>
        We take care to keep the site accurate and available, but it is provided as it is. As far as the law allows, we are not liable for losses caused by
        relying on general information on the site. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      {SHOW_DRAFTS && (
        <>
          <h2>Law</h2>
          <p>
            Governing law to be confirmed by the client. <DraftBadge note={l.note} />
          </p>
        </>
      )}

      <h2>Contact</h2>
      <p>
        Questions about these terms: {site.social.email ? <a href={site.social.email}>{site.contact.email}</a> : <a href={site.social.whatsapp}>WhatsApp {site.contact.phoneDisplay}</a>}. See also our <Link to="/privacy">Privacy Policy</Link> and{' '}
        <Link to="/cookies">Cookie Policy</Link>.
      </p>
    </LegalPage>
  );
}
