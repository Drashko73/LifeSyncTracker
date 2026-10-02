import { Currency } from '../models';

const CODES: Record<Currency, string> = {
  [Currency.USD]: 'USD',
  [Currency.EUR]: 'EUR',
  [Currency.RSD]: 'RSD',
};

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** ISO code for a Currency enum value. */
export function currencyCode(currency: Currency): string {
  return CODES[currency] ?? 'USD';
}

/**
 * Formats money with Intl, e.g. "€4,820" or "+€206.25".
 * `sign` prefixes + for positive and a true minus (−) for negative amounts.
 */
export function formatMoney(
  amount: number,
  currency: Currency,
  opts: { decimals?: 0 | 2; sign?: boolean } = {},
): string {
  const decimals = opts.decimals ?? 2;
  const key = `${currency}|${decimals}`;
  let fmt = moneyFormats.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode(currency),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    moneyFormats.set(key, fmt);
  }
  const text = fmt.format(Math.abs(amount));
  if (amount < 0) return `−${text}`;
  return opts.sign && amount > 0 ? `+${text}` : text;
}

/** "3h 05m" from minutes. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** "12.5" from hours (one decimal). */
export function formatHours(hours: number): string {
  return (Math.round(hours * 10) / 10).toFixed(1);
}

/** Soft tinted background for a category/project color. */
export function tint(color: string | undefined, pct = 14): string {
  return `color-mix(in oklab, ${color || 'var(--muted)'} ${pct}%, transparent)`;
}

/** "1 Apr – 2 Oct 2026" (year shown once when both dates share it). */
export function formatRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const a = start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
  const b = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${a} – ${b}`;
}

/** Local calendar-day key, e.g. "2026-10-02". */
export function dayKey(d: Date | string): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Percent change, or null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  return previous ? ((current - previous) / previous) * 100 : null;
}
