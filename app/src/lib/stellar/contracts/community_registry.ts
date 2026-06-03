import { arg, invokeContract, type ContractClientConfig } from './client';

export interface Community {
  community_id: string;
  name: string;
  admin: string;
  created_at: bigint;
}

export class CommunityRegistryClient {
  constructor(private readonly config: ContractClientConfig) {}

  async initialize(owner: string): Promise<void> {
    await invokeContract(this.config, 'initialize', [arg.address(owner)]);
  }

  async register(communityId: string, name: string, admin: string): Promise<void> {
    await invokeContract(this.config, 'register', [
      arg.string(communityId),
      arg.string(name),
      arg.address(admin),
    ]);
  }

  async get(communityId: string): Promise<Community | null> {
    return invokeContract<Community | null>(this.config, 'get', [
      arg.string(communityId),
    ]);
  }

  async exists(communityId: string): Promise<boolean> {
    return invokeContract<boolean>(this.config, 'exists', [
      arg.string(communityId),
    ]);
  }

  async updateAdmin(communityId: string, newAdmin: string): Promise<void> {
    await invokeContract(this.config, 'update_admin', [
      arg.string(communityId),
      arg.address(newAdmin),
    ]);
  }

  async owner(): Promise<string> {
    return invokeContract<string>(this.config, 'owner');
  }
}
