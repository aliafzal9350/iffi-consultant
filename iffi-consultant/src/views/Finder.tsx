'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/router';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { meta, site } from '@/data/content';
import { programs } from '@/data/catalog';
import { plural } from '@/lib/format';
import { EMPTY, SORTS, activeFilters, parseState, relaxSuggestions, runFinder, toParams, type FinderState, type SortId } from '@/lib/filters';
import { useIsClient } from '@/hooks/useIsClient';
import { useCurrency } from '@/hooks/useCurrency';
import { useLists } from '@/hooks/useLists';
import { JsonLd } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, Disclaimer, EmptyState } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Form';
import { Button, WhatsAppButton } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { ProgrammeCard } from '@/components/programmes/ProgrammeCard';
import { FilterPanel } from '@/components/programmes/FilterPanel';

const crumbs = [{ name: 'Programme finder', path: '/programmes' }];
const PAGE = 16;

export default function Finder() {
  const isClient = useIsClient();
  const [params, setParams] = useSearchParams();
  // the prerendered page is the unfiltered list; URL filters apply once the browser takes over
  const state = useMemo(() => (isClient ? parseState(params) : EMPTY), [isClient, params]);
  const results = useMemo(() => runFinder(state), [state]);
  const active = activeFilters(state);
  const currency = useCurrency();
  const { shortlist, setShortlistOpen } = useLists();
  const [sheet, setSheet] = useState(false);
  // a page of cards keeps the DOM small on phones; filters reset it to the first page
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [state]);

  const update = (next: FinderState) => setParams(toParams(next), { replace: true, preventScrollReset: true });
  const showMbbs = state.level.includes('MBBS') || (results.length > 0 && results.every((p) => p.level === 'MBBS'));

  const sortControl = (
    <div className="flex items-center gap-2">
      <label htmlFor="finder-sort" className="shrink-0 text-sm text-muted">
        Sort by
      </label>
      <Select id="finder-sort" value={state.sort} onChange={(e) => update({ ...state, sort: e.target.value as SortId })} className="w-[190px]">
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <JsonLd crumbs={crumbs} />
      <PageHeader
        crumbs={crumbs}
        title="China University & Programme Finder"
        lede={
          <>
            Filter all {meta.counts.programmes} programmes in our current list by level, major, city, teaching language and scholarship. Looking for a China
            university list or a CSC scholarship university list as a PDF? Shortlist the ones you like and save them as a PDF in one click.
          </>
        }
      />

      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Desktop filter rail */}
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-[96px] max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain rounded-card border border-line bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl">Filters</h2>
                {active.length > 0 && (
                  <button type="button" onClick={() => update({ ...EMPTY, sort: state.sort })} className="min-h-9 text-sm text-muted underline underline-offset-4 hover:text-navy">
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel state={state} onChange={update} currency={currency} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile sticky bar */}
            <div className="sticky top-[68px] z-30 -mx-4 mb-5 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:top-[76px] lg:hidden">
              <Button variant="navy" size="sm" icon={<SlidersHorizontal size={16} aria-hidden="true" />} onClick={() => setSheet(true)}>
                Filters{active.length ? ` (${active.length})` : ''}
              </Button>
              <Select aria-label="Sort by" value={state.sort} onChange={(e) => update({ ...state, sort: e.target.value as SortId })} className="min-w-0 flex-1">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] text-ink" aria-live="polite" role="status">
                <strong className="font-display text-2xl font-semibold text-navy">{results.length}</strong> of {programs.length} programmes
              </p>
              <div className="hidden lg:block">{sortControl}</div>
            </div>

            {active.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
                {active.map((f) => (
                  <li key={f.key}>
                    <button
                      type="button"
                      onClick={() => update(f.without)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3 text-[13px] text-navy hover:border-navy/40"
                      aria-label={`Remove filter: ${f.label}`}
                    >
                      {f.label}
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => update({ ...EMPTY, sort: state.sort })} className="min-h-9 px-2 text-[13px] text-muted underline underline-offset-4 hover:text-navy">
                    Clear all
                  </button>
                </li>
              </ul>
            )}

            {state.ids.length > 0 && (
              <Disclaimer className="mt-5">These are the programmes your eligibility check matched. Remove that filter to see everything.</Disclaimer>
            )}
            {showMbbs && (
              <Disclaimer tone="warn" className="mt-5">
                {site.disclaimers.mbbsRecognition}
              </Disclaimer>
            )}

            {results.length > 0 ? (
              <>
                <ul className="mt-6 grid gap-5 md:grid-cols-2">
                  {results.slice(0, shown).map((p) => (
                    <li key={p.id}>
                      <ProgrammeCard p={p} q={state.q} headingLevel="h2" />
                    </li>
                  ))}
                </ul>
                {results.length > shown && (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                      Show {Math.min(PAGE, results.length - shown)} more
                    </Button>
                    <p className="text-sm text-muted">
                      Showing {shown} of {results.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6">
                <EmptyState title="No programmes match all of these filters" icon={<SearchX size={22} aria-hidden="true" />}>
                  <p>Try removing one filter:</p>
                  <ul className="mt-4 flex flex-wrap justify-center gap-2">
                    {relaxSuggestions(state).map(({ filter, count }) => (
                      <li key={filter.key}>
                        <button
                          type="button"
                          onClick={() => update(filter.without)}
                          className="inline-flex min-h-10 items-center rounded-full border border-navy/20 bg-white px-4 text-sm text-navy hover:border-navy"
                        >
                          Remove “{filter.label}”: {plural(count, 'result')}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6">New programmes arrive every intake. Tell us what you are looking for.</p>
                  <WhatsAppButton messageKey="default" className="mt-4">
                    Ask on WhatsApp
                  </WhatsAppButton>
                </EmptyState>
              </div>
            )}

            <div className="mt-10 space-y-3">
              <Disclaimer>{site.disclaimers.dataFreshness}</Disclaimer>
              <Disclaimer>
                {site.disclaimers.universityNames} Looking for a CSC agency number? Agency numbers are not listed here; ask us on WhatsApp for the right one for
                your university.
              </Disclaimer>
            </div>

            {shortlist.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-gold/30 bg-gold-soft/60 p-4">
                <p className="text-sm text-ink">{plural(shortlist.length, 'programme')} in your shortlist.</p>
                <Button size="sm" variant="navy" onClick={() => setShortlistOpen(true)}>
                  View shortlist and PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>

      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        side="bottom"
        title="Filters"
        labelId="filters-title"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => update({ ...EMPTY, sort: state.sort })}>
              Clear all
            </Button>
            <Button variant="navy" className="flex-1" onClick={() => setSheet(false)}>
              Show {plural(results.length, 'result')}
            </Button>
          </div>
        }
      >
        <FilterPanel state={state} onChange={update} currency={currency} />
      </Drawer>
    </>
  );
}
