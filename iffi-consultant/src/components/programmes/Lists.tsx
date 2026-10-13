'use client';
import { createPortal } from 'react-dom';
import { Link } from '@/lib/router';
import { GitCompareArrows, Heart, Printer, X } from 'lucide-react';
import { programById } from '@/data/catalog';
import { site } from '@/data/content';
import type { Program } from '@/types/data';
import {
  LEVEL_LABEL,
  ageLine,
  bankLine,
  durationLabel,
  interviewLine,
  languagePlain,
  locationLabel,
  programPath,
  stipendLine,
  teachingLabel,
  tuitionLine,
} from '@/lib/programs';
import { waHref } from '@/lib/whatsapp';
import { cn } from '@/lib/cn';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/BrandIcons';
import { Disclaimer, EmptyState } from '@/components/ui/primitives';
import { Crest } from '@/components/ui/Logo';
import { useLists } from '@/hooks/useLists';
import { useIsClient } from '@/hooks/useIsClient';
import { ProgrammeRow } from './ProgrammeCard';

const toPrograms = (ids: string[]) => ids.map((id) => programById.get(id)).filter((p): p is Program => !!p);

export function printShortlist() {
  document.body.dataset.print = 'shortlist';
  const reset = () => {
    delete document.body.dataset.print;
    window.removeEventListener('afterprint', reset);
  };
  window.addEventListener('afterprint', reset);
  window.print();
}

export function ShortlistDrawer() {
  const { shortlist, shortlistOpen, setShortlistOpen, toggleShortlist, clearShortlist } = useLists();
  const items = toPrograms(shortlist);
  return (
    <Drawer
      open={shortlistOpen}
      onClose={() => setShortlistOpen(false)}
      title="Your shortlist"
      labelId="shortlist-title"
      footer={
        items.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" icon={<Printer size={17} aria-hidden="true" />} onClick={printShortlist}>
              Download PDF
            </Button>
            <a
              href={waHref('shortlist', { ids: items.map((p) => p.id).join(', ') })}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp px-5 text-[15px] font-medium text-navy"
            >
              <WhatsAppIcon size={18} />
              Send on WhatsApp
            </a>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState title="Nothing saved yet" icon={<Heart size={20} aria-hidden="true" />}>
          <p>Tap the heart on any programme to keep it here. You can save up to 10, then send the list to us or save it as a PDF.</p>
          <Link to="/programmes" onClick={() => setShortlistOpen(false)} className="mt-4 inline-block font-medium text-navy underline decoration-gold underline-offset-4">
            Browse programmes
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-2.5">
          <p className="text-sm text-muted">{items.length} of 10 saved. Your shortlist stays in this browser.</p>
          {items.map((p) => (
            <ProgrammeRow
              key={p.id}
              p={p}
              action={
                <button
                  type="button"
                  onClick={() => toggleShortlist(p.id)}
                  aria-label={`Remove ${p.id} from shortlist`}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-danger"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              }
            />
          ))}
          <button type="button" onClick={clearShortlist} className="mt-2 min-h-10 text-sm text-muted underline underline-offset-4 hover:text-danger">
            Clear shortlist
          </button>
        </div>
      )}
    </Drawer>
  );
}

/** Branded print sheet: three programmes per page. Rendered outside #root so print CSS can isolate it. */
export function PrintShortlist() {
  const isClient = useIsClient();
  const { shortlist } = useLists();
  if (!isClient) return null;
  const items = toPrograms(shortlist);
  const pages: Program[][] = [];
  for (let i = 0; i < items.length; i += 3) pages.push(items.slice(i, i + 3));
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return createPortal(
    <div id="print-shortlist" aria-hidden="true" className="bg-white text-ink">
      {pages.map((group, gi) => (
        <section key={gi} className={cn('min-h-[260mm]', gi < pages.length - 1 && 'print-break')}>
          <div className="flex items-center justify-between border-b-2 border-gold pb-3">
            <div className="flex items-center gap-3">
              <Crest variant="navy" size={44} />
              <div>
                <p className="font-display text-2xl font-semibold text-navy">{site.brand.name}</p>
                <p className="text-[11px] tracking-[0.2em] text-muted">MY CHINA PROGRAMME SHORTLIST</p>
              </div>
            </div>
            <p className="text-right text-xs text-muted">
              {date}
              <br />
              Page {gi + 1} of {pages.length}
            </p>
          </div>
          {group.map((p) => (
            <article key={p.id} className="border-b border-line py-4 text-[12px] leading-relaxed">
              <h2 className="font-display text-lg text-navy">
                {p.displayName} <span className="font-sans text-xs font-normal text-muted">({p.id})</span>
              </h2>
              <p className="text-muted">
                {LEVEL_LABEL[p.level]}, {locationLabel(p)}, {teachingLabel(p)}
                {p.ranking?.china ? `, China rank #${p.ranking.china}` : ''}
              </p>
              <p className="mt-1">
                <strong>Cost:</strong> {tuitionLine(p)}
                {stipendLine(p) ? `; ${stipendLine(p)}` : ''}
              </p>
              <p>
                <strong>Majors ({p.majors.length}):</strong> {p.majors.slice(0, 14).join(', ')}
                {p.majors.length > 14 ? ` and ${p.majors.length - 14} more` : ''}
              </p>
              {p.scholarships.length > 0 && (
                <p>
                  <strong>Scholarships:</strong> {p.scholarships.join('; ')}
                </p>
              )}
              <p>
                <strong>Language:</strong> {languagePlain(p)}
              </p>
              {p.typicalDeadlineMonth && (
                <p>
                  <strong>Usually closes:</strong> {p.typicalDeadlineMonth}
                </p>
              )}
            </article>
          ))}
          <div className="mt-4 space-y-1 text-[10.5px] leading-snug text-muted">
            <p>{site.disclaimers.dataFreshness}</p>
            <p>{site.disclaimers.universityNames}</p>
            {group.some((p) => p.level === 'MBBS') && <p>{site.disclaimers.mbbsRecognition}</p>}
            <p>
              WhatsApp / phone {site.contact.phoneDisplay}{site.contact.email ? ` | ${site.contact.email}` : ''} | {site.seo.siteUrl.replace('https://', '')}
            </p>
            {site.legal.footerDisclosure && <p>{site.legal.footerDisclosure}</p>}
          </div>
        </section>
      ))}
    </div>,
    document.body,
  );
}

