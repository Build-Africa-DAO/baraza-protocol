export const config = { runtime: 'nodejs' };

interface CommunityCreateRequest {
  name: string;
  type: string;
  description: string;
  membershipFee: number;
  chain?: string;
  quorumPct?: number;
  approvalThresholdPct?: number;
  votingPeriodDays?: number;
  treasuryPolicy?: string;
  paybillNumber?: string;
  ussdShortcode?: string;
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'content-type' },
    });
  }

  if (req.method !== 'POST') return bad('method not allowed', 405);

  let body: CommunityCreateRequest;
  try {
    body = await req.json() as CommunityCreateRequest;
  } catch {
    return bad('invalid JSON body');
  }

  const { name, type, description, membershipFee } = body;
  if (!name?.trim()) return bad('name is required');
  if (!type?.trim()) return bad('type is required');
  if (!description?.trim()) return bad('description is required');
  if (typeof membershipFee !== 'number' || membershipFee < 0) return bad('membershipFee must be a non-negative number');

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    return json({ persisted: false, message: 'Supabase not configured' }, { status: 200 });
  }

  const chain = body.chain ?? 'solana';
  const quorumPct = body.quorumPct ?? 51;
  const approvalThresholdPct = body.approvalThresholdPct ?? 66;
  const votingPeriodDays = body.votingPeriodDays ?? 7;
  const treasuryPolicy = body.treasuryPolicy ?? 'multisig-ready';

  function initials(n: string): string {
    return n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'BR';
  }

  const row = {
    name: name.trim(),
    type: type.trim(),
    description: description.trim(),
    membership_fee: membershipFee,
    member_count: 0,
    fund_balance: 0,
    active_decisions: 0,
    image: initials(name),
    chain,
    quorum_pct: quorumPct,
    approval_threshold_pct: approvalThresholdPct,
    voting_period_days: votingPeriodDays,
    treasury_policy: treasuryPolicy,
    paybill_number: body.paybillNumber ?? null,
    ussd_shortcode: body.ussdShortcode ?? null,
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/communities`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.status.toString());
    console.error('[api/communities] Supabase insert failed:', detail);
    return json({ error: 'db_error', message: 'Failed to persist community', detail }, { status: 502 });
  }

  const rows = await res.json() as unknown[];
  const created = Array.isArray(rows) ? rows[0] : rows;
  return json({ persisted: true, community: created }, { status: 201 });
}
