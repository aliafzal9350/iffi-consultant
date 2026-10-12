'use client';
import { fmtMoney } from '@/lib/format';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

/** Hand-drawn SVG donut (no chart library). Values in the display currency. */
export function CostDonut({ slices, code, centerLabel, centerValue }: { slices: Slice[]; code: string; centerLabel: string; centerValue: string }) {
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
          <text x="90" y="84" textAnchor="middle" fontSize="11" fill="#697185" fontFamily="Poppins, sans-serif">
            {centerLabel}
          </text>
          <text x="90" y="104" textAnchor="middle" fontSize="15" fontWeight="600" fill="#0d1f3f" fontFamily="Fraunces, serif">
            {centerValue}
          </text>
        </g>
      </svg>
      <ul className="w-full space-y-2.5 text-[14.5px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
            <span className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </span>
            <span className="tabular font-medium text-navy">{fmtMoney(s.value, code)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
