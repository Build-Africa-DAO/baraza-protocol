import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import GroupWorkspace from '@/components/app/GroupWorkspace';
import { ReceiptCard, type ReceiptStatus } from '@/components/app/ReceiptCard';
import { AmountBlock } from '@/components/ui/amount-block';
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
import { groupCurrency } from '@/lib/money';
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
  const knowsDues = membership.source === 'api';
  const duesOwedMinor = membership.duesOwedMinor;

  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<Stage>('amount');
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<PaymentOrderStatus | null>(null);
  const [orderAt, setOrderAt] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

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

  const owesNothing = knowsDues && (duesOwedMinor === null || duesOwedMinor <= 0);
  if (owesNothing && stage === 'amount') {
    return (
      <EmptyState
        title="You Are Up to Date"
        body={`Nothing is outstanding for ${community.name} right now.`}
        secondary={{ label: 'Go Home', to: `/dashboard/${community.id}` }}
      >
        {streak ? <StatusChip kind="confirmed" label={`${streak} ${streak === 1 ? 'Month' : 'Months'} On Time`} /> : null}
      </EmptyState>
    );
  }

  const normalisedPhone = normaliseKenyanPhone(phone);
  const canPay = knowsDues && duesOwedMinor !== null && duesOwedMinor > 0 && normalisedPhone !== null && stage === 'amount';

  async function pay() {
    if (!canPay || !normalisedPhone || duesOwedMinor === null) return;
    setError(null);
    const endpoint = isPaymentSimulatorEnabled() ? '/api/mpesa/simulate' : '/api/mpesa/stk-push';
    setStage('sending');
    const result = await submitGuard.run(`pay:${community.id}`, () =>
      apiFetch<{ orderId?: string; activationSecret?: string }>(endpoint, {
        method: 'POST',
        body: {
          phone: `+254${normalisedPhone}`,
          communityId: community.id,
          amount: Math.round(duesOwedMinor / 100),
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
          amountMinor={duesOwedMinor}
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
          <section className="baraza-card p-5">
            <div className="flex items-start justify-between gap-4">
              <AmountBlock
                label="Amount Due"
                amountMinor={knowsDues ? duesOwedMinor : null}
                currency={currency}
                note={knowsDues && duesOwedMinor !== null ? undefined : 'We could not read what you owe from your membership record yet. Ask an officer for the amount before paying.'}
              />
              {streak ? <StatusChip kind="confirmed" label={`${streak} ${streak === 1 ? 'Month' : 'Months'} On Time`} /> : null}
            </div>
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
                disabled={stage !== 'amount'}
                aria-invalid={phone.length > 0 && !normalisedPhone}
              />
            </Field>

            {error ? <InlineError className="mt-4" message={error} /> : null}

            <Button type="button" onClick={() => void pay()} disabled={!canPay} fullWidth className="mt-5">
              {stage !== 'amount' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {stage === 'amount' ? 'Pay With M-Pesa' : 'Check Your Phone'}
            </Button>

            {stage === 'confirming' ? (
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
