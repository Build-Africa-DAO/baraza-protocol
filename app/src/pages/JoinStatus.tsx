import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Clock3,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { isSupabaseConfigured } from "@/lib/communities";
import { useSeo } from "@/lib/seo";
import {
  fetchPaymentOrder,
  isFailureStatus,
  isTerminalStatus,
  PAYMENT_HAPPY_PATH,
  type PaymentOrderStatus,
} from "@/lib/payments";
import { recordActiveMembership } from "@/lib/memberships";

interface DisplayStep {
  code: string;
  label: string;
  minStatus: PaymentOrderStatus;
}

const SHARED_DISPLAY_STEPS: DisplayStep[] = [
  { code: "mint-queued", label: "Preparing your membership credential", minStatus: "MINT_QUEUED" },
  { code: "mint-submitted", label: "Submitting to Solana", minStatus: "MINT_SUBMITTED" },
  { code: "indexer-confirmed", label: "Membership verified", minStatus: "INDEXER_CONFIRMED" },
  { code: "reconciled", label: "Active DAO member", minStatus: "RECONCILED" },
];

const POLL_INTERVAL_MS = 2_500;
const MOCK_ADVANCE_INTERVAL_MS = 1_800;

// Local fallback when there's no Supabase order — the simulator's mock chain
// of statuses we step through to give the demo a sense of motion.
const MOCK_SEQUENCE: PaymentOrderStatus[] = [
  "PAYMENT_CONFIRMED",
  "MINT_QUEUED",
  "MINT_SUBMITTED",
  "MINT_CONFIRMED",
  "INDEXER_CONFIRMED",
  "RECONCILED",
];

function statusIndex(s: PaymentOrderStatus): number {
  const idx = PAYMENT_HAPPY_PATH.indexOf(s);
  return idx < 0 ? PAYMENT_HAPPY_PATH.length : idx;
}

function deriveStepState(stepMinStatus: PaymentOrderStatus, current: PaymentOrderStatus): "done" | "current" | "pending" {
  const cur = statusIndex(current);
  const step = statusIndex(stepMinStatus);
  if (cur > step) return "done";
  if (cur === step) return "current";
  return "pending";
}

