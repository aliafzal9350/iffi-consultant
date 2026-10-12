import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Services from '@/views/Services';

export const metadata = pageMetadata({ ...site.seo.routes['/services'], path: '/services', keywords: routeKeywords('/services') });

export default function Page() {
  return <Services />;
}
