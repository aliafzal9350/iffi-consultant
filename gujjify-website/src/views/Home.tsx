'use client';
import { Seo } from '@/components/ui/Seo';
import { routeSeo, websiteLd } from '@/lib/seo';
import { Hero } from '@/components/sections/Hero';
import {
  FaqPreview,
  FinalCta,
  HighlightsSection,
  ProcessSection,
  ProvincesSection,
  ServicesSection,
  ToolsSection,
  TrustStrip,
  WhyUsSection,
} from '@/components/sections/HomeSections';

export default function Home() {
  const seo = routeSeo('/');
  return (
    <>
      <Seo title={seo.title} description={seo.description} path="/" jsonLd={[websiteLd()]} />
      <Hero />
      <TrustStrip />
      <ToolsSection />
      <ProvincesSection />
      <HighlightsSection />
      <ServicesSection />
      <ProcessSection />
      <WhyUsSection />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
