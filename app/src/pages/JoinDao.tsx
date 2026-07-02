import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { storePaymentOrderActivationSecret } from "@/lib/payments";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { useToast } from "@/hooks/use-toast";
import { useExternalWallet } from "@/hooks/useExternalWallet";
import { formatKSh } from "@/lib/utils";
import { normaliseKenyanPhone } from "@/lib/phone";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { PRODUCT_ENVIRONMENT } from "@/lib/network";
import { useAccount } from "@/contexts/AccountContext";
import {
  PaymentMethodSelector,
  PaymentSummary,
  type BuyerPaymentMethod,
} from "@/components/payments/BuyerPaymentFlow";

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
  const { community } = useCommunity(id);
  const account = useAccount();
  const externalWallet = useExternalWallet();
  useSeo({
    title: community ? `Join ${community.name}` : "Join a DAO",
    description: "Verify your phone, pay membership dues via M-Pesa, and activate your membership.",
    path: id ? `/join/${id}` : undefined,
    noIndex: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BuyerPaymentMethod>(() =>
    account.country.code === "KE" ? "mobile-money" : "bank-transfer",
  );
  const [transactionReference, setTransactionReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingTransfer, setIsVerifyingTransfer] = useState(false);
  const [pendingWalletJoin, setPendingWalletJoin] = useState(false);

  const amount = community?.membershipFee ?? 0;
  const externalWalletAddress = externalWallet.address;
  const normalisedPhone = normaliseKenyanPhone(phone);
  const canSubmit = normalisedPhone !== null && amount > 0 && !isSubmitting;
  const settlementAmount = 1;
  const canVerifyTransfer = /^[a-f0-9]{64}$/i.test(transactionReference.trim()) &&
    !isVerifyingTransfer;

  function startAccountJoin(accountId: string) {
    if (!id || amount <= 0) return;
    // ord_local_ prefix: there is no server-side order for the wallet rail yet,
    // so JoinStatus must run its local progression instead of polling Supabase
    // for an order that doesn't exist.
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

  // Dismissing the wallet modal abandons the join intent — otherwise a later
  // connection (e.g. from the header) would silently restart the flow.
  async function handleMpesaSubmit() {
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
          amount,
          currency: "KES",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { orderId?: string; activationSecret?: string };
        orderId = data.orderId ?? null;
        activationSecret = data.activationSecret ?? null;
      }
    } catch {
      // network/CORS/local-dev-no-vercel - fall through to mock
    }

    if (!orderId) {
      orderId = generateLocalOrderId();
      usedFallback = true;
    }

    toast({
      title: usedFallback ? "Simulator unreachable - using local order" : "M-Pesa prompt sent",
      description: usedFallback
        ? "Run \"vercel dev\" to exercise the real /api/mpesa/simulate endpoint."
        : "Enter your M-Pesa PIN on your phone to confirm the payment.",
    });

    // Reset state before navigating so re-entering the page (back button)
    // doesn't leave the button permanently disabled.
    setIsSubmitting(false);
    if (activationSecret) storePaymentOrderActivationSecret(orderId, activationSecret);
    navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}`);
  }

  async function handleTransferSubmit() {
    if (!id || !canVerifyTransfer) return;
    setIsVerifyingTransfer(true);

    try {
      let intentToken: string | null = null;
      try {
        const intentRes = await fetch("/api/stellar/create-payment-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            communityId: id,
            amountXlm: settlementAmount,
            environment: PRODUCT_ENVIRONMENT,
          }),
        });
        if (intentRes.ok) {
          const intentData = (await intentRes.json()) as { intentToken?: string };
          intentToken = intentData.intentToken ?? null;
        }
      } catch {
        // Intent service unavailable - verify-payment will use legacy path on testnet.
      }

      const res = await fetch("/api/stellar/verify-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          intentToken
            ? { intentToken, txHash: transactionReference.trim().toLowerCase(), environment: PRODUCT_ENVIRONMENT }
            : {
                communityId: id,
                txHash: transactionReference.trim().toLowerCase(),
                amountXlm: settlementAmount,
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
      setIsVerifyingTransfer(false);
    }
  }

  return (
    <Layout>
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="container relative z-10 mx-auto px-4">
          <Link to={community ? `/dashboard/${community.id}` : "/communities"} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to DAO
          </Link>

          <div className="mx-auto max-w-5xl space-y-5">
            <div className="baraza-card overflow-hidden">
              <CommunityBanner className="rounded-none border-0 border-b">
              <div className="p-5 md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest">Join DAO</p>
                    <h1 className="mt-2 font-display text-3xl font-bold">
                      {community?.name ?? "DAO"}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6">
                      Pay with mobile money, bank transfer, your Baraza account, or an external
                      crypto wallet. Your membership record stays attached to the account you use.
                    </p>
                  </div>
                  <div className="w-full rounded-lg border px-4 py-3 md:w-auto md:text-right">
                    <p className="text-xs">Monthly Dues</p>
                    <p className="font-display text-lg font-bold">
                      {amount > 0 ? formatKSh(amount) : "-"}
                    </p>
                  </div>
                </div>
              </div>
              </CommunityBanner>

              <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  accountLabel="Account or crypto wallet"
                  accountDescription="Use your Baraza account or connect an approved external wallet."
                />

                <div className="min-w-0 space-y-5 lg:border-l lg:pl-6">
                  {paymentMethod === "mobile-money" && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <h2 className="text-base font-semibold">Pay with M-Pesa</h2>
                          <p className="text-xs text-muted-foreground">A payment prompt will appear on your phone.</p>
                        </div>
                      </div>
                      <label htmlFor="join-phone" className="mb-2 block text-sm font-semibold">M-Pesa phone number</label>
                      <div className="flex rounded-lg border focus-within:border-primary">
                        <span className="border-r px-3 py-3 text-sm">+254</span>
                        <input
                          id="join-phone"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                          placeholder="0712 345 678"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                        />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">Use the number registered to your M-Pesa account.</p>
                    </div>
                  )}

                  {paymentMethod === "bank-transfer" && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-primary" />
                        <div>
                          <h2 className="text-base font-semibold">Confirm a bank transfer</h2>
                          <p className="text-xs text-muted-foreground">For buyers who already received transfer instructions.</p>
                        </div>
                      </div>
                      <label htmlFor="transfer-reference" className="mb-2 block text-sm font-semibold">Payment reference</label>
                      <input
                        id="transfer-reference"
                        value={transactionReference}
                        onChange={(event) => setTransactionReference(event.target.value)}
                        className="w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-primary"
                        placeholder="Enter the reference from your receipt"
                        autoComplete="off"
                      />
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Bank instructions are issued before payment. Baraza checks the reference before activating membership.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "privy" && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <div>
                          <h2 className="text-base font-semibold">Pay from an account or crypto wallet</h2>
                          <p className="text-xs text-muted-foreground">
                            Choose the account that should hold your membership record.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-6">
                        Your payment and membership stay linked to the account you choose, so you
                        can return later to vote and view receipts.
                      </p>
                      {!account.configured && !externalWalletAddress && (
                        <p className="mt-3 rounded-lg border px-3 py-2 text-xs leading-5 text-muted-foreground">
                          Baraza account payments are not configured in this preview. You can still
                          connect an external wallet.
                        </p>
                      )}
                    </div>
                  )}

                  <PaymentSummary
                    lines={[{ label: "Monthly membership dues", value: amount > 0 ? formatKSh(amount) : "-" }]}
                    total={amount > 0 ? formatKSh(amount) : "-"}
                    totalLabel="Pay now"
                  />

                  {paymentMethod === "mobile-money" ? (
                    <button
                      type="button"
                      onClick={handleMpesaSubmit}
                      disabled={!canSubmit}
                      className="btn-warm min-h-12 w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      {isSubmitting ? "Sending payment prompt..." : `Pay ${formatKSh(amount)} with M-Pesa`}
                    </button>
                  ) : paymentMethod === "bank-transfer" ? (
                    <button
                      type="button"
                      onClick={() => void handleTransferSubmit()}
                      disabled={!canVerifyTransfer}
                      className="btn-warm min-h-12 w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isVerifyingTransfer ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isVerifyingTransfer ? "Checking payment..." : "Check bank payment"}
                    </button>
                  ) : (
                    <div className="space-y-3">
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
                        disabled={!account.ready || !account.configured || amount <= 0}
                        className="btn-warm min-h-12 w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Wallet className="h-4 w-4" />
                        {!account.ready
                          ? "Preparing account..."
                          : account.authenticated
                            ? `Pay ${formatKSh(amount)} from Baraza account`
                            : "Log in with Baraza account"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (externalWalletAddress) {
                            startAccountJoin(externalWalletAddress);
                            return;
                          }
                          externalWallet.openSelector();
                        }}
                        disabled={amount <= 0}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Wallet className="h-4 w-4" />
                        {externalWalletAddress
                          ? `Pay ${formatKSh(amount)} from external wallet`
                          : "Connect external crypto wallet"}
                      </button>
                      {!account.authenticated && account.configured && (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingWalletJoin(true);
                            account.createAccount();
                          }}
                          className="min-h-11 w-full text-center text-sm font-semibold"
                        >
                          Create a Baraza account
                        </button>
                      )}
                      <Link to="/profile" className="inline-flex min-h-11 items-center text-sm font-semibold">
                        Manage Baraza account
                      </Link>
                    </div>
                  )}
                </div>
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
