/**
 * Entry point for all Baraza Soroban contract clients.
 *
 * Contract IDs are read from the environment variables set during deployment
 * (see contracts/stellar/addresses/<network>.json and vercel env).
 *
 * All clients require a server-side signer secret — never use from the browser.
 */

import { PaymentAttestationClient } from './payment_attestation';
import { TreasuryVaultClient } from './treasury_vault';
import { CommunityRegistryClient } from './community_registry';
import { MembershipClient } from './membership';
import { GovernanceClient } from './governance';
import type { StellarEnv } from './client';

export type { PaymentRecord } from './payment_attestation';
export type { Community } from './community_registry';
export type { TreasuryConfig, TreasuryProposal } from './treasury_vault';
export type { GovernanceProposal, ProposalStatus } from './governance';
export type { StellarEnv };

function resolveEnv(): StellarEnv {
  const raw = process.env.STELLAR_NETWORK ?? process.env.VITE_STELLAR_NETWORK;
  return raw === 'mainnet' ? 'mainnet' : 'testnet';
}

function requireEnv(key: string): string {
  const val = process.env[key]?.trim();
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function buildConfig(contractIdEnvKey: string, signerSecretEnvKey: string) {
  return {
    contractId: requireEnv(contractIdEnvKey),
    signerSecret: requireEnv(signerSecretEnvKey),
    env: resolveEnv(),
  };
}

/** Lazily-constructed singleton clients — call within server-side code only. */
export function getPaymentAttestationClient() {
  return new PaymentAttestationClient(
    buildConfig('STELLAR_CONTRACT_PAYMENT_ATTESTATION', 'STELLAR_SIGNER_SECRET'),
  );
}

export function getTreasuryVaultClient() {
  return new TreasuryVaultClient(
    buildConfig('STELLAR_CONTRACT_TREASURY_VAULT', 'STELLAR_SIGNER_SECRET'),
  );
}

export function getCommunityRegistryClient() {
  return new CommunityRegistryClient(
    buildConfig('STELLAR_CONTRACT_COMMUNITY_REGISTRY', 'STELLAR_SIGNER_SECRET'),
  );
}

export function getMembershipClient() {
  return new MembershipClient(
    buildConfig('STELLAR_CONTRACT_MEMBERSHIP', 'STELLAR_SIGNER_SECRET'),
  );
}

export function getGovernanceClient() {
  return new GovernanceClient(
    buildConfig('STELLAR_CONTRACT_GOVERNANCE', 'STELLAR_SIGNER_SECRET'),
  );
}
