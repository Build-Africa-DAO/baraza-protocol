import { arg, invokeContract, type ContractClientConfig } from './client';

export interface TreasuryConfig {
  community_id: string;
  token: string;
  signers: string[];
  threshold: number;
}

export interface TreasuryProposal {
  id: bigint;
  to: string;
  amount: bigint;
  memo: string;
  approvals: string[];
  executed: boolean;
  created_at: bigint;
}

export class TreasuryVaultClient {
  constructor(private readonly config: ContractClientConfig) {}

  async initialize(params: {
    communityId: string;
    token: string;
    signers: string[];
    threshold: number;
  }): Promise<void> {
    const { nativeToScVal } = await import('@stellar/stellar-sdk');
    const signersVal = nativeToScVal(params.signers, { type: 'address' });
    await invokeContract(this.config, 'initialize', [
      arg.string(params.communityId),
      arg.address(params.token),
      signersVal,
      arg.u32(params.threshold),
    ]);
  }

  async propose(params: {
    proposer: string;
    to: string;
    amount: bigint;
    memo: string;
  }): Promise<bigint> {
    return invokeContract<bigint>(this.config, 'propose', [
      arg.address(params.proposer),
      arg.address(params.to),
      arg.i128(params.amount),
      arg.string(params.memo),
    ]);
  }

  async approve(signer: string, proposalId: bigint): Promise<void> {
    await invokeContract(this.config, 'approve', [
      arg.address(signer),
      arg.u64(proposalId),
    ]);
  }

  async execute(proposalId: bigint): Promise<void> {
    await invokeContract(this.config, 'execute', [arg.u64(proposalId)]);
  }

  async deposit(from: string, amount: bigint): Promise<void> {
    await invokeContract(this.config, 'deposit', [
      arg.address(from),
      arg.i128(amount),
    ]);
  }

  async balance(): Promise<bigint> {
    return invokeContract<bigint>(this.config, 'balance');
  }

  async getProposal(proposalId: bigint): Promise<TreasuryProposal | null> {
    return invokeContract<TreasuryProposal | null>(this.config, 'get_proposal', [
      arg.u64(proposalId),
    ]);
  }

  async getConfig(): Promise<TreasuryConfig> {
    return invokeContract<TreasuryConfig>(this.config, 'get_config');
  }
}
