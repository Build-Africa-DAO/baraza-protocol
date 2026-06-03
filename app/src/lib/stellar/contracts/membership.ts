import { arg, invokeContract, type ContractClientConfig } from './client';

export class MembershipClient {
  constructor(private readonly config: ContractClientConfig) {}

  async initialize(admin: string, registry: string): Promise<void> {
    await invokeContract(this.config, 'initialize', [
      arg.address(admin),
      arg.address(registry),
    ]);
  }

  async join(communityId: string, member: string): Promise<void> {
    await invokeContract(this.config, 'join', [
      arg.string(communityId),
      arg.address(member),
    ]);
  }

  async leave(communityId: string, member: string): Promise<void> {
    await invokeContract(this.config, 'leave', [
      arg.string(communityId),
      arg.address(member),
    ]);
  }

  async kick(communityId: string, member: string): Promise<void> {
    await invokeContract(this.config, 'kick', [
      arg.string(communityId),
      arg.address(member),
    ]);
  }

  async isMember(communityId: string, member: string): Promise<boolean> {
    return invokeContract<boolean>(this.config, 'is_member', [
      arg.string(communityId),
      arg.address(member),
    ]);
  }

  async memberCount(communityId: string): Promise<number> {
    return invokeContract<number>(this.config, 'member_count', [
      arg.string(communityId),
    ]);
  }
}
