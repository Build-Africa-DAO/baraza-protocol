import { beforeEach, describe, expect, it } from 'vitest';

import {
  getCommunityChainMapping,
  getDecisionChainMapping,
  getMemberChainMapping,
  saveCommunityChainMapping,
  saveDecisionChainMapping,
  saveMemberChainMapping,
} from '@/lib/chainMappings';

describe('chainMappings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists community address mappings by local id', () => {
    saveCommunityChainMapping({
      localId: 'community-1',
      chain: 'solana',
      slug: 'community-one',
      communityAddress: 'Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD',
      createTxSignature: 'sig-1',
    });

    expect(getCommunityChainMapping('community-1')).toMatchObject({
      localId: 'community-1',
      chain: 'solana',
      slug: 'community-one',
      communityAddress: 'Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD',
      createTxSignature: 'sig-1',
    });
  });

  it('persists decision proposal mappings by local id', () => {
    saveDecisionChainMapping({
      localId: 'd1',
      communityLocalId: 'community-1',
      chain: 'solana',
      proposalAddress: 'DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A',
      proposalId: 7,
    });

    expect(getDecisionChainMapping('d1')).toMatchObject({
      proposalAddress: 'DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A',
      proposalId: 7,
    });
  });

  it('persists member account mappings by local id', () => {
    saveMemberChainMapping({
      localId: 'member-1',
      communityLocalId: 'community-1',
      walletAddress: 'wallet-1',
      chain: 'solana',
      memberAddress: '34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK',
    });

    expect(getMemberChainMapping('member-1')).toMatchObject({
      communityLocalId: 'community-1',
      walletAddress: 'wallet-1',
      memberAddress: '34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK',
    });
  });
});
