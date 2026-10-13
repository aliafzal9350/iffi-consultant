import { BookOpen, CalendarClock, Clock, Coins, GraduationCap, Languages, MapPin, Trophy, Wallet } from 'lucide-react';
import { site } from '@/data/content';
import type { Program } from '@/types/data';
import { cn } from '@/lib/cn';
import { fmtNumber } from '@/lib/format';
import {
  LEVEL_LABEL,
  ageLine,
  bankLine,
  detailSections,
  durationLabel,
  interviewLine,
  languagePlain,
  locationLabel,
  programPath,
  provincePath,
  provinceZh,
  recognitionNote,
  stipendLine,
  teachingLabel,
  tuitionLine,
} from '@/lib/programs';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer, IconTile } from '@/components/ui/primitives';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { MiniMap } from '@/components/map/MiniMap';
import { ListToggles, ProgrammeBadges, ProgrammeCard } from '@/components/programmes/ProgrammeCard';
import { DocumentChecklist } from '@/components/programmes/DocumentChecklist';
import { MajorsList } from '@/components/programmes/MajorsList';
import { ShareButton, StickyApplyBar } from '@/components/programmes/ProgrammeActions';

// dt/dd must be direct children of the wrapper div (valid <dl> markup), so the icon sits inside the dt
function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="relative min-h-[4.5rem] rounded-xl border border-line bg-white p-4 pl-[4.25rem]">
      <dt className="text-[13px] text-muted">
        <IconTile light className="absolute left-4 top-4 h-10 w-10">
          {icon}
        </IconTile>
        {label}
      </dt>
      <dd className="mt-0.5 font-medium leading-snug text-navy">{value}</dd>
    </div>
  );
}

