import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import EligibilityChecker from '@/views/EligibilityChecker';
import { JsonLd } from '@/components/ui/Seo';

export const metadata = pageMetadata({ ...site.seo.routes['/tools/eligibility-checker'], path: '/tools/eligibility-checker', keywords: routeKeywords('/tools/eligibility-checker') });

// breadcrumb JSON-LD is rendered here (server) so the client view does not ship the SEO helpers
const crumbs = [{ name: 'Tools', path: '/tools' }, { name: 'Eligibility checker', path: '/tools/eligibility-checker' }];

export default function Page() {
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <EligibilityChecker />
    </>
  );
}
