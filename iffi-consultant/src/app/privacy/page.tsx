import { site } from '@/data/content';
import { pageMetadata } from '@/lib/metadata';
import Privacy from '@/views/legal/Privacy';

export const metadata = pageMetadata({
  title: `Privacy Policy | ${site.brand.name}`,
  description: `How ${site.brand.name} collects, uses and protects the personal data you share with us.`,
  path: '/privacy',
});

export default function Page() {
  return <Privacy />;
}
