import { AnchorProvider, BN, Program, type Provider } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';

import { IDL as COMMUNITY_REGISTRY_IDL, type CommunityRegistry } from './idl/community_registry';
import { IDL as GOVERNANCE_IDL, type Governance } from './idl/governance';
import { IDL as MEMBERSHIP_IDL, type Membership } from './idl/membership';
import { IDL as PAYMENT_ATTESTATION_IDL, type PaymentAttestation } from './idl/payment_attestation';
import { IDL as TREASURY_VAULT_IDL, type TreasuryVault } from './idl/treasury_vault';
import {
  COMMUNITY_REGISTRY_PROGRAM_ID,
  GOVERNANCE_PROGRAM_ID,
  communityPda,
  govConfigPda,
  paymentConfigPda,
  proposalPda,
  treasuryVaultPda,
  voteReceiptPda,
  MEMBERSHIP_PROGRAM_ID,
  PAYMENT_ATTESTATION_PROGRAM_ID,
  TREASURY_VAULT_PROGRAM_ID,
} from './pda';

export type VoteSupportArg = 'for' | 'against' | 'abstain';

const DEFAULT_GOV_PARAMS = {
  votingDelaySlots: new BN(0),
  votingPeriodSlots: new BN(108_000),
  timelockDelaySlots: new BN(0),
  gracePeriodSlots: new BN(216_000),
  quorumBps: 500,
  approvalThresholdBps: 5001,
  proposalThresholdWeight: new BN(1),
  vetoerAuthority: null,
};

export class BarazaChainClient {
  private registry: Program<CommunityRegistry>;
  private governance: Program<Governance>;
  private membership: Program<Membership>;
  private paymentAttestation: Program<PaymentAttestation>;
  private treasuryVault: Program<TreasuryVault>;

  constructor(provider: Provider) {
    this.registry = new Program<CommunityRegistry>(
      COMMUNITY_REGISTRY_IDL,
      COMMUNITY_REGISTRY_PROGRAM_ID,
      provider,
    );
    this.governance = new Program<Governance>(
      GOVERNANCE_IDL,
      GOVERNANCE_PROGRAM_ID,
      provider,
    );
    this.membership = new Program<Membership>(
      MEMBERSHIP_IDL,
      MEMBERSHIP_PROGRAM_ID,
      provider,
    );
    this.paymentAttestation = new Program<PaymentAttestation>(
      PAYMENT_ATTESTATION_IDL,
      PAYMENT_ATTESTATION_PROGRAM_ID,
      provider,
    );
    this.treasuryVault = new Program<TreasuryVault>(
      TREASURY_VAULT_IDL,
      TREASURY_VAULT_PROGRAM_ID,
      provider,
    );
  }

  async fetchCommunity(communityKey: PublicKey) {
    return this.registry.account.communityAccount.fetchNullable(communityKey);
  }

  async fetchCommunityBySlug(slug: string) {
    const [communityKey] = communityPda(slug);
    return this.fetchCommunity(communityKey);
  }

  async fetchMembershipTier(tierKey: PublicKey) {
    return this.membership.account.membershipTierAccount.fetchNullable(tierKey);
  }

  async fetchMember(memberKey: PublicKey) {
    return this.membership.account.memberAccount.fetchNullable(memberKey);
  }

  async fetchPaymentConfig() {
    const [configKey] = paymentConfigPda();
    return this.paymentAttestation.account.paymentConfigAccount
      .fetchNullable(configKey)
      .catch(() => null);
  }

  async fetchPaymentAttestation(attestationKey: PublicKey) {
    return this.paymentAttestation.account.paymentAttestationAccount.fetchNullable(attestationKey);
  }

  async fetchGovConfig(communityKey: PublicKey) {
    const [configKey] = govConfigPda(communityKey);
    return this.governance.account.communityConfigAccount.fetchNullable(configKey);
  }

  async fetchProposal(proposalKey: PublicKey) {
    return this.governance.account.proposalAccount.fetchNullable(proposalKey);
  }

  async fetchVoteReceipt(receiptKey: PublicKey) {
    return this.governance.account.voteReceiptAccount.fetchNullable(receiptKey);
  }

  async fetchTreasuryVault(communityKey: PublicKey) {
    const [vaultKey] = treasuryVaultPda(communityKey);
    return this.treasuryVault.account.treasuryVaultAccount.fetchNullable(vaultKey);
  }

  async fetchTreasuryBalance(communityKey: PublicKey): Promise<number> {
    const [vaultKey] = treasuryVaultPda(communityKey);
    return this.treasuryVault.provider.connection.getBalance(vaultKey, 'confirmed');
  }

  async createCommunity(slug: string, name: string, metadataUri: string): Promise<string> {
    const [communityKey] = communityPda(slug);
    const sig = await this.registry.methods
      .createCommunity(slug, name, metadataUri)
      .accounts({
        community: communityKey,
        admin: this.registry.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return sig;
  }

  async initGovConfig(communityKey: PublicKey): Promise<string> {
    const [configKey] = govConfigPda(communityKey);
    const sig = await this.governance.methods
      .initializeConfig(DEFAULT_GOV_PARAMS)
      .accounts({
        community: communityKey,
        config: configKey,
        admin: this.governance.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return sig;
  }

  async ensureGovConfig(communityKey: PublicKey): Promise<void> {
    const [configKey] = govConfigPda(communityKey);
    const existing = await this.governance.account.communityConfigAccount
      .fetchNullable(configKey)
      .catch(() => null);
    if (!existing) {
      await this.initGovConfig(communityKey);
    }
  }

  async createProposal(
    communityKey: PublicKey,
    proposalId: number,
    kind: 'treasuryRelease' | 'ruleChange' | 'membershipAction' | 'text',
    metadataUri: string,
    creatorMemberKey: PublicKey,
  ): Promise<string> {
    const [configKey] = govConfigPda(communityKey);
    const [proposalKey] = proposalPda(communityKey, proposalId);
    const kindArg: Record<string, Record<string, never>> = { [kind]: {} };
    const sig = await this.governance.methods
      .createProposal(new BN(proposalId), kindArg as never, metadataUri)
      .accounts({
        community: communityKey,
        config: configKey,
        creatorMember: creatorMemberKey,
        proposal: proposalKey,
        creator: this.governance.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return sig;
  }

  async castVote(
    proposalKey: PublicKey,
    voterMemberKey: PublicKey,
    support: VoteSupportArg,
  ): Promise<string> {
    const [receiptKey] = voteReceiptPda(proposalKey, voterMemberKey);
    const supportArg: Record<string, Record<string, never>> = { [support]: {} };
    const sig = await this.governance.methods
      .castVote(supportArg as never, null)
      .accounts({
        proposal: proposalKey,
        voterMember: voterMemberKey,
        receipt: receiptKey,
        voter: this.governance.provider.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return sig;
  }

  get walletPublicKey(): PublicKey | null {
    return this.registry.provider.publicKey ?? null;
  }
}

export function createBarazaClient(
  wallet: AnchorWallet,
  connection: Connection,
): BarazaChainClient {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  return new BarazaChainClient(provider);
}

export function createBarazaReadClient(connection: Connection): BarazaChainClient {
  // A real `AnchorProvider` is required — Anchor's Program constructor calls
  // internal Set/Map operations on the wallet that crash when the provider is a
  // bare `{ connection }` object with no wallet attached.
  const dummyKeypair = Keypair.generate();
  const dummyWallet: AnchorWallet = {
    publicKey: dummyKeypair.publicKey,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  return new BarazaChainClient(provider);
}
