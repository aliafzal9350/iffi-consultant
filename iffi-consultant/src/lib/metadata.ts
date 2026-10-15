/**
 * One place that turns a page's title / description / path / keywords into Next's Metadata.
 * Child `openGraph` objects replace the parent's instead of merging, so every page sets the full set here.
 */
import type { Metadata } from 'next';
import { site } from '@/data/content';
import { SITE_URL, canonical, clampDescription } from '@/lib/seo';

export const OG_IMAGE_PATH = '/og-image.png';
const OG_IMAGE = { url: OG_IMAGE_PATH, width: 1200, height: 630, alt: `${site.brand.name}: study in China with confidence` };

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  noindex?: boolean;
}

const MAX_TITLE = 60;
const BRAND_SUFFIX = new RegExp(`\\s*[|–-]\\s*${site.brand.name}(?: Blog)?$`);

/**
 * Google shows about 60 characters of a title. A longer one keeps its words and loses the brand first:
 * "… | IFFI Consultant", then "… | IFFI", then no suffix. Social cards keep the full title.
 */
export function fitTitle(title: string): string {
  if (title.length <= MAX_TITLE) return title;
  const core = title.replace(BRAND_SUFFIX, '');
  if (core === title) return title;
  return [`${core} | ${site.brand.name}`, `${core} | IFFI`].find((t) => t.length <= MAX_TITLE) ?? core;
}

export function pageMetadata({ title, description, path, keywords, type = 'website', publishedTime, noindex }: PageMeta): Metadata {
  const desc = clampDescription(description);
  const url = canonical(path).replace(SITE_URL, '') || '/';
  return {
    title: { absolute: fitTitle(title) },
    description: desc,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: site.brand.name,
      locale: 'en_GB',
      type,
      ...(publishedTime ? { publishedTime } : {}),
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [OG_IMAGE_PATH] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
