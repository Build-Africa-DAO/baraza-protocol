import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PageLoader from '@/components/PageLoader';
import { StatusScreen } from '@/components/StatusPage';
import { IdentityStrip } from '@/components/app/IdentityStrip';
import { AskAkili } from '@/akili/AskAkili';
import { AmountBlock } from '@/components/ui/amount-block';
import { Button } from '@/components/ui/button';
import { Field, Input, PhoneField } from '@/components/ui/field';
import { InlineError } from '@/components/ui/inline-error';
import { StatusChip } from '@/components/ui/status-chip';
import { Stepper } from '@/components/ui/stepper';
import { useAccount } from '@/contexts/AccountContext';
import { useCommunity } from '@/hooks/useCommunities';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, submitGuard } from '@/lib/api';
import { isPaymentSimulatorEnabled, RAIL_UNAVAILABLE_COPY } from '@/lib/devMode';
import { acceptInviteCode } from '@/lib/inviteAccept';
import { formatMoney, groupCurrency } from '@/lib/money';
import { PRODUCT_ENVIRONMENT } from '@/lib/network';
import { storePaymentOrderActivationSecret } from '@/lib/payments';
import { calculateDynamicFee, type FeeBreakdown } from '@/lib/payments/feeEngine';
import { normaliseKenyanPhone } from '@/lib/phone';
import { useSeo } from '@/lib/seo';
import { rulesSentence } from '@/lib/voteCopy';

/**
 * §13.11 Join — one page, four stages on the stepper at the top.
 *
 * Stage A: see the group, the rules and the amount (a server quote when the
 * intent API answers, the same fee formula locally otherwise). Stage B: pay
 * with M-Pesa. Confirming and You're In continue on `/join/:id/status`, which
 * wears the same stepper, so the person never feels they changed rooms.
 * No bank-transfer copy, no wallet picker.
 */
export const JOIN_STEPS = [{ label: 'See Group' }, { label: 'Pay' }, { label: 'Confirming' }, { label: "You're In" }];

const TYPE_LABELS: Record<string, string> = {
  savings: 'Savings chama',
  sacco: 'SACCO',
  cooperative: 'Cooperative',
  welfare: 'Welfare group',
  investment: 'Investment club',
  housing: 'Housing SACCO',
  professional: 'Professional network',
};

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase() || 'GP'
  );
}

