import { arg, invokeContract, type ContractClientConfig } from './client';

export type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Executed' | 'Cancelled';

export interface GovernanceProposal {
  id: bigint;
  community_id: string;
  title: string;
  description: string;
  proposer: string;
  for_votes: number;
  against_votes: number;
  status: ProposalStatus;
  deadline: bigint;
  executed: boolean;
}

export class GovernanceClient {
  constructor(private readonly config: ContractClientConfig) {}

  async initialize(params: {
    admin: string;
    membership: string;
    votingPeriod?: bigint;
  }): Promise<void> {
    await invokeContract(this.config, 'initialize', [
      arg.address(params.admin),
      arg.address(params.membership),
      arg.option(params.votingPeriod !== undefined ? arg.u64(params.votingPeriod) : null),
    ]);
  }

  async createProposal(params: {
    proposer: string;
    communityId: string;
    title: string;
    description: string;
  }): Promise<bigint> {
    return invokeContract<bigint>(this.config, 'create_proposal', [
      arg.address(params.proposer),
      arg.string(params.communityId),
      arg.string(params.title),
      arg.string(params.description),
    ]);
  }

  async vote(voter: string, proposalId: bigint, support: boolean): Promise<void> {
    await invokeContract(this.config, 'vote', [
      arg.address(voter),
      arg.u64(proposalId),
      arg.bool(support),
    ]);
  }

  async finalize(proposalId: bigint): Promise<ProposalStatus> {
    return invokeContract<ProposalStatus>(this.config, 'finalize', [
      arg.u64(proposalId),
    ]);
  }

  async markExecuted(proposalId: bigint): Promise<void> {
    await invokeContract(this.config, 'mark_executed', [arg.u64(proposalId)]);
  }

  async cancel(caller: string, proposalId: bigint): Promise<void> {
    await invokeContract(this.config, 'cancel', [
      arg.address(caller),
      arg.u64(proposalId),
    ]);
  }

  async getProposal(proposalId: bigint): Promise<GovernanceProposal | null> {
    return invokeContract<GovernanceProposal | null>(this.config, 'get_proposal', [
      arg.u64(proposalId),
    ]);
  }

  async hasVoted(proposalId: bigint, voter: string): Promise<boolean> {
    return invokeContract<boolean>(this.config, 'has_voted', [
      arg.u64(proposalId),
      arg.address(voter),
    ]);
  }

  async votingPeriod(): Promise<bigint> {
    return invokeContract<bigint>(this.config, 'voting_period');
  }
}
