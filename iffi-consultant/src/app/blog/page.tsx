import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Blog from '@/views/Blog';

export const metadata = pageMetadata({ ...site.seo.routes['/blog'], path: '/blog', keywords: routeKeywords('/blog') });

export default function Page() {
  return <Blog />;
}
