import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, Clock3, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";

const statusSteps = [
  ["payment-requested", "Check your phone for the M-Pesa prompt", "done"],
  ["payment-confirmed", "Payment received — activating membership", "done"],
  ["mint-queued", "Preparing your membership credential", "current"],
  ["mint-submitted", "Submitting to Solana", "pending"],
  ["indexer-confirmed", "Membership verified", "pending"],
  ["reconciled", "Active DAO member", "pending"],
] as const;

export default function JoinStatus() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { community } = useCommunity(id);
  const orderId = params.get("orderId") ?? "ord_demo_123";

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Join Status</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Activating your DAO membership</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Order {orderId} for {community?.name ?? "Community DAO"} is moving from M-Pesa confirmation to on-chain Membership Credential.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
              <div className="baraza-card p-5 md:p-6">
                <div className="space-y-5">
                  {statusSteps.map(([code, label, state]) => (
                    <div key={code} className="flex gap-4 rounded-lg border border-border bg-background/45 p-4">
                      <div
                        className={
                          state === "done"
                            ? "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-confirmed/15 text-confirmed"
                            : state === "current"
                              ? "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
                              : "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
                        }
                      >
                        {state === "done" ? <Check className="h-5 w-5" /> : state === "current" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock3 className="h-5 w-5" />}
                      </div>
                      <p className="self-center text-sm font-medium text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="space-y-5">
                <div className="baraza-card p-5">
                  <h2 className="font-display text-lg font-semibold text-foreground">Status</h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3 border-b border-border pb-3">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="text-confirmed">Confirmed</span>
                    </div>
                    <div className="flex justify-between gap-3 border-b border-border pb-3">
                      <span className="text-muted-foreground">Credential</span>
                      <span className="text-primary">Preparing</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Membership</span>
                      <span className="text-muted-foreground">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/25 bg-primary/8 p-5">
                  <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Your membership activates only after payment, attestation, mint, and chain confirmation all complete.
                  </p>
                </div>

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