export default function JoinStatus() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { community } = useCommunity(id);
  const { publicKey } = useWallet();
  const orderId = params.get("orderId") ?? "";
  const activationSecret = params.get("activationSecret") ?? "";
  const rail = params.get("rail") ?? (orderId.startsWith("ord_stellar_") || orderId.startsWith("ord_local_stellar_") ? "stellar" : "mpesa");
  const isStellarRail = rail === "stellar";

  useSeo({
    title: community ? `Join status — ${community.name}` : "Join status",
    description: isStellarRail
      ? "Track Stellar payment verification, credential mint, and on-chain membership activation."
      : "Track M-Pesa payment, credential mint, and on-chain membership activation.",
    path: id ? `/join/${id}/status` : undefined,
    noIndex: true,
  });

  const isLocalOrder = orderId.startsWith("ord_local_") || !orderId;
  const hasSupabase = isSupabaseConfigured();

  const [status, setStatus] = useState<PaymentOrderStatus>(
    isLocalOrder ? "PAYMENT_CONFIRMED" : "PAYMENT_REQUESTED",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const membershipRecordedRef = useRef(false);

  // ─── Local/mock progression: when there's no Supabase order, step through
  //     the happy-path sequence on a timer so the demo feels alive.
  useEffect(() => {
    if (!isLocalOrder && hasSupabase) return;

    let cancelled = false;
    let idx = 0;
    const advance = () => {
      if (cancelled) return;
      idx++;
      if (idx >= MOCK_SEQUENCE.length) return;
      setStatus(MOCK_SEQUENCE[idx]);
      if (idx < MOCK_SEQUENCE.length - 1) {
        window.setTimeout(advance, MOCK_ADVANCE_INTERVAL_MS);
      }
    };
    const timer = window.setTimeout(advance, MOCK_ADVANCE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLocalOrder, hasSupabase]);

  // ─── Supabase polling: refetch the order until it reaches a terminal state.
  useEffect(() => {
    if (isLocalOrder || !hasSupabase) return;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (cancelled) return;
      try {
        const order = await fetchPaymentOrder(orderId, activationSecret);
        if (cancelled) return;
        if (!order) {
          setErrorMessage(`Order ${orderId} not found in Supabase. Verify migrations + service role key.`);
          return;
        }
        setErrorMessage(null);
        setStatus(order.status);
        if (!isTerminalStatus(order.status)) {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Could not fetch order");
        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [isLocalOrder, hasSupabase, orderId, activationSecret]);

  // ─── On RECONCILED (or INDEXER_CONFIRMED) with a wallet present, record the
  //     membership locally for the dashboard AND try to persist via the
  //     /api/membership/activate endpoint. The local write always succeeds; the
  //     server write degrades gracefully when the endpoint is unreachable.
  useEffect(() => {
    if (membershipRecordedRef.current) return;
    if (status !== "RECONCILED" && status !== "INDEXER_CONFIRMED") return;
    if (!publicKey || !id) return;

    recordActiveMembership(id, publicKey.toBase58());
    membershipRecordedRef.current = true;

    if (!orderId || orderId.startsWith("ord_local_") || !activationSecret) return;

    fetch("/api/membership/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        communityId: id,
        walletAddress: publicKey.toBase58(),
        activationSecret,
      }),
    }).catch(() => {
      // Server endpoint unreachable; localStorage write is the source of truth.
    });
  }, [status, publicKey, id, orderId, activationSecret]);

  const stepStates = useMemo(
    () => {
      const paymentSteps: DisplayStep[] = isStellarRail
        ? [
            { code: "payment-requested", label: "Submit Stellar transaction hash", minStatus: "PAYMENT_REQUESTED" },
            { code: "payment-confirmed", label: "Stellar payment verified", minStatus: "PAYMENT_CONFIRMED" },
          ]
        : [
            { code: "payment-requested", label: "Check your phone for the M-Pesa prompt", minStatus: "PAYMENT_REQUESTED" },
            { code: "payment-confirmed", label: "Payment received - activating membership", minStatus: "PAYMENT_CONFIRMED" },
          ];

      return [...paymentSteps, ...SHARED_DISPLAY_STEPS].map((step) => ({
        ...step,
        state: deriveStepState(step.minStatus, status),
      }));
    },
    [isStellarRail, status],
  );

  const isFailed = isFailureStatus(status);
  const isComplete = status === "RECONCILED";

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-widest">Join Status</p>
              <h1 className="mt-2 font-display text-3xl font-bold">
                {isFailed
                  ? "Membership activation failed"
                  : isComplete
                    ? "You're an active member"
                    : "Activating your DAO membership"}
              </h1>
              <p className="mt-2 text-sm">
                Order <span className="font-mono">{orderId || "(none)"}</span> for{" "}
                {community?.name ?? "Chama DAO"} is moving from{" "}
                {isStellarRail ? "Stellar payment verification" : "M-Pesa confirmation"} to on-chain Membership Credential.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
              <div className="baraza-card p-5 md:p-6">
                <div className="space-y-5">
                  {stepStates.map((step) => (
                    <div key={step.code} className="flex gap-4 rounded-lg border p-4">
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                      >
                        {step.state === "done"
                          ? <Check className="h-5 w-5" />
                          : step.state === "current"
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <Clock3 className="h-5 w-5" />}
                      </div>
                      <p className="self-center text-sm font-medium">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="space-y-5">
                <div className="baraza-card p-5">
                  <h2 className="font-display text-lg font-semibold">Status</h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3 border-b pb-3">
                      <span>Payment</span>
                      <span>
                        {statusIndex(status) >= statusIndex("PAYMENT_CONFIRMED") ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 border-b pb-3">
                      <span>Credential</span>
                      <span>
                        {statusIndex(status) >= statusIndex("MINT_CONFIRMED")
                          ? "Minted"
                          : statusIndex(status) >= statusIndex("MINT_QUEUED")
                            ? "Preparing"
                            : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Membership</span>
                      <span>
                        {isComplete ? "Active" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-5">
                  <ShieldCheck className="mb-3 h-5 w-5" />
                  <p className="text-sm leading-6">
                    Your membership activates only after payment, attestation, mint, and chain confirmation all complete.
                  </p>
                </div>

                {!publicKey && isComplete && (
                  <div className="rounded-lg border p-5">
                    <p className="text-sm leading-6">
                      Connect your Solana wallet to bind this membership to your account.
                    </p>
                  </div>
                )}

                <Link to={`/dashboard/${id ?? "1"}`} className="btn-primary w-full justify-center gap-2 py-3 text-sm">
                  Open DAO Dashboard
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
