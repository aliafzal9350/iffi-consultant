import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Finder from '@/views/Finder';
import { JsonLd } from '@/components/ui/Seo';

export const metadata = pageMetadata({ ...site.seo.routes['/programmes'], path: '/programmes', keywords: routeKeywords('/programmes') });

// breadcrumb JSON-LD is rendered here (server) so the client view does not ship the SEO helpers
const crumbs = [{ name: 'Programme finder', path: '/programmes' }];

export default function Page() {
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <Finder />
    </>
  );
}
