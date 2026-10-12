/**
 * Prerender entry (used only by scripts/prerender.mjs at build time).
 * Renders one URL to static HTML and returns the head tags the page asked for.
 */
import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { HeadProvider, type HeadCollector } from '@/components/ui/Seo';
import { renderHeadTags } from '@/lib/seo';
import { programs, provinces, site } from '@/data';
import { provinceSlug } from '@/lib/programs';
import { BLOG_POSTS } from '@/content/blog';

export async function render(url: string): Promise<{ html: string; head: string }> {
  const collector: HeadCollector = { data: null };
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <HeadProvider collector={collector}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HeadProvider>
    </StrictMode>,
  );
  const decoder = new TextDecoder();
  let html = '';
  for await (const chunk of prelude as unknown as AsyncIterable<Uint8Array | string>) html += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
  if (!collector.data) throw new Error(`No <Seo> rendered for ${url}`);
  return { html, head: renderHeadTags(collector.data) };
}

/** Every URL that gets a static HTML file. Mirrors the router and public/sitemap.xml. */
export function allRoutes(): string[] {
  return [
    '/',
    '/programmes',
    '/tools',
    '/tools/cost-calculator',
    '/tools/eligibility-checker',
    '/services',
    '/about',
    '/blog',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    ...provinces.map((p) => `/provinces/${provinceSlug(p.name)}`),
    ...programs.map((p) => `/programmes/${p.slug}`),
    ...BLOG_POSTS.map((b) => `/blog/${b.slug}`),
  ];
}

export const siteUrl = site.seo.siteUrl;
