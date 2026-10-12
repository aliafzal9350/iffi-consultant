'use client';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { applyHead, breadcrumbLd, type Crumb, type HeadData } from '@/lib/seo';

/** During prerendering the server passes a collector; in the browser there is none. */
export interface HeadCollector {
  data: HeadData | null;
}
const HeadContext = createContext<HeadCollector | null>(null);

export function HeadProvider({ collector, children }: { collector?: HeadCollector; children: ReactNode }) {
  return <HeadContext.Provider value={collector ?? null}>{children}</HeadContext.Provider>;
}

interface SeoProps extends HeadData {
  breadcrumbs?: Crumb[];
}

/** Title, description, canonical, Open Graph, Twitter and JSON-LD for the current page. */
export function Seo({ breadcrumbs, ...data }: SeoProps) {
  const collector = useContext(HeadContext);
  const full: HeadData = {
    ...data,
    jsonLd: [...(breadcrumbs ? [breadcrumbLd(breadcrumbs)] : []), ...(data.jsonLd ?? [])],
  };
  if (collector) collector.data = full;

  const key = JSON.stringify(full);
  useEffect(() => {
    applyHead(JSON.parse(key) as HeadData);
  }, [key]);
  return null;
}
