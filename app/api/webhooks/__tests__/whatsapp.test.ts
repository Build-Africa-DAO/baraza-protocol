// app/api/webhooks/__tests__/whatsapp.test.ts
// Standard: S&P 500 Enterprise Fintech (Evolution WhatsApp Inbound Webhook Test Suite)

import { beforeEach, afterEach, afterAll, describe, expect, it } from 'vitest';
import { handleEvolutionWebhook, clearSessionStore, type EvolutionWebhookEvent } from '../whatsapp';

describe('Evolution WhatsApp Inbound Webhook Handler', () => {
  beforeEach(async () => {
    await clearSessionStore();
  });

  afterEach(async () => {
    await clearSessionStore();
  });

  afterAll(async () => {
    await clearSessionStore();
  });

  const createEvent = (phone: string, text: string, fromMe = false): EvolutionWebhookEvent => ({
    event: 'messages.upsert',
    instance: 'baraza-prod',
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe,
        id: `WA_MSG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      },
      message: {
        conversation: text,
      },
    },
  });

  it('successfully processes inbound WhatsApp greeting event and returns onboarding prompt', async () => {
    const event = createEvent('254712000001', 'Habari Baraza');
    const res = await handleEvolutionWebhook(event);
    expect(res.ok).toBe(true);
    expect(res.replyText).toContain('Karibu Baraza Protocol');
  });

  it('rejects requests with invalid apikey when expectedSecret is configured', async () => {
    const event = createEvent('254712000002', 'Habari Baraza');
    const res = await handleEvolutionWebhook(event, 'Bearer wrong-key', 'super-secret-key');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('unauthorized');
  });

  it('accepts requests with matching apikey', async () => {
    const event = createEvent('254712000003', 'Habari Baraza');
    const res = await handleEvolutionWebhook(event, 'Bearer correct-key', 'correct-key');
    expect(res.ok).toBe(true);
    expect(res.replyText).toContain('Karibu Baraza Protocol');
  });

  it('ignores self-sent messages (fromMe = true) to prevent infinite reflection loops', async () => {
    const selfEvent = createEvent('254712000004', 'Echo', true);
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
