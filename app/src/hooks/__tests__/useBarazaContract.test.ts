import { act, renderHook } from '@testing-library/react';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBarazaContract } from '@/hooks/useBarazaContract';
import { saveCommunityChainMapping, saveDecisionChainMapping } from '@/lib/chainMappings';

const COMMUNITY_ADDRESS = 'Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD';
const PROPOSAL_ADDRESS = 'DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A';

const MEMBER_ADDRESS = 'DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A';

const mockReadClient = {
  fetchTreasuryBalance: vi.fn(),
  fetchProposal: vi.fn(),
  fetchMember: vi.fn(),
};

/** Captures the memberIdHash arg passed to memberPda so tests can assert it was awaited. */
const memberPdaHashes: unknown[] = [];

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: {} }),
  useWallet: () => ({ connected: false, publicKey: null }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/lib/programs', async () => {
  const web3 = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
  return {
    createBarazaReadClient: () => mockReadClient,
    communityPda: () => [new web3.PublicKey(COMMUNITY_ADDRESS), 255],
    toSlug: (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    hashToBytes32: async () => new Uint8Array(32).fill(7),
    memberPda: (_communityKey: unknown, memberIdHash: unknown) => {
      memberPdaHashes.push(memberIdHash);
      // Mirror the strictness of the real bytes32() seed helper: a Promise (i.e.
      // an un-awaited hashToBytes32 result) must not be accepted as a seed.
      if (!(memberIdHash instanceof Uint8Array) || memberIdHash.length !== 32) {
        throw new Error('memberPda received an invalid 32-byte seed');
      }
      return [new web3.PublicKey(MEMBER_ADDRESS), 254];
    },
  };
});

describe('useBarazaContract read mapping', () => {
  beforeEach(() => {
    mockReadClient.fetchTreasuryBalance.mockReset();
    mockReadClient.fetchProposal.mockReset();
    mockReadClient.fetchMember.mockReset();
    memberPdaHashes.length = 0;
  });

  it('uses a saved community mapping before reading treasury balance', async () => {
    saveCommunityChainMapping({
      localId: 'local-community',
      chain: 'solana',
      slug: 'mapped-community',
      communityAddress: COMMUNITY_ADDRESS,
    });
    mockReadClient.fetchTreasuryBalance.mockResolvedValue(42_000);

    const { result } = renderHook(() => useBarazaContract());
    let balance = 0;

    await act(async () => {
      balance = await result.current.fetchTreasuryBalance('local-community');
    });

    expect(balance).toBe(42_000);
    expect(mockReadClient.fetchTreasuryBalance).toHaveBeenCalledWith(new PublicKey(COMMUNITY_ADDRESS));
  });

  it('uses a saved proposal mapping before reading vote state', async () => {
    saveDecisionChainMapping({
      localId: 'local-decision',
      communityLocalId: 'local-community',
      chain: 'solana',
      proposalAddress: PROPOSAL_ADDRESS,
      proposalId: 11,
    });
    mockReadClient.fetchProposal.mockResolvedValue({
      community: new PublicKey(COMMUNITY_ADDRESS),
      forWeight: new BN(7),
      againstWeight: new BN(2),
    });

    const { result } = renderHook(() => useBarazaContract());
    let voteState = null;

    await act(async () => {
      voteState = await result.current.fetchVoteState('local-decision');
    });

    expect(voteState).toEqual({
      communityId: COMMUNITY_ADDRESS,
      proposalId: 'local-decision',
      votesFor: 7,
      votesAgainst: 2,
    });
    expect(mockReadClient.fetchProposal).toHaveBeenCalledWith(new PublicKey(PROPOSAL_ADDRESS));
  });

  it('awaits hashToBytes32 before deriving the member PDA (fetchBrzaBalance regression)', async () => {
    mockReadClient.fetchMember.mockResolvedValue({ votingWeight: new BN(5) });

    const { result } = renderHook(() => useBarazaContract());
    let balance = -1;

    await act(async () => {
      balance = await result.current.fetchBrzaBalance(COMMUNITY_ADDRESS, 'wallet-regression-await');
    });

    // If the hash were not awaited, memberPda would receive a Promise, throw,
    // and fetchBrzaBalance would swallow the error and return 0.
    expect(balance).toBe(5);
    expect(memberPdaHashes).toHaveLength(1);
    expect(memberPdaHashes[0]).toBeInstanceOf(Uint8Array);
    expect((memberPdaHashes[0] as Uint8Array).length).toBe(32);
    expect(mockReadClient.fetchMember).toHaveBeenCalledWith(new PublicKey(MEMBER_ADDRESS));
  });

  it('returns 0 BRZA when no member account exists', async () => {
    mockReadClient.fetchMember.mockResolvedValue(null);

    const { result } = renderHook(() => useBarazaContract());
    let balance = -1;

    await act(async () => {
      balance = await result.current.fetchBrzaBalance(COMMUNITY_ADDRESS, 'wallet-regression-missing');
    });

    expect(balance).toBe(0);
  });
});
