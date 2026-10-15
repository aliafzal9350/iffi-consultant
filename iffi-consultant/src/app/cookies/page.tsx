import { site } from '@/data/content';
import { pageMetadata } from '@/lib/metadata';
import Cookies from '@/views/legal/Cookies';

export const metadata = pageMetadata({
  title: `Cookie Policy | ${site.brand.name}`,
  description: `How ${site.brand.name} uses cookies and browser storage on this website: what each one does, how long it lasts and how to say no to analytics.`,
  path: '/cookies',
});

export default function Page() {
  return <Cookies />;
}
