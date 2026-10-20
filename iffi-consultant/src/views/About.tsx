import { Building, Compass, Eye, HeartHandshake, MapPin } from 'lucide-react';
import { site } from '@/data/content';
import { FEATURE_TEAM, SHOW_DRAFTS } from '@/lib/env';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, DraftBadge, IconTile, Section } from '@/components/ui/primitives';
import { WhatsAppButton } from '@/components/ui/Button';
import { Crest } from '@/components/ui/Logo';
import { FinalCta, WhyUsSection } from '@/components/sections/HomeSections';
import { officeCities } from '@/lib/offices';

const crumbs = [{ name: 'About', path: '/about' }];

export default function About() {
  const offices = site.contact.offices.filter((o) => o.verified || SHOW_DRAFTS);
  const pillars = [
    { icon: Compass, title: 'Mission', text: site.about.mission },
    { icon: Eye, title: 'Vision', text: site.about.vision },
    { icon: HeartHandshake, title: 'Values', text: site.about.values },
  ];
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader crumbs={crumbs} title={site.about.title} lede={site.brand.description} />

      <Section tone="light">
        <div className="grid items-start gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-h2">A China study consultancy built on honest advice</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/85">{site.about.body}</p>
            <WhatsAppButton messageKey="aboutServices" className="mt-8">
              Talk to us on WhatsApp
            </WhatsAppButton>
          </div>
          <div className="relative overflow-hidden rounded-[22px] bg-navy p-8 text-mist">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
            <div className="relative">
              <Crest size={64} />
              <dl className="mt-8 space-y-4 text-[15px]">
                <div>
                  <dt className="text-mist/75">Name</dt>
                  <dd className="text-white">{site.brand.name}</dd>
                </div>
                {site.legal.companyName && (
                  <div>
                    <dt className="text-mist/75">Company</dt>
                    <dd className="text-white">
                      {site.legal.companyName}
                      {site.legal.companyNumber && `, company no. ${site.legal.companyNumber}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-mist/75">Offices</dt>
                  <dd className="text-white">{offices.map((o) => `${o.city}, ${o.country}`).join(' · ')}</dd>
                </div>
                <div>
                  <dt className="text-mist/75">Support</dt>
                  <dd className="text-white">WhatsApp {site.contact.phoneDisplay}, {site.contact.hours.replace('Open ', '').replace(' on WhatsApp', '')}</dd>
                </div>
                <div>
                  <dt className="text-mist/75">Students</dt>
                  <dd className="text-white">Pakistan and worldwide, counselled on WhatsApp and from our offices in {officeCities(offices)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="paper" title="What guides our work">
        <ul className="grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <li key={p.title} className="rounded-card border border-line bg-white p-7">
              <IconTile light>
                <p.icon size={20} />
              </IconTile>
              <h3 className="text-h3 mt-5">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="light" title="Where we are" lede="Most students work with us entirely on WhatsApp, wherever they live.">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {offices.map((o, i) => (
            <li key={o.label} className="rounded-card border border-line bg-white p-6">
              {i === 0 ? <MapPin size={20} aria-hidden="true" className="text-gold-deep" /> : <Building size={20} aria-hidden="true" className="text-gold-deep" />}
              <h3 className="mt-3 font-display text-xl">
                {o.city}, {o.country}
                {!o.verified && <DraftBadge note={o.note} />}
              </h3>
              <p className="text-[13px] text-muted">{o.label}</p>
              <address className="mt-2 text-[15px] not-italic text-ink">{o.address ?? 'Address to be confirmed'}</address>
              <p className="mt-2 text-[14px] text-muted">
                {o.countryCode === 'PK' ? 'Counselling for students in Pakistan.' : 'Support for students once they are in China.'} Message us on WhatsApp to arrange a visit.
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {FEATURE_TEAM && (
        <Section tone="paper" title="Our team">
          <p className="text-muted">Team profiles will appear here.</p>
        </Section>
      )}

      <WhyUsSection />
      <Container>
        <div className="h-px bg-line" />
      </Container>
      <FinalCta />
    </>
  );
}
