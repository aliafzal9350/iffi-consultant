import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import About from '@/views/About';

export const metadata = pageMetadata({ ...site.seo.routes['/about'], path: '/about', keywords: routeKeywords('/about') });

export default function Page() {
  return <About />;
}
