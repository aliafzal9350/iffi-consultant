'use client';
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { tools } from '@/data/config';
import { cn } from '@/lib/cn';
import { fmtNumber } from '@/lib/format';
import { CURRENCIES } from '@/lib/currency';
import { LEVEL_LABEL, LEVEL_ORDER } from '@/lib/programs';
import { KEYS, readJSON, removeKey, writeJSON } from '@/lib/storage';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Select, inputClass } from '@/components/ui/Form';
import { saveQuiz } from '@/lib/portal/actions';
import { ENGLISH_TESTS, QUESTIONS, checkQuestion, type QuestionId, type QuizAnswers } from '@/lib/portal/quiz';

const ec = tools.eligibilityChecker;
const COUNTRIES = CURRENCIES.filter((c) => !['USD', 'GBP', 'EUR', 'CNY'].includes(c.code)).sort((a, b) => a.country.localeCompare(b.country));

/** Questions that do not apply to this student are skipped (the 6-month language course has no academic entry rules). */
const skipped = (q: QuestionId, a: QuizAnswers) => a.level === 'Language' && (q === 'field' || q === 'grades');

/** A big tappable answer. Tapping it saves the answer and moves on. */
function Option({ selected, onPick, title, hint }: { selected: boolean; onPick: () => void; title: ReactNode; hint?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        'flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 text-left transition-[border-color,background-color,box-shadow] duration-150',
        selected ? 'border-navy bg-navy/[0.03] shadow-soft' : 'border-line hover:border-navy/35 hover:bg-paper/60'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium text-navy">{title}</span>
        {hint && <span className="mt-0.5 block text-[14px] leading-snug text-muted">{hint}</span>}
      </span>
      <span
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border-2', selected ? 'border-gold bg-gold text-navy' : 'border-line text-transparent')}
        aria-hidden="true"
      >
        <Check size={15} strokeWidth={3} />
      </span>
    </button>
  );
}

