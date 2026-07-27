import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/bounties/payouts';

const ENV = process.env;

function request(body?: unknown, authorization?: string): Request {
  return new Request('https://baraza.example/api/bounties/payouts', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('bounty payout API', () => {
  beforeEach(() => {
    process.env = {
      ...ENV,
      BOUNTY_PAYOUT_COORDINATOR_SECRET: 'test-secret',
      SUPABASE_URL: 'https://supabase.example',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    };
  });

  afterEach(() => {
    process.env = ENV;
    vi.restoreAllMocks();
  });

  it('rejects payout writes without coordinator authorization', async () => {
    const response = await handler(request({ action: 'create' }));
    expect(response.status).toBe(401);
  });

  it('creates a payout from the approved server-side bounty and submission records', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: 'b-1', community_id: 'c-1', reward_kes: 13000, status: 'awarded' }]))
      .mockResolvedValueOnce(Response.json([{
        id: 's-1',
        bounty_id: 'b-1',
        contributor: 'Amina',
        contributor_wallet: 'GDESTINATION',
        status: 'approved',
        creator_approved_at: '2026-07-04T10:00:00.000Z',
        admin_approved_at: '2026-07-04T10:05:00.000Z',
      }]))
      .mockResolvedValueOnce(Response.json([{ id: 'pay-1', status: 'awaiting_approval', amount_kes: 13000, asset: 'USDC' }], { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));

    const response = await handler(request({
      action: 'create',
      bountyId: 'b-1',
      submissionId: 's-1',
      asset: 'USDC',
      requiredApprovals: 2,
    }, 'Bearer test-secret'));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ payout: { amount_kes: 13000, asset: 'USDC' } });
    const inserted = JSON.parse(fetchMock.mock.calls[3][1]?.body as string);
    expect(inserted).toMatchObject({ recipient_wallet: 'GDESTINATION', amount_kes: 13000, status: 'awaiting_approval' });
  });

  it('does not create a payout before work approval', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: 'b-1', community_id: 'c-1', reward_kes: 13000, status: 'in_review' }]));

    const response = await handler(request({ action: 'create', bountyId: 'b-1', submissionId: 's-1' }, 'Bearer test-secret'));
    expect(response.status).toBe(409);
  });

  it('rejects a payout when only the admin approved the work', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: 'b-1', community_id: 'c-1', reward_kes: 13000, status: 'awarded' }]))
      .mockResolvedValueOnce(Response.json([{
        id: 's-1',
        bounty_id: 'b-1',
        contributor: 'Amina',
        contributor_wallet: 'GDESTINATION',
        status: 'approved',
        creator_approved_at: null,
        admin_approved_at: '2026-07-04T10:05:00.000Z',
      }]));

    const response = await handler(request({ action: 'create', bountyId: 'b-1', submissionId: 's-1' }, 'Bearer test-secret'));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringMatching(/creator.*admin/i) });
  });

  it('requires a public receipt lookup key', async () => {
    const response = await handler(new Request('https://baraza.example/api/bounties/payouts'));
    expect(response.status).toBe(400);
  });
});
