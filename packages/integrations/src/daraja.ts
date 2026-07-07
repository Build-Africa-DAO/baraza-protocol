export interface DarajaStkPushInput {
  phone: string;
  amountKes: number;
  reference: string;
  accountReference?: string;
  callbackUrl?: string;
}

export interface DarajaStkPushResult {
  provider: 'daraja';
  mode: 'sandbox' | 'live';
  checkoutRequestId: string;
  merchantRequestId: string;
  paymentReference: string;
  acceptedAt: string;
  sandboxReceipt?: string;
}

export interface DarajaWebhookPayload {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
  ResultCode?: number;
  ResultDesc?: string;
}

function toBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function hexFromBuffer(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toBuffer(value));
  return hexFromBuffer(digest);
}

export function darajaSandboxEnabled(): boolean {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_DARAJA_SANDBOX !== 'false';
}

export async function requestStkPush(input: DarajaStkPushInput): Promise<DarajaStkPushResult> {
  const acceptedAt = new Date().toISOString();
  const sandbox = darajaSandboxEnabled();
  const checkoutRequestId = `ws_${(await sha256(`${input.phone}:${input.amountKes}:${input.reference}`)).slice(0, 28)}`;
  const merchantRequestId = `mr_${(await sha256(`${input.reference}:${input.amountKes}`)).slice(0, 24)}`;

  return {
    provider: 'daraja',
    mode: sandbox ? 'sandbox' : 'live',
    checkoutRequestId,
    merchantRequestId,
    paymentReference: input.reference,
    acceptedAt,
    sandboxReceipt: sandbox ? `DAR-${checkoutRequestId.slice(0, 8).toUpperCase()}` : undefined,
  };
}

export async function signDarajaWebhookPayload(payload: DarajaWebhookPayload, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    toBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, toBuffer(JSON.stringify(payload)));
  return hexFromBuffer(digest);
}

export async function verifyDarajaWebhookSignature(
  payload: DarajaWebhookPayload,
  signature: string | null | undefined,
  secret: string | null | undefined,
): Promise<boolean> {
  if (!secret) return darajaSandboxEnabled();
  if (!signature) return false;
  const expected = await signDarajaWebhookPayload(payload, secret);
  return expected === signature.trim().toLowerCase();
}

