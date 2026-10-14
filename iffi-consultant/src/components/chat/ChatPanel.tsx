'use client';
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowUp, MessageCircleQuestionMark } from 'lucide-react';
import { site } from '@/data/core';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { Drawer } from '@/components/ui/Drawer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

interface Source {
  n: number;
  title: string;
  url: string;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
  sig?: string;
  sources?: Source[];
}

const MAX = 800;
const SUGGESTIONS = ['Fully funded Master programmes', 'Bachelor without IELTS', 'Living costs in Wuhan', 'Which documents do I need?'];

/** Plain-text rendering: paragraphs, "- " bullets and [n] source markers. Never HTML, so answers cannot inject markup. */
function Answer({ text, sources }: { text: string; sources?: Source[] }) {
  const cite = (line: string): ReactNode[] =>
    line.split(/(\[\d{1,2}\])/g).map((part, i) => {
      const m = part.match(/^\[(\d{1,2})\]$/);
      const s = m && sources?.find((x) => x.n === Number(m[1]));
      return s ? (
        <Link key={i} to={s.url} className="ml-0.5 align-super text-[11px] font-semibold text-gold-deep hover:underline" title={s.title}>
          {s.n}
        </Link>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      );
    });
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.length && lines.every((l) => /^\s*[-*•]\s/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, k) => (
                <li key={k}>{cite(l.replace(/^\s*[-*•]\s/, ''))}</li>
              ))}
            </ul>
          );
        return <p key={i}>{cite(block.replace(/\*\*/g, ''))}</p>;
      })}
      {!!sources?.length && (
        <ol className="mt-2 space-y-0.5 border-t border-line pt-2 text-[12.5px] text-muted">
          {sources.map((s) => (
            <li key={s.n}>
              {s.n}.{' '}
              <Link to={s.url} className="underline decoration-gold/60 underline-offset-2 hover:text-navy">
                {s.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages, busy]);

  async function ask(question: string) {
    const q = question.trim().slice(0, MAX);
    if (!q || busy) return;
    const next: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-12).map(({ role, content, sig }) => ({ role, content, sig })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 429 ? 'You have asked a lot of questions in a short time. Please wait a minute, or continue on WhatsApp.' : data.error || 'Answers are unavailable right now. Please continue on WhatsApp.');
        return;
      }
      setMessages([...next, { role: 'assistant', content: data.answer, sig: data.sig, sources: data.sources }]);
    } catch {
      setError('Connection problem. Please try again or continue on WhatsApp.');
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };
  const summary = messages
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => m.content.slice(0, 120))
    .join(' | ');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      labelId="chat-title"
      widthClass="sm:max-w-[420px]"
      title={
        <span className="inline-flex items-center gap-2">
          <MessageCircleQuestionMark size={19} aria-hidden="true" className="text-gold-deep" />
          Ask {site.brand.name}
        </span>
      }
      footer={
        <div className="space-y-2.5">
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={2}
              maxLength={MAX}
              placeholder="Ask about programmes, scholarships, costs or visas"
              className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white disabled:opacity-40"
            >
              <ArrowUp size={20} aria-hidden="true" />
            </button>
          </form>
          <p className="text-[12px] leading-snug text-muted">
            Automatic answers from our published programme data. They can be wrong, so confirm anything important with our team. Do not share passport or ID numbers.{' '}
            <Link to="/privacy" className="underline underline-offset-2">
              Privacy
            </Link>
          </p>
          {messages.length > 0 && (
            <WhatsAppButton messageKey="chatSummary" vars={{ summary }} size="sm" className="w-full">
              Continue on WhatsApp
            </WhatsAppButton>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-[15px] leading-relaxed" aria-live="polite">
        <div className="rounded-2xl bg-paper p-4 text-ink">
          <p>
            Hi! I answer questions about our {`${site.hero.mapCaption.split(' · ')[0]}`}, scholarships, costs, documents and visas. University names are shared in your free
            consultation on WhatsApp.
          </p>
          {messages.length === 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => ask(s)} className="min-h-9 rounded-full border border-navy/15 bg-white px-3 text-[13.5px] text-navy hover:border-navy/40">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[88%] rounded-2xl px-4 py-3', m.role === 'user' ? 'whitespace-pre-wrap bg-navy text-white' : 'border border-line bg-white text-ink')}>
              {m.role === 'user' ? m.content : <Answer text={m.content} sources={m.sources} />}
            </div>
          </div>
        ))}
        {busy && (
          <p className="text-sm text-muted" role="status">
            Looking that up…
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>
    </Drawer>
  );
}
