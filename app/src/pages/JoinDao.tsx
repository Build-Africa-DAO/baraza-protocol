import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { useCommunity } from "@/hooks/useCommunities";
import { formatKSh } from "@/lib/utils";

const joinSteps = [
  { label: "Enter phone number", state: "pending" },
  { label: "Verify with SMS code", state: "pending" },
  { label: "Approve M-Pesa prompt", state: "pending" },
  { label: "Payment confirmed", state: "pending" },
  { label: "Membership credential prepared", state: "pending" },
  { label: "Confirmed on Solana", state: "pending" },
  { label: "Active DAO member", state: "pending" },
];

function StepRail() {
  return (
    <div className="baraza-card p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">How activation works</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Every join follows the same steps. We&apos;ll guide you through each one in real time once you start.
      </p>
      <div className="mt-6 space-y-5">
        {joinSteps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={
                step.state === "done"
                  ? "grid h-7 w-7 place-items-center rounded-full border border-confirmed/50 bg-confirmed/15 text-confirmed"
                  : step.state === "current"
                    ? "grid h-7 w-7 place-items-center rounded-full border border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.28)]"
                    : "grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-muted-foreground"
              }
            >
              {step.state === "done" ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </div>
            <span
              className={
                step.state === "current"
                  ? "font-mono text-xs font-semibold uppercase tracking-widest text-primary"
                  : "font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JoinDao() {
  const { id } = useParams<{ id: string }>();
  const { community } = useCommunity(id);
  const { setVisible } = useWalletModal();

  return (
    <Layout>
      <section className="relative overflow-hidden py-10 md:py-14">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full border border-primary/10 bg-primary/5 blur-sm" />
          <div className="absolute right-20 top-40 h-40 w-40 rounded-full border border-primary/15" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <Link to={community ? `/dashboard/${community.id}` : "/communities"} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to DAO
          </Link>

          <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
            <StepRail />

            <div className="baraza-card overflow-hidden">
              <div className="border-b border-border bg-surface/70 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">Join DAO</p>
                    <h1 className="mt-2 font-display text-2xl font-bold text-foreground">
                      {community?.name ?? "Community DAO"}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      Start with M-Pesa dues, then link a Solana wallet to receive your Membership Credential.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                    <p className="text-xs text-muted-foreground">Monthly Dues</p>
                    <p className="font-display text-lg font-bold text-primary">
                      {formatKSh(community?.membershipFee ?? 5000)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
                <div className="rounded-lg border border-border bg-background/55 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">Phone-first M-Pesa</h2>
                      <p className="text-xs text-muted-foreground">Primary MVP path</p>
                    </div>
                  </div>

                  <label htmlFor="join-phone" className="mb-2 block text-xs font-semibold text-foreground">M-Pesa phone number</label>
                  <div className="flex rounded-lg border border-border bg-surface focus-within:border-primary/50">
                    <span className="border-r border-border px-3 py-3 text-sm text-muted-foreground">+254</span>
                    <input
                      id="join-phone"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none"
                      placeholder="7XX XXX XXX"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">We&apos;ll send a one-time code by SMS. Your number stays private.</p>

                  <Link
                    to={`/join/${id ?? "1"}/status?orderId=ord_demo_123`}
                    className="btn-warm mt-5 w-full justify-center gap-2 py-3 text-sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    Request M-Pesa Prompt
                  </Link>
                </div>

                <div className="rounded-lg border border-border bg-background/55 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-dao/15 text-dao">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">Join with wallet</h2>
                      <p className="text-xs text-muted-foreground">Optional chain-first path</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Connect Phantom, Solflare, or Coinbase Wallet and pay membership dues directly from your wallet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisible(true)}
                    className="btn-ghost mt-5 w-full justify-center gap-2 py-3 text-sm"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect wallet
                  </button>
                </div>
              </div>

              <div className="mx-5 mb-5 rounded-lg border border-primary/25 bg-primary/8 p-4 md:mx-6 md:mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Payment confirmed is not membership activation.</strong> Your membership activates after attestation, mint, and chain confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["PaymentAttestation Created", "Membership Mint Submitted", "MemberAccount Active"].map((label) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
