import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, ReceiptText, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import {
  listBountyPayouts,
  PAYOUT_ASSET_DETAILS,
  toPublicPayoutReceipt,
  type PublicPayoutReceipt,
} from '@/lib/bountyPayouts';
import { formatKSh } from '@/lib/utils';
import { useSeo } from '@/lib/seo';

interface ReceiptResponse {
  receipt?: {
    payout_id: string;
    bounty_id: string;
    community_id: string;
    amount_kes: number | string;
    asset: PublicPayoutReceipt['asset'];
    asset_amount: number | string | null;
    recipient_wallet: string;
    tx_hash: string;
    explorer_url?: string | null;
    paid_at: string;
  };
}

function fromApi(value: ReceiptResponse['receipt']): PublicPayoutReceipt | null {
  if (!value) return null;
  return {
    payoutId: value.payout_id,
    bountyId: value.bounty_id,
    communityId: value.community_id,
    amountKes: Number(value.amount_kes),
    asset: value.asset,
    assetAmount: value.asset_amount === null ? null : String(value.asset_amount),
    recipientWallet: value.recipient_wallet,
    approvalCount: 0,
    txHash: value.tx_hash,
    explorerUrl: value.explorer_url ?? undefined,
    paidAt: value.paid_at,
  };
}

export default function PayoutReceipt() {
  const { payoutId = '' } = useParams();
  const [receipt, setReceipt] = useState<PublicPayoutReceipt | null>(() => {
    const local = listBountyPayouts().find((payout) => payout.id === payoutId);
    return local ? toPublicPayoutReceipt(local) : null;
  });
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'Payout receipt',
    description: 'Verify a confirmed Baraza community bounty payout.',
    path: payoutId ? `/payouts/${payoutId}` : '/payouts',
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bounties/payouts?payoutId=${encodeURIComponent(payoutId)}`)
      .then(async (response) => response.ok ? response.json() as Promise<ReceiptResponse> : null)
      .then((body) => {
        if (!cancelled && body?.receipt) setReceipt(fromApi(body.receipt));
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [payoutId]);

  return (
    <Layout>
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-2xl px-4">
          <Link to="/bounties" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to bounties
          </Link>

          {receipt ? (
            <article className="baraza-card overflow-hidden">
              <header className="border-b bg-confirmed/5 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-confirmed">Public payout receipt</p>
                    <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Payment confirmed</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Verified settlement for approved community work.</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-confirmed" />
                </div>
              </header>

              <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Local accounting value</p>
                  <p className="mt-1 font-display text-xl font-bold">{formatKSh(receipt.amountKes)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Settlement</p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {receipt.assetAmount ? `${receipt.assetAmount} ` : ''}{receipt.asset}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{PAYOUT_ASSET_DETAILS[receipt.asset].label}</p>
                </div>
                <div className="rounded-lg border p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Recipient wallet</p>
                  <p className="mt-1 break-all font-mono text-xs">{receipt.recipientWallet}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Bounty reference</p>
                  <p className="mt-1 break-all font-mono text-xs">{receipt.bountyId}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                  <p className="mt-1 text-sm font-semibold">{new Date(receipt.paidAt).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Transaction</p>
                  <p className="mt-1 break-all font-mono text-xs">{receipt.txHash}</p>
                  {receipt.explorerUrl && (
                    <a href={receipt.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Open transaction <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <footer className="flex items-center gap-2 border-t px-6 py-4 text-xs text-muted-foreground sm:px-8">
                <ShieldCheck className="h-4 w-4 text-primary" />
                This receipt contains no private contact or identity information.
              </footer>
            </article>
          ) : (
            <div className="baraza-card p-8 text-center">
              <ReceiptText className="mx-auto h-9 w-9 text-muted-foreground" />
              <h1 className="mt-4 font-display text-xl font-bold">{loading ? 'Checking payout...' : 'Receipt not available'}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A public receipt appears only after the payout transaction is confirmed.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
