import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Home from '@/views/Home';

export const metadata = pageMetadata({ ...site.seo.routes['/'], path: '/', keywords: routeKeywords('/') });

export default function Page() {
  return <Home />;
}
