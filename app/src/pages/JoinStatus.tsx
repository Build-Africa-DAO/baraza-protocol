import { apiFetch } from "@/lib/api";
import { nextPollDelay } from "@/lib/polling";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { StatusChip } from "@/components/ui/status-chip";
import { Stepper } from "@/components/ui/stepper";
import { SUPPORT_EMAIL } from "@/lib/support";
import { useCommunity } from "@/hooks/useCommunities";
import { isSupabaseConfigured } from "@/lib/communities";
import { useSeo } from "@/lib/seo";
import {
  fetchPaymentOrder,
  getPaymentOrderActivationSecret,
  isFailureStatus,
  isTerminalStatus,
  PAYMENT_HAPPY_PATH,
  type PaymentOrderStatus,
} from "@/lib/payments";
import { recordActiveMembership } from "@/lib/memberships";
import { getPhoneAuthSession } from "@/lib/phoneAuth";
import { useAccount } from "@/contexts/AccountContext";

interface DisplayStep {
  code: string;
  label: string;
  minStatus: PaymentOrderStatus;
}

function getDisplaySteps(): DisplayStep[] {
  return [
    { code: "mint-queued", label: "Preparing your membership", minStatus: "MINT_QUEUED" },
    { code: "mint-submitted", label: "Recording your membership", minStatus: "MINT_SUBMITTED" },
    { code: "indexer-confirmed", label: "Membership verified", minStatus: "INDEXER_CONFIRMED" },
    { code: "reconciled", label: "Active member", minStatus: "RECONCILED" },
  ];
}


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
  const account = useAccount();
  const orderId = params.get("orderId") ?? "";
  const activationSecret = getPaymentOrderActivationSecret(orderId);
  const rail = params.get("rail") ?? (orderId.startsWith("ord_stellar_") || orderId.startsWith("ord_local_stellar_") ? "stellar" : "mpesa");
  const isStellarRail = rail === "stellar";

  useSeo({
    title: community ? `Join status - ${community.name}` : "Join status",
    description: "Track payment verification and membership activation.",
    path: id ? `/join/${id}/status` : undefined,
    noIndex: true,
  });

  // ord_wallet_ ids predate the local prefix and never had a server-side order.
  const isLocalOrder = orderId.startsWith("ord_local_") || orderId.startsWith("ord_wallet_") || !orderId;
  const hasSupabase = isSupabaseConfigured();
  const shouldPollServer = Boolean(orderId && !isLocalOrder && (activationSecret || hasSupabase));

  // Nothing here can be verified: no order id, a client-minted id, or no way to
  // reach the order. The stepper must not move. Previously this branch walked a
  // hardcoded happy path on a timer and wrote an "active" membership at the end.
  const isUnverifiable = !shouldPollServer;

  const [status, setStatus] = useState<PaymentOrderStatus>("PAYMENT_REQUESTED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const membershipRecordedRef = useRef(false);

  // ─── Supabase polling: refetch the order until it reaches a terminal state.
  useEffect(() => {
    if (!shouldPollServer) return;

    let cancelled = false;
    let timer: number | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      if (cancelled) return;
      try {
        const order = await fetchPaymentOrder(orderId, activationSecret);
        if (cancelled) return;
        if (!order) {
          setErrorMessage(`Payment order ${orderId} was not found. Contact support if the payment has left your account.`);
          return;
        }
        setErrorMessage(null);
        setStatus(order.status);
        if (!isTerminalStatus(order.status)) {
          timer = window.setTimeout(poll, nextPollDelay(startedAt));
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Could not fetch order");
        timer = window.setTimeout(poll, nextPollDelay(startedAt));
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [shouldPollServer, orderId, activationSecret]);

  // ─── On a server-confirmed RECONCILED / INDEXER_CONFIRMED, activate the
  //     membership through the API and only cache it locally once the server has
  //     accepted. The local write is a cache, never the source of truth.
  useEffect(() => {
    if (membershipRecordedRef.current) return;
    if (!shouldPollServer) return;
    if (status !== "RECONCILED" && status !== "INDEXER_CONFIRMED") return;
    if (!id) return;

    const accountId = account.accountId;
    const phoneAddr = getPhoneAuthSession().phone
      ? `phone:${getPhoneAuthSession().phone}`
      : null;
    const identity = accountId ?? phoneAddr;
    if (!identity) return;
    if (!orderId || !activationSecret) return;

    let cancelled = false;
    membershipRecordedRef.current = true;

    void (async () => {
      const result = await apiFetch("/api/membership/activate", {
        method: "POST",
        body: {
          orderId,
          communityId: id,
          walletAddress: accountId,
          phoneIdentifier: accountId ? null : phoneAddr,
          activationSecret,
        },
        auth: "omit",
      });
      if (cancelled) return;
      if (!result.ok) {
        membershipRecordedRef.current = false;
        setActivationError(
          result.error.kind === "network"
            ? "Your payment is confirmed but the activation service is unreachable. We will keep retrying. Do not pay again."
            : result.error.kind === "conflict"
              ? "Your payment is still being recorded. This page keeps checking. Do not pay again."
              : "Your payment is confirmed but we could not activate the membership. Email hello@barazaprotocol.com with the reference above.",
        );
        return;
      }
      setActivationError(null);
      recordActiveMembership(id, identity);
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldPollServer, status, account.accountId, id, orderId, activationSecret]);

  const stepStates = useMemo(
    () => {
      const paymentSteps: DisplayStep[] = isStellarRail
        ? [
            { code: "payment-requested", label: "Submit transfer reference", minStatus: "PAYMENT_REQUESTED" },
            { code: "payment-confirmed", label: "Transfer verified", minStatus: "PAYMENT_CONFIRMED" },
          ]
        : [
            { code: "payment-requested", label: "Check your phone for the M-Pesa STK PIN prompt", minStatus: "PAYMENT_REQUESTED" },
            { code: "payment-confirmed", label: "Payment received - activating membership", minStatus: "PAYMENT_CONFIRMED" },
          ];

      return [...paymentSteps, ...getDisplaySteps()].map((step) => ({
        ...step,
        state: deriveStepState(step.minStatus, status),
      }));
    },
    [isStellarRail, status],
  );

  const isFailed = isFailureStatus(status);
  const isComplete = shouldPollServer && (status === "RECONCILED" || status === "INDEXER_CONFIRMED");
  const referenceParts = orderId.split("_");
  const displayReference = orderId ? referenceParts[referenceParts.length - 1] : "(none)";

  const headline = isUnverifiable
    ? "We cannot confirm this payment"
    : isFailed
      ? "Membership activation failed"
      : isComplete
        ? "You're an active member"
        : "Activating your membership";

  const JOIN_STEPS = [{ label: "See Group" }, { label: "Pay" }, { label: "Confirming" }, { label: "You're In" }];
  const topStep = isComplete ? 4 : 2;
  const detailSteps = stepStates.map((step) => ({ label: step.label }));
  const detailCurrent = isFailed || isUnverifiable
    ? Math.max(0, stepStates.findIndex((step) => step.state === "current"))
    : isComplete
      ? stepStates.length
      : Math.max(0, stepStates.findIndex((step) => step.state === "current"));

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-2xl space-y-6 px-4">
          <Stepper steps={JOIN_STEPS} current={topStep} failed={isFailed} />

          <header>
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip
                kind={isUnverifiable || isFailed ? "failed" : isComplete ? "confirmed" : "pending"}
                label={isUnverifiable ? "Cannot Be Checked" : isFailed ? "Failed" : isComplete ? "You're In" : "Confirming"}
              />
            </div>
            <h1 className="mt-3 font-display text-2xl font-black tracking-tight md:text-3xl">{headline}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Payment reference <span className="font-mono">{displayReference}</span> for{" "}
              {community?.name ?? "this group"} moves from{" "}
              {isStellarRail ? "transfer verification" : "M-Pesa confirmation"} to active membership.
            </p>
          </header>

          {isUnverifiable ? (
            <InlineError
              title="This reference cannot be checked."
              message={`We have no confirmed payment record for it, so the steps below will not move. If money left your account, email ${SUPPORT_EMAIL} with the reference above. Do not pay again.`}
            />
          ) : null}
          {activationError ? <InlineError message={activationError} /> : null}
          {errorMessage ? <InlineError message={errorMessage} /> : null}

          <section className="baraza-card p-5" aria-label="Payment and membership steps">
            <Stepper steps={detailSteps} current={detailCurrent} failed={isFailed} orientation="vertical" />
          </section>

          <section className="baraza-card p-5">
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-muted-foreground">Payment</dt>
                <dd>
                  {statusIndex(status) >= statusIndex("PAYMENT_CONFIRMED") ? (
                    <StatusChip kind="confirmed" label="Confirmed" />
                  ) : (
                    <StatusChip kind="pending" label="Pending" />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-muted-foreground">Membership</dt>
                <dd>{isComplete ? <StatusChip kind="confirmed" label="Active" /> : <StatusChip kind="pending" label="Pending" />}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              A confirmed payment and an active membership are two steps. Your membership activates once the payment is confirmed on the group record.
            </p>
          </section>

          {!account.authenticated && isComplete ? (
            <p className="text-sm text-muted-foreground">Sign in to attach this membership to your Baraza account.</p>
          ) : null}

          {isComplete ? (
            <Button asChild fullWidth>
              <Link to={id ? `/dashboard/${id}` : "/home"}>Open Group</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" fullWidth>
              <Link to={id ? `/dashboard/${id}` : "/home"}>View Group</Link>
            </Button>
          )}
        </div>
      </section>
    </Layout>
  );
}
