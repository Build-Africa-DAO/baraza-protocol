/**
 * Membership activation — durable Supabase write triggered by the client
 * when JoinStatus observes a payment order reach a terminal positive state
 * (INDEXER_CONFIRMED or RECONCILED).
 *
 * Server-side gating:
 *   1. Order must exist in `payment_orders` with status >= INDEXER_CONFIRMED.
 *   2. Idempotent — duplicate POSTs with the same (community_id, wallet_address)
 *      return 200 with the existing record.
 *
 * Client always also calls `recordActiveMembership()` locally so the dashboard
 * recognises the user immediately even if the Supabase insert is async/slow.
 */

export const config = { runtime: 'edge' };

interface ActivateRequest {
  orderId: string;
  communityId: string;
  /** Solana base58 pubkey. Required unless phoneIdentifier is provided. */
  walletAddress: string | null;
  /** phone:+254... identifier for phone-only users with no wallet. */
  phoneIdentifier?: string | null;
  activationSecret: string;
}

interface PaymentOrderRow {
  status: string;
  community_id: string;
  activation_secret_hash: string | null;
  wallet_address: string | null;
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      ...(init?.headers ?? {}),
    },
  });
}

function bad(message: string, status = 400): Response {
  return json({ error: 'invalid_request', message }, { status });
}

const TERMINAL_POSITIVE_STATUSES = new Set([
  'INDEXER_CONFIRMED',
  'RECONCILED',
]);

async function fetchOrder(url: string, serviceKey: string, orderId: string): Promise<PaymentOrderRow | null> {
  const res = await fetch(
    `${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}&select=status,community_id,activation_secret_hash,wallet_address`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json().catch(() => [])) as PaymentOrderRow[];
  return rows[0] ?? null;
}

async function hashActivationSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function bindOrderWallet(
  url: string,
  serviceKey: string,
  orderId: string,
  walletAddress: string,
): Promise<boolean> {
  const res = await fetch(
    `${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}&wallet_address=is.null`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ wallet_address: walletAddress }),
    },
  );
  return res.ok;
}

async function findExistingMembership(
  url: string,
  serviceKey: string,
  communityId: string,
  walletAddress: string,
): Promise<{ member_id: string; status: string } | null> {
  const params = new URLSearchParams({
    community_id: `eq.${communityId}`,
    wallet_address: `eq.${walletAddress}`,
    select: 'member_id,status',
  });
  const res = await fetch(`${url}/rest/v1/memberships?${params.toString()}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json().catch(() => [])) as Array<{ member_id: string; status: string }>;
  return rows.find((r) => r.status === 'ACTIVE' || r.status === 'PENDING') ?? null;
}

async function insertMembership(
  url: string,
  serviceKey: string,
  payload: {
    member_id: string;
    community_id: string;
    user_id_hash: string;
    wallet_address: string;
    payment_order_id: string;
  },
): Promise<{ ok: boolean; duplicate: boolean; detail?: string }> {
  const res = await fetch(`${url}/rest/v1/memberships`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ...payload,
      status: 'ACTIVE',
      voting_weight: 1,
      activated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Partial unique index `memberships_active_community_wallet_unique` fires
    // when a parallel request beat us to the insert. Treat as "already exists"
    // rather than 500ing the caller.
    const isDuplicate = res.status === 409 ||
      /duplicate key|23505|memberships_active_community_wallet_unique/i.test(detail);
    return { ok: false, duplicate: isDuplicate, detail };
  }
  return { ok: true, duplicate: false };
}

function generateMemberId(): string {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json({
      ok: false,
      persisted: false,
      reason: 'supabase_not_configured',
      note: 'Membership recorded locally only. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable durable writes.',
    });
  }

  let body: ActivateRequest;
  try {
    body = (await req.json()) as ActivateRequest;
  } catch {
    return bad('Body must be valid JSON');
  }

  if (!body.orderId) return bad('orderId is required');
  if (!body.communityId) return bad('communityId is required');
  if (!body.walletAddress && !body.phoneIdentifier) return bad('walletAddress or phoneIdentifier is required');
  if (!body.activationSecret) return bad('activationSecret is required');

  // Resolve the effective identity address.
  // walletAddress takes priority; phoneIdentifier is the fallback for phone-only flows.
  const effectiveAddress = body.walletAddress ?? body.phoneIdentifier!;

  // Gate: order must be in a terminal positive state.
  const order = await fetchOrder(url, serviceKey, body.orderId);
  if (!order) {
    return bad(`Order ${body.orderId} not found`, 404);
  }
  if (order.community_id !== body.communityId) {
    return bad(
      `Order ${body.orderId} belongs to a different community.`,
      403,
    );
  }
  if (!TERMINAL_POSITIVE_STATUSES.has(order.status)) {
    return bad(
      `Order ${body.orderId} is in status ${order.status}; activation requires INDEXER_CONFIRMED or RECONCILED.`,
      409,
    );
  }
  if (!order.activation_secret_hash) {
    return bad(`Order ${body.orderId} cannot be activated because it was created without an activation secret.`, 409);
  }
  if (await hashActivationSecret(body.activationSecret) !== order.activation_secret_hash) {
    return bad('Activation secret does not match this payment order.', 403);
  }
  if (order.wallet_address && order.wallet_address !== effectiveAddress) {
    return bad('Order is already bound to a different identity.', 403);
  }
  if (!order.wallet_address) {
    await bindOrderWallet(url, serviceKey, body.orderId, effectiveAddress);
  }

  // Idempotent: return existing membership if one already exists.
  const existing = await findExistingMembership(url, serviceKey, body.communityId, effectiveAddress);
  if (existing) {
    return json({
      ok: true,
      persisted: true,
      memberId: existing.member_id,
      status: existing.status,
      created: false,
    });
  }

  // user_id_hash: wallet-derived for wallet users, phone-derived for phone-only.
  // Production replaces both with the HMAC-peppered phone hash from auth.
  const userIdHash = effectiveAddress;

  const memberId = generateMemberId();
  const result = await insertMembership(url, serviceKey, {
    member_id: memberId,
    community_id: body.communityId,
    user_id_hash: userIdHash,
    wallet_address: effectiveAddress,
    payment_order_id: body.orderId,
  });

  if (!result.ok) {
    if (result.duplicate) {
      const winner = await findExistingMembership(url, serviceKey, body.communityId, effectiveAddress);
      if (winner) {
        return json({
          ok: true,
          persisted: true,
          memberId: winner.member_id,
          status: winner.status,
          created: false,
        });
      }
    }
    return json({ ok: false, persisted: false, error: result.detail }, { status: 500 });
  }

  return json({ ok: true, persisted: true, memberId, status: 'ACTIVE', created: true });
}
