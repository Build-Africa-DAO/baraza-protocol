const SERVER_ONLY_ERROR = 'Kotani payments require trusted server orchestration.';

export async function mpesaToBrza(_params: {
  phone: string;
  kesAmount: number;
  destinationAddress: string;
  communityCode: string;
}): Promise<{ reference: string; status: string; error?: string }> {
  return { reference: '', status: 'failed', error: SERVER_ONLY_ERROR };
}

export async function brzaToMpesa(_params: {
  phone: string;
  brzaAmount: string;
  sourceAddress: string;
}): Promise<{ reference: string; kesAmount: number; error?: string }> {
  return { reference: '', kesAmount: 0, error: SERVER_ONLY_ERROR };
}

export async function checkStatus(_ref: string): Promise<{ status: string; error?: string }> {
  return { status: 'unknown', error: SERVER_ONLY_ERROR };
}
