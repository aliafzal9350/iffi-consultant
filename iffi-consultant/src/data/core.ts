/**
 * The client slice of the site copy (site-core.json, written by data-pipeline/build_site_data.py next to site.json):
 * brand, contacts, navigation, WhatsApp messages and disclaimers. Client components import `site` from here, so every
 * page downloads ~5 KB of copy instead of the full site.json (FAQ, blog seeds, services, SEO). Server components keep
 * using '@/data/content'.
 */
import coreJson from './site-core.json';
import metaJson from './meta.json';
import type { SiteContent } from './content';

type Core = Pick<SiteContent, 'contact' | 'social' | 'navigation' | 'whatsapp' | 'disclaimers' | 'documentChecklist'> & {
  brand: Pick<SiteContent['brand'], 'name' | 'shortName' | 'wordmarkMain' | 'wordmarkSub'>;
  hero: Pick<SiteContent['hero'], 'mapCaption'>;
  seo: Pick<SiteContent['seo'], 'siteUrl'>;
  legal: Pick<SiteContent['legal'], 'footerDisclosure'>;
};

export const site: Core = coreJson;

/** Counts (programmes, provinces, cities, by level) */
export const meta = metaJson;

/** WhatsApp click-to-chat link with a pre-filled message */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