export function Quiz({ initial, next, firstName }: { initial: QuizAnswers; next: string | null; firstName: string | null }) {
  const [a, setA] = useState<QuizAnswers>(initial);
  const [i, setI] = useState(0);
  const [error, setError] = useState<string | null>(null); // this question's answer is not valid
  const [saveError, setSaveError] = useState<string | null>(null); // the answers were fine, saving failed
  const [saving, startSaving] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // keep progress if the page is refreshed (this browser tab only)
  useEffect(() => {
    const saved = readJSON<{ a: QuizAnswers; i: number } | null>(KEYS.portalQuiz, null, 'session');
    if (saved) {
      setA({ ...initial, ...saved.a });
      setI(Math.min(saved.i, QUESTIONS.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => writeJSON(KEYS.portalQuiz, { a, i }, 'session'), [a, i]);

  // move focus to the new question so screen readers read it out
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [i]);

  const q = QUESTIONS[i];
  const visible = QUESTIONS.filter((x) => !skipped(x, a));
  const position = visible.indexOf(q) + 1;
  const isLast = i === QUESTIONS.length - 1;

  const go = (dir: 1 | -1, answers = a) => {
    let j = i + dir;
    while (j >= 0 && j < QUESTIONS.length && skipped(QUESTIONS[j], answers)) j += dir;
    if (j >= 0 && j < QUESTIONS.length) setI(j);
  };

  const set = (patch: Partial<QuizAnswers>) => {
    setA((cur) => ({ ...cur, ...patch }));
    setError(null);
    setSaveError(null);
  };

  /** single-choice questions: save and move on after a short beat, so the tick is seen */
  const advancing = useRef(false);
  const pick = (patch: Partial<QuizAnswers>) => {
    if (advancing.current) return; // a double tap must not skip the next question
    advancing.current = true;
    const answers = { ...a, ...patch };
    set(patch);
    window.setTimeout(() => {
      advancing.current = false;
      go(1, answers);
    }, 220);
  };

  const submit = () => {
    const err = checkQuestion(q, a);
    if (err) return setError(err);
    if (!isLast) return go(1);
    removeKey(KEYS.portalQuiz, 'session'); // a successful save navigates away straight away
    startSaving(async () => {
      const res = await saveQuiz(a, next);
      if (res?.error) {
        setSaveError(res.error);
        writeJSON(KEYS.portalQuiz, { a, i }, 'session');
      }
    });
  };

  const test = ENGLISH_TESTS.find((t) => t.id === a.englishTest);
  let title = '';
  let lede: ReactNode = null;
  let body: ReactNode = null;
  let needsButton = true;

  switch (q) {
    case 'level':
      title = 'What do you want to study?';
      lede = firstName ? `Hi ${firstName}. Ten quick questions, then we show you the programmes that fit.` : 'Ten quick questions, then we show you the programmes that fit.';
      needsButton = false;
      body = LEVEL_ORDER.map((l) => (
        <Option key={l} selected={a.level === l} onPick={() => pick({ level: l })} title={LEVEL_LABEL[l]} hint={(ec.levels as Record<string, string>)[l]} />
      ));
      break;
    case 'field':
      title = 'Which subject interests you most?';
      needsButton = false;
      body = (
        <>
          {tools.finder.fields.map((f) => (
            <Option key={f} selected={a.field === f} onPick={() => pick({ field: f })} title={f} />
          ))}
          <Option selected={a.field === ''} onPick={() => pick({ field: '' })} title="I'm not sure yet" hint="We will show programmes in every subject." />
        </>
      );
      break;
    case 'dob':
      title = 'When were you born?';
      lede = 'Some programmes have age limits.';
      body = (
        <input
          type="date"
          aria-label="Date of birth"
          value={a.dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => set({ dob: e.target.value })}
          aria-invalid={!!error}
          className={cn(inputClass, 'h-14 max-w-xs text-lg')}
        />
      );
      break;
    case 'grades':
      title = 'What was your last result?';
      lede = a.level === 'Master' ? 'Your Bachelor degree.' : a.level === 'PhD' ? 'Your Master degree.' : 'Your FSc, A-Level, HSC or equivalent.';
      body = (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            {(['percentage', 'cgpa'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={a.gradeMode === m}
                onClick={() => set({ gradeMode: m })}
                className={cn('h-12 rounded-xl border-2 font-medium', a.gradeMode === m ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy/35')}
              >
                {m === 'percentage' ? 'Percentage' : 'CGPA'}
              </button>
            ))}
          </div>
          {a.gradeMode === 'percentage' ? (
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-sm font-medium text-navy">Your percentage</span>
              <span className="relative block">
                <input type="number" inputMode="decimal" min={1} max={100} step={0.1} value={a.percent ?? ''} onChange={(e) => set({ percent: e.target.value ? Number(e.target.value) : null })} aria-invalid={!!error} className={cn(inputClass, 'h-14 pr-10 text-lg')} />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">%</span>
              </span>
            </label>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <label className="block w-36">
                <span className="mb-1.5 block text-sm font-medium text-navy">Your CGPA</span>
                <input type="number" inputMode="decimal" min={0} max={a.scale} step={0.01} value={a.cgpa ?? ''} onChange={(e) => set({ cgpa: e.target.value ? Number(e.target.value) : null })} aria-invalid={!!error} className={cn(inputClass, 'h-14 text-lg')} />
              </label>
              <label className="block w-28">
                <span className="mb-1.5 block text-sm font-medium text-navy">Out of</span>
                <Select value={a.scale} onChange={(e) => set({ scale: Number(e.target.value) })} className="[&_select]:h-14">
                  {ec.gradeInput.cgpaScales.map((s) => (
                    <option key={s} value={s}>
                      {fmtNumber(s, 1)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          )}
        </div>
      );
      break;
    case 'english':
      title = 'Do you have an English test?';
      lede = 'Many programmes need no IELTS at all.';
      needsButton = Boolean(test?.max);
      body = (
        <>
          {ENGLISH_TESTS.map((t) => (
            <Option
              key={t.id}
              selected={a.englishTest === t.id}
              onPick={() => (t.max ? set({ englishTest: t.id, englishScore: null }) : pick({ englishTest: t.id, englishScore: null }))}
              title={t.id === 'moi' ? 'No test, but my school taught in English' : t.label}
              hint={t.id === 'moi' ? 'A letter from your school can be enough for some programmes.' : undefined}
            />
          ))}
          <Option selected={a.englishTest === 'none'} onPick={() => pick({ englishTest: 'none', englishScore: null })} title="No English test yet" />
          {test?.max && (
            <label className="block max-w-xs pt-2">
              <span className="mb-1.5 block text-sm font-medium text-navy">Your {test.label} score</span>
              <input type="number" inputMode="decimal" min={0} max={test.max} step={test.step} value={a.englishScore ?? ''} onChange={(e) => set({ englishScore: e.target.value ? Number(e.target.value) : null })} aria-invalid={!!error} autoFocus className={cn(inputClass, 'h-14 text-lg')} />
              <span className="mt-1.5 block text-[13px] text-muted">Up to {test.max}</span>
            </label>
          )}
        </>
      );
      break;
    case 'hsk':
      title = 'Do you know any Chinese?';
      lede = 'Only programmes taught in Chinese ask for an HSK level.';
      needsButton = false;
      body = (
        <>
          <Option selected={a.hsk === 0} onPick={() => pick({ hsk: 0 })} title="No Chinese yet" hint="That's normal. English-taught programmes don't need it." />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {ec.hskLevels.filter((h) => h > 0).map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={a.hsk === h}
                onClick={() => pick({ hsk: h })}
                className={cn('h-14 rounded-2xl border-2 font-medium', a.hsk === h ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy/35')}
              >
                HSK {h}
              </button>
            ))}
          </div>
        </>
      );
      break;
    case 'funding':
      title = 'How will you pay for your studies?';
      needsButton = false;
      body = (
        [
          ['full', 'I need a full scholarship', 'Only show programmes where tuition can be free.'],
          ['partial', 'A partial scholarship is fine', 'Show programmes that lower the fees.'],
          ['self', 'My family can pay the fees', 'Show everything that fits me.'],
        ] as const
      ).map(([v, t, h]) => <Option key={v} selected={a.funding === v} onPick={() => pick({ funding: v })} title={t} hint={h} />);
      break;
    case 'teaching':
      title = 'Which language do you want to study in?';
      needsButton = false;
      body = (
        [
          ['English', 'English', undefined],
          ['Chinese', 'Chinese', 'You learn Chinese first, often in a free foundation year.'],
          ['either', 'Either is fine', 'Show me both.'],
        ] as const
      ).map(([v, t, h]) => <Option key={v} selected={a.teaching === v} onPick={() => pick({ teaching: v })} title={t} hint={h} />);
      break;
    case 'bank':
      title = 'How much can your family show in a bank statement?';
      lede = 'Some universities ask to see this. A low amount is fine: many programmes have no minimum.';
      needsButton = false;
      body = ec.bankStatementOptions.map((b) => <Option key={b.value} selected={a.bank === b.value} onPick={() => pick({ bank: b.value })} title={b.label} />);
      break;
    case 'contact':
      title = 'Last one: where can we reach you?';
      lede = 'Your IFFI adviser sends updates about your application on WhatsApp.';
      body = (
        <div className="space-y-5 sm:max-w-md">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Your country</span>
            <Select value={a.country} onChange={(e) => set({ country: e.target.value })} className="[&_select]:h-14">
              {COUNTRIES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.country}
                </option>
              ))}
              <option value="other">Another country</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">WhatsApp number</span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+92 300 1234567" value={a.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} aria-invalid={!!error} className={cn(inputClass, 'h-14 text-lg')} />
            <span className="mt-1.5 block text-[13px] text-muted">Include your country code.</span>
          </label>
        </div>
      );
      break;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 md:pt-10">
      {/* progress */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-navy hover:bg-white disabled:invisible"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back
        </button>
        <p className="tabular text-[14px] text-muted">
          Question {position} of {visible.length}
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={visible.length} aria-valuenow={position} aria-label="Quiz progress">
        {visible.map((x, k) => (
          <span key={x} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', k < position ? 'bg-gold' : 'bg-line')} />
        ))}
      </div>

      <form
        className="mt-8 md:mt-10"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h1 ref={heading} tabIndex={-1} className="text-[clamp(1.6rem,3.6vw,2.2rem)] leading-[1.15] outline-none">
          {title}
        </h1>
        {lede && <p className="mt-2 text-[15px] text-muted md:text-base">{lede}</p>}

        <div className="mt-7 space-y-3">{body}</div>

        {(error ?? saveError) && (
          <p role="alert" className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">
            {error ?? saveError}
          </p>
        )}

        {needsButton && (
          <button type="submit" disabled={saving} className={buttonClass(isLast ? 'gold' : 'navy', 'lg', 'mt-8 w-full sm:w-auto sm:min-w-56')}>
            {isLast ? (saving ? 'Finding your matches…' : 'See my matches') : 'Continue'}
          </button>
        )}
      </form>

      <p className="mt-12 flex items-center gap-2 text-[13px] text-muted">
        <Lock size={14} aria-hidden="true" className="shrink-0" />
        Only you and IFFI advisers can see your answers.
      </p>
    </div>
  );
}
