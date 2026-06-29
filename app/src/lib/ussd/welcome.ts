/**
 * USSD welcome flow — Nia's filing (2026-06-17).
 *
 * Closes the belonging gap between USSD/feature-phone members and the
 * smartphone WelcomeScreen. Four screens fire on the first dial after a
 * USSD-originated payment reaches MINT_CONFIRMED for that phone+community
 * pair.
 *
 * Member-voice gap (carried from Nia's filing): obs-corpus-220 voices were
 * not queryable when this was designed. Before this flow is treated as the
 * final word, one verbatim voice from a member describing what they expected
 * when they paid the first time belongs on the implementation ticket.
 */

import type { MenuResult } from './menu.js';

export interface PendingWelcome {
  phoneNumber: string;
  communityCode: string;
  communityName: string;
  memberName?: string;
  /** Live community proposal title, if any. Defaults to a stable example. */
  activeProposalTitle?: string;
  paymentAmountKes: number;
  /** Months paid so far (1 on first welcome). */
  monthsPaid: number;
  /** Expected month count for the dues schedule (defaults to 1). */
  totalMonthsExpected: number;
  triggeredAt: number;
}

const pendingWelcomes = new Map<string, PendingWelcome>();
const pendingSmsFallbacks = new Set<string>();

/**
 * Webhook hook: call this from the payment promoter when MINT_CONFIRMED
 * fires the first time for a USSD-originated (phone, community) pair.
 *
 * Note: in serverless, the cron and the USSD handler are different processes,
 * so the in-memory registry alone won't carry state across them. The promoter
 * additionally calls `flagPendingWelcomeOnOrder()` (Supabase write) so the
 * USSD endpoint can rehydrate via `hydratePendingWelcomeFromDb()` on session
 * start. Cross-process persistence lives in Phase 2-B; this function remains
 * the single in-process insertion point.
 */
export function markMemberOnboarded(
  input: Omit<PendingWelcome, 'triggeredAt'>,
): void {
  pendingWelcomes.set(input.phoneNumber, { ...input, triggeredAt: Date.now() });
}

/**
 * Cron-side helper: write `metadata.pending_welcome` on the payment_order so
 * any USSD process can read it back on next session. No-op if Supabase env is
 * not configured (dev / test). Fire-and-forget; failures are logged.
 */
