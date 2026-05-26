import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Phone,
  Stars,
  Wallet,
} from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { useToast } from "@/hooks/use-toast";
import { formatKSh } from "@/lib/utils";
import { normaliseKenyanPhone } from "@/lib/phone";
import CommunityBanner from "@/components/CommunityBanner";
import { useSeo } from "@/lib/seo";
import { useChain } from "@/hooks/useChain";

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
  const { chainMeta } = useChain();
  useSeo({
    title: community ? `Join ${community.name}` : "Join a DAO or chama",
    description: "Verify your phone, pay membership dues via M-Pesa, and activate your membership.",
    path: id ? `/join/${id}` : undefined,
    noIndex: true,
  });
  const { setVisible } = useWalletModal();
  const { connected, publicKey, connecting } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [stellarTxHash, setStellarTxHash] = useState("");
  const [stellarAmountXlm, setStellarAmountXlm] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingStellar, setIsVerifyingStellar] = useState(false);
  const [pendingWalletJoin, setPendingWalletJoin] = useState(false);

  const amount = community?.membershipFee ?? 0;
  const normalisedPhone = normaliseKenyanPhone(phone);
  const canSubmit = normalisedPhone !== null && amount > 0 && !isSubmitting;
  const canVerifyStellar = /^[a-f0-9]{64}$/i.test(stellarTxHash.trim()) &&
    Number(stellarAmountXlm) > 0 &&
    !isVerifyingStellar;

  function startWalletJoin(walletAddress: string) {
    if (!id || amount <= 0) return;
    const orderId = `ord_wallet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    toast({
      title: "Account payment started",
      description: `Membership dues will be signed from ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}.`,
    });
    navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}&rail=wallet`);
  }

  useEffect(() => {
    if (!pendingWalletJoin || !connected || !publicKey) return;
    setPendingWalletJoin(false);
    startWalletJoin(publicKey.toBase58());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, pendingWalletJoin, publicKey]);

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
    const secretParam = activationSecret ? `&activationSecret=${encodeURIComponent(activationSecret)}` : "";
    navigate(`/join/${id}/status?orderId=${encodeURIComponent(orderId)}${secretParam}`);
  }

  async function handleStellarSubmit() {
    if (!id || !canVerifyStellar) return;
    setIsVerifyingStellar(true);

    try {
      const res = await fetch("/api/stellar/verify-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          communityId: id,
          txHash: stellarTxHash.trim().toLowerCase(),
          amountXlm: Number(stellarAmountXlm),
        }),
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
        throw new Error(data.message ?? "Could not verify Stellar payment.");
      }

      toast({
        title: "Stellar payment verified",
        description: data.persisted
          ? `Ledger ${data.ledger ?? "confirmed"} - ${data.amountXlm ?? stellarAmountXlm} XLM recorded.`
          : "Verified through Horizon. Supabase is offline, so this will continue in local demo mode.",
      });

      const secretParam = data.activationSecret ? `&activationSecret=${encodeURIComponent(data.activationSecret)}` : "";
      navigate(`/join/${id}/status?orderId=${encodeURIComponent(data.orderId)}${secretParam}&rail=stellar`);
    } catch (err) {
      toast({
        title: "Stellar verification failed",
        description: err instanceof Error ? err.message : "Check the transaction hash and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingStellar(false);
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
                      Pay dues through M-Pesa or Stellar, then connect your {chainMeta.label} account to receive your membership record.
                    </p>
                  </div>
                  <div className="w-full rounded-lg border px-4 py-3 md:w-auto md:text-right">
                    <p className="text-xs">Monthly Dues</p>
                    <p className="font-display text-lg font-bold">
                      {formatKSh(community?.membershipFee ?? 5000)}
                    </p>
                  </div>
                </div>
              </div>
              </CommunityBanner>

              <div className="grid gap-4 p-5 lg:grid-cols-3 md:p-6">
                <div className="rounded-lg border p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-semibold">Phone-first M-Pesa</h2>
                      <p className="text-xs">Primary MVP path</p>
                    </div>
                  </div>

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
                  <p className="mt-2 text-[11px]">We&apos;ll send a one-time code by SMS. Your number stays private.</p>

                  <button
                    type="button"
                    onClick={handleMpesaSubmit}
                    disabled={!canSubmit}
                    className="btn-warm mt-5 w-full justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending prompt...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Request M-Pesa Prompt
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg border p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg">
                      <Stars className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-semibold">Stellar XLM</h2>
                      <p className="text-xs">Verify payment proof</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6">
                    Paste a Stellar transaction hash after sending XLM. Baraza verifies Horizon and records a payment order.
                  </p>

                  <label htmlFor="stellar-amount" className="mb-2 mt-4 block text-xs font-semibold">Expected XLM</label>
                  <input
                    id="stellar-amount"
                    value={stellarAmountXlm}
                    onChange={(event) => setStellarAmountXlm(event.target.value)}
                    className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
                    inputMode="decimal"
                    placeholder="1"
                  />

                  <label htmlFor="stellar-tx" className="mb-2 mt-3 block text-xs font-semibold">Transaction hash</label>
                  <input
                    id="stellar-tx"
                    value={stellarTxHash}
                    onChange={(event) => setStellarTxHash(event.target.value)}
                    className="w-full rounded-lg border px-3 py-3 font-mono text-xs outline-none"
                    placeholder="64-character tx hash"
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
                        Verifying Stellar...
                      </>
                    ) : (
                      <>
                        <Stars className="h-4 w-4" />
                        Verify Stellar Payment
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
                      <h2 className="font-display text-base font-semibold">{chainMeta.label} account</h2>
                      <p className="text-xs">Optional account path</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6">
                    Connect your {chainMeta.label} account for credentials and voting.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (connected && publicKey) {
                        startWalletJoin(publicKey.toBase58());
                        return;
                      }
                      setPendingWalletJoin(true);
                      setVisible(true);
                    }}
                    disabled={connecting || amount <= 0}
                    className="btn-ghost mt-5 w-full justify-center gap-2 py-3 text-sm font-bold"
                  >
                    <Wallet className="h-4 w-4" />
                    {connecting ? "Connecting..." : connected ? `Pay from connected ${chainMeta.label} account` : chainMeta.accountCta}
                  </button>
                  <Link to="/profile" className="mt-3 inline-flex text-xs font-semibold">
                    Manage linked Stellar account
                  </Link>
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
