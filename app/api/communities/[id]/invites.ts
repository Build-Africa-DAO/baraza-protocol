// app/api/communities/[id]/invites.ts
// Production Dynamic Route: /api/communities/:id/invites
// Reference: Frontend-PRD-Screens-Backend-Handoff.md §5.1

export const config = { runtime: 'edge' };

import handleInvites from '../invites/index';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-wallet-signature, x-wallet-message, x-test-wallet-address, x-test-privy-did',
      },
    });
  }

  const url = new URL(req.url);
  // Extract :id from /api/communities/:id/invites
  const segments = url.pathname.split('/');
  const commIdx = segments.indexOf('communities');
  const communityId = commIdx !== -1 && segments[commIdx + 1] ? segments[commIdx + 1] : null;

  if (!communityId || communityId === '[id]') {
    return new Response(JSON.stringify({ error: 'invalid_route', message: 'Missing community ID in URL path.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Rewrite request to inject communityId into query string for GET
  if (req.method === 'GET') {
    url.searchParams.set('communityId', communityId);
    const rewrittenReq = new Request(url.toString(), req);
    return handleInvites(rewrittenReq);
  }

  // Rewrite request to inject communityId into body for POST
  if (req.method === 'POST') {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.clone().json()) as Record<string, unknown>;
    } catch {
      // Empty or invalid body will be validated by handleInvites
    }
    body.communityId = body.communityId || communityId;
    const rewrittenReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body),
    });
    return handleInvites(rewrittenReq);
  }

  return handleInvites(req);
}
