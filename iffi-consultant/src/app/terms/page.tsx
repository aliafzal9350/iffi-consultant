import { site } from '@/data/content';
import { pageMetadata } from '@/lib/metadata';
import Terms from '@/views/legal/Terms';

export const metadata = pageMetadata({
  title: `Terms & Conditions | ${site.brand.name}`,
  description: `Terms of use for this website and for consultancy services from ${site.brand.name}.`,
  path: '/terms',
});

export default function Page() {
  return <Terms />;
}
