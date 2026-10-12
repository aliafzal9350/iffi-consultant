'use client';
import { site } from '@/data';
import { routeSeo } from '@/lib/seo';
import { Seo } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, IconTile } from '@/components/ui/primitives';
import { WhatsAppButton } from '@/components/ui/Button';
import { DataIcon } from '@/components/ui/Icon';
import { FinalCta, ProcessSection } from '@/components/sections/HomeSections';

const crumbs = [{ name: 'Services', path: '/services' }];

export default function Services() {
  const seo = routeSeo('/services');
  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        path="/services"
        breadcrumbs={crumbs}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'IFFI Global Education Consultants services',
            itemListElement: site.services.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: { '@type': 'Service', name: s.title, description: s.summary, provider: { '@id': 'https://www.iffiglobal.com/#organization' }, url: `https://www.iffiglobal.com/services#${s.id}` },
            })),
          },
        ]}
      />
      <PageHeader
        crumbs={crumbs}
        title="Study in China services: admission, CSC scholarship and student visa"
        lede="From choosing a university to landing in China, one team handles your file. Start with a free counselling session on WhatsApp."
      >
        <WhatsAppButton messageKey="chooseService" variant="gold">
          Help me choose a service
        </WhatsAppButton>
      </PageHeader>

      <Container className="py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Services on this page" className="hidden lg:block">
            <ol className="sticky top-28 space-y-1 border-l border-line">
              {site.services.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-2 pl-4 text-[14.5px] text-muted hover:border-gold hover:text-navy">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-6">
            {site.services.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 rounded-card border border-line bg-white p-7 sm:p-9">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <IconTile className="h-12 w-12">
                    <DataIcon name={s.icon} size={22} />
                  </IconTile>
                  <div>
                    <h2 id={`${s.id}-h`} className="text-[1.6rem] leading-tight">
                      {s.title}
                    </h2>
                    <p className="mt-2 font-medium text-ink">{s.summary}</p>
                    <p className="mt-3 max-w-2xl leading-relaxed text-ink/80">{s.detail}</p>
                    <WhatsAppButton messageKey="serviceInterest" vars={{ service: s.title }} variant="outline" size="sm" className="mt-6">
                      Ask about this
                    </WhatsAppButton>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </Container>

      <ProcessSection tone="light" />
      <FinalCta />
    </>
  );
}
