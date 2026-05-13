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
import CommunityBanner from "@/components/CommunityBanner";

const joinSteps = [
  { label: "Phone entered", state: "current" },
  { label: "OTP verified", state: "pending" },
  { label: "Payment started", state: "pending" },
  { label: "Payment confirmed", state: "pending" },
  { label: "Credential minted", state: "pending" },
  { label: "Active DAO member", state: "pending" },
];

function ActivationTracker() {
  return (
    <div className="baraza-card p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Membership activation</h2>
          <p className="mt-1 text-xs text-muted-foreground">Payment, mint, and on-chain confirmation stay separate.</p>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary">
          Step 1 of {joinSteps.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {joinSteps.map((step, index) => (
          <div
            key={step.label}
            className={
              step.state === "current"
                ? "rounded-lg border border-primary/35 bg-primary/10 p-3"
                : "rounded-lg border border-border/70 bg-background/35 p-3"
            }
          >
            <div
              className={
                step.state === "current"
                  ? "mb-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.28)]"
                  : "mb-2 grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-muted-foreground"
              }
            >
              {step.state === "done" ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-bold">{index + 1}</span>}
            </div>
            <span
              className={
                step.state === "current"
                  ? "block text-[11px] font-bold uppercase tracking-widest text-primary"
                  : "block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
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
      <section className="relative overflow-hidden py-8 md:py-12">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full border border-primary/10 bg-primary/5 blur-sm" />
          <div className="absolute right-20 top-40 h-40 w-40 rounded-full border border-primary/15" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <Link to={community ? `/dashboard/${community.id}` : "/communities"} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to DAO
          </Link>

          <div className="mx-auto max-w-5xl space-y-5">
            <div className="baraza-card overflow-hidden">
              <CommunityBanner type={community?.type} className="rounded-none border-0 border-b border-border">
              <div className="p-5 md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">Join DAO</p>
                    <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
                      {community?.name ?? "Community DAO"}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                      Start with M-Pesa dues, then link a Solana wallet to receive your Membership Credential.
                    </p>
                  </div>
                  <div className="w-full rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 md:w-auto md:text-right">
                    <p className="text-xs text-muted-foreground">Monthly Dues</p>
                    <p className="font-display text-lg font-bold text-primary">
                      {formatKSh(community?.membershipFee ?? 5000)}
                    </p>
                  </div>
                </div>
              </div>
              </CommunityBanner>

              <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
                <div className="rounded-lg border border-primary/18 bg-background/50 p-5">
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
                    className="btn-warm mt-5 w-full justify-center gap-2 py-3 text-sm font-bold"
                  >
                    <CreditCard className="h-4 w-4" />
                    Request M-Pesa Prompt
                  </Link>
                </div>

                <div className="rounded-lg border border-primary/18 bg-background/50 p-5">
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
                    className="btn-ghost mt-5 w-full justify-center gap-2 py-3 text-sm font-bold"
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

            <ActivationTracker />

            <div className="grid gap-3 md:grid-cols-3">
              {["PaymentAttestation Created", "Membership Mint Submitted", "MemberAccount Active"].map((label) => (
                <div key={label} className="rounded-lg border border-border/70 bg-card/70 p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
