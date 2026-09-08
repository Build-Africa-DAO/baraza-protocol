import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Phone,
  Stars,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { storePaymentOrderActivationSecret } from "@/lib/payments";
import { calculateDynamicFee } from "@/lib/payments/feeEngine";
import Layout from "@/components/Layout";
import { StatusScreen } from "@/components/StatusPage";
import PageLoader from "@/components/PageLoader";
import { useCommunity } from "@/hooks/useCommunities";
import { useToast } from "@/hooks/use-toast";
import { formatKSh } from "@/lib/utils";
import { normaliseKenyanPhone } from "@/lib/phone";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { PRODUCT_ENVIRONMENT } from "@/lib/network";
import { useAccount } from "@/contexts/AccountContext";
import { acceptInviteCode } from "@/lib/inviteAccept";
import type { FeeBreakdown } from "@/lib/payments/feeEngine";
import type { VerificationTier } from "@/lib/constants";

const joinSteps = [
  { label: "Invite opened", state: "current" },
  { label: "Payment method selected", state: "pending" },
  { label: "Payment proof submitted", state: "pending" },
  { label: "Payment confirmed", state: "pending" },
  { label: "Credential minted", state: "pending" },
  { label: "Active member", state: "pending" },
];

function ActivationTracker() {
  return (
    <div className="baraza-card p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Membership activation</h2>
          <p className="mt-1 text-xs">Payment proof and membership approval stay separate.</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-[11px] font-semibold">
          Step 1 of {joinSteps.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {joinSteps.map((step, index) => (
          <div
            key={step.label}
            className={
              step.state === "current"
                ? "rounded-lg border border-primary bg-primary/10 p-3"
                : "rounded-lg border p-3"
            }
          >
            <div
              className={
                step.state === "current"
                  ? "mb-2 grid h-7 w-7 place-items-center rounded-full"
                  : "mb-2 grid h-7 w-7 place-items-center rounded-full border"
              }
            >
              {step.state === "done" ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-bold">{index + 1}</span>}
            </div>
            <span className="block text-[11px] font-bold uppercase tracking-widest">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateLocalOrderId(): string {
  return `ord_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function JoinDao() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { community, isLoading } = useCommunity(id);
  const account = useAccount();
  useSeo({
    title: community ? `Join ${community.name}` : "Join a community",
    description: "Verify your phone, pay membership dues via M-Pesa, and activate your membership.",
    path: id ? `/join/${id}` : undefined,
    noIndex: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [stellarTxHash, setStellarTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingStellar, setIsVerifyingStellar] = useState(false);
  const [pendingWalletJoin, setPendingWalletJoin] = useState(false);
  const [quotedFee, setQuotedFee] = useState<FeeBreakdown | null>(null);
  const [showOtherRails, setShowOtherRails] = useState(false);

  const amount = community?.membershipFee ?? 0;
  const localFee = calculateDynamicFee(Math.round(amount * 100), 'KES', true);
  const feeBreakdown = quotedFee ?? localFee;
  const isFree = feeBreakdown.isFree;
  const verificationTier: VerificationTier = community?.verificationTier ?? 'activation';
  const vouchThreshold = community?.vouchThreshold ?? 2;
  const needsLogin = !account.authenticated;
  const joinBlockedByTier = verificationTier === 'vouching' || verificationTier === 'proof_of_personhood';

  const normalisedPhone = normaliseKenyanPhone(phone);
  const canSubmit = (isFree || (normalisedPhone !== null && amount > 0)) && !isSubmitting;
  const canVerifyStellar = /^[a-f0-9]{64}$/i.test(stellarTxHash.trim()) && !isVerifyingStellar;

  function startAccountJoin(accountId: string) {
    if (!id) return;
    const orderId = `ord_local_wallet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    toast({
      title: "Account payment started",
      description: `Membership dues are linked to ${accountId.slice(0, 6)}...${accountId.slice(-4)}.`,
    });
    navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}&rail=wallet`);
  }

  useEffect(() => {
    if (!pendingWalletJoin || !account.authenticated || !account.accountId) return;
    setPendingWalletJoin(false);
    startAccountJoin(account.accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.accountId, account.authenticated, pendingWalletJoin]);

  useEffect(() => {
    const code = searchParams.get('invite');
    if (!code || !/^[a-zA-Z0-9_-]{6,32}$/.test(code) || !account.authenticated) return;
    let cancelled = false;
    void acceptInviteCode(code, account.getAccessToken).then((accepted) => {
      if (cancelled || !accepted.ok || !accepted.communityId) return;
      if (accepted.alreadyMember) {
        toast({ title: 'You already belong to this group', description: 'Opening the group workspace.' });
        navigate(`/dashboard/${accepted.communityId}`);
      } else if (accepted.joined) {
        toast({ title: 'Invite accepted', description: 'Continue with activation dues if this group charges a fee.' });
      }
    });
    return () => { cancelled = true; };
  }, [account.authenticated, account.getAccessToken, navigate, searchParams, toast]);

  useEffect(() => {
    if (!id || !community || isFree) return;
    let cancelled = false;
    void fetch("/api/stellar/create-payment-intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ communityId: id }),
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { feeBreakdown?: FeeBreakdown; zeroFee?: boolean };
        if (cancelled) return;
        if (data.feeBreakdown) setQuotedFee(data.feeBreakdown);
      })
      .catch(() => {
        // Intent signing is optional; local feeEngine is the same formula the API uses.
      });
    return () => {
      cancelled = true;
    };
  }, [community, id, isFree]);

  function requireLogin(): boolean {
    if (account.authenticated) return true;
    account.login();
    return false;
  }

  async function handleFreeJoin() {
    if (!id || isSubmitting) return;
    if (!requireLogin()) return;
    setIsSubmitting(true);
    try {
      const walletAddress = account.accountId || (phone ? `phone:${phone}` : `phone:anon_${crypto.randomUUID()}`);
      const freeOrderId = `ord_free_${id}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
      const freeSecret = `sec_free_${crypto.randomUUID()}`;
      const res = await fetch("/api/membership/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: freeOrderId,
          communityId: id,
          walletAddress,
          activationSecret: freeSecret,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        toast({
          title: "Membership Activated",
          description: `Welcome to ${community?.name || 'the community'}!`,
        });
        navigate(`/dashboard/${id}`);
        return;
      }
      throw new Error(data.message || "Failed to activate free membership.");
    } catch (err: unknown) {
      toast({
        title: "Activation failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMpesaSubmit() {
    if (isFree) {
      return handleFreeJoin();
    }
    if (!requireLogin()) return;
    if (!canSubmit || !id || !normalisedPhone) return;
    setIsSubmitting(true);

    let orderId: string | null = null;
    let activationSecret: string | null = null;
    let usedFallback = false;

    try {
      const res = await fetch("/api/mpesa/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: `+254${normalisedPhone}`,
          communityId: id,
          amount: Math.round(feeBreakdown.totalExpectedMinor / 100),
          currency: "KES",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { orderId?: string; activationSecret?: string };
        orderId = data.orderId ?? null;
        activationSecret = data.activationSecret ?? null;
      }
    } catch {
      // network/CORS/local-dev - fall through to mock
    }

    if (!orderId) {
      orderId = generateLocalOrderId();
      usedFallback = true;
    }

    toast({
      title: usedFallback ? "Simulator unreachable - using local order" : "Check your phone for the M-Pesa STK PIN prompt",
      description: usedFallback
        ? "Run local dev server to exercise the real /api/mpesa/simulate endpoint."
        : `Enter your M-Pesa PIN to confirm ${formatKSh(feeBreakdown.totalExpectedMinor / 100)}.`,
    });

    setIsSubmitting(false);
    if (activationSecret) storePaymentOrderActivationSecret(orderId, activationSecret);
    navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}`);
  }

  async function handleStellarSubmit() {
    if (!requireLogin()) return;
    if (!id || !canVerifyStellar) return;
    setIsVerifyingStellar(true);

    try {
      let intentToken: string | null = null;
      try {
        const intentRes = await fetch("/api/stellar/create-payment-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            communityId: id,
            amountKes: amount,
            environment: PRODUCT_ENVIRONMENT,
          }),
        });
        if (intentRes.ok) {
          const intentData = (await intentRes.json()) as { intentToken?: string };
          intentToken = intentData.intentToken ?? null;
        }
      } catch {
        // Intent service unavailable
      }

      const res = await fetch("/api/stellar/verify-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          intentToken
            ? { intentToken, txHash: stellarTxHash.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT }
            : {
                communityId: id,
                txHash: stellarTxHash.trim().toLowerCase(),
                environment: PRODUCT_ENVIRONMENT,
              },
        ),
      });
      const data = (await res.json()) as {
        orderId?: string;
        activationSecret?: string | null;
        ledger?: number;
        amountXlm?: number;
        persisted?: boolean;
        message?: string;
      };

      if (!res.ok || !data.orderId) {
        throw new Error(data.message ?? "Could not verify this transfer.");
      }

      toast({
        title: "Transfer verified",
        description: data.persisted
          ? `Payment record ${data.ledger ?? "confirmed"} was accepted.`
          : "The transfer was verified. This will continue in local preview mode.",
      });

      if (data.activationSecret) storePaymentOrderActivationSecret(data.orderId, data.activationSecret);
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(data.orderId)}&rail=stellar`);
    } catch (err) {
      toast({
        title: "Transfer verification failed",
        description: err instanceof Error ? err.message : "Check the transaction hash and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingStellar(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <PageLoader label="Loading community" />
      </Layout>
    );
  }

  if (!community) {
    return <StatusScreen kind="community" />;
  }

  return (
    <Layout>
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="container relative z-10 mx-auto px-4">
          <Link to={account.authenticated ? '/home' : (community ? `/dashboard/${community.id}` : '/communities')} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>

          <div className="mx-auto max-w-5xl space-y-5">
            <div className="baraza-card overflow-hidden">
              <CommunityBanner className="rounded-none border-0 border-b">
              <div className="p-5 md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest">Join community</p>
                    <h1 className="mt-2 font-display text-3xl font-bold">
                      {community?.name ?? "Community"}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6">
                      Pay with mobile money, bank transfer, or your Baraza account. Your membership record stays attached to one Baraza account.
                    </p>
                  </div>
                  <div className="w-full rounded-lg border px-4 py-3 md:w-auto md:text-right">
                    <p className="text-xs">Membership Dues</p>
                    <p className="font-display text-lg font-bold">
                      {isFree ? "Free / Zero Dues" : formatKSh(amount)}
                    </p>
                  </div>
                </div>
              </div>
              </CommunityBanner>

              {/* Pre-Transaction Itemized Fee Disclosure */}
              {!isFree && verificationTier === 'activation' && (
                <div className="mx-5 mt-5 rounded-lg border p-4 bg-muted/30 md:mx-6">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Dues breakdown
                  </h3>
                  <p className="mb-3 text-[11px] text-muted-foreground">
                    Total = activation fee + 2.0% platform fee + 0.5% carrier cost (capped at KES 200). Same protocol formula the payment API uses.
                  </p>
                  <div className="grid gap-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Activation fee</span>
                      <span className="font-medium">{formatKSh(feeBreakdown.baseAmountMinor / 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Baraza platform fee (2.0%)</span>
                      <span className="font-medium">{formatKSh(feeBreakdown.platformFeeMinor / 100)}</span>
                    </div>
                    {feeBreakdown.carrierCostMinor > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carrier processing cost (0.5% capped)</span>
                        <span className="font-medium">{formatKSh(feeBreakdown.carrierCostMinor / 100)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                      <span>Total expected payment</span>
                      <span className="text-primary font-bold">{formatKSh(feeBreakdown.totalExpectedMinor / 100)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-5 md:p-6">
                {verificationTier === 'vouching' && (
                  <div className="rounded-lg border border-accent/40 bg-accent/10 p-5">
                    <h2 className="font-display text-base font-semibold">Waiting for member vouches</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Waiting for {vouchThreshold} member {vouchThreshold === 1 ? 'vouch' : 'vouches'} before this group can activate your membership. Ask a current member to vouch for you.
                    </p>
                  </div>
                )}

                {verificationTier === 'proof_of_personhood' && (
                  <div className="rounded-lg border p-5">
                    <h2 className="font-display text-base font-semibold">Proof of personhood</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This group requires proof of personhood. That check is not available in this app yet. Ask an officer how to complete it.
                    </p>
                  </div>
                )}

                {verificationTier === 'phone' && (
                  <div className="rounded-lg border p-5">
                    <h2 className="font-display text-base font-semibold">Phone verification</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This group verifies members by phone. Sign in with your phone number, then continue.
                    </p>
                    {needsLogin ? (
                      <button
                        type="button"
                        onClick={() => account.login()}
                        className="btn-wipe mt-4 w-full justify-center py-3 text-sm font-bold"
                      >
                        Sign in with phone
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleFreeJoin()}
                        disabled={isSubmitting}
                        className="btn-wipe mt-4 w-full justify-center gap-2 py-3 text-sm font-bold"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Continue with verified phone
                      </button>
                    )}
                  </div>
                )}

                {!joinBlockedByTier && verificationTier !== 'phone' && (
                  <div className="rounded-lg border p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-base font-semibold">M-Pesa (default)</h2>
                        <p className="text-xs">Check your phone for the M-Pesa STK PIN prompt</p>
                      </div>
                    </div>

                    {needsLogin && (
                      <p className="mb-4 rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-5">
                        Sign in to attach this membership to your Baraza account before you pay.
                      </p>
                    )}

                    {!isFree ? (
                      <>
                        <label htmlFor="join-phone" className="mb-2 block text-xs font-semibold">M-Pesa phone number</label>
                        <div className="flex rounded-lg border focus-within:border-current">
                          <span className="border-r px-3 py-3 text-sm">+254</span>
                          <input
                            id="join-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                            placeholder="e.g. 0712 345 678"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                          />
                        </div>
                        <p className="mt-2 text-[11px]">We send an STK PIN prompt. Your number stays private.</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">This community has no activation dues. You can join immediately after signing in.</p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (needsLogin) {
                          account.login();
                          return;
                        }
                        void (isFree ? handleFreeJoin() : handleMpesaSubmit());
                      }}
                      disabled={needsLogin ? !account.ready : !canSubmit}
                      className="btn-warm mt-5 w-full justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isFree ? "Activating..." : "Sending STK prompt..."}
                        </>
                      ) : needsLogin ? (
                        "Sign in to pay"
                      ) : isFree ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Join free community
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Send M-Pesa STK PIN prompt
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!joinBlockedByTier && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowOtherRails((open) => !open)}
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {showOtherRails ? "Hide other payment methods" : "Other payment methods (wallet, transfer, card)"}
                    </button>
                    {showOtherRails && (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-lg">
                              <Stars className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="font-display text-base font-semibold">On-chain transfer</h2>
                              <p className="text-xs">Verify a settlement transaction hash</p>
                            </div>
                          </div>
                          <p className="text-sm leading-6">
                            Paste the 64-character transaction hash from the group settlement rail.
                          </p>

                          <div className="mb-3 mt-4 rounded-lg border bg-muted/20 p-3">
                            <p className="text-[11px] text-muted-foreground">Amount to send</p>
                            <p className="font-mono text-sm font-bold">
                              {formatKSh(feeBreakdown.totalExpectedMinor / 100)}
                            </p>
                          </div>

                          <label htmlFor="stellar-tx" className="mb-2 mt-3 block text-xs font-semibold">Transaction hash</label>
                          <input
                            id="stellar-tx"
                            value={stellarTxHash}
                            onChange={(event) => setStellarTxHash(event.target.value)}
                            className="w-full rounded-lg border px-3 py-3 font-mono text-xs outline-none"
                            placeholder="64-character transaction hash"
                          />

                          <button
                            type="button"
                            onClick={() => void handleStellarSubmit()}
                            disabled={!canVerifyStellar}
                            className="btn-warm mt-5 w-full justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isVerifyingStellar ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Verifying transfer...
                              </>
                            ) : (
                              <>
                                <Stars className="h-4 w-4" />
                                Verify transfer
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-lg border p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-lg">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="font-display text-base font-semibold">Baraza account</h2>
                              <p className="text-xs">Private account access</p>
                            </div>
                          </div>
                          <p className="text-sm leading-6">
                            Log in or create an account to pay, receive membership credentials, and vote.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (account.authenticated && account.accountId) {
                                startAccountJoin(account.accountId);
                                return;
                              }
                              setPendingWalletJoin(true);
                              account.login();
                            }}
                            disabled={!account.ready || !account.configured}
                            className="btn-ghost mt-5 w-full justify-center gap-2 py-3 text-sm font-bold"
                          >
                            <Wallet className="h-4 w-4" />
                            {!account.ready ? "Loading..." : account.authenticated ? "Pay from your account" : "Log in"}
                          </button>
                          {!account.authenticated && account.configured && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingWalletJoin(true);
                                account.createAccount();
                              }}
                              className="btn-wipe-outline mt-3 w-full justify-center py-2 text-xs"
                            >
                              Create an account
                            </button>
                          )}
                          <Link to="/profile" className="mt-3 inline-flex text-xs font-semibold">
                            Manage Baraza account
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mx-5 mb-5 rounded-lg border p-4 md:mx-6 md:mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-6">
                    <strong>Payment confirmed is not membership activation.</strong> Your membership activates after proof review and approval.
                  </p>
                </div>
              </div>
            </div>

            <ActivationTracker />
          </div>
        </div>
      </section>
    </Layout>
  );
}
