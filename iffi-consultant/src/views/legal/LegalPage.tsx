import type { ReactNode } from 'react';
import { IS_DEV } from '@/lib/env';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/primitives';
import { fmtDate } from '@/lib/format';

export const LEGAL_UPDATED = '2026-10-12';

interface Props {
  path: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}

export function LegalPage({ path, title, intro, children }: Props) {
  const crumbs = [{ name: title, path }];
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader crumbs={crumbs} title={title} lede={intro} />
      <Container narrow className="py-12 md:py-16">
        {IS_DEV && (
          <p className="mb-8 rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-900">
            Template: have it reviewed by a professional before launch. This note shows only in development.
          </p>
        )}
        <p className="mb-8 text-sm text-muted">Last updated {fmtDate(LEGAL_UPDATED)}</p>
        <div className="prose-gj">{children}</div>
      </Container>
    </>
  );
}
