import { site } from '@/data/content';
import { routeKeywords } from '@/data/keywords';
import { pageMetadata } from '@/lib/metadata';
import ToolsHub from '@/views/ToolsHub';

export const metadata = pageMetadata({
  title: `Study in China Tools: Finder, Cost & CSC Check | ${site.brand.name}`,
  description:
    'Three free tools for studying in China: a university and programme finder, a cost calculator in 40+ currencies and a CSC scholarship eligibility checker.',
  path: '/tools',
  keywords: routeKeywords('/tools'),
});

export default function Page() {
  return <ToolsHub />;
}
