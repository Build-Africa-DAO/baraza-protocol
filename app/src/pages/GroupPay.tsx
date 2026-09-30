import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ReceiptCard, type ReceiptStatus } from '@/components/app/ReceiptCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, PhoneField } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { StatusChip } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';
import { useAccount } from '@/contexts/AccountContext';
import { formatAccountDate } from '@/lib/accountLocale';
import { RailHealthLine } from '@/components/app/RailHealthLine';
import { apiFetch, submitGuard } from '@/lib/api';
import { isPaymentSimulatorEnabled } from '@/lib/devMode';
import { nextPollDelay } from '@/lib/polling';
import { fetchDuesStreak } from '@/lib/duesStreak';
import { formatMoney, groupCurrency } from '@/lib/money';
import { calculateDynamicFee } from '@/lib/payments/feeEngine';
import {
  fetchPaymentOrder,
  isFailureStatus,
  isTerminalStatus,
  PAYMENT_HAPPY_PATH,
  storePaymentOrderActivationSecret,
  type PaymentOrderStatus, getPaymentOrderActivationSecret } from '@/lib/payments';
import { normaliseKenyanPhone } from '@/lib/phone';
import { SUPPORT_EMAIL } from '@/lib/support';
import type { Community } from '@/lib/constants';
import type { GroupMembership } from '@/hooks/useGroupMembership';

/**
 * §13.13 Pay Dues — one page, four stages.
 *
 * Amount (from `GET /api/user/memberships`), phone, pay, then confirming and
 * the receipt on this same page. The receipt carries the reference, the
 * status as the server reports it, and the 14-day dispute path. Nothing here
 * ever says "paid" before the provider does.
 */
export default function GroupPay() {
  return (
    <GroupWorkspace
      title="Pay Dues"
      subtitle="Contribute your dues to the shared group pool."
      gate={{ title: 'Sign in to pay', description: 'Log in to pay your dues for this group.' }}
      hideBanner
    >
      {({ community, membership }) => <PayPanel community={community} membership={membership} />}
    </GroupWorkspace>
  );
}

type Stage = 'amount' | 'sending' | 'confirming' | 'done';

const STEPS = [{ label: 'Amount' }, { label: 'Pay' }, { label: 'Confirming' }, { label: 'Done' }];

function statusIndex(status: PaymentOrderStatus): number {
  return PAYMENT_HAPPY_PATH.indexOf(status);
}

function receiptStatus(status: PaymentOrderStatus | null): ReceiptStatus {
  if (!status) return 'pending';
  if (isFailureStatus(status)) return 'failed';
  return statusIndex(status) >= statusIndex('PAYMENT_CONFIRMED') ? 'confirmed' : 'pending';
}

