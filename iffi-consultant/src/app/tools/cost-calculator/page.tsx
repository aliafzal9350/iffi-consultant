import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import CostCalculator from '@/views/CostCalculator';
import { JsonLd } from '@/components/ui/Seo';

export const metadata = pageMetadata({ ...site.seo.routes['/tools/cost-calculator'], path: '/tools/cost-calculator', keywords: routeKeywords('/tools/cost-calculator') });

// breadcrumb JSON-LD is rendered here (server) so the client view does not ship the SEO helpers
const crumbs = [{ name: 'Tools', path: '/tools' }, { name: 'Cost calculator', path: '/tools/cost-calculator' }];

export default function Page() {
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <CostCalculator />
    </>
  );
}
