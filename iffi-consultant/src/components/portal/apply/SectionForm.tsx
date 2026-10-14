'use client';
/**
 * One part of the application form, drawn from the schema in lib/portal/form.ts. Answers save by themselves a moment
 * after the student stops typing; "Save and continue" checks everything (here, then again on the server) and moves on.
 */
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, CloudOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Select, inputClass } from '@/components/ui/Form';
import { saveSection } from '@/lib/portal/apply-actions';
import type { FormSectionKey } from '@/lib/portal/application';
import {
  COUNTRY_NAMES,
  SECTIONS,
  isShown,
  optionsOf,
  rowsOf,
  validateSection,
  type Errors,
  type FieldDef,
  type FormContext,
  type GroupDef,
  type Row,
  type SectionValues,
} from '@/lib/portal/form';
import { IFFI_REFERENCE } from '@/lib/portal/policy';

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: string } | { kind: 'error'; message: string };

interface Props {
  appId: string;
  sectionKey: FormSectionKey;
  initial: SectionValues;
  ctx: FormContext;
  readOnly: boolean;
  backHref: string;
}

const AUTOSAVE_MS = 1200;
const widthClass = { full: 'sm:col-span-6', half: 'sm:col-span-3', third: 'sm:col-span-2' };
const fieldId = (name: string) => `f-${name.replace(/\./g, '-')}`;

function LabelText({ f }: { f: FieldDef }) {
  return (
    <>
      {f.label}
      {f.zh && (
        <span lang="zh" className="font-zh ml-2 text-[12px] font-normal text-muted">
          {f.zh}
        </span>
      )}
    </>
  );
}

const labelClass = 'mb-1.5 block text-sm font-medium text-navy';

function Control({ f, id, value, error, ctx, disabled, onChange }: { f: FieldDef; id: string; value: string; error?: string; ctx: FormContext; disabled: boolean; onChange: (v: string) => void }) {
  const hintId = f.hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  const common = { id, disabled, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy } as const;
  const options = optionsOf(f, ctx);

  let control: ReactNode;
  if (f.type === 'checkbox') {
    return (
      <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-[15px] text-ink', disabled && 'cursor-default opacity-70')}>
        <input type="checkbox" {...common} checked={value === 'yes'} onChange={(e) => onChange(e.target.checked ? 'yes' : '')} className="h-5 w-5 accent-navy" />
        {f.label}
      </label>
    );
  }
  if (f.type === 'radio') {
    return (
      <fieldset id={id} tabIndex={-1} aria-describedby={describedBy} className="outline-none">
        <legend className={labelClass}>
          <LabelText f={f} />
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
                value === o.value ? 'border-navy bg-navy/[0.04] font-medium text-navy' : 'border-line bg-white text-ink hover:border-navy/30',
                disabled && 'pointer-events-none opacity-70'
              )}
            >
              <input type="radio" name={id} value={o.value} checked={value === o.value} disabled={disabled} aria-invalid={error ? true : undefined} onChange={() => onChange(o.value)} className="h-4 w-4 accent-navy" />
              {o.label}
            </label>
          ))}
        </div>
        <Help id={id} hint={f.hint} error={error} />
      </fieldset>
    );
  }
  if (f.type === 'select' && options.length) {
    control = (
      <Select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  } else if (f.type === 'textarea') {
    control = <textarea {...common} rows={3} maxLength={f.maxLength} placeholder={f.placeholder} autoComplete={f.autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, 'min-h-24 py-3')} />;
  } else {
    const type = f.type === 'select' ? 'text' : f.type === 'month' ? 'month' : f.type;
    control = (
      <input
        {...common}
        type={type}
        value={value}
        maxLength={f.type === 'number' || f.type === 'date' || f.type === 'month' ? undefined : f.maxLength}
        placeholder={f.placeholder ?? (f.type === 'month' ? 'YYYY-MM' : undefined)}
        autoComplete={f.autoComplete}
        inputMode={f.inputMode}
        list={f.suggest === 'countries' ? 'iffi-countries' : undefined}
        step={f.type === 'number' ? 'any' : undefined}
        onChange={(e) => onChange(f.upper ? e.target.value.toUpperCase() : e.target.value)}
        className={cn(inputClass, f.upper && 'uppercase')}
      />
    );
  }
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        <LabelText f={f} />
      </label>
      {control}
      <Help id={id} hint={f.hint} error={error} />
    </div>
  );
}

