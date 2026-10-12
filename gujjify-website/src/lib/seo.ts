/**
 * Head tags + JSON-LD. One data shape (HeadData) feeds two outputs:
 *  - applyHead(): updates document.head in the browser after navigation
 *  - renderHeadTags(): an HTML string the prerender script writes into each static page
 */
import { site } from '@/data';

export const SITE_URL = site.seo.siteUrl;
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export interface Crumb {
  name: string;
  path: string;
}

export interface HeadData {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
}

type RouteKey = keyof typeof site.seo.routes;
export function routeSeo(path: RouteKey) {
  return site.seo.routes[path];
}

export function canonical(path: string): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return `${SITE_URL}${clean || '/'}`;
}

export function organizationLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${SITE_URL}/#organization`,
    name: site.brand.name,
    legalName: site.legal.companyName,
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    image: OG_IMAGE,
    description: site.brand.description,
    slogan: site.brand.tagline,
    email: site.contact.email,
    telephone: site.contact.phoneE164,
    sameAs: [site.social.facebook, site.social.instagram],
    areaServed: 'Worldwide',
    knowsAbout: ['Study in China', 'Chinese Government Scholarship (CSC)', 'China student visa (X1/X2)', 'MBBS in China'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Office 6317, 58 Peregrine Road, Hainault',
      addressLocality: 'Ilford',
      addressRegion: 'Essex',
      postalCode: 'IG6 3SZ',
      addressCountry: 'GB',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: site.contact.phoneE164,
        email: site.contact.email,
        url: site.contact.whatsappUrl,
        availableLanguage: ['English', 'Urdu'],
      },
    ],
  };
}

export function websiteLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: site.brand.name,
    url: `${SITE_URL}/`,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };
}

export function breadcrumbLd(crumbs: Crumb[]): Record<string, unknown> {
  const all = [{ name: 'Home', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: canonical(c.path),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleLd(a: { title: string; description: string; path: string; date: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    mainEntityOfPage: canonical(a.path),
    image: OG_IMAGE,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };
}

/** Every page carries the organisation; pages add their own blocks. */
export function withDefaults(data: HeadData): Required<HeadData> {
  return {
    type: 'website',
    noindex: false,
    ...data,
    jsonLd: [organizationLd(), ...(data.jsonLd ?? [])],
  };
}

function metaList(d: Required<HeadData>): { attr: 'name' | 'property'; key: string; content: string }[] {
  const url = canonical(d.path);
  return [
    { attr: 'name', key: 'description', content: d.description },
    { attr: 'name', key: 'robots', content: d.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large' },
    { attr: 'property', key: 'og:type', content: d.type },
    { attr: 'property', key: 'og:site_name', content: site.brand.name },
    { attr: 'property', key: 'og:title', content: d.title },
    { attr: 'property', key: 'og:description', content: d.description },
    { attr: 'property', key: 'og:url', content: url },
    { attr: 'property', key: 'og:image', content: OG_IMAGE },
    { attr: 'property', key: 'og:image:width', content: '1200' },
    { attr: 'property', key: 'og:image:height', content: '630' },
    { attr: 'property', key: 'og:image:alt', content: 'IFFI Global Education Consultants: study in China with confidence' },
    { attr: 'property', key: 'og:locale', content: 'en_GB' },
    { attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attr: 'name', key: 'twitter:title', content: d.title },
    { attr: 'name', key: 'twitter:description', content: d.description },
    { attr: 'name', key: 'twitter:image', content: OG_IMAGE },
  ];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonForScript = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');

export function renderHeadTags(input: HeadData): string {
  const d = withDefaults(input);
  const lines = [
    `<title>${esc(d.title)}</title>`,
    ...metaList(d).map((m) => `<meta ${m.attr}="${m.key}" content="${esc(m.content)}" />`),
    `<link rel="canonical" href="${esc(canonical(d.path))}" />`,
    ...d.jsonLd.map((o) => `<script type="application/ld+json" data-head="ld">${jsonForScript(o)}</script>`),
  ];
  return lines.join('\n    ');
}

export function applyHead(input: HeadData): void {
  const d = withDefaults(input);
  document.title = d.title;
  for (const m of metaList(d)) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${m.attr}="${m.key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(m.attr, m.key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', m.content);
  }
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonical(d.path);
  document.head.querySelectorAll('script[data-head="ld"]').forEach((s) => s.remove());
  for (const o of d.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.head = 'ld';
    s.textContent = JSON.stringify(o);
    document.head.appendChild(s);
  }
}

/** Trim to ~155 characters on a word boundary for meta descriptions. */
export function clampDescription(s: string, max = 158): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
