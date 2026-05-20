import { AnchorProvider, BN, Program, type Provider } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';

import { IDL as COMMUNITY_REGISTRY_IDL, type CommunityRegistry } from './idl/community_registry';
import { IDL as GOVERNANCE_IDL, type Governance } from './idl/governance';
import {
  COMMUNITY_REGISTRY_PROGRAM_ID,
  GOVERNANCE_PROGRAM_ID,
  communityPda,
  govConfigPda,
  proposalPda,
  voteReceiptPda,
} from './pda';

export type VoteSupportArg = 'for' | 'against' | 'abstain';

const DEFAULT_GOV_PARAMS = {
  proposalMaxVotingTime: new BN(7 * 24 * 60 * 60), // 7 days in seconds
  quorumVotes: new BN(1),
  voteThresholdBps: 5001, // simple majority
  proposalLimit: null,
  vetoAuthority: null,
};

export class BarazaChainClient {
  private registry: Program<CommunityRegistry>;
  private governance: Program<Governance>;

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