export async function flagPendingWelcomeOnOrder(input: {
  orderId: string;
  phoneNumber: string;
  communityCode: string;
  communityName: string;
  memberName?: string;
  paymentAmountKes: number;
  monthsPaid: number;
  totalMonthsExpected: number;
  activeProposalTitle?: string;
}): Promise<void> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const payload = {
    metadata: {
      pending_welcome: {
        phone: input.phoneNumber,
        communityCode: input.communityCode,
        communityName: input.communityName,
        memberName: input.memberName ?? null,
        activeProposalTitle: input.activeProposalTitle ?? null,
        paymentAmountKes: input.paymentAmountKes,
        monthsPaid: input.monthsPaid,
        totalMonthsExpected: input.totalMonthsExpected,
        triggeredAt: Date.now(),
      },
    },
  };

  try {
    await fetch(
      `${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(input.orderId)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
  } catch (err) {
    console.warn('[welcome] flagPendingWelcomeOnOrder failed', input.orderId, err);
  }
}

/**
 * USSD endpoint helper: if a pending welcome is persisted on any of this
 * phone's orders, hydrate the in-memory registry so welcomeFlow can pick it
 * up. Drains the metadata so the same welcome doesn't replay on every dial.
 *
 * Idempotent: if multiple orders carry pending_welcome (unlikely), the most
 * recent one wins and the others get cleared too.
 */
export async function hydratePendingWelcomeFromDb(phoneNumber: string): Promise<void> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  if (pendingWelcomes.has(phoneNumber)) return;

  try {
    const params = new URLSearchParams({
      select: 'order_id,metadata',
      'metadata->pending_welcome->>phone': `eq.${phoneNumber}`,
      limit: '5',
    }).toString();

    const res = await fetch(`${url}/rest/v1/payment_orders?${params}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!res.ok) return;

    interface OrderRow {
      order_id: string;
      metadata?: { pending_welcome?: Omit<PendingWelcome, 'phoneNumber'> & { phone: string } };
    }
    const rows = (await res.json().catch(() => [])) as OrderRow[];
    if (rows.length === 0) return;

    const latest = rows.sort(
      (a, b) =>
        (b.metadata?.pending_welcome?.triggeredAt ?? 0) -
        (a.metadata?.pending_welcome?.triggeredAt ?? 0),
    )[0];
    const pw = latest.metadata?.pending_welcome;
    if (!pw) return;

    markMemberOnboarded({
      phoneNumber: pw.phone,
      communityCode: pw.communityCode,
      communityName: pw.communityName,
      memberName: pw.memberName ?? undefined,
      activeProposalTitle: pw.activeProposalTitle ?? undefined,
      paymentAmountKes: pw.paymentAmountKes,
      monthsPaid: pw.monthsPaid,
      totalMonthsExpected: pw.totalMonthsExpected,
    });

    // Clear the metadata on the order so it doesn't replay.
    await fetch(
      `${url}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(latest.order_id)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ metadata: { pending_welcome: null } }),
      },
    );
  } catch (err) {
    console.warn('[welcome] hydratePendingWelcomeFromDb failed', err);
  }
}

export function peekPendingWelcome(phone: string): PendingWelcome | null {
  return pendingWelcomes.get(phone) ?? null;
}

export function consumePendingWelcome(phone: string): void {
  pendingWelcomes.delete(phone);
}

/**
 * Welcomes older than `ms` should get the SMS fallback. Cron / monitoring
 * (Phase 2-B / Seku's instrumentation) drains this list and dispatches.
 */
export function getStalePendingWelcomes(ms: number): PendingWelcome[] {
  const cutoff = Date.now() - ms;
  return [...pendingWelcomes.values()].filter((w) => w.triggeredAt <= cutoff);
}

/**
 * The handler layer drains this set to send SMS welcomes for members who
 * skipped the in-session flow (chose "Main menu" on W0). Separate from the
 * 60-second stale list above; this is an explicit skip signal.
 */
export function takePendingSmsFallbacks(): string[] {
  const drained = [...pendingSmsFallbacks];
  pendingSmsFallbacks.clear();
  return drained;
}

function maskedName(name: string | undefined, phone: string): string {
  if (name && name.trim()) return name.trim();
  // Keep the last 4 digits visible — chama members recognise their own
  // tail digits, and full numbers feel surveillant on a screen they share.
  const tail = phone.slice(-4);
  return `friend (${tail})`;
}

function w0(welcome: PendingWelcome): MenuResult {
  const name = maskedName(welcome.memberName, welcome.phoneNumber);
  return {
    text:
      `Baraza: Karibu, ${name}!\n` +
      `You are now a member of ${welcome.communityName}.\n` +
      `Your payment of ${welcome.paymentAmountKes} KES is confirmed.\n\n` +
      `1. See what this means\n2. Main menu`,
    action: 'CON',
  };
}

function w1(welcome: PendingWelcome): MenuResult {
  const proposal = welcome.activeProposalTitle ?? 'Purchase Shared Boda-Boda';
  return {
    text:
      `Your voice counts here.\n` +
      `Members vote on decisions like loans, events & fund releases.\n` +
      `Example: ${proposal}\n\n` +
      `1. Next\n0. Main menu`,
    action: 'CON',
  };
}

function w2(welcome: PendingWelcome): MenuResult {
  return {
    text:
      `Month ${welcome.monthsPaid} done. Your standing begins today.\n` +
      `Pay each month to keep your vote & build trust.\n` +
      `Your record: ${welcome.monthsPaid}/${welcome.totalMonthsExpected}\n\n` +
      `1. Next\n0. Main menu`,
    action: 'CON',
  };
}

function w3(): MenuResult {
  return {
    text:
      `Later: link a wallet to access BRZA rewards & vote on baraza.app.\n` +
      `For now, your phone IS your membership.\n\n` +
      `1. Go to my community\n0. Main menu`,
    action: 'CON',
  };
}

function exitToMainMenuMessage(): MenuResult {
  return {
    text: 'Returning to Baraza menu. Dial *384# to continue.',
    action: 'END',
  };
}

function exitToCommunityMessage(communityName: string): MenuResult {
  return {
    text: `Welcome complete. You are with ${communityName}. Dial *384# to vote or pay dues.`,
    action: 'END',
  };
}

function flagSmsFallback(phone: string): void {
  pendingSmsFallbacks.add(phone);
}

/**
 * Render the welcome flow for an accumulated USSD `text` path. The caller
 * must have already confirmed a `PendingWelcome` exists for the phone. On
 * exit (W3 complete OR any "Main menu" choice), the welcome is consumed
 * and — for the skip path — an SMS fallback is queued.
 */
export function welcomeFlow(text: string, welcome: PendingWelcome): MenuResult {
  // W0 — fresh dial
  if (text === '') {
    return w0(welcome);
  }

  const path = text.split('*');

  // W0 → choice
  if (path.length === 1) {
    if (path[0] === '1') return w1(welcome);
    if (path[0] === '2') {
      consumePendingWelcome(welcome.phoneNumber);
      flagSmsFallback(welcome.phoneNumber);
      return exitToMainMenuMessage();
    }
    return { text: 'Invalid selection.', action: 'END' };
  }

  // W1 → choice
  if (path.length === 2 && path[0] === '1') {
    if (path[1] === '1') return w2(welcome);
    if (path[1] === '0') {
      consumePendingWelcome(welcome.phoneNumber);
      return exitToMainMenuMessage();
    }
  }

  // W2 → choice
  if (path.length === 3 && path[0] === '1' && path[1] === '1') {
    if (path[2] === '1') return w3();
    if (path[2] === '0') {
      consumePendingWelcome(welcome.phoneNumber);
      return exitToMainMenuMessage();
    }
  }

  // W3 → choice
  if (path.length === 4 && path[0] === '1' && path[1] === '1' && path[2] === '1') {
    if (path[3] === '1') {
      consumePendingWelcome(welcome.phoneNumber);
      return exitToCommunityMessage(welcome.communityName);
    }
    if (path[3] === '0') {
      consumePendingWelcome(welcome.phoneNumber);
      return exitToMainMenuMessage();
    }
  }

  return { text: 'Invalid selection.', action: 'END' };
}

// Test-only — reset module state between tests.
export function __resetWelcomeRegistryForTests(): void {
  pendingWelcomes.clear();
  pendingSmsFallbacks.clear();
}
