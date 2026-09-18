import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
import { RailHealthLine } from '@/components/app/RailHealthLine';
import { apiFetch, submitGuard } from '@/lib/api';
import { isPaymentSimulatorEnabled } from '@/lib/devMode';
import { acceptInviteCode } from '@/lib/inviteAccept';
import { formatMoney, groupCurrency } from '@/lib/money';
import { PRODUCT_ENVIRONMENT } from '@/lib/network';
import { storePaymentOrderActivationSecret } from '@/lib/payments';
import { calculateDynamicFee, type FeeBreakdown } from '@/lib/payments/feeEngine';
import { normaliseKenyanPhone } from '@/lib/phone';
import { useCommunityImage } from '@/lib/imageUpload';
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

export const PAYMENT_METHODS = [
  {
    id: 'mpesa' as const,
    name: 'M-Pesa',
    subtitle: 'Safaricom STK',
    logo: '/logos/mpesa.svg',
  },
  {
    id: 'airtel' as const,
    name: 'Airtel Money',
    subtitle: 'Airtel Kenya',
    logo: '/logos/airtel.svg',
  },
  {
    id: 'card' as const,
    name: 'Card / Bank',
    subtitle: 'Mastercard / Visa',
    logo: '/logos/mastercard.svg',
  },
  {
    id: 'crypto' as const,
    name: 'Crypto',
    subtitle: 'Stellar XLM / USDC',
    logo: '/logos/stellar.svg',
    invertOnDark: true,
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

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
  const { image: communityLogo } = useCommunityImage(community?.id, community?.image);
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
  const [email, setEmail] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'airtel' | 'card' | 'crypto'>('mpesa');
  const [txHash, setTxHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FeeBreakdown | null>(null);

  const currency = groupCurrency(community);
  const amountMajor = community?.membershipFee ?? 0;
  const fee = quote ?? calculateDynamicFee(Math.round(amountMajor * 100), currency, true);
  const isFree = fee.totalExpectedMinor <= 0;
  const needsLogin = !account.authenticated;
  const stage = needsLogin ? 0 : 1;
  const normalisedPhone = normaliseKenyanPhone(phone);
  const hashOk = /^[a-f0-9]{64}$/i.test(txHash.trim());
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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

  async function payWithMobileMoney(targetRail: 'mpesa' | 'airtel' = selectedMethod === 'airtel' ? 'airtel' : 'mpesa') {
    if (!id || busy) return;
    if (needsLogin) {
      account.login();
      return;
    }
    if (!normalisedPhone) return;
    setError(null);
    // M-Pesa has a live Daraja route (dev, PR #94); Airtel Money has none yet, so
    // outside the simulator it stays honest and says the rail is unavailable.
    if (targetRail === 'airtel' && !isPaymentSimulatorEnabled()) {
      setError(RAIL_UNAVAILABLE_COPY);
      return;
    }
    const endpoint = isPaymentSimulatorEnabled() ? '/api/mpesa/simulate' : '/api/mpesa/stk-push';
    setBusy(true);
    try {
      const result = await submitGuard.run(`join-pay:${id}`, () =>
        apiFetch<{ orderId?: string; activationSecret?: string }>(endpoint, {
          method: 'POST',
          body: {
            phone: `+254${normalisedPhone}`,
            communityId: id,
            amount: Math.round(fee.totalExpectedMinor / 100),
            currency,
            rail: targetRail,
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
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(result.data.orderId)}&rail=${targetRail}`);
    } finally {
      setBusy(false);
    }
  }

  async function payWithCard() {
    if (!id || busy) return;
    if (needsLogin) {
      account.login();
      return;
    }
    if (!emailOk) return;
    setError(null);
    if (!isPaymentSimulatorEnabled()) {
      setError(RAIL_UNAVAILABLE_COPY);
      return;
    }
    setBusy(true);
    try {
      const orderId = `ord_card_${id}_${Date.now().toString(36)}`;
      const result = await submitGuard.run(`join-pay-card:${id}`, () =>
        apiFetch<{ orderId?: string; activationSecret?: string }>('/api/mpesa/simulate', {
          method: 'POST',
          body: {
            phone: `+254${normalisedPhone || '700000000'}`,
            communityId: id,
            amount: Math.round(fee.totalExpectedMinor / 100),
            currency,
            channel: 'card',
          },
          auth: 'omit',
        }),
      );
      if (!result || !result.ok || !result.data?.orderId) {
        const simSecret = `sec_card_${crypto.randomUUID()}`;
        storePaymentOrderActivationSecret(orderId, simSecret);
        navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}&rail=card`);
        return;
      }
      if (result.data.activationSecret) storePaymentOrderActivationSecret(result.data.orderId, result.data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(result.data.orderId)}&rail=card`);
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
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 md:px-6">
          <Link
            to={account.authenticated ? `/dashboard/${community.id}` : '/groups'}
            className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {account.authenticated ? 'Back to Group' : 'Browse Groups'}
          </Link>

          <Stepper steps={JOIN_STEPS} current={stage} />

          <IdentityStrip
            name={community.name}
            initials={communityLogo ?? community.image ?? initialsOf(community.name)}
            image={communityLogo ?? community.image}
            type={TYPE_LABELS[community.type] ?? community.type}
            chip={<StatusChip kind="info" icon={null} label="Joining" />}
            centered
            singleRow
          />

          <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
            {rulesSentence({
              quorumPct: community.quorumPct,
              approvalThresholdPct: community.approvalThresholdPct,
              votingPeriodDays: community.votingPeriodDays,
            })}
          </p>

          {/* Stage A — the amount, itemised as 4 vertical cards in one row. */}
          {isFree ? (
            <section className="baraza-card p-5 text-center" aria-labelledby="join-amount">
              <AmountBlock
                className="text-center"
                label="To Join"
                amountMinor={0}
                currency={currency}
                note="This group charges nothing to join."
              />
            </section>
          ) : (
            <section className="space-y-4" aria-labelledby="join-amount">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="baraza-card flex flex-col items-center justify-center p-4 md:p-5 text-center min-h-24">
                  <p className="text-xs font-medium text-muted-foreground">Activation fee</p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-black tabular-nums tracking-tight text-foreground">
                    {formatMoney(fee.baseAmountMinor, currency)}
                  </p>
                </div>
                <div className="baraza-card flex flex-col items-center justify-center p-4 md:p-5 text-center min-h-24">
                  <p className="text-xs font-medium text-muted-foreground">Baraza platform fee (2.0%)</p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-black tabular-nums tracking-tight text-foreground">
                    {formatMoney(fee.platformFeeMinor, currency)}
                  </p>
                </div>
                <div className="baraza-card flex flex-col items-center justify-center p-4 md:p-5 text-center min-h-24">
                  <p className="text-xs font-medium text-muted-foreground">Carrier processing cost</p>
                  <p className="mt-1.5 font-display text-lg md:text-xl font-black tabular-nums tracking-tight text-foreground">
                    {formatMoney(fee.carrierCostMinor, currency)}
                  </p>
                </div>
                <div className="baraza-card !bg-primary text-primary-foreground border-0 ring-0 outline-none flex flex-col items-center justify-center p-4 md:p-5 text-center min-h-24 shadow-sm">
                  <p id="join-amount" className="text-xs font-semibold text-primary-foreground/90">Total</p>
                  <p className="mt-1.5 font-display text-xl md:text-2xl font-black tabular-nums tracking-tight text-primary-foreground">
                    {formatMoney(fee.totalExpectedMinor, currency)}
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <AskAkili
                  prompt={`Why is joining ${community.name} ${formatMoney(fee.totalExpectedMinor, currency)}?`}
                  label="Why This Amount?"
                  variant="chip"
                />
              </div>
            </section>
          )}

          {/* Stage B — how they get in. */}
          <section className="baraza-card p-5 md:p-6" aria-labelledby="join-pay">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left column: active payment method form */}
              <div className="flex-1 min-w-0 space-y-4 my-auto">
                <div>
                  <h2 id="join-pay" className="font-display text-base font-bold md:text-lg">
                    {isFree
                      ? 'Join'
                      : selectedMethod === 'mpesa'
                        ? 'Pay With M-Pesa'
                        : selectedMethod === 'airtel'
                          ? 'Pay With Airtel Money'
                          : selectedMethod === 'card'
                            ? 'Pay With Card or Bank'
                            : 'Pay With Crypto (Stellar)'}
                  </h2>
                  {needsLogin ? (
                    <p className="mt-1 text-sm text-muted-foreground">Sign in first so this membership is attached to your Baraza account.</p>
                  ) : isFree ? (
                    <p className="mt-1 text-sm text-muted-foreground">Nothing to pay. Your account becomes the membership.</p>
                  ) : null}
                  {!needsLogin && !isFree ? (
                    <div className="mt-2 flex items-center gap-2">
                      {selectedMethod === 'mpesa' || selectedMethod === 'airtel' ? (
                        <RailHealthLine />
                      ) : selectedMethod === 'card' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                          Instant card & bank checkout (Paystack)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="inline-block h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                          Stellar on-chain verification
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {!needsLogin && !isFree ? (
                  <div>
                    {selectedMethod === 'mpesa' ? (
                      <Field
                        label="M-Pesa Phone Number"
                        htmlFor="join-phone-mpesa"
                        help="Enter your M-Pesa PIN on your phone when the prompt arrives."
                        error={phone.length > 0 && !normalisedPhone ? 'Enter a Kenyan mobile number, for example 712 345 678.' : undefined}
                      >
                        <PhoneField
                          id="join-phone-mpesa"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="7XX XXX XXX"
                          aria-invalid={phone.length > 0 && !normalisedPhone}
                        />
                      </Field>
                    ) : selectedMethod === 'airtel' ? (
                      <Field
                        label="Airtel Phone Number"
                        htmlFor="join-phone-airtel"
                        help="Enter your Airtel Money PIN on your phone when the prompt arrives."
                        error={phone.length > 0 && !normalisedPhone ? 'Enter a Kenyan mobile number, for example 712 345 678.' : undefined}
                      >
                        <PhoneField
                          id="join-phone-airtel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="7XX XXX XXX"
                          aria-invalid={phone.length > 0 && !normalisedPhone}
                        />
                      </Field>
                    ) : selectedMethod === 'card' ? (
                      <Field
                        label="Email Address for Receipt"
                        htmlFor="join-email"
                        help="Enter your email address to receive your Paystack payment receipt."
                        error={email.length > 0 && !emailOk ? 'Enter a valid email address, for example name@example.com.' : undefined}
                      >
                        <Input
                          id="join-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="name@example.com"
                          aria-invalid={Boolean(email.length > 0 && !emailOk)}
                        />
                      </Field>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          If your group settles on-chain and you already sent {formatMoney(fee.totalExpectedMinor, currency)} that way, paste the transfer reference and Baraza checks it.
                        </p>
                        <Field
                          label="Transfer Reference"
                          htmlFor="join-hash"
                          help="The 64-character reference from the transfer."
                          error={txHash && !hashOk ? 'A transfer reference is 64 letters and numbers.' : undefined}
                        >
                          <Input
                            id="join-hash"
                            value={txHash}
                            onChange={(event) => setTxHash(event.target.value)}
                            className="font-mono text-xs"
                            placeholder="e.g. 3389e9c0147...64chars"
                            aria-invalid={Boolean(txHash && !hashOk)}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Right column: payment method options with logos */}
              {!isFree && (
                <div className="shrink-0 w-full md:w-52 lg:w-56 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 text-center">
                    Payment Options
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5" role="radiogroup" aria-label="Select payment option">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setSelectedMethod(method.id);
                            setError(null);
                          }}
                          className={`baraza-card-3d flex items-center gap-3 p-2.5 rounded-lg text-left border-0 ring-0 outline-none select-none ${
                            isSelected
                              ? 'bg-primary/10'
                              : 'bg-card'
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <img
                              src={method.logo}
                              alt=""
                              className={`h-9 w-9 object-contain ${'invertOnDark' in method && method.invertOnDark ? 'dark:invert' : ''}`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">{method.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{method.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {error ? <InlineError className="mt-4" message={error} /> : null}

            <Button
              type="button"
              fullWidth
              className="mt-5"
              onClick={() => {
                if (isFree) return void joinFree();
                if (selectedMethod === 'mpesa') return void payWithMobileMoney('mpesa');
                if (selectedMethod === 'airtel') return void payWithMobileMoney('airtel');
                if (selectedMethod === 'card') return void payWithCard();
                if (selectedMethod === 'crypto') return void verifyTransfer();
              }}
              disabled={
                needsLogin
                  ? !account.ready
                  : busy ||
                    verifying ||
                    (!isFree &&
                      ((selectedMethod === 'mpesa' && !normalisedPhone) ||
                        (selectedMethod === 'airtel' && !normalisedPhone) ||
                        (selectedMethod === 'card' && !emailOk) ||
                        (selectedMethod === 'crypto' && !hashOk)))
              }
            >
              {busy || verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {needsLogin
                ? 'Sign in to pay'
                : busy
                  ? selectedMethod === 'card'
                    ? 'Connecting to Paystack...'
                    : 'Check Your Phone'
                  : verifying
                    ? 'Verifying Transfer...'
                    : isFree
                      ? 'Join This Group'
                      : selectedMethod === 'mpesa'
                        ? 'Pay With M-Pesa'
                        : selectedMethod === 'airtel'
                          ? 'Pay With Airtel Money'
                          : selectedMethod === 'card'
                            ? 'Pay With Card / Bank'
                            : 'Verify Transfer'}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              A confirmed payment and an active membership are two steps. You will see both on the next screen.
            </p>
          </section>
        </div>
      </section>
    </Layout>
  );
}
