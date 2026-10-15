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
} from '@/components/sections/HomeSections';
import { StoriesSection } from '@/components/testimonials/StoriesSection';

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
      <StoriesSection />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
