import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MOCK_COMMUNITIES } from '@/lib/constants';

// communities.ts contains a module-level Supabase singleton. Reset it between tests
// by re-importing via the module registry reset.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => null),
}));

// Import after mocking so the singleton is always null (no env vars set)
const { listCommunities, getCommunity, createCommunityRecord } = await import('@/lib/communities');

const LOCAL_KEY = 'baraza.communities.v1';

describe('listCommunities (localStorage mode)', () => {
  it('returns mock communities when localStorage is empty', async () => {
    const results = await listCommunities();
    const mockIds = MOCK_COMMUNITIES.map((c) => c.id);
    results.forEach((r) => expect(mockIds).toContain(r.id));
  });

  it('merges localStorage community ahead of mocks (user-created wins)', async () => {
    const local = {
      id: 'local-1',
      name: 'Test Group',
      type: 'savings',
      description: 'desc',
      membershipFee: 100,
      memberCount: 0,
      fundBalance: 0,
      activeDecisions: 0,
      createdAt: new Date().toISOString(),
      image: 'TG',
    };
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify([local]));
    const results = await listCommunities();
    expect(results.some((r) => r.id === 'local-1')).toBe(true);
  });

  it('returns results sorted newest first', async () => {
    const results = await listCommunities();
    for (let i = 1; i < results.length; i++) {
      expect(new Date(results[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(results[i].createdAt).getTime(),
      );
    }
  });
});

describe('getCommunity (localStorage mode)', () => {
  it('returns a mock community by id', async () => {
    const result = await getCommunity('1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('1');
    expect(result?.name).toBe('Kibera Youth Collective');
  });

  it('returns null for unknown id', async () => {
    const result = await getCommunity('does-not-exist');
    expect(result).toBeNull();
  });

  it('returns a locally-created community by id', async () => {
    const local = {
      id: 'local-99',
      name: 'My Chama',
      type: 'savings',
      description: 'My desc',
      membershipFee: 500,
      memberCount: 0,
      fundBalance: 0,
      activeDecisions: 0,
      createdAt: new Date().toISOString(),
      image: 'MC',
    };
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify([local]));
    const result = await getCommunity('local-99');
    expect(result?.name).toBe('My Chama');
  });
});

describe('createCommunityRecord (localStorage mode)', () => {
  beforeEach(() => {
    window.localStorage.removeItem(LOCAL_KEY);
  });

  it('creates and persists a community', async () => {
    const result = await createCommunityRecord({
      name: 'New Sacco',
      type: 'housing',
      description: 'A housing sacco',
      membershipFee: 2000,
    });
    expect(result.name).toBe('New Sacco');
    expect(result.type).toBe('housing');
    expect(result.membershipFee).toBe(2000);
    expect(result.memberCount).toBe(0);
    expect(result.fundBalance).toBe(0);
  });

  it('derives initials as image when no image provided', async () => {
    const result = await createCommunityRecord({
      name: 'Baraza Protocol',
      type: 'savings',
      description: 'desc',
      membershipFee: 100,
    });
    expect(result.image).toBe('BP');
  });

  it('trims whitespace from name and description', async () => {
    const result = await createCommunityRecord({
      name: '  Trimmed Name  ',
      type: 'savings',
      description: '  Trimmed Desc  ',
      membershipFee: 0,
    });
    expect(result.name).toBe('Trimmed Name');
    expect(result.description).toBe('Trimmed Desc');
  });

  it('stores the new community in localStorage', async () => {
    await createCommunityRecord({
      name: 'Stored Group',
      type: 'welfare',
      description: 'welfare desc',
      membershipFee: 300,
    });
    const raw = window.localStorage.getItem(LOCAL_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.some((c: { name: string }) => c.name === 'Stored Group')).toBe(true);
  });

  it('assigns a unique id to each community', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const a = await createCommunityRecord({ name: 'A', type: 'savings', description: 'd', membershipFee: 0 });

    vi.setSystemTime(new Date('2026-01-01T00:00:01Z'));
    const b = await createCommunityRecord({ name: 'B', type: 'savings', description: 'd', membershipFee: 0 });

    expect(a.id).not.toBe(b.id);
    vi.useRealTimers();
  });
});
