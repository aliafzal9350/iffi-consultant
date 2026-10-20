/**
 * SEO helpers: canonical URLs and JSON-LD blocks. Titles, descriptions and Open Graph tags are set by each
 * page.tsx through Next's Metadata API (see app/layout.tsx for the site-wide defaults).
 */
import { site } from '@/data/content';

export const SITE_URL = site.seo.siteUrl;
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export interface Crumb {
  name: string;
  path: string;
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
  // only details the client has confirmed: no legal entity or street address until IFFI provides them
  const sameAs = [site.social.facebook, site.social.instagram].filter((x): x is string => !!x);
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${SITE_URL}/#organization`,
    name: site.brand.name,
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    image: OG_IMAGE,
    description: site.brand.description,
    slogan: site.brand.tagline,
    telephone: site.contact.phoneE164,
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    areaServed: 'Worldwide',
    knowsAbout: ['Study in China', 'Chinese Government Scholarship (CSC)', 'China student visa (X1/X2)', 'MBBS in China'],
    address: site.contact.offices.map((o) => ({
      '@type': 'PostalAddress',
      streetAddress: o.streetAddress,
      addressLocality: o.city,
      addressRegion: o.region,
      addressCountry: o.countryCode,
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: site.contact.phoneE164,
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

/** Trim to ~155 characters on a word boundary for meta descriptions. */
export function clampDescription(s: string, max = 158): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
