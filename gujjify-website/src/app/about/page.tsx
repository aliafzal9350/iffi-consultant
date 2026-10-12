import type { Metadata } from 'next';
import About from '@/views/About';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/about'].title,
  description: site.seo.routes['/about'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/about',
  },
};

export default function Page() {
  return <About />;
}
