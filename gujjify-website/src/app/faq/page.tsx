import type { Metadata } from 'next';
import Faq from '@/views/Faq';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/faq'].title,
  description: site.seo.routes['/faq'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/faq',
  },
};

export default function Page() {
  return <Faq />;
}