/* Compare ---------------------------------------------------------------- */
type Row = { label: string; get: (p: Program) => React.ReactNode };
const ROWS: Row[] = [
  { label: 'Level', get: (p) => LEVEL_LABEL[p.level] },
  { label: 'Location', get: (p) => locationLabel(p) },
  { label: 'Duration', get: (p) => durationLabel(p) },
  { label: 'Ranking', get: (p) => [p.ranking?.china && `China #${p.ranking.china}`, p.ranking?.world && `World ${p.ranking.world}`].filter(Boolean).join(', ') || 'Not stated' },
  { label: 'Teaching language', get: (p) => teachingLabel(p) },
  { label: 'Majors', get: (p) => `${p.majors.slice(0, 6).join(', ')}${p.majors.length > 6 ? ` and ${p.majors.length - 6} more` : ''}` },
  { label: 'Scholarships', get: (p) => (p.scholarships.length ? p.scholarships.slice(0, 4).join('; ') : p.fullyFunded ? 'Fully funded offer' : 'Not listed') },
  { label: 'Tuition', get: (p) => tuitionLine(p) },
  { label: 'Stipend', get: (p) => stipendLine(p) ?? 'None listed' },
  { label: 'Language requirement', get: (p) => languagePlain(p) },
  { label: 'Age', get: (p) => ageLine(p) ?? 'No limit stated' },
  { label: 'Bank statement', get: (p) => bankLine(p) ?? 'Not stated' },
  { label: 'Documents', get: (p) => (p.documents.length ? `${p.documents.length} documents` : 'Ask us') },
  { label: 'Interview / video', get: (p) => interviewLine(p) ?? 'None stated' },
  { label: 'Usual deadline', get: (p) => p.typicalDeadlineMonth ?? 'Not stated' },
];

export function CompareTray() {
  const { compare, toggleCompare, setCompareOpen, clearCompare } = useLists();
  const items = toPrograms(compare);
  if (!items.length) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-navy-2/95 text-mist shadow-[0_-12px_40px_rgba(5,12,28,0.35)] backdrop-blur-xl" data-noprint>
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        <GitCompareArrows size={20} aria-hidden="true" className="hidden shrink-0 text-gold-2 sm:block" />
        <ul className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {items.map((p) => (
            <li key={p.id} className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 py-1 pl-3 pr-1 text-sm text-white">
              <span className="max-w-[180px] truncate">{p.id}: {p.city ?? p.province}</span>
              <button type="button" onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.id} from compare`} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
                <X size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={clearCompare} className="hidden min-h-10 px-2 text-sm text-mist/80 hover:text-white sm:block">
          Clear
        </button>
        <Button size="sm" variant="gold" onClick={() => setCompareOpen(true)} disabled={items.length < 2} className="shrink-0">
          Compare {items.length}
        </Button>
      </div>
    </div>
  );
}

export function CompareDrawer() {
  const { compare, compareOpen, setCompareOpen, toggleCompare } = useLists();
  const items = toPrograms(compare);
  return (
    <Drawer open={compareOpen} onClose={() => setCompareOpen(false)} side="full" title="Compare programmes" labelId="compare-title">
      <div className="mx-auto max-w-6xl">
        {/* Phones: one stacked card per programme */}
        <div className="space-y-4 md:hidden">
          {items.map((p) => (
            <section key={p.id} className="rounded-card border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg leading-snug">
                  <Link to={programPath(p)} onClick={() => setCompareOpen(false)}>
                    {p.displayName}
                  </Link>
                </h3>
                <button type="button" onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.id}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-paper">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <dl className="mt-3 divide-y divide-line text-sm">
                {ROWS.map((r) => (
                  <div key={r.label} className="grid grid-cols-[120px_1fr] gap-3 py-2">
                    <dt className="text-muted">{r.label}</dt>
                    <dd>{r.get(p)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        {/* Tablets and up: a real table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Side-by-side comparison of {items.length} programmes</caption>
            <thead>
              <tr>
                <th scope="col" className="w-44 border-b border-line p-3 align-bottom font-medium text-muted">
                  Programme
                </th>
                {items.map((p) => (
                  <th key={p.id} scope="col" className="border-b border-line p-3 align-bottom">
                    <Link to={programPath(p)} onClick={() => setCompareOpen(false)} className="font-display text-lg font-semibold leading-snug text-navy hover:underline">
                      {p.displayName}
                    </Link>
                    <span className="mt-0.5 block text-xs font-normal text-muted">{p.id}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="even:bg-paper/70">
                  <th scope="row" className="border-b border-line p-3 align-top font-medium text-navy">
                    {r.label}
                  </th>
                  {items.map((p) => (
                    <td key={p.id} className="border-b border-line p-3 align-top leading-relaxed">
                      {r.get(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Disclaimer className="mt-6">{site.disclaimers.dataFreshness}</Disclaimer>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={waHref('shortlist', { ids: items.map((p) => p.id).join(', ') })}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-[15px] font-medium text-navy"
          >
            <WhatsAppIcon size={18} />
            Ask which one suits me
          </a>
        </div>
      </div>
    </Drawer>
  );
}
