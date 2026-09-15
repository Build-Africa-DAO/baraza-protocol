// app/api/webhooks/whatsapp.ts
// Subsystem: Evolution WhatsApp Inbound Webhook & Conversational Gateway (ADR-007)
// Standard: S&P 500 Enterprise Fintech (RFC 7230 / Fail-Closed Webhook Ingress)

export const config = { runtime: 'nodejs' };

import { processTurn, type BotSessionState, type BotWriteCommand } from '../../src/lib/bot/fsm.js';
import { constantTimeCompare } from '../_lib/crypto';

// In-Memory Session Cache (backed by phone key; production loads from user_profiles / auth_sessions)
const sessionStore = new Map<string, BotSessionState>();

export function clearSessionStore(): void {
  sessionStore.clear();
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

export interface EvolutionWebhookEvent {
  event: string; // 'messages.upsert' | 'MESSAGES_UPSERT'
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string };
    };
  };
}

export async function handleEvolutionWebhook(
  payload: EvolutionWebhookEvent,
  apiKeyHeader?: string,
  expectedSecret?: string
): Promise<{ ok: boolean; replyText?: string; commands?: BotWriteCommand[]; error?: string }> {
  // 1. ApiKey / Secret Authorization Guard (Fail-Closed & Constant-Time when configured)
  if (expectedSecret !== undefined) {
    if (!expectedSecret || expectedSecret.trim() === '') {
      return { ok: false, error: 'server_misconfigured' };
    }
    if (!apiKeyHeader || apiKeyHeader.trim() === '') {
      return { ok: false, error: 'unauthorized' };
    }
    const token = apiKeyHeader.replace(/^Bearer\s+/i, '').trim();
    if (!constantTimeCompare(token, expectedSecret.trim())) {
      return { ok: false, error: 'unauthorized' };
    }
  }

  // 2. Event Validation
  if (payload.event !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
    return { ok: true, error: 'ignored_event' };
  }

  const data = payload.data;
  if (!data?.key || data.key.fromMe) {
    return { ok: true, error: 'ignored_self_message' };
  }

  const remoteJid = data.key.remoteJid || '';
  const text =
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    data.message?.imageMessage?.caption ||
    '';

  if (!remoteJid || !text) {
    return { ok: false, error: 'missing_jid_or_text' };
  }

  const phoneNumber = remoteJid.split('@')[0] || '';

  // 3. Session State Retrieval & FSM Turn Execution
  const currentState: BotSessionState = sessionStore.get(phoneNumber) || {
    currentNode: 'ROOT',
    slots: { phone: phoneNumber, failureCount: 0 },
  };

  const result = processTurn(currentState, text);
  sessionStore.set(phoneNumber, result.nextState);

  // 4. Return Output
  return {
    ok: true,
    replyText: result.replyText,
    commands: result.commands,
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  const expectedSecret = process.env.EVOLUTION_API_KEY || process.env.WHATSAPP_WEBHOOK_SECRET;
  const authHeader = req.headers.get('apikey') || req.headers.get('authorization') || '';

  let body: EvolutionWebhookEvent;
  try {
    body = (await req.json()) as EvolutionWebhookEvent;
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 });
  }

  const res = await handleEvolutionWebhook(body, authHeader, expectedSecret || '');
  if (!res.ok) {
    const status = res.error === 'server_misconfigured' ? 503 : (res.error === 'unauthorized' ? 401 : 400);
    return json({ error: res.error }, { status });
  }

  return json({
    ok: true,
    replyText: res.replyText,
    commands: res.commands,
  });
}
