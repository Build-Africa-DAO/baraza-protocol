/**
 * Dues-streak math — pure, no fetches. The /api/payment-orders/streak
 * route delegates here so the algorithm is unit-testable in isolation.
 *
 * "Streak" = the number of consecutive calendar months ending at the most
 * recent confirmed payment that each contain at least one confirmed payment.
 * A gap of even one month resets the count.
 *
 * Calendar month = UTC YYYY-MM. This avoids timezone drift around month
 * boundaries (a member who pays late on the 31st in EAT versus UTC).
 */

export interface ConfirmedPayment {
  /** ISO 8601 timestamp from payment_orders.confirmed_at. */
  confirmedAt: string;
  communityId: string;
}

export interface StreakResult {
  consecutiveMonthsPaid: number;
  lastPaidAt: string | null;
  /** Per-community streak count, keyed by community_id. */
  perCommunity: Record<string, number>;
}

function monthKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function previousMonthKey(key: string): string {
  const [yearStr, monthStr] = key.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

function streakFromMonths(months: Set<string>, anchor: string | null): number {
  if (!anchor || !months.has(anchor)) return 0;
  let count = 1;
  let cursor = previousMonthKey(anchor);
  while (months.has(cursor)) {
    count += 1;
    cursor = previousMonthKey(cursor);
  }
  return count;
}

/**
 * Compute streak summary from a list of confirmed payments. Pure function;
 * the caller is responsible for filtering payment_orders to the
 * confirmed-payment statuses (`MINT_CONFIRMED`, `INDEXER_CONFIRMED`,
 * `RECONCILED`) before invoking this.
 */
export function computeStreak(payments: ConfirmedPayment[]): StreakResult {
  // Drop entries with unparseable timestamps before doing any work — they
  // can't anchor a streak and would otherwise corrupt the sort.
  const valid = payments.filter((p) => !Number.isNaN(new Date(p.confirmedAt).getTime()));
  if (valid.length === 0) {
    return { consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} };
  }

  // Sort newest first.
  const sorted = [...valid].sort(
    (a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime(),
  );

  const lastPaidAt = sorted[0].confirmedAt;
  const allMonths = new Set<string>();
  const monthsByCommunity = new Map<string, Set<string>>();

  for (const p of sorted) {
    const key = monthKey(p.confirmedAt);
    if (!key) continue;
    allMonths.add(key);
    const cm = monthsByCommunity.get(p.communityId) ?? new Set<string>();
    cm.add(key);
    monthsByCommunity.set(p.communityId, cm);
  }

  const anchorAll = monthKey(lastPaidAt);
  const consecutiveMonthsPaid = streakFromMonths(allMonths, anchorAll);

  const perCommunity: Record<string, number> = {};
  for (const [community, monthSet] of monthsByCommunity) {
    // Anchor for per-community streak is the latest month in *that* community.
    const sortedKeys = [...monthSet].sort().reverse();
    perCommunity[community] = streakFromMonths(monthSet, sortedKeys[0]);
  }

  return { consecutiveMonthsPaid, lastPaidAt, perCommunity };
}

/**
 * Statuses that count as "paid" for streak purposes. Pre-MINT statuses
 * (PAYMENT_CONFIRMED, MINT_QUEUED, MINT_SUBMITTED) are excluded — the
 * payment exists in the system but hasn't actually settled BRZA to the
 * member yet, so it would overstate standing.
 */
export const STREAK_QUALIFYING_STATUSES = [
  'MINT_CONFIRMED',
  'INDEXER_CONFIRMED',
  'RECONCILED',
] as const;

// -------- Client fetcher --------

const STREAK_CACHE_TTL_MS = 60_000;
const streakCache = new Map<string, { result: StreakResult; expiresAt: number }>();

export function clearStreakCache(): void {
  streakCache.clear();
}

export async function fetchDuesStreak(wallet: string): Promise<StreakResult> {
  if (!wallet) return { consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} };

  const cached = streakCache.get(wallet);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  try {
    const res = await fetch(`/api/payment-orders/streak?wallet=${encodeURIComponent(wallet)}`);
    if (!res.ok) {
      return { consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} };
    }
    const data = (await res.json()) as StreakResult;
    streakCache.set(wallet, { result: data, expiresAt: Date.now() + STREAK_CACHE_TTL_MS });
    return data;
  } catch {
    return { consecutiveMonthsPaid: 0, lastPaidAt: null, perCommunity: {} };
  }
}

/**
 * Batched fetch — one round trip for many wallets. Used by MemberDirectory
 * so a community of N members triggers one HTTP call instead of N. Each
 * wallet's result is cached under the same TTL as the single-wallet fetch
 * so subsequent single-wallet calls hit the cache.
 */
export async function fetchDuesStreakBatch(
  wallets: string[],
): Promise<Record<string, StreakResult>> {
  if (wallets.length === 0) return {};

  // De-dup and split into cached vs to-fetch.
  const unique = [...new Set(wallets)].filter((w) => w);
  const now = Date.now();
  const cachedHits: Record<string, StreakResult> = {};
  const toFetch: string[] = [];

  for (const w of unique) {
    const c = streakCache.get(w);
    if (c && c.expiresAt > now) cachedHits[w] = c.result;
    else toFetch.push(w);
  }

  if (toFetch.length === 0) return cachedHits;

  try {
    const res = await fetch('/api/payment-orders/streak-batch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wallets: toFetch }),
    });
    if (!res.ok) return cachedHits;
    const data = (await res.json()) as { results: Record<string, StreakResult> };
    const fresh = data.results ?? {};
    for (const [w, r] of Object.entries(fresh)) {
      streakCache.set(w, { result: r, expiresAt: now + STREAK_CACHE_TTL_MS });
    }
    return { ...cachedHits, ...fresh };
  } catch {
    return cachedHits;
  }
}
