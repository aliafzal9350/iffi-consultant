/**
 * The student's answers, read-only and in plain words: the "Review and sign" step and the staff application page
 * both show it. Drawn from the same schema as the form, so a new field shows up here without extra work.
 */
import { CircleCheck, Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from '@/lib/router';
import { FORM_SECTION_KEYS, sectionDone, type FormSectionKey } from '@/lib/portal/application';
import { SECTIONS, displayValue, isShown, rowsOf, savedSection, type FieldDef, type FormContext, type SectionValues } from '@/lib/portal/form';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtValue(f: FieldDef, value: string, ctx: FormContext): string {
  if (!value) return '';
  if (f.type === 'month' && /^\d{4}-\d{2}$/.test(value)) return `${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;
  if (f.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return `${Number(value.slice(8, 10))} ${MONTHS[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`;
  return displayValue(f, value, ctx);
}

function Facts({ fields, values, ctx }: { fields: FieldDef[]; values: SectionValues; ctx: FormContext }) {
  const shown = fields.filter((f) => f.type !== 'checkbox' && isShown(f, values, ctx));
  if (!shown.length) return null;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {shown.map((f) => {
        const v = fmtValue(f, String(values[f.name] ?? ''), ctx);
        return (
          <div key={f.name} className={cn(f.type === 'textarea' && 'sm:col-span-2')}>
            <dt className="text-[12.5px] text-muted">{f.label}</dt>
            <dd className={cn('mt-0.5 whitespace-pre-line break-words text-[14.5px]', v ? 'text-ink' : 'text-muted/70')}>{v || '—'}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function AnswersView({ form, ctx, keys = FORM_SECTION_KEYS, editHref }: { form: Record<string, unknown>; ctx: FormContext; keys?: readonly FormSectionKey[]; editHref?: (key: FormSectionKey) => string }) {
  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const s = SECTIONS[key];
        const values = savedSection(form, key);
        const started = Boolean(form[key]);
        const done = sectionDone(form, key);
        return (
          <section key={key} aria-labelledby={`ans-${key}`} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id={`ans-${key}`} className="flex items-center gap-2 font-sans text-[16px] font-medium text-navy">
                {done && <CircleCheck size={17} aria-hidden="true" className="text-good" />}
                {s.title}
                {!done && <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[11.5px] font-medium text-gold-deep">{started ? 'Not finished' : 'Not started'}</span>}
              </h3>
              {editHref && (
                <Link to={editHref(key)} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-navy underline underline-offset-4 hover:text-gold-deep">
                  <Pencil size={13} aria-hidden="true" /> {done ? 'Edit' : 'Fill in'}
                </Link>
              )}
            </div>
            {started && (
              <div className="mt-4 space-y-5">
                {s.blocks.map((b, i) => {
                  if (b.note) return null;
                  if (b.group) {
                    const rows = rowsOf(values, b.group.name);
                    return (
                      <div key={i}>
                        <p className="mb-2 text-[13px] font-medium text-navy">{b.group.label}</p>
                        {rows.length ? (
                          <ol className="space-y-1.5">
                            {rows.map((r, k) => (
                              <li key={k} className="rounded-xl bg-paper/70 px-3 py-2 text-[14px] text-ink">
                                {b.group!.fields
                                  .map((f) => fmtValue(f, r[f.name] ?? '', ctx))
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-[14px] text-muted">None</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={i}>
                      {b.title && <p className="mb-2 text-[13px] font-medium text-navy">{b.title}</p>}
                      <Facts fields={b.fields ?? []} values={values} ctx={ctx} />
                      {b.fields?.some((f) => f.type === 'checkbox' && values[f.name] === 'yes') && (
                        <p className="mt-2 text-[13.5px] text-muted">
                          {b.fields
                            .filter((f) => f.type === 'checkbox' && values[f.name] === 'yes')
                            .map((f) => f.label)
                            .join('. ')}
                          .
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
