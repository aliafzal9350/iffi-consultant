'use client';
import { fmtCNY } from '@/lib/format';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

/** Hand-drawn SVG donut (no chart library). Values in RMB. */
export function CostDonut({ slices, centerLabel, centerValue }: { slices: Slice[]; centerLabel: string; centerValue: string }) {
  const total = slices.reduce((n, s) => n + Math.max(0, s.value), 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label={`Cost split: ${slices.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}`}>
        <g transform="rotate(-90 90 90)">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#e7eaf1" strokeWidth="22" />
        {slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const len = (s.value / total) * c;
            const el = <circle key={s.label} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="22" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </g>
        <g>
          <text x="90" y="84" textAnchor="middle" fontSize="11" fill="#5f6779" style={{ fontFamily: 'var(--font-sans)' }}>
            {centerLabel}
          </text>
          <text x="90" y="104" textAnchor="middle" fontSize="15" fontWeight="600" fill="#0d1f3f" style={{ fontFamily: 'var(--font-display)' }}>
            {centerValue}
          </text>
        </g>
      </svg>
      <ul className="w-full space-y-2.5 text-[14.5px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </span>
            <span className="tabular shrink-0 whitespace-nowrap font-medium text-navy">{fmtCNY(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
