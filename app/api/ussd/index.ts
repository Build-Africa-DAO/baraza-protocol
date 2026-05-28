import { getOrCreateSession, destroySession, resolveCountryFromPhone } from '../../src/lib/ussd/session';
import { handleUssdInput } from '../../src/lib/ussd/menu';

export const config = { runtime: 'edge' };

function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

function isAuthorized(req: Request): boolean {
  if (!isProduction()) return true;
  const apiKey = process.env.AT_API_KEY;
  if (!apiKey) return false;
  return req.headers.get('AT-API-Key') === apiKey;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type, AT-API-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!isAuthorized(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response('Bad Request: body must be form-encoded', { status: 400 });
  }

  const sessionId = formData.get('sessionId');
  const phoneNumber = formData.get('phoneNumber');
  const serviceCode = formData.get('serviceCode');
  const text = formData.get('text');

  if (
    typeof sessionId !== 'string' ||
    typeof phoneNumber !== 'string' ||
    typeof serviceCode !== 'string' ||
    typeof text !== 'string'
  ) {
    return new Response('Bad Request: missing required fields', { status: 400 });
  }

  const countryCode = resolveCountryFromPhone(phoneNumber);
  const session = getOrCreateSession({ sessionId, phoneNumber, serviceCode, countryCode });

  const result = handleUssdInput({ session, text, phoneNumber });

  if (result.action === 'END') {
    destroySession(sessionId);
  }

  return new Response(`${result.action} ${result.text}`, {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
}
