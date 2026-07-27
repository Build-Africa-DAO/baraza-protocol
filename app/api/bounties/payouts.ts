import { randomUUID, timingSafeEqual } from 'node:crypto';

export const config = { runtime: 'nodejs' };

type PayoutAsset = 'USDC' | 'USDT' | 'G$';
type PayoutAction = 'create' | 'approve' | 'submit' | 'confirm' | 'fail';

interface PayoutRequest {
  action: PayoutAction;
  payoutId?: string;
  bountyId?: string;
  submissionId?: string;
  asset?: PayoutAsset;
  requiredApprovals?: number;
  idempotencyKey?: string;
  approverWallet?: string;
  assetAmount?: string;
  provider?: string;
  providerReference?: string;
  txHash?: string;
  explorerUrl?: string;
  reason?: string;
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

function authorized(req: Request): boolean {
  const expected = process.env.BOUNTY_PAYOUT_COORDINATOR_SECRET?.trim();
  const value = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!expected || !value) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}

function configuration(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

async function db(path: string, init: RequestInit = {}): Promise<Response> {
  const config = configuration();
  if (!config) throw new Error('Bounty payout storage is not configured.');
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function rows<T>(response: Response): Promise<T[]> {
  if (!response.ok) {
    const detail = await response.text().catch(() => String(response.status));
    throw new Error(detail || `Database request failed (${response.status}).`);
  }
  const value = await response.json().catch(() => []);
  return Array.isArray(value) ? value as T[] : [];
}

async function event(payoutId: string, eventType: string, actor?: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const response = await db('bounty_payout_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ payout_id: payoutId, event_type: eventType, actor: actor ?? null, metadata }),
  });
  if (!response.ok) console.warn('[bounty-payouts] audit event failed', response.status);
}

async function createPayout(body: PayoutRequest): Promise<Response> {
  if (!body.bountyId || !body.submissionId) return bad('bountyId and submissionId are required.');
  const asset = body.asset ?? 'USDC';
  if (!['USDC', 'USDT', 'G$'].includes(asset)) return bad('Unsupported payout asset.');
  const requiredApprovals = body.requiredApprovals ?? 2;
  if (!Number.isInteger(requiredApprovals) || requiredApprovals < 1 || requiredApprovals > 10) {
    return bad('requiredApprovals must be between 1 and 10.');
  }

  const idempotencyKey = body.idempotencyKey?.trim() || `bounty:${body.bountyId}:submission:${body.submissionId}`;
  const existing = await rows<Record<string, unknown>>(await db(
    `bounty_payouts?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=*`,
  ));
  if (existing[0]) return json({ payout: existing[0], idempotent: true });

  const bounties = await rows<{ id: string; community_id: string; reward_kes: number | string; status: string }>(await db(
    `bounties?id=eq.${encodeURIComponent(body.bountyId)}&select=id,community_id,reward_kes,status`,
  ));
  const bounty = bounties[0];
  if (!bounty) return bad('Bounty not found.', 404);
  if (bounty.status !== 'awarded') return bad('Work must be approved before creating a payout.', 409);

  const submissions = await rows<{
    id: string;
    bounty_id: string;
    contributor: string;
    contributor_wallet: string | null;
    status: string;
    creator_approved_at: string | null;
    admin_approved_at: string | null;
  }>(await db(
    `bounty_submissions?id=eq.${encodeURIComponent(body.submissionId)}&select=id,bounty_id,contributor,contributor_wallet,status,creator_approved_at,admin_approved_at`,
  ));
  const submission = submissions[0];
  if (!submission || submission.bounty_id !== bounty.id) return bad('Approved submission not found.', 404);
  if (submission.status !== 'approved') return bad('Submission has not been approved.', 409);
  if (!submission.creator_approved_at || !submission.admin_approved_at) {
    return bad('Creator and community admin approval are both required.', 409);
  }
  if (!submission.contributor_wallet) return bad('Contributor wallet is required before payout.', 409);

  const payout = {
    id: `pay_${randomUUID().replace(/-/g, '')}`,
    bounty_id: bounty.id,
    community_id: bounty.community_id,
    submission_id: submission.id,
    recipient_wallet: submission.contributor_wallet,
    recipient_name: submission.contributor,
    amount_kes: Number(bounty.reward_kes),
    asset,
    required_approvals: requiredApprovals,
    status: 'awaiting_approval',
    idempotency_key: idempotencyKey,
  };
  const created = await rows<Record<string, unknown>>(await db('bounty_payouts', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payout),
  }));
  await event(payout.id, 'payout_created', undefined, { asset, requiredApprovals });
  return json({ payout: created[0] ?? payout, idempotent: false }, { status: 201 });
}

