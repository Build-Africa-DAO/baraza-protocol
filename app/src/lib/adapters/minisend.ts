// Minisend: stablecoin → M-Pesa off-ramp (Kenya, Nigeria, Ghana)
// Used as secondary off-ramp when BRZA is bridged to Base/Polygon
const BASE_URL = import.meta.env.VITE_MINISEND_API_BASE || 'https://api.minisend.xyz';
const KEY = import.meta.env.VITE_MINISEND_API_KEY || '';

export async function usdcToMpesa(params: {
  phone: string;
  usdcAmount: string;
  chain: 'base' | 'polygon' | 'celo';
}): Promise<{ reference: string; kesAmount: number; error?: string }> {
  if (!KEY) return { reference: '', kesAmount: 0, error: 'MINISEND_API_KEY not set' };
  try {
    const res = await fetch(`${BASE_URL}/v1/offramp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ phone: params.phone, amount: params.usdcAmount, chain: params.chain, currency: 'KES' }),
    });
    const data = await res.json();
    return { reference: data.id, kesAmount: data.kes_amount };
  } catch (e) {
    return { reference: '', kesAmount: 0, error: String(e) };
  }
}
