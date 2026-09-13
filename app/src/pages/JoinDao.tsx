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
import { isPaymentSimulatorEnabled, RAIL_UNAVAILABLE_COPY } from '@/lib/devMode';
import { acceptInviteCode } from '@/lib/inviteAccept';
import { formatMoney, groupCurrency } from '@/lib/money';
import { PRODUCT_ENVIRONMENT } from '@/lib/network';
import { storePaymentOrderActivationSecret } from '@/lib/payments';
import { calculateDynamicFee, type FeeBreakdown } from '@/lib/payments/feeEngine';
import { normaliseKenyanPhone } from '@/lib/phone';
import { useSeo } from '@/lib/seo';
import { rulesSentence } from '@/lib/voteCopy';
import type { VerificationTier } from '@/lib/constants';

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
  const tier: VerificationTier = community?.verificationTier ?? 'activation';
  const vouchThreshold = community?.vouchThreshold ?? 2;
  const needsLogin = !account.authenticated;
  const queued = tier === 'vouching' || tier === 'proof_of_personhood';
  const stage = needsLogin || queued ? 0 : 1;
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
    void fetch('/api/stellar/create-payment-intent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ communityId: id }),
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { feeBreakdown?: FeeBreakdown };
        if (!cancelled && data.feeBreakdown) setQuote(data.feeBreakdown);
      })
      .catch(() => undefined);
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
      const res = await fetch('/api/membership/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId: `ord_free_${id}_${Date.now().toString(36)}`,
          communityId: id,
          walletAddress,
          activationSecret: `sec_free_${crypto.randomUUID()}`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) throw new Error(data.message ?? 'Baraza could not activate the membership.');
      toast({ title: "You're In", description: `Welcome to ${community?.name ?? 'the group'}.` });
      navigate(`/dashboard/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Baraza could not activate the membership. Try again.');
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
      const res = await fetch('/api/mpesa/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: `+254${normalisedPhone}`,
          communityId: id,
          amount: Math.round(fee.totalExpectedMinor / 100),
          currency,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { orderId?: string; activationSecret?: string; message?: string };
      if (!res.ok || !data.orderId) throw new Error(data.message ?? 'The payment could not be started. Nothing has been charged.');
      if (data.activationSecret) storePaymentOrderActivationSecret(data.orderId, data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(data.orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The payment could not be started. Nothing has been charged.');
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
      let intentToken: string | null = null;
      try {
        const intentRes = await fetch('/api/stellar/create-payment-intent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ communityId: id, amountKes: amountMajor, environment: PRODUCT_ENVIRONMENT }),
        });
        if (intentRes.ok) intentToken = ((await intentRes.json()) as { intentToken?: string }).intentToken ?? null;
      } catch {
        /* the intent service is optional */
      }
      const res = await fetch('/api/stellar/verify-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          intentToken
            ? { intentToken, txHash: txHash.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT }
            : { communityId: id, txHash: txHash.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as { orderId?: string; activationSecret?: string | null; message?: string };
      if (!res.ok || !data.orderId) throw new Error(data.message ?? 'The transfer could not be verified. Check the reference and try again.');
      if (data.activationSecret) storePaymentOrderActivationSecret(data.orderId, data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(data.orderId)}&rail=stellar`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The transfer could not be verified.');
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
          {tier === 'vouching' ? (
            <section className="baraza-card p-5">
              <StatusChip kind="pending" label="You're In the Queue" size="md" />
              <p className="mt-3 text-sm text-muted-foreground">
                This group admits people once {vouchThreshold} current {vouchThreshold === 1 ? 'member vouches' : 'members vouch'} for them. Ask a member you know to vouch for you; there is nothing to pay yet.
              </p>
              {needsLogin ? (
                <Button type="button" className="mt-4" onClick={() => account.login()} disabled={!account.ready}>
                  Sign In
                </Button>
              ) : null}
            </section>
          ) : tier === 'proof_of_personhood' ? (
            <section className="baraza-card p-5">
              <StatusChip kind="hold" label="Not Available Here Yet" size="md" />
              <p className="mt-3 text-sm text-muted-foreground">
                This group checks each person's identity before admitting them. That check is not available in this app yet; ask an officer how to complete it.
              </p>
            </section>
          ) : (
            <section className="baraza-card p-5" aria-labelledby="join-pay">
              <h2 id="join-pay" className="font-display text-base font-bold">
                {isFree || tier === 'phone' ? 'Join' : 'Pay With M-Pesa'}
              </h2>
              {needsLogin ? (
                <p className="mt-2 text-sm text-muted-foreground">Sign in first so this membership is attached to your Baraza account.</p>
              ) : isFree || tier === 'phone' ? (
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
                onClick={() => void (isFree || tier === 'phone' ? joinFree() : payWithMpesa())}
                disabled={needsLogin ? !account.ready : busy || (!isFree && tier !== 'phone' && !normalisedPhone)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {needsLogin ? 'Sign in to pay' : busy ? 'Check Your Phone' : isFree || tier === 'phone' ? 'Join This Group' : 'Pay With M-Pesa'}
              </Button>

              <p className="mt-3 text-xs text-muted-foreground">
                A confirmed payment and an active membership are two steps. You will see both on the next screen.
              </p>
            </section>
          )}

          {!isFree && !queued ? (
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
