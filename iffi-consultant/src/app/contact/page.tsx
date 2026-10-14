import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Contact from '@/views/Contact';
import { JsonLd } from '@/components/ui/Seo';

export const metadata = pageMetadata({ ...site.seo.routes['/contact'], path: '/contact', keywords: routeKeywords('/contact') });

// breadcrumb JSON-LD is rendered here (server) so the client view does not ship the SEO helpers
const crumbs = [{ name: 'Contact', path: '/contact' }];

export default function Page() {
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <Contact />
    </>
  );
}
