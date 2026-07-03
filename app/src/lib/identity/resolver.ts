/**
 * Identity resolver (Phase 9). Maps wallet_address OR phone-identity-key
 * to the canonical phone_hash when one is linked.
 *
 * Council ruling 2026-06-19 (filings 351d, 18f8, 4c43, f025): phone_hash
 * is canonical. This resolver is the single function the rest of the
 * stack calls when it needs to ask "what's the canonical identity for
 * this input?".
 *
 * Returns null when no link exists — the caller falls back to the input
 * as-is (the existing behaviour before phase 9). This makes the resolver
 * a non-breaking add: existing code paths continue to work; only code
 * that explicitly resolves benefits from continuity.
 *
 * Cache: in-memory, 5-minute TTL. Identity links are append-only and
 * rarely change, so even a stale read is correct most of the time.
 */

export interface CanonicalIdentity {
  /** Canonical phone_hash (HMAC of phone under PAYMENT_PHONE_HASH_PEPPER). */
  phoneHash: string;
  /** All wallets ever linked to this phone_hash. */
  walletAddresses: string[];
  /** Earliest linked_at across the cluster, ISO 8601. */
  earliestLinkedAt: string;
}

const RESOLVER_CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { result: CanonicalIdentity | null; expiresAt: number }>();

export function __clearResolverCacheForTests(): void {
  cache.clear();
}

interface IdentityLinkRow {
  phone_hash: string;
  wallet_address: string;
  linked_at: string;
}

/**
 * Resolve a wallet_address OR an existing phone-identity-key
 * (`phone:+254...`) to a canonical identity. Returns null when nothing
 * is linked.
 *
 * No-op when Supabase env is not configured — returns null and the caller
 * falls back to the input as before.
 */
export async function resolveCanonicalIdentity(input: string): Promise<CanonicalIdentity | null> {
  if (!input) return null;

  const cached = cache.get(input);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    cache.set(input, { result: null, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
    return null;
  }

  // Phone-identity input — strip the prefix, hash, then query by phone_hash.
  // Wallet input — query by wallet_address, get phone_hash, then refetch
  // the cluster of all wallets sharing that phone_hash.
  let phoneHash: string | null = null;

  try {
    if (input.startsWith('phone:')) {
      const phone = input.slice('phone:'.length);
      const { hashPhoneNumber } = await import('./claim.js');
      phoneHash = await hashPhoneNumber(phone);
    } else {
      const params = new URLSearchParams({
        wallet_address: `eq.${input}`,
        select: 'phone_hash,wallet_address,linked_at',
        limit: '1',
      }).toString();
      const res = await fetch(`${url}/rest/v1/identity_links?${params}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (res.ok) {
        const rows = (await res.json().catch(() => [])) as IdentityLinkRow[];
        if (rows[0]) phoneHash = rows[0].phone_hash;
      }
    }
  } catch {
    phoneHash = null;
  }

  if (!phoneHash) {
    cache.set(input, { result: null, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
    return null;
  }

  try {
    const params = new URLSearchParams({
      phone_hash: `eq.${phoneHash}`,
      select: 'phone_hash,wallet_address,linked_at',
      order: 'linked_at.asc',
    }).toString();
    const res = await fetch(`${url}/rest/v1/identity_links?${params}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) {
      cache.set(input, { result: null, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
      return null;
    }
    const rows = (await res.json().catch(() => [])) as IdentityLinkRow[];
    if (rows.length === 0) {
      cache.set(input, { result: null, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
      return null;
    }
    const result: CanonicalIdentity = {
      phoneHash,
      walletAddresses: rows.map((r) => r.wallet_address),
      earliestLinkedAt: rows[0].linked_at,
    };
    cache.set(input, { result, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
    // Also warm cache for each wallet in the cluster so subsequent
    // single-wallet lookups hit immediately.
    for (const w of result.walletAddresses) {
      cache.set(w, { result, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
    }
    return result;
  } catch {
    cache.set(input, { result: null, expiresAt: Date.now() + RESOLVER_CACHE_TTL_MS });
    return null;
  }
}
