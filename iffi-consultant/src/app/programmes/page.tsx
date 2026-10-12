import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Finder from '@/views/Finder';

export const metadata = pageMetadata({ ...site.seo.routes['/programmes'], path: '/programmes', keywords: routeKeywords('/programmes') });

export default function Page() {
  return <Finder />;
}
