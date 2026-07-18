// See /api/README.md - re-exports the real implementation in app/api/.
export const config = { runtime: 'nodejs' };

import {
  GET,
  POST,
} from '../../app/api/cron/settle-retro-allocations.js';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    return GET(req);
  }
  if (req.method === 'POST') {
    return POST(req);
  }
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
