'use client';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { programs } from '@/data/catalog';
import { provinces } from '@/data/places';
import { tools } from '@/data/config';
import { cn } from '@/lib/cn';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { FUNDING, TUITION_MAX, TUITION_STEP, matches, toggle, type FinderState } from '@/lib/filters';
import { LEVEL_LABEL, LEVEL_ORDER } from '@/lib/programs';
import { Chip } from '@/components/ui/primitives';
import { Slider, inputClass } from '@/components/ui/Form';
import { MiniMap } from '@/components/map/MiniMap';

interface Props {
  state: FinderState;
  onChange: (next: FinderState) => void;
  currency: { code: string; toLocal: (cny: number) => number };
}

function Group({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <legend id={id} className="mb-3 text-sm font-semibold text-navy">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]">
      <span>
        {label}
        {hint && <span className="block text-[12.5px] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-navy" />
    </label>
  );
}

/** Count of results if a value were toggled on top of the current filters. */
function useCounter(state: FinderState) {
  return (patch: Partial<FinderState>) => programs.filter((p) => matches(p, { ...state, ...patch })).length;
}

export function FilterPanel({ state, onChange, currency }: Props) {
  const set = (patch: Partial<FinderState>) => onChange({ ...state, ...patch });
  const count = useCounter(state);
  const uid = useId();

  // major search: typing is local, the URL updates after a short pause
  const [q, setQ] = useState(state.q);
  useEffect(() => setQ(state.q), [state.q]);
  useEffect(() => {
    if (q === state.q) return;
    const t = window.setTimeout(() => onChange({ ...state, q }), 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const cityOptions = useMemo(() => {
    const src = state.province.length ? provinces.filter((p) => state.province.includes(p.name)) : provinces;
    return src.flatMap((p) => p.cities.map((c) => c.name)).sort();
  }, [state.province]);

  const sliderValue = state.max ?? TUITION_MAX;

  return (
    <div>
      <Group title="Study level">
        <div className="flex flex-wrap gap-2">
          {LEVEL_ORDER.map((l) => (
            <Chip key={l} pressed={state.level.includes(l)} onClick={() => set({ level: toggle(state.level, l) })} count={count({ level: [l] })}>
              {LEVEL_LABEL[l]}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Major">
        <label htmlFor={`${uid}-q`} className="sr-only">
          Search majors
        </label>
        <div className="relative">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id={`${uid}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Computer Science, Pharmacy"
            className={cn(inputClass, 'pl-10')}
            autoComplete="off"
          />
        </div>
      </Group>

      <Group title="Study field">
        <div className="flex flex-wrap gap-2">
          {tools.finder.fields.map((f) => (
            <Chip key={f} pressed={state.field.includes(f)} onClick={() => set({ field: toggle(state.field, f) })} className="text-left">
              {f}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Funding">
        {FUNDING.map((f) => (
          <Toggle
            key={f.id}
            label={`${f.label} (${count({ funding: Array.from(new Set([...state.funding, f.id])) })})`}
            checked={state.funding.includes(f.id)}
            onChange={() => set({ funding: toggle(state.funding, f.id) })}
          />
        ))}
        <Toggle label="No IELTS required" hint="The brochure says no IELTS or Duolingo is needed" checked={state.noielts} onChange={(v) => set({ noielts: v })} />
      </Group>

      <Group title="Teaching language">
        <div className="flex flex-wrap gap-2">
          {(['', 'English', 'Chinese'] as const).map((l) => (
            <Chip key={l || 'any'} pressed={state.lang === l} onClick={() => set({ lang: l })}>
              {l ? `${l}-taught` : 'Any'}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Maximum tuition per year">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-navy">{state.max === null ? 'Any amount' : `${fmtNumber(sliderValue)} CNY`}</span>
          {state.max !== null && currency.code !== 'CNY' && <span className="text-muted">≈ {fmtMoney(currency.toLocal(sliderValue), currency.code)}</span>}
        </div>
        <Slider
          aria-label="Maximum tuition per year in CNY"
          value={sliderValue}
          min={0}
          max={TUITION_MAX}
          step={TUITION_STEP}
          onValue={(v) => set({ max: v >= TUITION_MAX ? null : v })}
        />
        <p className="text-[12.5px] text-muted">Uses the highest tuition listed in the brochure. Programmes with no listed fee are hidden while this is on.</p>
      </Group>

      <Group title="Province">
        <div className="mb-3 overflow-hidden rounded-xl bg-navy p-2">
          <MiniMap
            aspect="5 / 4"
            compact
            showCities={false}
            selected={state.province}
            onSelect={(name) => set({ province: toggle(state.province, name), city: [] })}
            ariaLabel="Map of China: click a gold province to filter by it"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {provinces.map((p) => (
            <Chip key={p.name} pressed={state.province.includes(p.name)} onClick={() => set({ province: toggle(state.province, p.name), city: [] })} className="min-h-9 px-3 text-[13px]">
              {p.name}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="City">
        <div className="flex flex-wrap gap-1.5">
          {cityOptions.map((c) => (
            <Chip key={c} pressed={state.city.includes(c)} onClick={() => set({ city: toggle(state.city, c) })} className="min-h-9 px-3 text-[13px]">
              {c}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="More">
        <Toggle label="Top 50 in China" hint="China ranking as stated in the brochure" checked={state.top50} onChange={(v) => set({ top50: v })} />
        <Toggle label="No interview or video" checked={state.easy} onChange={(v) => set({ easy: v })} />
      </Group>
    </div>
  );
}
