export interface SmsPayload {
  to: string | string[];
  message: string;
  from?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const AT_SMS_URL = 'https://api.africastalking.com/version1/messaging';

export async function sendSms(payload: SmsPayload): Promise<SmsSendResult> {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;

  if (!username || !apiKey) {
    return { success: false, error: 'AT_SMS_DISABLED' };
  }

  const recipients = Array.isArray(payload.to) ? payload.to.join(',') : payload.to;

  const body = new URLSearchParams({ username, to: recipients, message: payload.message });
  if (payload.from) {
    body.set('from', payload.from);
  }

  let res: Response;
  try {
    res = await fetch(AT_SMS_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'network_error' };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { success: false, error: `AT_HTTP_${res.status}: ${detail}` };
  }

  interface AtResponse {
    SMSMessageData?: {
      Recipients?: Array<{ messageId?: string; status?: string }>;
    };
  }

  const data = (await res.json().catch(() => ({}))) as AtResponse;
  const first = data.SMSMessageData?.Recipients?.[0];

  if (first?.status === 'Success' || first?.messageId) {
    return { success: true, messageId: first.messageId };
  }

  return { success: false, error: `AT_SEND_FAILED: ${first?.status ?? 'unknown'}` };
}

export function formatVoteConfirmation(
  communityName: string,
  decision: 'FOR' | 'AGAINST',
): string {
  return `Baraza: Your vote ${decision} on the active proposal in ${communityName} has been recorded. Visit baraza.app to track results.`;
}

export function formatDuesReminder(
  communityName: string,
  amountKes: number,
  dueDate: string,
): string {
  return `Baraza: Dues reminder for ${communityName}. KES ${amountKes} due by ${dueDate}. Dial *384# or visit baraza.app to pay.`;
}

export function formatMemberWelcome(communityName: string, adminPhone: string): string {
  return `Welcome to ${communityName} on Baraza! Your membership is active. Contact admin: ${adminPhone}. Manage at baraza.app or *384#.`;
}
