import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import CostCalculator from '@/views/CostCalculator';

export const metadata = pageMetadata({ ...site.seo.routes['/tools/cost-calculator'], path: '/tools/cost-calculator', keywords: routeKeywords('/tools/cost-calculator') });

export default function Page() {
  return <CostCalculator />;
}
