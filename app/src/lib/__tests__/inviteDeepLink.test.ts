import { describe, expect, it, vi } from 'vitest';
import { extractInviteCode, resolveInviteCode } from '@/lib/inviteAccept';

describe('Invite Deep Linking & Code Extraction', () => {
  it('extracts invite codes from ?code= query parameters', () => {
    expect(extractInviteCode('https://barazaprotocol.com/invite?code=abc123def456')).toBe('abc123def456');
    expect(extractInviteCode('/invite?code=CanvaKenya2026')).toBe('CanvaKenya2026');
  });

  it('extracts invite codes from legacy ?invite= query parameters', () => {
    expect(extractInviteCode('https://barazaprotocol.com/join/chama-1?invite=code789xyz')).toBe('code789xyz');
  });

  it('extracts raw alphanumeric invite codes', () => {
    expect(extractInviteCode('1234567890ab')).toBe('1234567890ab');
    expect(extractInviteCode('  valid_code-123  ')).toBe('valid_code-123');
    expect(extractInviteCode('402b4ed6-fa5e-47a9-869d-d4a0de0740b6')).toBe('402b4ed6-fa5e-47a9-869d-d4a0de0740b6');
    expect(extractInviteCode('https://barazaprotocol.com/invite?code=402b4ed6-fa5e-47a9-869d-d4a0de0740b6')).toBe('402b4ed6-fa5e-47a9-869d-d4a0de0740b6');
  });

  it('rejects malformed or short invite codes', () => {
    expect(extractInviteCode('123')).toBeNull();
    expect(extractInviteCode('https://evil.com/fake?other=123')).toBeNull();
    expect(extractInviteCode('')).toBeNull();
  });

  it('resolves invite code details through resolveInviteCode API helper', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        invite: {
          code: 'CanvaCreator',
          communityId: 'comm_canva_123',
          maxUses: 100,
          usesCount: 5,
          expiresAt: '2026-10-10T00:00:00Z',
        },
        community: {
          id: 'comm_canva_123',
          name: 'Canva Creators Kenya',
          type: 'creative',
          description: 'Official Canva creators collective',
          imageUrl: 'https://cdn.example.com/canva.png',
          memberCount: 5,
          currency: 'KES',
          membershipFee: 0,
          feeType: 'free',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await resolveInviteCode('CanvaCreator');
    expect(result.ok).toBe(true);
    expect(result.data?.community.name).toBe('Canva Creators Kenya');
    expect(result.data?.community.type).toBe('creative');
    expect(result.data?.community.membershipFee).toBe(0);

    vi.unstubAllGlobals();
  });
});