export default function JoinDao() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { community, isLoading } = useCommunity(id);
  const account = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();

  useSeo({
    title: community ? `Join ${community.name}` : 'Join a group',
    description: 'See the group, the rules and the amount, then pay dues by M-Pesa.',
    path: id ? `/join/${id}` : undefined,
    noIndex: true,
  });

  const [phone, setPhone] = useState('');
  const [txHash, setTxHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FeeBreakdown | null>(null);
  const [otherWays, setOtherWays] = useState(false);

  const currency = groupCurrency(community);
  const amountMajor = community?.membershipFee ?? 0;
  const fee = quote ?? calculateDynamicFee(Math.round(amountMajor * 100), currency, true);
  const isFree = fee.totalExpectedMinor <= 0;
  const needsLogin = !account.authenticated;
  const stage = needsLogin ? 0 : 1;
  const normalisedPhone = normaliseKenyanPhone(phone);
  const hashOk = /^[a-f0-9]{64}$/i.test(txHash.trim());

  // An invite code in the URL is accepted as soon as the person is signed in.
  useEffect(() => {
    const code = searchParams.get('invite');
    if (!code || !/^[a-zA-Z0-9_-]{6,32}$/.test(code) || !account.authenticated) return;
    let cancelled = false;
    void acceptInviteCode(code, account.getAccessToken).then((accepted) => {
      if (cancelled || !accepted.ok || !accepted.communityId) return;
      if (accepted.alreadyMember) {
        toast({ title: 'You Already Belong to This Group', description: 'Opening the group.' });
        navigate(`/dashboard/${accepted.communityId}`);
      } else if (accepted.joined) {
        toast({ title: 'Invite Accepted', description: 'Pay the activation dues if this group charges them.' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [account.authenticated, account.getAccessToken, navigate, searchParams, toast]);

  // The server's quote wins over the local formula when it answers.
  useEffect(() => {
    if (!id || !community || amountMajor <= 0) return;
    let cancelled = false;
    void apiFetch<{ feeBreakdown?: FeeBreakdown }>('/api/stellar/create-payment-intent', {
      method: 'POST',
      body: { communityId: id },
      auth: 'omit',
    }).then((result) => {
      if (result.ok && !cancelled && result.data?.feeBreakdown) setQuote(result.data.feeBreakdown);
    });
    return () => {
      cancelled = true;
    };
  }, [amountMajor, community, id]);

  async function joinFree() {
    if (!id || busy) return;
    if (needsLogin) {
      account.login();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const walletAddress = account.accountId ?? `phone:${normalisedPhone ?? 'unknown'}`;
      const result = await submitGuard.run(`join-free:${id}`, () =>
        apiFetch<{ ok?: boolean }>('/api/membership/activate', {
          method: 'POST',
          body: {
            orderId: `ord_free_${id}_${Date.now().toString(36)}`,
            communityId: id,
            walletAddress,
            activationSecret: `sec_free_${crypto.randomUUID()}`,
          },
          auth: 'omit',
        }),
      );
      if (!result) return;
      if (!result.ok || !result.data?.ok) {
        setError(result.ok ? 'Baraza could not activate the membership. Try again.' : result.error.message);
        return;
      }
      toast({ title: "You're In", description: `Welcome to ${community?.name ?? 'the group'}.` });
      navigate(`/dashboard/${id}`);
    } finally {
      setBusy(false);
    }
  }

  async function payWithMpesa() {
    if (!id || busy) return;
    if (needsLogin) {
      account.login();
      return;
    }
    if (!normalisedPhone) return;
    setError(null);
    if (!isPaymentSimulatorEnabled()) {
      setError(RAIL_UNAVAILABLE_COPY);
      return;
    }
    setBusy(true);
    try {
      const result = await submitGuard.run(`join-pay:${id}`, () =>
        apiFetch<{ orderId?: string; activationSecret?: string }>('/api/mpesa/simulate', {
          method: 'POST',
          body: {
            phone: `+254${normalisedPhone}`,
            communityId: id,
            amount: Math.round(fee.totalExpectedMinor / 100),
            currency,
          },
          auth: 'omit',
        }),
      );
      if (!result) return;
      if (!result.ok || !result.data?.orderId) {
        setError(result.ok ? 'The payment could not be started. Nothing has been charged.' : `${result.error.message} Nothing has been charged.`);
        return;
      }
      if (result.data.activationSecret) storePaymentOrderActivationSecret(result.data.orderId, result.data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(result.data.orderId)}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyTransfer() {
    if (!id || !hashOk || verifying) return;
    if (needsLogin) {
      account.login();
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      // The intent is optional off mainnet; on mainnet verify-payment requires it.
      const intent = await apiFetch<{ intentToken?: string }>('/api/stellar/create-payment-intent', {
        method: 'POST',
        body: { communityId: id, amountKes: amountMajor, environment: PRODUCT_ENVIRONMENT },
        auth: 'omit',
      });
      const intentToken = intent.ok ? intent.data?.intentToken ?? null : null;
      const result = await submitGuard.run(`verify:${txHash.trim().toLowerCase()}`, () =>
        apiFetch<{ orderId?: string; activationSecret?: string | null }>('/api/stellar/verify-payment', {
          method: 'POST',
          body: intentToken
            ? { intentToken, txHash: txHash.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT }
            : { communityId: id, txHash: txHash.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT },
          auth: 'omit',
        }),
      );
      if (!result) return;
      if (!result.ok || !result.data?.orderId) {
        setError(
          !result.ok && (result.error.code === 'stellar_payment_reused' || result.error.code === 'stellar_intent_reused')
            ? 'That transfer has already been used for a membership.'
            : !result.ok && result.error.code === 'stellar_verification_failed'
              ? 'We could not find a matching payment to the group account for that reference. Check it and try again.'
              : !result.ok
                ? result.error.message
                : 'The transfer could not be verified. Check the reference and try again.',
        );
        return;
      }
      if (result.data.activationSecret) storePaymentOrderActivationSecret(result.data.orderId, result.data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(result.data.orderId)}&rail=stellar`);
    } finally {
      setVerifying(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <PageLoader label="Loading Group" />
      </Layout>
    );
  }
  if (!community) return <StatusScreen kind="community" />;

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-2xl space-y-6 px-4">
          <Link
            to={account.authenticated ? `/dashboard/${community.id}` : '/groups'}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {account.authenticated ? 'Back to Group' : 'Browse Groups'}
          </Link>

          <Stepper steps={JOIN_STEPS} current={stage} />

          <IdentityStrip
            name={community.name}
            initials={community.image ?? initialsOf(community.name)}
            type={TYPE_LABELS[community.type] ?? community.type}
            chip={<StatusChip kind="info" icon={null} label="Joining" />}
          />

          <p className="text-sm text-muted-foreground">
            {rulesSentence({
              quorumPct: community.quorumPct,
              approvalThresholdPct: community.approvalThresholdPct,
              votingPeriodDays: community.votingPeriodDays,
            })}
          </p>

          {/* Stage A — the amount, itemised. A quote from the server when it answers. */}
          <section className="baraza-card p-5" aria-labelledby="join-amount">
            <div className="flex items-start justify-between gap-4">
              <AmountBlock
                label={isFree ? 'To Join' : 'To Join, Once'}
                amountMinor={isFree ? 0 : fee.totalExpectedMinor}
                currency={currency}
                note={isFree ? 'This group charges nothing to join.' : quote ? 'Quoted by Baraza for this group.' : undefined}
              />
              {!isFree ? <AskAkili prompt={`Why is joining ${community.name} ${formatMoney(fee.totalExpectedMinor, currency)}?`} label="Why This Amount?" variant="chip" /> : null}
            </div>
            {!isFree ? (
              <dl className="mt-4 divide-y divide-border border-t border-border text-sm">
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Activation fee</dt>
                  <dd className="tabular-nums">{formatMoney(fee.baseAmountMinor, currency)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Baraza platform fee (2.0%)</dt>
                  <dd className="tabular-nums">{formatMoney(fee.platformFeeMinor, currency)}</dd>
                </div>
                {fee.carrierCostMinor > 0 ? (
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Carrier processing cost</dt>
                    <dd className="tabular-nums">{formatMoney(fee.carrierCostMinor, currency)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between py-2 font-semibold">
                  <dt id="join-amount">Total</dt>
                  <dd className="tabular-nums">{formatMoney(fee.totalExpectedMinor, currency)}</dd>
                </div>
              </dl>
            ) : null}
          </section>

          {/* Stage B — how they get in. */}
          {(
            <section className="baraza-card p-5" aria-labelledby="join-pay">
              <h2 id="join-pay" className="font-display text-base font-bold">
                {isFree ? 'Join' : 'Pay With M-Pesa'}
              </h2>
              {needsLogin ? (
                <p className="mt-2 text-sm text-muted-foreground">Sign in first so this membership is attached to your Baraza account.</p>
              ) : isFree ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing to pay. Your account becomes the membership.</p>
              ) : (
                <div className="mt-4">
                  <Field
                    label="M-Pesa Phone Number"
                    htmlFor="join-phone"
                    help="Enter your M-Pesa PIN on your phone when the prompt arrives."
                    error={phone.length > 0 && !normalisedPhone ? 'Enter a Kenyan mobile number, for example 712 345 678.' : undefined}
                  >
                    <PhoneField id="join-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="7XX XXX XXX" aria-invalid={phone.length > 0 && !normalisedPhone} />
                  </Field>
                </div>
              )}

              {error ? <InlineError className="mt-4" message={error} /> : null}

              <Button
                type="button"
                fullWidth
                className="mt-5"
                onClick={() => void (isFree ? joinFree() : payWithMpesa())}
                disabled={needsLogin ? !account.ready : busy || (!isFree && !normalisedPhone)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {needsLogin ? 'Sign in to pay' : busy ? 'Check Your Phone' : isFree ? 'Join This Group' : 'Pay With M-Pesa'}
              </Button>

              <p className="mt-3 text-xs text-muted-foreground">
                A confirmed payment and an active membership are two steps. You will see both on the next screen.
              </p>
            </section>
          )}

          {!isFree ? (
            <section className="baraza-card p-5">
              <button
                type="button"
                onClick={() => setOtherWays((open) => !open)}
                aria-expanded={otherWays}
                className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold"
              >
                Other Ways to Pay
                <ChevronDown className={`h-4 w-4 transition-transform ${otherWays ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {otherWays ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    If your group settles on-chain and you already sent {formatMoney(fee.totalExpectedMinor, currency)} that way, paste the transfer reference and Baraza checks it.
                  </p>
                  <Field label="Transfer Reference" htmlFor="join-hash" help="The 64-character reference from the transfer." error={txHash && !hashOk ? 'A transfer reference is 64 letters and numbers.' : undefined}>
                    <Input id="join-hash" value={txHash} onChange={(event) => setTxHash(event.target.value)} className="font-mono" aria-invalid={Boolean(txHash && !hashOk)} />
                  </Field>
                  <Button type="button" variant="outline" onClick={() => void verifyTransfer()} disabled={!hashOk || verifying}>
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    Verify Transfer
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}
