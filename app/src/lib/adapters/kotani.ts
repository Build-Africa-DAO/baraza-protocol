const BASE = import.meta.env.VITE_KOTANI_API_BASE || 'https://api.kotanipay.com';
const KEY = import.meta.env.VITE_KOTANI_PAY_API_KEY || '';

export async function mpesaToBrza(params: {
  phone: string;
  kesAmount: number;
  destinationAddress: string;
  communityCode: string;
}): Promise<{ reference: string; status: string; error?: string }> {
  if (!KEY) return { reference: '', status: 'failed', error: 'KOTANI_PAY_API_KEY not set' };
  try {
    const res = await fetch(`${BASE}/v1/onramp/stellar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        phone: params.phone,
        amount: params.kesAmount,
        currency: 'KES',
        destination: params.destinationAddress,
        memo: `BRZA ${params.communityCode}`,
        network: 'stellar',
      }),
    });
    const data = await res.json();
    return { reference: data.reference, status: 'pending' };
  } catch (e) {
    return { reference: '', status: 'failed', error: String(e) };
  }
}

export async function brzaToMpesa(params: {
  phone: string;
  brzaAmount: string;
  sourceAddress: string;
}): Promise<{ reference: string; kesAmount: number; error?: string }> {
  if (!KEY) return { reference: '', kesAmount: 0, error: 'KOTANI_PAY_API_KEY not set' };
  try {
    const res = await fetch(`${BASE}/v1/offramp/stellar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ phone: params.phone, xlm_amount: params.brzaAmount, source: params.sourceAddress, currency: 'KES' }),
    });
    const data = await res.json();
    return { reference: data.reference, kesAmount: data.kes_amount };
  } catch (e) {
    return { reference: '', kesAmount: 0, error: String(e) };
  }
}

export async function checkStatus(ref: string): Promise<{ status: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/v1/status/${ref}`, {
      headers: { 'Authorization': `Bearer ${KEY}` },
    });
    const data = await res.json();
    return { status: data.status };
  } catch (e) {
    return { status: 'unknown', error: String(e) };
  }
}
