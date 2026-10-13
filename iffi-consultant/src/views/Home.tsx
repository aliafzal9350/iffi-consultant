import { JsonLd } from '@/components/ui/Seo';
import { websiteLd } from '@/lib/seo';
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
  return (
    <>
      <JsonLd data={[websiteLd()]} />
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
