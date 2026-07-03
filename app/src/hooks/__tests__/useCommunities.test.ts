import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCommunities, useCommunity } from '@/hooks/useCommunities';
import type { Community } from '@/lib/constants';

vi.mock('@/lib/communities', () => ({
  listCommunities: vi.fn(),
  getCommunity: vi.fn(),
}));

import { listCommunities, getCommunity } from '@/lib/communities';

const mockListCommunities = vi.mocked(listCommunities);
const mockGetCommunity = vi.mocked(getCommunity);

const SAMPLE: Community = {
  id: '1',
  name: 'Kibera Youth',
  type: 'savings',
  description: 'desc',
  membershipFee: 500,
  memberCount: 10,
  fundBalance: 5000,
  activeDecisions: 1,
  createdAt: '2025-01-01T00:00:00Z',
  image: 'KY',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCommunities', () => {
  it('starts loading and resolves communities', async () => {
    mockListCommunities.mockResolvedValue([SAMPLE]);
    const { result } = renderHook(() => useCommunities());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.communities).toEqual([SAMPLE]);
    expect(result.current.error).toBeNull();
  });

  it('captures error when listCommunities rejects', async () => {
    mockListCommunities.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useCommunities());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('network error');
    expect(result.current.communities).toEqual([]);
  });

  it('wraps non-Error rejections in Error', async () => {
    mockListCommunities.mockRejectedValue('string error');
    const { result } = renderHook(() => useCommunities());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to load communities');
  });

  it('reload fetches communities again', async () => {
    mockListCommunities.mockResolvedValueOnce([SAMPLE]).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCommunities());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.communities).toHaveLength(1);

    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.communities).toHaveLength(0));
    expect(mockListCommunities).toHaveBeenCalledTimes(2);
  });
});

describe('useCommunity', () => {
  it('fetches and returns a community by id', async () => {
    mockGetCommunity.mockResolvedValue(SAMPLE);
    const { result } = renderHook(() => useCommunity('1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.community).toEqual(SAMPLE);
    expect(result.current.error).toBeNull();
    expect(mockGetCommunity).toHaveBeenCalledWith('1');
  });

  it('returns null community when id is undefined', async () => {
    const { result } = renderHook(() => useCommunity(undefined));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.community).toBeNull();
    expect(mockGetCommunity).not.toHaveBeenCalled();
  });

  it('returns null community when getCommunity returns null', async () => {
    mockGetCommunity.mockResolvedValue(null);
    const { result } = renderHook(() => useCommunity('unknown'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.community).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('captures error when getCommunity rejects', async () => {
    mockGetCommunity.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useCommunity('bad-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('not found');
  });
});
