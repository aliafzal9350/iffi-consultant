import { site } from '@/data/content';
import { pageMetadata } from '@/lib/metadata';
import Testimonials from '@/views/Testimonials';

export const metadata = pageMetadata({ ...site.seo.routes['/testimonials'], path: '/testimonials' });

export default function Page() {
  return <Testimonials />;
}
