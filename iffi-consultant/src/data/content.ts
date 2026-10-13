/**
 * Light site data: copy, contacts, SEO routes, WhatsApp messages and counts.
 * Safe to import from client components - it does not pull in the 220 KB programme list.
 *
 * Data modules (keep heavy and light apart so the browser only downloads what a page needs):
 *   '@/data/content'  site, meta, whatsappLink           (light)
 *   '@/data/places'   provinces + lookups               (light)
 *   '@/data/config'   tools config                      (light)
 *   '@/data/catalog'  programmes + lookups              (heavy - server components and tool pages only)
 *   '@/data/geo'      map geometry                      (lazy map components only)
 *   '@/data/keywords' ranked SEO keywords               (server only - metadata)
 */
import siteJson from './site.json';
import metaJson from './meta.json';

type SiteJson = typeof siteJson;
type Maybe = string | null;
/** Fields left empty (null) until the client confirms them: the UI hides whatever is missing. */
type Confirmable = Omit<SiteJson, 'contact' | 'social' | 'legal'> & {
  contact: Omit<SiteJson['contact'], 'email'> & { email: Maybe };
  social: Omit<SiteJson['social'], 'facebook' | 'instagram' | 'email'> & { facebook: Maybe; instagram: Maybe; email: Maybe };
  legal: Omit<SiteJson['legal'], 'companyName' | 'companyNumber' | 'registeredIn' | 'registeredOffice' | 'footerDisclosure'> & {
    companyName: Maybe;
    companyNumber: Maybe;
    registeredIn: Maybe;
    registeredOffice: Maybe;
    footerDisclosure: Maybe;
  };
};

/** Site copy, contacts, social links, legal, FAQ, SEO, WhatsApp messages */
export const site: Confirmable = siteJson;
export type SiteContent = Confirmable;

export const meta = metaJson;

/** WhatsApp click-to-chat link with a pre-filled message */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
