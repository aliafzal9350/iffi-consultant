import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Faq from '@/views/Faq';

export const metadata = pageMetadata({ ...site.seo.routes['/faq'], path: '/faq', keywords: routeKeywords('/faq') });

export default function Page() {
  return <Faq />;
}