function PayPanel({ community, membership }: { community: Community; membership: GroupMembership }) {
  const account = useAccount();
  const currency = membership.currency ?? groupCurrency(community);
  const duesOwedMinor = membership.duesOwedMinor;

  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<Stage>('amount');
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<PaymentOrderStatus | null>(null);
  const [orderAt, setOrderAt] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [mountedAt] = useState(() => Date.now());

  // Streak comes from the server or not at all (§13.13).
  useEffect(() => {
    if (!account.accountId) return;
    let cancelled = false;
    fetchDuesStreak(account.accountId)
      .then((result) => {
        if (cancelled) return;
        const months = result.perCommunity[community.id] ?? 0;
        setStreak(months > 0 ? months : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account.accountId, community.id]);

  // Confirming: poll the order until the server says it is done or failed.
  useEffect(() => {
    if (stage !== 'confirming' || !orderId) return;
    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();
    const poll = async () => {
      try {
        const order = await fetchPaymentOrder(orderId, getPaymentOrderActivationSecret(orderId));
        if (cancelled) return;
        if (!order) {
          setError(`We have no record of payment ${orderId}. If money left your account, email ${SUPPORT_EMAIL} with that reference. Do not pay again.`);
          setStage('done');
          return;
        }
        setOrderStatus(order.status);
        setOrderAt(order.confirmed_at ?? order.updated_at ?? order.created_at);
        if (isTerminalStatus(order.status)) {
          setStage('done');
          return;
        }
        timer = window.setTimeout(poll, nextPollDelay(startedAt));
      } catch {
        if (cancelled) return;
        timer = window.setTimeout(poll, nextPollDelay(startedAt));
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [stage, orderId]);

  if (!membership.isMember) {
    return (
      <EmptyState
        title="Join This Group First"
        body={`Join ${community.name} before paying dues, so the payment is credited to your membership.`}
        primary={{ label: 'Join This Group', to: `/join/${community.id}` }}
      />
    );
  }

  if (membership.status === 'pending') {
    return (
      <EmptyState
        title="Your Membership Is Being Confirmed"
        body="Dues start once your activation payment is confirmed."
        primary={{ label: 'See Status', to: `/join/${community.id}/status` }}
      />
    );
  }
  const CANVA_LAUNCH_DATE_MS = 1791590400000; // 2026-10-10T00:00:00Z

  // Effective dues owed: either individual member record or standard community rate
  const fallbackDuesMinor = community.membershipFee ? Math.round(community.membershipFee * 100) : 0;
  const effectiveDuesMinor = duesOwedMinor !== null ? duesOwedMinor : fallbackDuesMinor;
  const feeBreakdown = calculateDynamicFee(effectiveDuesMinor, currency, true);

  const isNonMonetary = community.feeType === 'free' || (!community.membershipFee && (duesOwedMinor === null || duesOwedMinor === 0));
  const isContributionsGated = Boolean(
    community.contributionsGated ||
    (community.type === 'creative' && mountedAt < CANVA_LAUNCH_DATE_MS)
  );

  const owesNothing = isNonMonetary || effectiveDuesMinor <= 0;
  if (owesNothing && stage === 'amount') {
    return (
      <EmptyState
        title={isNonMonetary ? 'No Dues Required' : 'You Are Up to Date'}
        body={
          isNonMonetary
            ? `${community.name} does not collect mandatory dues. Your membership and voting seat are active.`
            : `Nothing is outstanding for ${community.name} right now.`
        }
        secondary={{ label: 'Go Home', to: `/dashboard/${community.id}` }}
      >
        {streak ? <StatusChip kind="confirmed" label={`${streak} ${streak === 1 ? 'Month' : 'Months'} On Time`} /> : null}
      </EmptyState>
    );
  }

  const normalisedPhone = normaliseKenyanPhone(phone);
  const canPay = !isContributionsGated && effectiveDuesMinor > 0 && normalisedPhone !== null && stage === 'amount';

  async function pay() {
    if (!canPay || !normalisedPhone || effectiveDuesMinor <= 0) return;
    setError(null);
    const endpoint = isPaymentSimulatorEnabled() ? '/api/mpesa/simulate' : '/api/mpesa/stk-push';
    setStage('sending');
    const result = await submitGuard.run(`pay:${community.id}`, () =>
      apiFetch<{ orderId?: string; activationSecret?: string }>(endpoint, {
        method: 'POST',
        body: {
          phone: `+254${normalisedPhone}`,
          communityId: community.id,
          amount: Math.round(feeBreakdown.totalExpectedMinor / 100),
          currency,
        },
        auth: 'omit',
      }),
    );
    if (!result) return; // a second tap while the first request is in flight
    if (!result.ok || !result.data?.orderId) {
      setStage('amount');
      setError(result.ok ? 'The payment could not be started. Nothing has been charged.' : `${result.error.message} Nothing has been charged.`);
      return;
    }
    if (result.data.activationSecret) storePaymentOrderActivationSecret(result.data.orderId, result.data.activationSecret);
    setOrderId(result.data.orderId);
    setOrderAt(new Date().toISOString());
    setStage('confirming');
  }

  const stepIndex = stage === 'amount' ? 0 : stage === 'sending' ? 1 : stage === 'confirming' ? 2 : 3;
  const receipt = receiptStatus(orderStatus);

  return (
    <div className="space-y-5">
      <Stepper steps={STEPS} current={stage === 'done' && receipt !== 'failed' ? 4 : stepIndex} failed={stage === 'done' && receipt === 'failed'} />

      {stage === 'done' && orderId ? (
        <ReceiptCard
          amountMinor={feeBreakdown.totalExpectedMinor}
          currency={currency}
          reference={orderId.split('_').pop() ?? orderId}
          date={formatAccountDate(orderAt ?? new Date(), undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          status={receipt}
          note={
            receipt === 'confirmed'
              ? 'The provider has confirmed this payment. It now counts toward your dues.'
              : receipt === 'failed'
                ? `The provider did not complete this payment. Nothing was charged. If it was, email ${SUPPORT_EMAIL} with the reference above.`
                : 'Waiting for the provider to confirm. You can leave this page; the receipt stays in your record. Do not pay again.'
          }
          disputeHref={`/dashboard/${community.id}/settings#disputes`}
          homeHref={`/dashboard/${community.id}`}
          onRetry={() => {
            setStage('amount');
            setOrderId(null);
            setOrderStatus(null);
          }}
        />
      ) : null}

      {stage === 'done' && error ? <InlineError message={error} /> : null}

      {stage !== 'done' ? (
        <>
          <section className="baraza-card p-5" aria-labelledby="pay-amount">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 id="pay-amount" className="font-display text-base font-bold">Contribution Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  {isContributionsGated
                    ? 'Dues collections open 10 October 2026.'
                    : (duesOwedMinor !== null ? 'Individual dues schedule.' : 'Standard community dues schedule.')}
                </p>
              </div>
              {streak ? <StatusChip kind="confirmed" label={`${streak} ${streak === 1 ? 'Month' : 'Months'} On Time`} /> : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="baraza-card flex flex-col items-center justify-center p-3 md:p-4 text-center min-h-20">
                <p className="text-xs font-medium text-muted-foreground">Dues to Vault</p>
                <p className="mt-1 font-display text-base md:text-lg font-bold tabular-nums tracking-tight text-foreground">
                  {formatMoney(feeBreakdown.baseAmountMinor, currency)}
                </p>
              </div>
              <div className="baraza-card flex flex-col items-center justify-center p-3 md:p-4 text-center min-h-20">
                <p className="text-xs font-medium text-muted-foreground">Platform fee (1.5%)</p>
                <p className="mt-1 font-display text-base md:text-lg font-bold tabular-nums tracking-tight text-foreground">
                  {formatMoney(feeBreakdown.platformFeeMinor, currency)}
                </p>
              </div>
              <div className="baraza-card flex flex-col items-center justify-center p-3 md:p-4 text-center min-h-20">
                <p className="text-xs font-medium text-muted-foreground">Carrier processing</p>
                <p className="mt-1 font-display text-base md:text-lg font-bold tabular-nums tracking-tight text-foreground">
                  {formatMoney(feeBreakdown.carrierCostMinor, currency)}
                </p>
              </div>
              <div className="baraza-card !bg-primary text-primary-foreground border-0 ring-0 outline-none flex flex-col items-center justify-center p-3 md:p-4 text-center min-h-20 shadow-sm">
                <p className="text-xs font-semibold text-primary-foreground/90">Total</p>
                <p className="mt-1 font-display text-lg md:text-xl font-black tabular-nums tracking-tight text-primary-foreground">
                  {formatMoney(feeBreakdown.totalExpectedMinor, currency)}
                </p>
              </div>
            </div>

            {feeBreakdown.activationFeeMinor > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs px-3 py-2 bg-muted/40 rounded-md border border-border">
                <span className="text-muted-foreground">First-Time Member Protocol Activation:</span>
                <span className="font-semibold text-foreground">{formatMoney(feeBreakdown.activationFeeMinor, currency)}</span>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground text-center">
              100% of your {formatMoney(feeBreakdown.netCreditedMinor, currency)} dues goes directly into {community.name}&apos;s sovereign treasury.
            </p>
          </section>

          <section className="baraza-card p-5">
            <RailHealthLine className="mb-3" />
            <Field
              label="M-Pesa Phone Number"
              htmlFor="pay-phone"
              help="Enter your M-Pesa PIN on your phone when the prompt arrives."
              error={phone.length > 0 && !normalisedPhone ? 'Enter a Kenyan mobile number, for example 712 345 678.' : undefined}
            >
              <PhoneField
                id="pay-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="7XX XXX XXX"
                disabled={stage !== 'amount' || isContributionsGated}
                aria-invalid={phone.length > 0 && !normalisedPhone}
              />
            </Field>

            {error ? <InlineError className="mt-4" message={error} /> : null}

            {isContributionsGated ? (
              <Button type="button" disabled fullWidth className="mt-5">
                Contributions Open 10 October
              </Button>
            ) : (
              <Button type="button" onClick={() => void pay()} disabled={!canPay} fullWidth className="mt-5">
                {stage !== 'amount' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {stage === 'amount' ? 'Pay With M-Pesa' : 'Check Your Phone'}
              </Button>
            )}

            {isContributionsGated ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Contributions for this community launch on 10 October 2026. Your voting seat and membership are active today.
              </p>
            ) : stage === 'confirming' ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Enter your M-Pesa PIN on your phone. This page updates when the provider confirms.
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                A payment is only counted once the provider confirms it. If something looks wrong, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                  {SUPPORT_EMAIL}
                </a>{' '}
                rather than paying again.
              </p>
            )}
          </section>
        </>
      ) : null}

      {stage === 'done' ? (
        <p className="text-sm text-muted-foreground">
          Need this later? It is also on{' '}
          <Link to={`/dashboard/${community.id}/money`} className="font-semibold text-foreground underline-offset-4 hover:underline">
            Money
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
