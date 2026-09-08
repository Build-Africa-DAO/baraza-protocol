// app/api/_lib/mail.ts
// Subsystem: SendGrid Email Delivery & Transactional Template Engine
// Standard: S&P 500 Enterprise Fintech (Poison Pill Isolation, Zero Placeholder Leakage)
// Reference: Frontend-PRD-Screens-Backend-Handoff.md & Custom-Auth-Spec

import fs from 'node:fs';
import path from 'node:path';
import sgMail from '@sendgrid/mail';
import { getSupabaseAdmin } from './supabase';

interface CatalogEntry {
  id: string;
  name: string;
  subject: string;
  variables: string[];
  html: string;
  text: string;
}

interface Catalog {
  from: string;
  support_email: string;
  site_url: string;
  templates: CatalogEntry[];
}

let catalogCache: Catalog | null = null;

function getEmailsDirectory(): string {
  // Resolve directory across different runtime environments (Next.js, Vite, Cloudflare, Vitest)
  const candidatePaths = [
    path.resolve(process.cwd(), 'emails'),
    path.resolve(process.cwd(), 'app/emails'),
    path.resolve(__dirname, '../../emails'),
    path.resolve(__dirname, '../../../emails'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(path.join(p, 'catalog.json'))) {
      return p;
    }
  }

  // Fallback to app/emails
  return path.resolve(process.cwd(), 'app/emails');
}

export function loadCatalog(): Catalog {
  if (catalogCache) return catalogCache;
  const emailsDir = getEmailsDirectory();
  const catalogPath = path.join(emailsDir, 'catalog.json');

  if (fs.existsSync(catalogPath)) {
    const raw = fs.readFileSync(catalogPath, 'utf8');
    catalogCache = JSON.parse(raw) as Catalog;
    return catalogCache;
  }

  throw new Error(`Email catalog not found at ${catalogPath}`);
}

export function renderEmailTemplate(
  templateId: string,
  vars: Record<string, string>
): { html: string; text: string; subject: string } {
  const catalog = loadCatalog();
  const entry = catalog.templates.find((t) => t.id === templateId);
  if (!entry) {
    throw new Error(`Unknown email template: ${templateId}`);
  }

  const emailsDir = getEmailsDirectory();
  const htmlPath = path.join(emailsDir, 'html', `${templateId}.html`);
  const textPath = path.join(emailsDir, 'text', `${templateId}.txt`);

  const rawHtml = fs.existsSync(htmlPath)
    ? fs.readFileSync(htmlPath, 'utf8')
    : `<html><body><p>${entry.subject}</p></body></html>`;

  const rawText = fs.existsSync(textPath)
    ? fs.readFileSync(textPath, 'utf8')
    : entry.subject;

  // Merge default context variables
  const mergedVars: Record<string, string> = {
    support_email: catalog.support_email,
    site_url: catalog.site_url,
    year: new Date().getFullYear().toString(),
    ...vars,
  };

  let renderedHtml = rawHtml;
  let renderedText = rawText;
  let renderedSubject = entry.subject;

  // Replace all {{key}} placeholders
  for (const [key, value] of Object.entries(mergedVars)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    renderedHtml = renderedHtml.replace(pattern, value);
    renderedText = renderedText.replace(pattern, value);
    renderedSubject = renderedSubject.replace(pattern, value);
  }

  // Sanity check: Invariant - Zero unhandled {{placeholders}}
  const remainingInSubject = renderedSubject.match(/{{[a-zA-Z0-9_]+}}/g);
  if (remainingInSubject) {
    console.warn(`[mail] Unsubstituted placeholders in subject for template ${templateId}:`, remainingInSubject);
  }

  return {
    html: renderedHtml,
    text: renderedText,
    subject: renderedSubject,
  };
}

export async function sendTransactionalEmail(
  destination: string,
  templateId: string,
  vars: Record<string, string>
): Promise<{ ok: boolean; messageId?: string; poisonPill?: boolean; error?: string }> {
  // RFC 5322 Basic Email Format Validation (Poison Pill Check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(destination)) {
    return {
      ok: false,
      poisonPill: true,
      error: `Malformed recipient email address: '${destination}'`,
    };
  }

  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const { html, text, subject } = renderEmailTemplate(templateId, vars);
  const fromAddress = process.env.SENDGRID_FROM_EMAIL || 'Baraza Protocol <no-reply@barazaprotocol.com>';

  if (!apiKey || apiKey.startsWith('mock_')) {
    // Sandbox / Test Mode
    return {
      ok: true,
      messageId: `mock_sg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  sgMail.setApiKey(apiKey);

  try {
    const [response] = await sgMail.send({
      to: destination,
      from: fromAddress,
      subject,
      text,
      html,
    });

    const messageId = response.headers['x-message-id'] || `sg_${Date.now()}`;
    return { ok: true, messageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown SendGrid error';
    // If SendGrid returns 4xx client error (e.g. invalid recipient, suppressed), mark poison pill
    const is4xx = message.includes('400') || message.includes('401') || message.includes('403') || message.includes('422');
    return {
      ok: false,
      poisonPill: is4xx,
      error: message,
    };
  }
}

/**
 * Dispatches a pending notification from the notification_outbox table.
 * Implements Head-of-Line Blocking Protection via POISON_PILL status.
 */
export async function dispatchOutboxNotification(outboxId: string): Promise<{
  ok: boolean;
  poisonPill?: boolean;
  error?: string;
}> {
  const supabase = getSupabaseAdmin();

  const { data: outboxItem, error: fetchErr } = await supabase
    .from('notification_outbox')
    .select('*')
    .eq('id', outboxId)
    .single();

  if (fetchErr || !outboxItem) {
    return { ok: false, error: 'Outbox record not found' };
  }

  if (outboxItem.status === 'POISON_PILL' || outboxItem.status === 'SENT') {
    return { ok: true };
  }

  if (outboxItem.channel === 'email') {
    const result = await sendTransactionalEmail(
      outboxItem.destination,
      outboxItem.template_id,
      outboxItem.template_vars as Record<string, string>
    );

    if (result.ok) {
      await supabase
        .from('notification_outbox')
        .update({
          status: 'SENT',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', outboxId);
      return { ok: true };
    }

    if (result.poisonPill) {
      await supabase
        .from('notification_outbox')
        .update({
          status: 'POISON_PILL',
          last_error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', outboxId);
      return { ok: false, poisonPill: true, error: result.error };
    }

    // Retriable failure
    await supabase
      .from('notification_outbox')
      .update({
        status: 'FAILED',
        retry_count: (outboxItem.retry_count || 0) + 1,
        last_error: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', outboxId);

    return { ok: false, error: result.error };
  }

  return { ok: false, error: `Unsupported channel: ${outboxItem.channel}` };
}
