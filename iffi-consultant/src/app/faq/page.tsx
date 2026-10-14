import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import Faq from '@/views/Faq';
import { JsonLd } from '@/components/ui/Seo';
import { faqLd } from '@/lib/seo';

export const metadata = pageMetadata({ ...site.seo.routes['/faq'], path: '/faq', keywords: routeKeywords('/faq') });

// breadcrumb JSON-LD is rendered here (server) so the client view does not ship the SEO helpers
const crumbs = [{ name: 'FAQ', path: '/faq' }];

export default function Page() {
  return (
    <>
      <JsonLd crumbs={crumbs} data={[faqLd(site.faq.filter((f) => f.status === 'published'))]} />
      <Faq faq={site.faq} />
    </>
  );
}
