/** IFFI's offices (site.contact.offices): Lahore first, then the registered address in Nanning. */

interface OfficeLike {
  city: string | null;
  address: string | null;
}

/** "Lahore and Nanning" */
export const officeCities = (offices: readonly OfficeLike[]): string =>
  offices
    .map((o) => o.city)
    .filter(Boolean)
    .join(' and ');

/** Directions to an address on Google Maps (opens the app on phones). */
export const directionsUrl = (address: string): string => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
