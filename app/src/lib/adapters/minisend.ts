// Minisend: stablecoin -> M-Pesa off-ramp (Kenya, Nigeria, Ghana)
// Browser callers cannot invoke provider APIs directly; use the trusted server route.
export async function usdcToMpesa(_params: {
  phone: string;
  usdcAmount: string;
  chain: 'base' | 'polygon' | 'celo';
}): Promise<{ reference: string; kesAmount: number; error?: string }> {
  return {
    reference: '',
    kesAmount: 0,
    error: 'Minisend payments require trusted server orchestration.',
  };
}
