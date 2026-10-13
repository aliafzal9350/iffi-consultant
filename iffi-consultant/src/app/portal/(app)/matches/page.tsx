import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Info, Pencil } from 'lucide-react';
import { site } from '@/data/content';
import { requireUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/router';
import { LEVEL_LABEL } from '@/lib/programs';
import { findMatches, reasonsFor } from '@/lib/portal/match';
import { explainMatches } from '@/lib/portal/explain';
import { getStudyProfile, isStudyProfileComplete, toEligibilityProfile } from '@/lib/portal/study';
import { ENGLISH_TESTS } from '@/lib/portal/quiz';
import { buttonClass } from '@/components/ui/buttonStyles';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { PortalBand } from '@/components/portal/PortalBand';
import { MatchCard } from '@/components/portal/MatchCard';

export const metadata: Metadata = { title: { absolute: `Your matches | ${site.brand.name}` } };

const TOP = 5; // programmes that get an AI note and a large card

export default async function MatchesPage() {
  const me = await requireUser();
  const sp = await getStudyProfile(me.id);
  if (!isStudyProfileComplete(sp)) redirect('/portal/start');

  const pr = toEligibilityProfile(sp);
  const { matches, near } = findMatches(pr);
  const top = matches.slice(0, TOP);
  const more = matches.slice(TOP);
  // started, not awaited: the cards render now and each note streams in when Gemini answers
  const notes = explainMatches(sp, pr, top.map((m) => m.program));

  const supabase = await createClient();
  const { data: apps } = await supabase.from('applications').select('id, program_id').eq('user_id', me.id);
  const appFor = new Map((apps ?? []).map((a) => [a.program_id as string, a.id as string]));

  const english = pr.englishTest === 'none' ? 'No English test' : pr.englishTest === 'moi' ? 'English-medium letter' : `${ENGLISH_TESTS.find((t) => t.id === pr.englishTest)?.label} ${pr.englishScore}`;
  const summary = [LEVEL_LABEL[pr.level], pr.field || 'Any subject', english, pr.hsk ? `HSK ${pr.hsk}` : null, { full: 'Full scholarship', partial: 'Partial scholarship OK', self: 'Self-funded OK' }[pr.funding]].filter(Boolean);

  return (
    <>
      <PortalBand
        title={matches.length ? 'Your matches' : 'Almost there'}
        lede={
          matches.length
            ? `${matches.length} ${matches.length === 1 ? 'programme fits' : 'programmes fit'} your profile. The best ones for you are at the top.`
            : 'No programme fits every answer yet, but some are very close. An adviser can help you close the gap.'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {summary.map((s) => (
            <span key={s} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[13px] text-mist">
              {s}
            </span>
          ))}
          <Link to="/portal/start" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium text-gold-2 hover:text-white">
            <Pencil size={13} aria-hidden="true" /> Change my answers
          </Link>
        </div>
      </PortalBand>

      <div className="mx-auto max-w-[1000px] space-y-10 px-4 py-8 sm:px-6 md:py-10">
        {top.length > 0 && (
          <section aria-labelledby="best" className="space-y-5">
            <h2 id="best" className="sr-only">
              Best matches
            </h2>
            {top.map(({ program }, k) => (
              <MatchCard key={program.id} program={program} reasons={reasonsFor(program, pr)} notes={notes} best={k === 0} applicationId={appFor.get(program.id)} />
            ))}
          </section>
        )}

        {more.length > 0 && (
          <section aria-labelledby="more" className="space-y-5">
            <h2 id="more" className="text-h3">
              More programmes that fit you
            </h2>
            {more.map(({ program }) => (
              <MatchCard key={program.id} program={program} reasons={reasonsFor(program, pr)} applicationId={appFor.get(program.id)} />
            ))}
          </section>
        )}

        {near.length > 0 && (
          <section aria-labelledby="near" className="space-y-5">
            <div>
              <h2 id="near" className="text-h3">
                Almost a match
              </h2>
              <p className="mt-1 text-[15px] text-muted">You are one step away from these. An adviser can tell you if they will still consider you.</p>
            </div>
            {near.slice(0, 6).map(({ program, verdict }) => (
              <MatchCard key={program.id} program={program} reasons={reasonsFor(program, pr)} gap={verdict.reasons.join('. ')} applicationId={appFor.get(program.id)} />
            ))}
          </section>
        )}

        <section className="flex flex-col items-start gap-4 rounded-card bg-navy p-6 text-mist sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="text-[1.3rem] text-white">Not sure which one to pick?</h2>
            <p className="mt-1 text-[14px]">An IFFI adviser can compare them with you. {site.contact.responsePromise}</p>
          </div>
          <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md', 'shrink-0')}>
            <WhatsAppIcon size={18} /> Ask an adviser
          </a>
        </section>

        <p className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
          <Info size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
          {site.disclaimers.dataFreshness} {site.disclaimers.eligibility} {pr.level === 'MBBS' && site.disclaimers.mbbsRecognition}
        </p>
      </div>
    </>
  );
}
