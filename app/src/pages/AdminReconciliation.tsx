import { useState } from "react";
import { Download, RefreshCw, ShieldOff } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Layout from "@/components/Layout";
import { truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ADMIN_WALLETS = (import.meta.env.VITE_ADMIN_WALLETS ?? "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

const paymentOrders = [
  ["ORD-8942A", "KSh 15,000", "PAYMENT_PENDING", "2026-05-13 08:02 UTC", "Reconcile Chain Proof"],
  ["ORD-8941B", "KSh 5,000", "PAYMENT_CONFIRMED", "2026-05-13 07:45 UTC", "-"],
  ["ORD-8939X", "KSh 100,000", "MANUAL_REVIEW", "2026-05-13 06:20 UTC", "Approve Refund"],
];

const mintJobs = [
  ["MNT-1029", "MINT_QUEUED", "-"],
  ["MNT-1028", "MINT_FAILED_RETRYABLE", "Retry Mint"],
  ["MNT-1027", "MINT_CONFIRMED", "-"],
];

function StatusChip({ value }: { value: string }) {
  const isGood = value.includes("CONFIRMED") || value === "200 OK";
  const isBad = value.includes("FAILED") || value.includes("REVIEW");
  return (
    <span
      className={
        isGood
          ? "rounded-full border border-confirmed/30 bg-confirmed/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-confirmed"
          : isBad
            ? "rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-destructive"
            : "rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-primary"
      }
    >
      {value}
    </span>
  );
}

export default function AdminReconciliation() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const allowlistConfigured = ADMIN_WALLETS.length > 0;
  const isAdmin =
    connected &&
    !!publicKey &&
    allowlistConfigured &&
    ADMIN_WALLETS.includes(publicKey.toBase58());

  const notifyNotWired = (action: string) =>
    toast({
      title: `${action} — coming soon`,
      description: 'This operation goes live once reconciliation endpoints ship.',
    });

  const filteredOrders = paymentOrders.filter(([id]) =>
    id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isAdmin) {
    return (
      <Layout>
        <section className="py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldOff className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Access restricted</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This page is for Baraza operators. Connect with an authorised wallet to continue.
            </p>
            {connected && publicKey ? (
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                Signed in as {truncateAddress(publicKey.toBase58())}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="btn-warm mt-6 inline-flex items-center gap-2 text-sm"
              >
                Connect wallet
              </button>
            )}
            {!allowlistConfigured && (
              <p className="mt-4 text-[11px] text-muted-foreground/70">
                Operators: set <code className="font-mono">VITE_ADMIN_WALLETS</code> to enable this page.
              </p>
            )}
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <header className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Admin</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Payment Reconciliation</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Operational view for payment orders, webhook events, mint jobs, refunds, manual reviews, and audit events.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => notifyNotWired('Export CSV')}
                className="btn-ghost gap-2 text-sm"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => notifyNotWired('Sync state')}
                className="btn-ghost gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" /> Sync state
              </button>
            </div>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {[
              ["Pending Value", "KSh 425,000", "12 orders flagged"],
              ["Webhook Health", "99.8%", "All endpoints active"],
              ["Mint Queue Depth", "45 jobs", "Est. clearance 4m"],
            ].map(([label, value, note]) => (
              <div key={label} className="baraza-card p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>

          <div className="baraza-card mb-6 overflow-x-auto p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Payment Orders</h2>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                placeholder="Search by order ID"
              />
            </div>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">Order ID</th>
                  <th className="pb-3 font-normal">Amount</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 font-normal">Timestamp</th>
                  <th className="pb-3 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No orders match &ldquo;{searchTerm}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(([id, amount, status, time, action]) => (
                    <tr key={id} className="border-b border-border/70 last:border-b-0">
                      <td className="py-4 font-mono text-foreground">{id}</td>
                      <td className="py-4 text-foreground">{amount}</td>
                      <td className="py-4"><StatusChip value={status} /></td>
                      <td className="py-4 text-muted-foreground">{time}</td>
                      <td className="py-4 text-right">
                        {action === "-" ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => notifyNotWired(action)}
                            className="text-primary hover:underline"
                          >
                            {action}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="baraza-card overflow-x-auto p-5">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Mint Jobs</h2>
              <table className="w-full text-left text-sm">
                <tbody>
                  {mintJobs.map(([id, status, action]) => (
                    <tr key={id} className="border-b border-border/70 last:border-b-0">
                      <td className="py-4 font-mono text-foreground">{id}</td>
                      <td className="py-4"><StatusChip value={status} /></td>
                      <td className="py-4 text-right">
                        {action === "-" ? (
                          "-"
                        ) : (
                          <button
                            type="button"
                            onClick={() => notifyNotWired(action)}
                            className="text-primary hover:underline"
                          >
                            {action}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="baraza-card overflow-x-auto p-5">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Webhook Events</h2>
              <table className="w-full text-left text-sm">
                <tbody>
                  {[
                    ["payment.success", "/api/webhooks/africas-talking", "200 OK"],
                    ["mint.failed", "/api/mint-jobs/MNT-1028", "503 UNAVAIL"],
                    ["dao.created", "/api/communities", "201 CREATED"],
                  ].map(([event, target, response]) => (
                    <tr key={event} className="border-b border-border/70 last:border-b-0">
                      <td className="py-4 font-mono text-foreground">{event}</td>
                      <td className="py-4 text-muted-foreground">{target}</td>
                      <td className="py-4 text-right"><StatusChip value={response} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