async function approvePayout(body: PayoutRequest): Promise<Response> {
  if (!body.payoutId || !body.approverWallet?.trim()) return bad('payoutId and approverWallet are required.');
  const payouts = await rows<{ id: string; status: string; required_approvals: number }>(await db(
    `bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}&select=id,status,required_approvals`,
  ));
  const payout = payouts[0];
  if (!payout) return bad('Payout not found.', 404);
  if (!['awaiting_approval', 'ready'].includes(payout.status)) return bad('Payout is not accepting approvals.', 409);

  const approvalResponse = await db('bounty_payout_approvals?on_conflict=payout_id,approver_wallet', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ payout_id: payout.id, approver_wallet: body.approverWallet.trim() }),
  });
  if (!approvalResponse.ok) return bad('Could not record payout approval.', 502);

  const approvals = await rows<{ approver_wallet: string }>(await db(
    `bounty_payout_approvals?payout_id=eq.${encodeURIComponent(payout.id)}&select=approver_wallet`,
  ));
  const status = approvals.length >= payout.required_approvals ? 'ready' : 'awaiting_approval';
  const updated = await rows<Record<string, unknown>>(await db(`bounty_payouts?id=eq.${encodeURIComponent(payout.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  }));
  await event(payout.id, 'approval_recorded', body.approverWallet.trim(), { approvalCount: approvals.length, status });
  return json({ payout: updated[0], approvalCount: approvals.length });
}

async function submitPayout(body: PayoutRequest): Promise<Response> {
  if (!body.payoutId || !body.assetAmount || Number(body.assetAmount) <= 0) return bad('payoutId and a valid assetAmount are required.');
  const payouts = await rows<{ id: string; status: string }>(await db(
    `bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}&select=id,status`,
  ));
  if (!payouts[0]) return bad('Payout not found.', 404);
  if (payouts[0].status !== 'ready') return bad('Multisig approval threshold has not been reached.', 409);

  const attempt = await db('bounty_payout_attempts', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      payout_id: body.payoutId,
      provider: body.provider?.trim() || 'community-multisig',
      provider_reference: body.providerReference?.trim() || null,
      status: 'submitted',
    }),
  });
  if (!attempt.ok) return bad('Could not record payout submission.', 502);
  const updated = await rows<Record<string, unknown>>(await db(`bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ asset_amount: Number(body.assetAmount), status: 'processing', updated_at: new Date().toISOString() }),
  }));
  await event(body.payoutId, 'settlement_submitted', undefined, { provider: body.provider ?? 'community-multisig' });
  return json({ payout: updated[0] });
}

async function confirmPayout(body: PayoutRequest): Promise<Response> {
  if (!body.payoutId || !body.txHash?.trim()) return bad('payoutId and txHash are required.');
  const payouts = await rows<{ id: string; bounty_id: string; status: string }>(await db(
    `bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}&select=id,bounty_id,status`,
  ));
  const payout = payouts[0];
  if (!payout) return bad('Payout not found.', 404);
  if (payout.status !== 'processing') return bad('Only a submitted payout can be confirmed.', 409);
  const now = new Date().toISOString();
  const updated = await rows<Record<string, unknown>>(await db(`bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'paid', tx_hash: body.txHash.trim(), explorer_url: body.explorerUrl?.trim() || null, paid_at: now, updated_at: now }),
  }));
  const bountyUpdate = await db(`bounties?id=eq.${encodeURIComponent(payout.bounty_id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'paid', payout_tx_hash: body.txHash.trim() }),
  });
  if (!bountyUpdate.ok) return bad('Settlement confirmed but bounty reconciliation failed.', 502);
  await event(body.payoutId, 'settlement_confirmed', undefined, { txHash: body.txHash.trim() });
  return json({ payout: updated[0] });
}

async function failPayout(body: PayoutRequest): Promise<Response> {
  if (!body.payoutId) return bad('payoutId is required.');
  const updated = await rows<Record<string, unknown>>(await db(`bounty_payouts?id=eq.${encodeURIComponent(body.payoutId)}&status=neq.paid`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'failed', failure_reason: body.reason?.trim() || 'Settlement failed.', updated_at: new Date().toISOString() }),
  }));
  if (!updated[0]) return bad('Payout not found or already paid.', 409);
  await event(body.payoutId, 'settlement_failed', undefined, { reason: body.reason ?? 'Settlement failed.' });
  return json({ payout: updated[0] });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'authorization,content-type',
      },
    });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const payoutId = url.searchParams.get('payoutId');
    const bountyId = url.searchParams.get('bountyId');
    if (!payoutId && !bountyId) return bad('payoutId or bountyId is required.');
    try {
      const filter = payoutId
        ? `payout_id=eq.${encodeURIComponent(payoutId)}`
        : `bounty_id=eq.${encodeURIComponent(bountyId ?? '')}`;
      const receipts = await rows<Record<string, unknown>>(await db(`public_bounty_payout_receipts?${filter}&select=*`));
      return receipts[0] ? json({ receipt: receipts[0] }) : bad('Receipt not found.', 404);
    } catch (error) {
      return bad(error instanceof Error ? error.message : 'Receipt lookup failed.', 503);
    }
  }

  if (req.method !== 'POST') return bad('method not allowed', 405);
  if (!authorized(req)) return bad('Trusted payout coordinator authorization required.', 401);

  let body: PayoutRequest;
  try {
    body = await req.json() as PayoutRequest;
  } catch {
    return bad('invalid JSON body');
  }

  try {
    if (body.action === 'create') return createPayout(body);
    if (body.action === 'approve') return approvePayout(body);
    if (body.action === 'submit') return submitPayout(body);
    if (body.action === 'confirm') return confirmPayout(body);
    if (body.action === 'fail') return failPayout(body);
    return bad('Unsupported payout action.');
  } catch (error) {
    console.error('[bounty-payouts]', error);
    return bad('Bounty payout service is unavailable.', 503);
  }
}
