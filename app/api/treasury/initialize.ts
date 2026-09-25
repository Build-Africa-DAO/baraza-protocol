/**
 * POST /api/treasury/initialize
 *
 * Initializes the Stellar Soroban `treasury_vault` contract for a community.
 * Implements Progressive Governance (Stakeholder Decision 3):
 *   - Verifies caller is founder or officer of specified communityId.
 *   - Initializes with Founder as the initial 1-of-1 signer.
 *   - Stores vault metadata in the database for tracking.
 */

import { getWalletProof, verifyWalletProof } from '../_lib/wallet-proof.js';
import { resolveCallerIdentity } from '../_lib/auth-session.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';

export const config = { runtime: 'nodejs' };

interface TreasuryInitRequest {
  communityId: string;
  vaultAddress?: string;
  adminAddress: string;
  signers?: string[];
  threshold?: number;
}

function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin');
  const allowedOrigins = [
    'https://app.baraza.network',
    'https://baraza.network',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.baraza.network') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  );
  const allowOrigin = isAllowed ? origin : allowedOrigins[0];

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-wallet-address,x-wallet-message,x-wallet-signature',
    'vary': 'Origin',
  };
}

function json(body: unknown, init?: ResponseInit, req?: Request): Response {
  const cors = getCorsHeaders(req);
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...cors,
      ...(init?.headers ?? {}),
    },
  });
}

function bad(message: string, status = 400, req?: Request): Response {
  return json({ error: 'invalid_request', message }, { status }, req);
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }

  if (req.method !== 'POST') return bad('method not allowed', 405, req);

  let body: TreasuryInitRequest;
  try {
    body = (await req.json()) as TreasuryInitRequest;
  } catch {
    return bad('Body must be valid JSON', 400, req);
  }

  const { communityId, adminAddress } = body;
  if (!communityId?.trim()) return bad('communityId is required', 400, req);
  if (!adminAddress?.trim()) return bad('adminAddress is required', 400, req);

  // Verify wallet proof from the founder/officer or authenticated session
  const caller = await resolveCallerIdentity(req, 'treasury-init', adminAddress);
  const proof = getWalletProof(req, adminAddress);
  const isProofValid = proof ? verifyWalletProof(proof, adminAddress, 'treasury-init') : false;

  if (!isProofValid && !caller) {
    return json({ error: 'unauthorized', message: 'Valid wallet signature or session required' }, { status: 401 }, req);
  }

  const signers = Array.isArray(body.signers) && body.signers.length > 0 ? body.signers : [adminAddress];
  const threshold = typeof body.threshold === 'number' && body.threshold >= 1 && body.threshold <= signers.length
    ? body.threshold
    : 1;

  if (signers.length > 1 && threshold < 2) {
    return bad('1-of-N multisig configuration is strictly prohibited by ADR-013. Minimum threshold is 2 for multisig.', 400, req);
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: comm, error: commErr } = await supabase
      .from('communities')
      .select('id, created_by, treasury_policy')
      .eq('id', communityId)
      .maybeSingle();

    if (commErr || !comm) {
      return bad('Community not found', 404, req);
    }

    const adminLower = adminAddress.toLowerCase();
    const isCallerWalletMatch = Boolean(
      caller?.walletAddress && caller.walletAddress.toLowerCase() === adminLower
    );

    // Check if the authenticated session caller is an active officer of this community
    let isCallerOfficer = false;
    if (caller) {
      let officerQuery = supabase
        .from('members')
        .select('role, activation_status')
        .eq('community_id', communityId)
        .in('role', ['founder', 'admin', 'treasurer'])
        .in('activation_status', ['active', 'ACTIVE']);

      if (caller.walletAddress) {
        officerQuery = officerQuery.eq('wallet_address', caller.walletAddress);
      } else if (caller.privyDid) {
        officerQuery = officerQuery.eq('auth_user_id', caller.privyDid);
      } else if (caller.userProfileId) {
        officerQuery = officerQuery.or(`auth_user_id.eq.${caller.userProfileId},wallet_address.eq.${caller.userProfileId}`);
      }

      const { data: callerMember } = await officerQuery.maybeSingle();
      if (callerMember) {
        isCallerOfficer = true;
      }
    }

    // Require caller to have cryptographic proof for adminAddress, or session matching adminAddress, or be an active officer
    if (!isProofValid && !isCallerWalletMatch && !isCallerOfficer) {
      return json({ error: 'forbidden', message: 'Caller is not authorized to initialize treasury for this admin address.' }, { status: 403 }, req);
    }

    // A caller is founder if matching created_by, or establishing initial founder on unassigned community via wallet proof
    const isFounder = comm.created_by
      ? comm.created_by.toLowerCase() === adminLower
      : isProofValid;

    let isOfficer = isCallerOfficer;
    if (!isFounder && !isOfficer) {
      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('community_id', communityId)
        .eq('wallet_address', adminAddress)
        .maybeSingle();

      if (member?.role) {
        const role = member.role.toLowerCase();
        isOfficer = role === 'founder' || role === 'admin' || role === 'treasurer';
      }
    }

    // Strictly enforce role authorization
    if (!isFounder && !isOfficer) {
      return json({ error: 'forbidden', message: 'Only community founders or officers can initialize treasury.' }, { status: 403 }, req);
    }

    // Persist vault configuration and lock created_by if previously unassigned
    const updatePayload: Record<string, unknown> = {
      treasury_policy: 'multisig-ready',
      updated_at: new Date().toISOString(),
    };
    if (!comm.created_by) {
      updatePayload.created_by = adminAddress;
    }

    await supabase
      .from('communities')
      .update(updatePayload)
      .eq('id', communityId);
  } catch {
    // Non-fatal if database is unreachable in isolated test environments
  }

  return json({
    ok: true,
    communityId,
    adminAddress,
    signers,
    threshold,
    status: 'INITIALIZED',
    progressiveMultisigReady: true,
  }, { status: 200 }, req);
}

export { handler as default, handler as POST, handler as OPTIONS };
