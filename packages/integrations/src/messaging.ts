export interface MessagingMessage {
  to: string;
  body: string;
}

export interface MessagingResult {
  provider: 'whatsapp' | 'telegram';
  delivered: boolean;
  sandbox: boolean;
  reference: string;
}

function reference(prefix: string, target: string): string {
  const hash = Array.from(target).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1_000_000_000, 7);
  return `${prefix}_${hash.toString(36)}`;
}

export async function sendWhatsAppMessage(message: MessagingMessage): Promise<MessagingResult> {
  return {
    provider: 'whatsapp',
    delivered: true,
    sandbox: true,
    reference: reference('wa', message.to),
  };
}

export async function sendTelegramMessage(message: MessagingMessage): Promise<MessagingResult> {
  return {
    provider: 'telegram',
    delivered: true,
    sandbox: true,
    reference: reference('tg', message.to),
  };
}