function Help({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}

function Fields({ fields, values, errors, ctx, disabled, prefix, onChange }: { fields: FieldDef[]; values: SectionValues | Row; errors: Errors; ctx: FormContext; disabled: boolean; prefix?: string; onChange: (name: string, v: string) => void }) {
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-6">
      {fields
        .filter((f) => isShown(f, values as SectionValues, ctx))
        .map((f) => {
          const key = prefix ? `${prefix}.${f.name}` : f.name;
          return (
            <div key={f.name} className={cn('col-span-6', widthClass[f.width ?? 'full'])}>
              <Control f={f} id={fieldId(key)} value={String((values as Record<string, unknown>)[f.name] ?? '')} error={errors[key]} ctx={ctx} disabled={disabled} onChange={(v) => onChange(f.name, v)} />
            </div>
          );
        })}
    </div>
  );
}

function Group({ g, rows, errors, ctx, disabled, onRows }: { g: GroupDef; rows: Row[]; errors: Errors; ctx: FormContext; disabled: boolean; onRows: (rows: Row[]) => void }) {
  const min = g.min(ctx);
  const hint = typeof g.hint === 'function' ? g.hint(ctx) : g.hint;
  const empty = () => Object.fromEntries(g.fields.map((f) => [f.name, '']));
  return (
    <div>
      {hint && <p className="mb-4 text-[14px] text-muted">{hint}</p>}
      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className="rounded-2xl border border-line bg-paper/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[14px] font-medium text-navy">
                {g.itemLabel} {i + 1}
              </p>
              {!disabled && rows.length > min && (
                <button
                  type="button"
                  onClick={() => onRows(rows.filter((_, k) => k !== i))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted hover:bg-white hover:text-danger"
                >
                  <Trash2 size={15} aria-hidden="true" /> Remove
                </button>
              )}
            </div>
            <Fields fields={g.fields} values={row} errors={errors} ctx={ctx} disabled={disabled} prefix={`${g.name}.${i}`} onChange={(name, v) => onRows(rows.map((r, k) => (k === i ? { ...r, [name]: v } : r)))} />
          </li>
        ))}
      </ol>
      {errors[g.name] && (
        <p id={fieldId(g.name)} tabIndex={-1} className="mt-3 text-[13px] font-medium text-danger">
          {errors[g.name]}
        </p>
      )}
      {!disabled && rows.length < g.max && (
        <button type="button" onClick={() => onRows([...rows, empty()])} className={buttonClass('outline', 'sm', 'mt-4')}>
          <Plus size={16} aria-hidden="true" /> {rows.length ? g.addLabel : `Add ${g.itemLabel.toLowerCase()}`}
        </button>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state.kind === 'idle') return null;
  return (
    <p role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      {state.kind === 'saving' && (
        <>
          <Loader2 size={14} aria-hidden="true" className="animate-spin" /> Saving…
        </>
      )}
      {state.kind === 'saved' && (
        <>
          <CircleCheck size={14} aria-hidden="true" className="text-good" /> Saved {new Date(state.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </>
      )}
      {state.kind === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-danger">
          <CloudOff size={14} aria-hidden="true" /> {state.message}
        </span>
      )}
    </p>
  );
}

export function SectionForm({ appId, sectionKey, initial, ctx, readOnly, backHref }: Props) {
  const section = SECTIONS[sectionKey];
  const [values, setValues] = useState<SectionValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [finishing, startFinishing] = useTransition();
  const queue = useRef<Promise<unknown>>(Promise.resolve()); // saves run one after another, never overlapping
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(values);
  latest.current = values;

  const enqueue = <T,>(job: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(job, job);
    queue.current = run.catch(() => undefined);
    return run;
  };

  const autosave = () => {
    window.clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setSave({ kind: 'saving' });
    const snapshot = latest.current;
    enqueue(() => saveSection(appId, sectionKey, snapshot, false))
      .then((res) => setSave(res.ok ? { kind: 'saved', at: res.savedAt ?? new Date().toISOString() } : { kind: 'error', message: res.message ?? 'Not saved' }))
      .catch(() => {
        dirty.current = true;
        setSave({ kind: 'error', message: 'Not saved: check your connection' });
      });
  };

  const update = (next: SectionValues) => {
    setValues(next);
    setMessage(null);
    if (tried) setErrors(validateSection(sectionKey, next, ctx));
    if (readOnly) return;
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(autosave, AUTOSAVE_MS);
  };
  const setField = (name: string, v: string) => update({ ...latest.current, [name]: v });

  // leaving with unsaved answers: save now, and ask the browser to warn if the tab is closing
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      autosave();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      autosave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    window.clearTimeout(timer.current);
    const found = validateSection(sectionKey, values, ctx);
    setTried(true);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      setMessage(`${Object.keys(found).length === 1 ? 'One answer needs' : `${Object.keys(found).length} answers need`} fixing before you continue.`);
      requestAnimationFrame(() => document.getElementById(fieldId(first))?.focus());
      return;
    }
    dirty.current = false;
    startFinishing(async () => {
      const res = await enqueue(() => saveSection(appId, sectionKey, values, true));
      // success redirects to the next part; we only get here when something went wrong
      if (res && !res.ok) {
        setErrors(res.errors ?? {});
        setMessage(res.message ?? 'Your answers could not be saved.');
      }
    });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        finish();
      }}
      className="space-y-6"
    >
      <datalist id="iffi-countries">
        {COUNTRY_NAMES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {readOnly && (
        <p className="flex gap-2.5 rounded-xl border border-gold/35 bg-gold-soft/70 px-4 py-3 text-[14px] text-ink">
          <CircleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-deep" />
          IFFI is working on your application, so these answers are locked. Message your adviser on WhatsApp if something needs changing.
        </p>
      )}

      {section.blocks.map((b, i) => (
        <section key={i} aria-labelledby={b.title ? `blk-${i}` : undefined} className="rounded-card border border-line bg-white p-5 sm:p-7">
          {(b.title || b.group) && (
            <h2 id={`blk-${i}`} className="mb-5 font-sans text-[17px] font-medium text-navy">
              {b.title ?? b.group?.label}
              {(b.zh ?? b.group?.zh) && (
                <span lang="zh" className="font-zh ml-2 text-[13px] font-normal text-muted">
                  {b.zh ?? b.group?.zh}
                </span>
              )}
            </h2>
          )}
          {b.hint && <p className="-mt-3 mb-5 text-[14px] text-muted">{b.hint}</p>}
          {b.fields && <Fields fields={b.fields} values={values} errors={errors} ctx={ctx} disabled={readOnly} onChange={setField} />}
          {b.group && (
            <Group g={b.group} rows={rowsOf(values, b.group.name)} errors={errors} ctx={ctx} disabled={readOnly} onRows={(rows) => update({ ...latest.current, [b.group!.name]: rows })} />
          )}
          {b.note === 'iffi-reference' && (
            <div className="rounded-2xl bg-paper px-4 py-3.5 text-[14px] text-ink">
              <p>
                IFFI fills these boxes on the official form for you: <span className="font-medium text-navy">{IFFI_REFERENCE.organization}</span>, {IFFI_REFERENCE.address.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}.
              </p>
              <p className="mt-1 text-[13px] text-muted">Nothing to do here.</p>
            </div>
          )}
        </section>
      ))}

      {message && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card border border-line bg-white px-5 py-4 sm:px-7">
        {readOnly ? (
          <Link to={backHref} className={buttonClass('navy', 'md')}>
            Back to my application
          </Link>
        ) : (
          <button type="submit" disabled={finishing} className={buttonClass('gold', 'lg', 'w-full sm:w-auto sm:min-w-56')}>
            {finishing ? 'Saving…' : 'Save and continue'}
          </button>
        )}
        <SaveIndicator state={save} />
        {!readOnly && <p className="text-[13px] text-muted sm:ml-auto">Your answers save as you type. You can stop and come back any time.</p>}
      </div>
    </form>
  );
}
