import { Link } from '@/lib/router';
import { BadgeCheck, ChevronRight, Coins, FileText, Lock } from 'lucide-react';
import { tools } from '@/data/config';
import { meta } from '@/data/content';
import { TOOLS } from '@/lib/toolsMeta';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section, IconTile } from '@/components/ui/primitives';
import { FinalCta } from '@/components/sections/HomeSections';

const crumbs = [{ name: 'Tools', path: '/tools' }];

const HOW = [
  {
    icon: Lock,
    title: 'Free, with no sign-up',
    text: 'Your answers, shortlist and checklist stay in your own browser. Nothing is sent to us unless you choose to share it.',
  },
  {
    icon: FileText,
    title: 'Built on real brochures',
    text: `Fees, scholarships, stipends and deadlines come from the university brochures behind our ${meta.counts.programmes} programmes. Living costs are typical student budgets for each city.`,
  },
  {
    icon: Coins,
    title: 'In your own currency',
    text: `Costs are shown in Chinese yuan and converted into ${tools.currency.currencies.length} currencies, including PKR, BDT, NGN and INR, with exchange rates updated daily.`,
  },
  {
    icon: BadgeCheck,
    title: 'Checked by a person next',
    text: 'Send your result to us on WhatsApp and a counsellor confirms the latest fees, the scholarship and the next deadline for your intake.',
  },
];

export default function ToolsHub() {
  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader
        crumbs={crumbs}
        title="Free tools to plan your studies in China"
        lede="Find programmes, budget in your own currency and check your scholarship chances. No sign-up, and your answers stay in your browser."
      />

      <Section tone="paper" compact>
        <ul className="grid gap-6 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.id}>
              <Link to={t.path} className="group flex h-full flex-col rounded-card border border-line bg-white p-7 shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift">
                <IconTile className="h-12 w-12">
                  <t.icon size={22} />
                </IconTile>
                <h2 className="text-h3 mt-6">{t.name}</h2>
                <p className="mt-2 text-[15px] text-muted">{t.description}</p>
                <p className="mt-2 text-[15px] text-ink">{t.benefit}</p>
                <span className="mt-auto pt-6">
                  <span className="flex items-center gap-1 border-t border-line pt-5 font-medium text-navy">
                    Open the tool
                    <ChevronRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="light" compact title="How the tools work">
        <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {HOW.map((h) => (
            <li key={h.title} className="flex gap-4">
              <IconTile light>
                <h.icon size={20} />
              </IconTile>
              <div>
                <h3 className="font-display text-[1.2rem]">{h.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{h.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta />
    </>
  );
}
