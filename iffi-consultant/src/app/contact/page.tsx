import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Contact from '@/views/Contact';

export const metadata = pageMetadata({ ...site.seo.routes['/contact'], path: '/contact', keywords: routeKeywords('/contact') });

export default function Page() {
  return <Contact />;
}
