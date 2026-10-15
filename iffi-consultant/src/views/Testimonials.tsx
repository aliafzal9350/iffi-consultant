import { FileCheck2, Play, Video } from 'lucide-react';
import { SITE_URL } from '@/lib/seo';
import { ADMISSION_DOCS, VIDEO_STORIES, storyLabel, videoPoster, videoSrc } from '@/data/testimonials';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Disclaimer, Section } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Crest } from '@/components/ui/Logo';
import { VideoStories } from '@/components/testimonials/VideoStories';
import { DocumentGallery } from '@/components/testimonials/DocumentGallery';

const crumbs = [{ name: 'Success stories', path: '/testimonials' }];

// lets the videos show up in Google's video results
const videoLd = VIDEO_STORIES.map((s, i) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: `${storyLabel(s, i)} - IFFI Consultant student video`,
  description: 'A video message from an IFFI Consultant student about studying in China.',
  thumbnailUrl: `${SITE_URL}${videoPoster(s.id)}`,
  contentUrl: `${SITE_URL}${videoSrc(s.id)}`,
  uploadDate: '2026-10-15',
  duration: `PT${s.seconds}S`,
}));

export default function Testimonials() {
  const jw202Count = ADMISSION_DOCS.filter((d) => d.kind === 'jw202').length;
  const countries = [...new Set(ADMISSION_DOCS.map((d) => d.country).filter(Boolean))];
  const figures = [
    { icon: Video, value: VIDEO_STORIES.length, label: 'video stories from our students' },
    { icon: FileCheck2, value: ADMISSION_DOCS.length, label: `admissions for 2026, including ${jw202Count} JW202 visa forms` },
  ];

  return (
    <>
      <JsonLd crumbs={crumbs} data={videoLd} />
      <PageHeader
        crumbs={crumbs}
        title={
          <>
            Student stories and <span className="font-display-italic text-gold-gradient">admission results</span>
          </>
        }
        lede="Videos from IFFI students, and the paperwork behind them: admission notices and JW202 visa forms for the 2026 intake."
        aside={
          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
            <Crest size={44} className="absolute right-6 top-6 opacity-80" />
            <dl className="space-y-5 pr-12">
              {figures.map((f) => (
                <div key={f.label} className="flex items-center gap-4">
                  <dt className="tabular font-display text-[2.6rem] font-semibold leading-none text-gold-2">{f.value}</dt>
                  <dd className="max-w-[15rem] text-[14.5px] leading-snug text-mist">{f.label}</dd>
                </div>
              ))}
            </dl>
            {countries.length > 0 && <p className="mt-6 border-t border-white/10 pt-4 text-[13.5px] text-mist/80">Students from {countries.join(' and ')}</p>}
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#videos" variant="gold" icon={<Play size={16} fill="currentColor" aria-hidden="true" />}>
            Watch the videos
          </Button>
          <Button href="#documents" variant="outline-light">
            See the documents
          </Button>
        </div>
      </PageHeader>

      <Section
        id="videos"
        tone="paper"
        eyebrow="In their own words"
        title="Video stories"
        lede="Recorded by IFFI students on their own phones. Tap a card to watch with sound; use the arrows to move between videos."
      >
        <VideoStories stories={VIDEO_STORIES} />
      </Section>

      <Section
        id="documents"
        tone="light"
        eyebrow="Proof on paper"
        title="Admission notices and JW202 visa forms"
        lede="The JW202 is printed by China's Ministry of Education and issued by the university once a student is accepted; the student needs it to apply for the X1 study visa. Click any document to read it."
      >
        <DocumentGallery docs={ADMISSION_DOCS}>
          <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[22px] bg-navy p-7 text-mist sm:p-9">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #e0bd6b 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <h3 className="text-h3 text-white">Start your own application</h3>
              <p className="mt-3 max-w-md leading-relaxed">
                Send us your marks and goals on WhatsApp. We check your eligibility for free, then handle the paperwork through to your JW202 and visa.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton messageKey="heroConsultation" variant="gold">
                  Free eligibility check
                </WhatsAppButton>
                <Button to="/portal/sign-in" variant="outline-light">
                  Apply online
                </Button>
              </div>
            </div>
          </div>
        </DocumentGallery>
        <Disclaimer className="mt-14 max-w-3xl">
          Before publishing, we blur each student&rsquo;s passport number, home address and the scannable verification code that links to their official record.
        </Disclaimer>
      </Section>
    </>
  );
}
