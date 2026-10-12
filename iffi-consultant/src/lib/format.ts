/** Number and money formatting. Uses a fixed locale so server-rendered HTML matches the browser. */

const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDecFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function fmtNumber(n: number, decimals = 0): string {
  return decimals === 0 ? intFmt.format(Math.round(n)) : oneDecFmt.format(n);
}

export function fmtCNY(n: number): string {
  return `${fmtNumber(n)} CNY`;
}

/** Round converted amounts to a sensible precision so "41,236.9 PKR" reads as "41,240 PKR". */
export function roundForDisplay(n: number): number {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return Math.round(n / 1000) * 1000;
  if (abs >= 100_000) return Math.round(n / 100) * 100;
  if (abs >= 1_000) return Math.round(n / 10) * 10;
  if (abs >= 100) return Math.round(n);
  return Math.round(n * 10) / 10;
}

export function fmtMoney(n: number, code: string): string {
  const v = roundForDisplay(n);
  const body = Math.abs(v) < 100 && !Number.isInteger(v) ? oneDecFmt.format(v) : intFmt.format(v);
  return `${body} ${code}`;
}

export function plural(n: number, one: string, many?: string): string {
  return `${fmtNumber(n)} ${n === 1 ? one : (many ?? `${one}s`)}`;
}

/** "Bachelor, Master and PhD" */
export function joinList(items: string[], last = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}
