/**
 * Site data: copy, contacts, SEO routes, WhatsApp messages and counts. Client components import the smaller
 * '@/data/core' instead, so the FAQ, blog seeds and SEO copy are not downloaded on every page.
 *
 * Data modules (keep heavy and light apart so the browser only downloads what a page needs):
 *   '@/data/content'  site, meta, whatsappLink           (server components; the full copy)
 *   '@/data/core'     site (client slice), whatsappLink (client components - every page downloads it)
 *   '@/data/places'   provinces + lookups               (light)
 *   '@/data/config'   tools config                      (light)
 *   '@/data/catalog'  programmes + lookups              (heavy - server components and tool pages only)
 *   '@/data/geo'      map geometry                      (lazy map components only)
 *   '@/data/keywords' ranked SEO keywords               (server only - metadata)
 */
import siteJson from './site.json';

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


export { meta, whatsappLink } from './core';
