/**
 * Money formatting for group screens (decision §9.6 in
 * `frontend-post-login-audit.md`).
 *
 * Every amount that belongs to a group is shown in that group's currency, code
 * first: `KES 1,200`. Nothing here converts between currencies. The viewer's
 * account country only seeds defaults when starting a new group.
 */

const DEFAULT_CURRENCY = 'KES';

/** Minor units per major unit. Every currency Baraza lists today uses 100. */
const MINOR_PER_MAJOR = 100;

function normaliseCurrency(currency: string | null | undefined): string {
  const code = (currency ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : DEFAULT_CURRENCY;
}

function formatNumber(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  const hasFraction = Math.abs(amount - Math.round(amount)) > 0.004;
  return amount.toLocaleString('en-KE', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  });
}

/** Format a major-unit amount, e.g. `formatMajor(1200, 'KES')` → `KES 1,200`. */
export function formatMajor(amount: number, currency: string | null | undefined = DEFAULT_CURRENCY): string {
  const code = normaliseCurrency(currency);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${code} ${formatNumber(Math.abs(amount))}`;
}

/** Format a minor-unit amount, e.g. `formatMoney(120050, 'KES')` → `KES 1,200.50`. */
export function formatMoney(amountMinor: number, currency: string | null | undefined = DEFAULT_CURRENCY): string {
  return formatMajor(amountMinor / MINOR_PER_MAJOR, currency);
}

/** The currency a group's money is shown in. Falls back to KES, the launch rail. */
export function groupCurrency(community: { currency?: string | null } | null | undefined): string {
  return normaliseCurrency(community?.currency);
}

export { DEFAULT_CURRENCY };
