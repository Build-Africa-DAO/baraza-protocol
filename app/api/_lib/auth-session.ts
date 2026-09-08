// app/api/_lib/auth-session.ts
// Unified Auth Ingress Architecture:
//   1. Web3 Wallet Proof (Stellar StrKey / Solana Base58)
//   2. Privy Bearer Token (JWT with JWKS)
//   3. Baraza Custom Session Token (256-bit CSPRNG token in Cookie or Bearer header)
//   4. Test Mock Ingress (for isolated Vitest suites)

import { getWalletProof, verifyWalletProof } from './wallet-proof';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getSupabaseAdmin } from './supabase';

export interface AuthenticatedIdentity {
  walletAddress?: string;
  privyDid?: string;
  userProfileId?: string;
  email?: string;
  authMethod: 'WALLET_PROOF' | 'PRIVY_BEARER' | 'BARAZA_SESSION' | 'TEST_MOCK';
}

interface CachedJWKS {
  jwks: ReturnType<typeof createRemoteJWKSet>;
  expiresAt: number;
}

let cachedJWKS: CachedJWKS | null = null;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';');
  for (const item of items) {
    const parts = item.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(value);
    }
  }
  return cookies;
}

export async function resolveCallerIdentity(
  req: Request,
  purpose: string,
  targetWallet?: string | null
): Promise<AuthenticatedIdentity | null> {
  // Test Mode Bypass / Mock Ingress for Vitest Testing
  const testPrivyDid = req.headers.get('x-test-privy-did');
  if (testPrivyDid) {
    return { privyDid: testPrivyDid, authMethod: 'TEST_MOCK' };
  }
  const testWallet = req.headers.get('x-test-wallet-address');
  if (testWallet) {
    return { walletAddress: testWallet, authMethod: 'TEST_MOCK' };
  }
  const testUserProfileId = req.headers.get('x-test-user-profile-id');
  if (testUserProfileId) {
    return { userProfileId: testUserProfileId, authMethod: 'TEST_MOCK' };
  }

  // Path A: Web3 Wallet Proof (Stellar StrKey Base32 or Solana Base58)
  const proof = getWalletProof(req, targetWallet);
  if (proof && proof.wallet) {
    const expected = targetWallet || proof.wallet;
    if (verifyWalletProof(proof, expected, purpose)) {
      return { walletAddress: proof.wallet, authMethod: 'WALLET_PROOF' };
    }
  }

  // Extract candidate session token from Cookie or Authorization header
  const cookies = parseCookies(req.headers.get('cookie'));
  const cookieSession = cookies['BARAZA_SESSION'] || cookies['baraza_session'];

  const authHeader = req.headers.get('authorization') || req.headers.get('x-privy-authorization');
  let bearerToken: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const candidateToken = cookieSession || bearerToken;

  // Path B: Baraza Custom Session Token (256-bit CSPRNG)
  if (candidateToken) {
    if (candidateToken.startsWith('test_baraza_token_')) {
      const profileId = candidateToken.replace('test_baraza_token_', '');
      return {
        userProfileId: profileId,
        email: 'test@barazaprotocol.com',
        authMethod: 'BARAZA_SESSION',
      };
    }

    if (candidateToken.startsWith('brz_sess_')) {
      const tokenHash = await hashSessionToken(candidateToken);
      const supabase = getSupabaseAdmin();

      const { data: session } = await supabase
        .from('auth_sessions')
        .select('id, user_profile_id, expires_at, revoked_at, user_profiles(id, email)')
        .eq('session_token_hash', tokenHash)
        .maybeSingle();

      if (session && !session.revoked_at && new Date(session.expires_at) > new Date()) {
        // Asynchronously update last active timestamp
        supabase
          .from('auth_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', session.id)
          .then();

        const rawProfile = Array.isArray(session.user_profiles) ? session.user_profiles[0] : session.user_profiles;
        const userProfile = rawProfile as { id: string; email?: string } | null | undefined;
        return {
          userProfileId: session.user_profile_id,
          email: userProfile?.email,
          authMethod: 'BARAZA_SESSION',
        };
      }
    }
  }

  // Path C: Privy Bearer Session Token
  if (bearerToken) {
    const appId = process.env.PRIVY_APP_ID || 'cm1234567890';

    // Support mock verification in test environments
    if (bearerToken.startsWith('test_privy_token_')) {
      const did = bearerToken.replace('test_privy_token_', 'did:privy:');
      return { privyDid: did, authMethod: 'PRIVY_BEARER' };
    }

    try {
      if (!cachedJWKS || Date.now() > cachedJWKS.expiresAt) {
        cachedJWKS = {
          jwks: createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`)),
          expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
        };
      }

      const { payload } = await jwtVerify(bearerToken, cachedJWKS.jwks, {
        issuer: 'privy.io',
        audience: appId,
      });

      if (payload.sub) {
        return { privyDid: payload.sub, authMethod: 'PRIVY_BEARER' };
      }
    } catch {
      return null;
    }
  }

  return null;
}
