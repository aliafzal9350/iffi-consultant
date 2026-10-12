import type { Metadata } from 'next';
import Blog from '@/views/Blog';
import { site } from '@/data';

export const metadata: Metadata = {
  title: site.seo.routes['/blog'].title,
  description: site.seo.routes['/blog'].description,
  alternates: {
    canonical: 'https://www.iffiglobal.com/blog',
  },
};

export default function Page() {
  return <Blog />;
}
