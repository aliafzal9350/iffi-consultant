import type { MetadataRoute } from 'next';
import { programs } from '@/data/catalog';
import { provinces } from '@/data/places';
import { meta } from '@/data/content';
import { BLOG_POSTS } from '@/content/blog';
import { SITE_URL } from '@/lib/seo';
import { programPath, provincePath } from '@/lib/programs';

const STATIC: [path: string, priority: number][] = [
  ['/', 1],
  ['/programmes', 0.9],
  ['/tools', 0.8],
  ['/tools/cost-calculator', 0.9],
  ['/tools/eligibility-checker', 0.9],
  ['/services', 0.8],
  ['/about', 0.6],
  ['/blog', 0.7],
  ['/faq', 0.7],
  ['/contact', 0.7],
  ['/privacy', 0.2],
  ['/terms', 0.2],
  ['/cookies', 0.2],
];

/** /sitemap.xml - every static page, programme, province and blog post, built from the same data as the pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(meta.generated);
  const url = (path: string) => `${SITE_URL}${path === '/' ? '/' : path}`;
  return [
    ...STATIC.map(([path, priority]) => ({ url: url(path), lastModified: updated, priority })),
    ...programs.map((p) => ({ url: url(programPath(p)), lastModified: updated, priority: 0.7 })),
    ...provinces.map((p) => ({ url: url(provincePath(p.name)), lastModified: updated, priority: 0.6 })),
    ...BLOG_POSTS.map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: new Date(p.date), priority: 0.6 })),
  ];
}
