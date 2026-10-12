import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import EligibilityChecker from '@/views/EligibilityChecker';

export const metadata = pageMetadata({ ...site.seo.routes['/tools/eligibility-checker'], path: '/tools/eligibility-checker', keywords: routeKeywords('/tools/eligibility-checker') });

export default function Page() {
  return <EligibilityChecker />;
}
