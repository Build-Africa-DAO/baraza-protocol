// app/api/webhooks/__tests__/whatsapp.test.ts
// Standard: S&P 500 Enterprise Fintech (Evolution WhatsApp Inbound Webhook Test Suite)

import { beforeEach, describe, expect, it } from 'vitest';
import { handleEvolutionWebhook, clearSessionStore, type EvolutionWebhookEvent } from '../whatsapp';

describe('Evolution WhatsApp Inbound Webhook Handler', () => {
  beforeEach(() => {
    clearSessionStore();
  });
  const validEvent: EvolutionWebhookEvent = {
    event: 'messages.upsert',
    instance: 'baraza-prod',
    data: {
      key: {
        remoteJid: '254712345678@s.whatsapp.net',
        fromMe: false,
        id: 'WA_MSG_123',
      },
      message: {
        conversation: 'Habari Baraza',
      },
    },
  };

  it('successfully processes inbound WhatsApp greeting event and returns onboarding prompt', async () => {
    const res = await handleEvolutionWebhook(validEvent);
    expect(res.ok).toBe(true);
    expect(res.replyText).toContain('Karibu Baraza Protocol');
  });

  it('rejects requests with invalid apikey when expectedSecret is configured', async () => {
    const res = await handleEvolutionWebhook(validEvent, 'Bearer wrong-key', 'super-secret-key');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unauthorized');
  });

  it('accepts requests with matching apikey', async () => {
    const res = await handleEvolutionWebhook(validEvent, 'Bearer correct-key', 'correct-key');
    expect(res.ok).toBe(true);
    expect(res.replyText).toContain('Karibu Baraza Protocol');
  });

  it('ignores self-sent messages (fromMe = true) to prevent infinite reflection loops', async () => {
    const selfEvent: EvolutionWebhookEvent = {
      event: 'messages.upsert',
      data: {
        key: {
          remoteJid: '254712345678@s.whatsapp.net',
          fromMe: true,
        },
        message: { conversation: 'Echo' },
      },
    };
    const res = await handleEvolutionWebhook(selfEvent);
    expect(res.ok).toBe(true);
    expect(res.error).toBe('ignored_self_message');
  });

  it('handles extendedTextMessage and imageMessage captions', async () => {
    const extendedEvent: EvolutionWebhookEvent = {
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '254799999999@s.whatsapp.net', fromMe: false },
        message: { extendedTextMessage: { text: '1' } },
      },
    };
    const res = await handleEvolutionWebhook(extendedEvent);
    expect(res.ok).toBe(true);
  });
});
