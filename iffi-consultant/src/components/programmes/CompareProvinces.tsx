'use client';
import { useState } from 'react';
import { provinces, provinceByName } from '@/data/places';
import { LEVEL_LABEL, LEVEL_ORDER, provincePath, provinceStats } from '@/lib/programs';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Form';

const levelsLine = (name: string) => {
  const p = provinceByName.get(name)!;
  return LEVEL_ORDER.filter((l) => p.programsByLevel[l]).map((l) => `${LEVEL_LABEL[l]} ${p.programsByLevel[l]}`).join(', ');
};

/** Side-by-side figures for this province and one the visitor picks. */
export function CompareProvinces({ current }: { current: string }) {
  const others = provinces.filter((p) => p.name !== current);
  const [other, setOther] = useState(others[0].name);
  const a = provinceByName.get(current)!;
  const b = provinceByName.get(other)!;
  const statsB = provinceStats(b);
  const rows = [
    ...provinceStats(a).map((s, i) => ({ label: s.label, a: s.value, b: statsB[i].value })),
    { label: 'Levels', a: levelsLine(current), b: levelsLine(other) },
  ];
  return (
    <div className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="compare-province" className="font-display text-xl text-navy">
          Compare {current} with
        </label>
        <Select id="compare-province" value={other} onChange={(e) => setOther(e.target.value)} className="w-full sm:w-56">
          {others.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="-mx-1 mt-5 overflow-x-auto px-1">
        <table className="w-full min-w-[420px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Measure</span>
              </th>
              <th scope="col" className="py-2 font-medium text-navy">
                {current}
              </th>
              <th scope="col" className="py-2 font-medium text-navy">
                {other}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <th scope="row" className="py-2.5 pr-3 font-normal text-muted">
                  {r.label}
                </th>
                <td className="py-2.5 pr-3">{r.a}</td>
                <td className="py-2.5">{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button to={provincePath(other)} variant="outline" size="sm" className="mt-5">
        Open {other}
      </Button>
    </div>
  );
}
