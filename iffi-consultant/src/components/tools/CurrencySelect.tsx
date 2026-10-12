'use client';
import { CURRENCIES } from '@/lib/currency';
import { Select } from '@/components/ui/Form';

const MAJORS = ['USD', 'GBP', 'EUR', 'CNY'];

/** Currency picker: the 38 markets from the keyword research plus USD, GBP, EUR and CNY. */
export function CurrencySelect({
  value,
  onChange,
  id,
  describedBy,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  describedBy?: string;
  className?: string;
}) {
  const markets = CURRENCIES.filter((c) => !MAJORS.includes(c.code)).sort((a, b) => a.country.localeCompare(b.country));
  const majors = CURRENCIES.filter((c) => MAJORS.includes(c.code));
  return (
    <Select id={id} aria-describedby={describedBy} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <optgroup label="By country">
        {markets.map((c) => (
          <option key={c.code} value={c.code}>
            {c.country} ({c.code})
          </option>
        ))}
      </optgroup>
      <optgroup label="Major currencies">
        {majors.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.country})
          </option>
        ))}
      </optgroup>
    </Select>
  );
}
