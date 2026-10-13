import { breadcrumbLd, type Crumb } from '@/lib/seo';

/**
 * Structured data for the current page. Titles, descriptions, canonicals and Open Graph come from each
 * page.tsx `metadata`; this only adds the JSON-LD blocks (rendered into the static HTML, no client JS).
 */
export function JsonLd({ crumbs, data = [] }: { crumbs?: Crumb[]; data?: Record<string, unknown>[] }) {
  const blocks = [...(crumbs ? [breadcrumbLd(crumbs)] : []), ...data];
  return (
    <>
      {blocks.map((o, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o).replace(/</g, '\u003c') }} />
      ))}
    </>
  );
}