function Block({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('scroll-mt-28', className)}>
      <h2 id={`${id}-h`} className="text-[1.65rem] leading-tight">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Programme page (Server Component): the page passes the programme and similar ones, so the full list never ships to the browser. */
export default function ProgrammeDetail({ p, similar }: { p: Program; similar: Program[] }) {
  const location = p.city ? `${p.city}, ${p.province}` : p.province;
  const sections = detailSections(p);
  const recognition = recognitionNote(p);
  const crumbs = [
    { name: 'Programmes', path: '/programmes' },
    { name: p.displayName, path: programPath(p) },
  ];
  const waVars = { id: p.id, level: LEVEL_LABEL[p.level], location };
  const applyLabel = `Apply with ${site.brand.name}`;
  // the online application: sign-in (if needed) -> profile quiz (if needed) -> this programme
  const applyHref = `/portal/apply/${p.id}`;

  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader
        crumbs={crumbs}
        title={p.displayName}
        lede={
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <MapPin size={18} aria-hidden="true" className="text-gold-2" />
            {p.city ? `${p.city}, ` : ''}
            {p.province}
            <span className="font-cjk text-base text-gold-2" lang="zh">
              {provinceZh(p.province)}
            </span>
            {!p.city && <span className="text-mist/80">(city shared on request)</span>}
            <span className="tabular ml-1 rounded-full border border-white/15 px-2 py-px text-[13px] text-mist/80">{p.id}</span>
          </p>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <ProgrammeBadges p={p} max={8} dark />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button to={applyHref} variant="gold" size="lg">
            Apply online
          </Button>
          <WhatsAppButton messageKey="programInterest" vars={waVars} variant="outline-light" size="lg">
            Ask on WhatsApp
          </WhatsAppButton>
          <ListToggles id={p.id} dark />
          <ShareButton title={p.displayName} />
        </div>
      </PageHeader>

      <Container className="py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-14">
            <section aria-label="At a glance">
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Fact icon={<GraduationCap size={18} />} label="Level" value={p.levelDetail && p.levelDetail !== p.level && !/see note/i.test(p.levelDetail) ? p.levelDetail : LEVEL_LABEL[p.level]} />
                <Fact icon={<Clock size={18} />} label="Duration" value={durationLabel(p)} />
                <Fact icon={<Languages size={18} />} label="Teaching language" value={teachingLabel(p)} />
                <Fact
                  icon={<Trophy size={18} />}
                  label="Ranking (as stated)"
                  value={[p.ranking?.china && `#${p.ranking.china} in China`, p.ranking?.world && `#${p.ranking.world} world`].filter(Boolean).join(', ') || 'Not stated'}
                />
                <Fact icon={<Wallet size={18} />} label="Stipend" value={stipendLine(p) ?? (p.fullyFunded ? 'Ask us' : 'None listed')} />
                <Fact icon={<Coins size={18} />} label="Tuition" value={tuitionLine(p)} />
                <Fact icon={<CalendarClock size={18} />} label="Usually closes" value={p.typicalDeadlineMonth ?? 'Ask us for the next deadline'} />
                {p.intake && <Fact icon={<BookOpen size={18} />} label="Intake in the brochure" value={p.intake} />}
                {p.status && <Fact icon={<Trophy size={18} />} label="University status" value={p.status} />}
              </dl>
            </section>

            <Block id="majors" title={`Majors (${p.majors.length})`}>
              <MajorsList majors={p.majors} />
            </Block>

            {(p.scholarships.length > 0 || p.fullyFunded) && (
              <Block id="scholarships" title="Scholarships">
                {p.scholarships.length > 0 ? (
                  <ul className="space-y-3">
                    {p.scholarships.map((s) => (
                      <li key={s} className="rounded-xl border border-gold/25 bg-gold-soft/50 px-4 py-3 text-[15px]">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[15px]">Fully funded offer: tuition and dormitory are free and a monthly stipend is paid{p.stipendCNYPerMonth ? ` (${fmtNumber(p.stipendCNYPerMonth)} CNY)` : ''}.</p>
                )}
              </Block>
            )}

            <Block id="costs" title="Costs listed in the brochure">
              {p.costItems.length ? (
                <ul className="divide-y divide-line rounded-xl border border-line bg-white">
                  {p.costItems.map((c) => (
                    <li key={c} className="px-4 py-3 text-[15px]">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">The brochure lists no fees for this programme. Ask us for the current figures.</p>
              )}
              {p.tuitionNote && <p className="mt-3 text-sm text-muted">{p.tuitionNote}</p>}
              {p.level !== 'Language' && (
                <Button to={`/tools/cost-calculator?program=${p.id}`} variant="navy" className="mt-5">
                  Estimate my total cost
                </Button>
              )}
            </Block>

            <Block id="requirements" title="Language and requirements">
              <ul className="space-y-3 text-[15px]">
                <li className="rounded-xl border border-line bg-white p-4">
                  <strong className="block font-medium text-navy">Language</strong>
                  {languagePlain(p)}
                  {p.languagePolicy.note && !/not stated|as stated/i.test(p.languagePolicy.note) && <span className="block text-sm text-muted">{p.languagePolicy.note}</span>}
                </li>
                {ageLine(p) && (
                  <li className="rounded-xl border border-line bg-white p-4">
                    <strong className="block font-medium text-navy">Age</strong>
                    {ageLine(p)}
                  </li>
                )}
                {bankLine(p) && (
                  <li className="rounded-xl border border-line bg-white p-4">
                    <strong className="block font-medium text-navy">Bank statement</strong>
                    {bankLine(p)}
                  </li>
                )}
                {interviewLine(p) && (
                  <li className="rounded-xl border border-line bg-white p-4">
                    <strong className="block font-medium text-navy">Interview and video</strong>
                    {interviewLine(p)}
                  </li>
                )}
              </ul>
              <Button to="/tools/eligibility-checker" variant="outline" className="mt-5">
                Check my eligibility
              </Button>
            </Block>

            <Block id="documents" title="Documents">
              <DocumentChecklist
                id={p.id}
                items={p.documents.length ? p.documents : site.documentChecklist.general}
                title={p.documents.length ? 'Documents this programme asks for' : 'Typical documents (this brochure has no list)'}
              />
            </Block>

            {sections.length > 0 && (
              <Block id="details" title="More from the brochure">
                <Accordion
                  items={sections.map((s, i) => ({
                    id: `d${i}`,
                    title: s.title,
                    content: (
                      <ul className="space-y-1.5">
                        {s.lines.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ),
                  }))}
                />
              </Block>
            )}

            <div className="space-y-3">
              {p.level === 'MBBS' && (
                <Disclaimer tone="warn">
                  {recognition ? `Recognition as stated in the brochure: ${recognition}. ` : ''}
                  {site.disclaimers.mbbsRecognition}
                </Disclaimer>
              )}
              <Disclaimer>{site.disclaimers.dataFreshness}</Disclaimer>
              <Disclaimer>{site.disclaimers.universityNames}</Disclaimer>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start" aria-label="Location and next steps">
            <div className="overflow-hidden rounded-card bg-navy p-4 text-mist">
              <MiniMap
                focus={p.province}
                showCities={false}
                pin={p.coordinates ? { ...p.coordinates, label: p.city ?? undefined } : null}
                ariaLabel={`Map: ${locationLabel(p)}`}
              />
              <p className="mt-2 px-1 text-sm">
                {locationLabel(p)}
                {p.coordinatesApproximate && <span className="block text-[12.5px] text-mist/70">Pin shows the provincial capital.</span>}
              </p>
              <Button to={provincePath(p.province)} variant="outline-light" size="sm" className="mt-3 w-full">
                All programmes in {p.province}
              </Button>
            </div>
            <div className="rounded-card border border-line bg-white p-5">
              <p className="font-display text-xl text-navy">Interested in {p.id}?</p>
              <p className="mt-2 text-[15px] text-muted">Apply online in a few minutes, or send us your marks and we will confirm the latest fees, scholarship and deadline.</p>
              <Button to={applyHref} variant="gold" className="mt-4 w-full">
                Apply online
              </Button>
              <WhatsAppButton messageKey="programInterest" vars={waVars} variant="outline" className="mt-2.5 w-full">
                {applyLabel} on WhatsApp
              </WhatsAppButton>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-h" className="mt-20">
            <h2 id="similar-h" className="text-h2">
              Similar programmes
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <li key={s.id}>
                  <ProgrammeCard p={s} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>

      <StickyApplyBar vars={waVars} applyHref={applyHref} />
    </>
  );
}
