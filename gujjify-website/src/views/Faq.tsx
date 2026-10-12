'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { site } from '@/data';
import { cn } from '@/lib/cn';
import { faqLd, routeSeo } from '@/lib/seo';
import { SHOW_DRAFTS } from '@/lib/env';
import { Seo } from '@/components/ui/Seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container, DraftBadge, Disclaimer } from '@/components/ui/primitives';
import { Accordion } from '@/components/ui/Accordion';
import { inputClass } from '@/components/ui/Form';
import { Button, WhatsAppButton } from '@/components/ui/Button';

const crumbs = [{ name: 'FAQ', path: '/faq' }];
const TOPICS = ['Scholarships', 'Costs', 'Language', 'Visa', 'MBBS', 'Student life', 'Process'] as const;

function topicOf(q: string): (typeof TOPICS)[number] {
  if (/mbbs|pm&dc|practi[sc]e/i.test(q)) return 'MBBS';
  if (/scholarship|marks/i.test(q)) return 'Scholarships';
  if (/visa/i.test(q)) return 'Visa';
  if (/chinese|language/i.test(q)) return 'Language';
  if (/expensive|cost|fee/i.test(q)) return 'Costs';
  if (/hostel|safe|life/i.test(q)) return 'Student life';
  return 'Process';
}

export default function Faq() {
  const [query, setQuery] = useState('');
  const items = useMemo(() => site.faq.filter((f) => f.status === 'published' || SHOW_DRAFTS), []);
  const published = site.faq.filter((f) => f.status === 'published');
  const needle = query.trim().toLowerCase();
  const shown = needle ? items.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(needle)) : items;
  const seo = routeSeo('/faq');

  return (
    <>
      <Seo title={seo.title} description={seo.description} path="/faq" breadcrumbs={crumbs} jsonLd={[faqLd(published)]} />
      <PageHeader crumbs={crumbs} title="Study in China: frequently asked questions" lede="Scholarships, costs, language, visas and MBBS. If your question is not here, ask us on WhatsApp." />

      <Container narrow className="py-12 md:py-16">
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">
            Search questions
          </label>
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input id="faq-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search, e.g. IELTS, hostel, visa" className={cn(inputClass, 'h-12 pl-11 text-base')} />
        </div>
        <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
          {needle ? `${shown.length} ${shown.length === 1 ? 'answer' : 'answers'} for “${query.trim()}”` : `${shown.length} questions`}
        </p>

        <div className="mt-8 space-y-12">
          {TOPICS.map((topic) => {
            const group = shown.filter((f) => topicOf(f.q) === topic);
            if (!group.length) return null;
            return (
              <section key={topic} aria-labelledby={`t-${topic}`}>
                <h2 id={`t-${topic}`} className="text-h3">
                  {topic}
                </h2>
                <div className="mt-4">
                  <Accordion
                    key={needle}
                    defaultOpen={needle ? group.map((_, i) => `${topic}-${i}`) : []}
                    items={group.map((f, i) => ({
                      id: `${topic}-${i}`,
                      title: (
                        <>
                          {f.q}
                          {f.status !== 'published' && <DraftBadge note={f.status} />}
                        </>
                      ),
                      content: (
                        <>
                          <p>{f.a}</p>
                          {topic === 'MBBS' && <Disclaimer tone="warn" className="mt-3">{site.disclaimers.mbbsRecognition}</Disclaimer>}
                        </>
                      ),
                    }))}
                  />
                </div>
              </section>
            );
          })}
          {shown.length === 0 && <p className="text-muted">No answer matches that yet. Ask us directly and we will reply on WhatsApp.</p>}
        </div>

        <div className="mt-16 rounded-card bg-navy p-7 text-mist sm:p-9">
          <h2 className="text-h3 text-white">Still have a question?</h2>
          <p className="mt-2">{site.contact.responsePromise}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppButton messageKey="faqQuestion" variant="gold">
              Ask on WhatsApp
            </WhatsAppButton>
            <Button to="/tools/eligibility-checker" variant="outline-light">
              Check my eligibility
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
