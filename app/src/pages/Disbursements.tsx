import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Loader2, Phone } from 'lucide-react';
import Layout from '@/components/Layout';
import PageLoader from '@/components/PageLoader';
import { StatusScreen } from '@/components/StatusPage';
import CommunityBanner from '@/components/CommunityBanner';
import { DISBURSEMENT_LOCKED_COPY, TreasuryCircuitBreakerBanner } from '@/components/TreasuryCircuitBreakerBanner';
import { useCommunity } from '@/hooks/useCommunities';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from '@/contexts/AccountContext';
import { usdcToMobileMoney } from '@/lib/adapters/minisend';
import { toE164 } from '@/lib/phone';
import { calculateExpectedFiat, MAX_SLIPPAGE_BPS_TOLERANCE, planTelcoTranches } from '@/lib/payments/slippage';
import { useSeo } from '@/lib/seo';
import { sessionHeaders } from '@/lib/sessionHeaders';
import { formatKSh } from '@/lib/utils';

type OfframpStep = 'OFFRAMP_INITIATED' | 'PROVIDER_PENDING_VERIFICATION' | 'SETTLED' | 'FAILED' | 'REVERSAL_DETECTED';
type Rail = 'mpesa' | 'mtn' | 'airtel' | 'bank';

const FX_USDC_KES = 130.5;

const STEP_COPY: Record<OfframpStep, string> = {
  OFFRAMP_INITIATED: 'Escrow funds reserved in the treasury vault (Debit: Treasury, Credit: Escrow).',
  PROVIDER_PENDING_VERIFICATION: 'Processing with Safaricom M-Pesa…',
  SETTLED: 'Confirmed. Receipt posted to the group record.',
  FAILED: 'Payout failed at carrier network. Treasury funds have been automatically returned to the Community Vault via compensatory reversal.',
  REVERSAL_DETECTED: 'Carrier chargeback under audit investigation.',
};

export default function Disbursements() {
  const { id } = useParams<{ id: string }>();
  const { community, isLoading, error, reload } = useCommunity(id);
  const account = useAccount();
  const { toast } = useToast();

  useSeo({
    title: community ? `${community.name} payouts` : 'Payouts',
    description: 'Send treasury funds to a member phone via mobile money.',
    path: id ? `/dashboard/${id}/disbursements` : undefined,
    noIndex: true,
  });

  const frozen = Boolean(community?.isPayoutFrozen || community?.communityStatus === 'paused');
  const [phone, setPhone] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('100');
  const [rail, setRail] = useState<Rail>('mpesa');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<OfframpStep | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [settledKes, setSettledKes] = useState<number | null>(null);
  const [routedKotani, setRoutedKotani] = useState(false);
  const [confirmTranches, setConfirmTranches] = useState(false);

  const e164 = toE164(phone, 'KE');
  const fiatMinor = useMemo(() => calculateExpectedFiat(usdcAmount || '0', FX_USDC_KES), [usdcAmount]);
  const plan = planTelcoTranches(fiatMinor);
  const phoneError = phone.trim() && !e164 ? 'Enter a valid +254, +256, +233, or +234 number.' : null;

  async function sendTranche(trancheIndex: number, amountUsdc: string, proposalId: string) {
    const headers = await sessionHeaders(account.getAccessToken, e164 ? { 'x-wallet-proof': `session:${account.accountId ?? 'session'}:${Date.now()}` } : undefined);
    const result = await usdcToMobileMoney({
      communityId: id,
      proposalId: `${proposalId}-tranche-${trancheIndex}`,
      callerWallet: account.accountId ?? undefined,
      phone: e164 ?? phone,
      usdcAmount: amountUsdc,
      chain: 'stellar',
      currency: 'KES',
      headers,
    });
    return result;
  }

  async function handleSend() {
    if (frozen || !e164 || !id) return;
    if (plan.exceeds && !confirmTranches) {
      setConfirmTranches(true);
      return;
    }
    setBusy(true);
    setStep('OFFRAMP_INITIATED');
    setRoutedKotani(false);
    try {
      const proposalId = `payout-${id}-${Date.now()}`;
      const usdcNum = Number(usdcAmount);
      let lastKes = 0;
      let lastRef = '';
      for (let i = 0; i < plan.amountsMinor.length; i++) {
        const share = plan.amountsMinor.length === 1
          ? usdcAmount
          : (usdcNum * Number(plan.amountsMinor[i]) / Number(fiatMinor)).toFixed(6);
        setStep('PROVIDER_PENDING_VERIFICATION');
        const result = await sendTranche(i + 1, share, proposalId);
        if (!result.ok) {
          const circuit = Boolean(result.circuitBreaker) || /frozen|circuit/i.test(result.error ?? '');
          toast({
            title: circuit ? 'Payout locked' : 'Payout failed',
            description: circuit ? DISBURSEMENT_LOCKED_COPY : (result.error ?? STEP_COPY.FAILED),
            variant: 'destructive',
          });
          setStep('FAILED');
          return;
        }
        lastKes = result.kesAmount;
        lastRef = result.reference;
        if (/kotani/i.test(result.reference) || /kotani/i.test(result.error ?? '')) setRoutedKotani(true);
      }
      setReceipt(lastRef);
      setSettledKes(lastKes);
      setStep('SETTLED');
    } finally {
      setBusy(false);
    }
  }

  const gate = { title: 'Sign in to send a payout', description: 'Officers send treasury funds to a member phone from this page.' };

  if (isLoading) {
    return (
      <Layout gate={gate}>
        <PageLoader label="Loading payouts" />
      </Layout>
    );
  }

  if (!community) {
    if (error) return <StatusScreen kind="server" gate={gate} onRetry={() => void reload()} />;
    return <StatusScreen kind="community" gate={gate} />;
  }

  return (
    <Layout gate={gate}>
      <section className="py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to={`/dashboard/${community.id}/treasury`} className="mb-6 inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Group funds
          </Link>
          <CommunityBanner type={community.type} className="mb-6 p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Officer payouts</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Send payout</h1>
            <p className="mt-2 text-sm text-muted-foreground">Convert treasury USDC into mobile money on the member’s handset.</p>
          </CommunityBanner>

          <TreasuryCircuitBreakerBanner frozen={frozen} />
          {routedKotani && (
            <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
              Disbursement routed via Kotani Pay B2C (Secondary Liquidation Rail)
            </p>
          )}

          <div className="baraza-card space-y-5 p-5">
            <div>
              <label className="mb-2 block text-xs font-semibold">Recipient phone</label>
              <div className="flex items-center gap-2 rounded-lg border px-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </div>
              {phoneError && <p className="mt-2 text-xs text-destructive">{phoneError}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">Amount (USDC)</label>
              <input
                value={usdcAmount}
                onChange={(e) => { setUsdcAmount(e.target.value); setConfirmTranches(false); }}
                className="w-full rounded-lg border px-3 py-3 text-sm outline-none"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Quoted rate: 1 USDC = {FX_USDC_KES.toFixed(2)} KES · expected {formatKSh(Number(fiatMinor) / 100)}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Adverse spot slippage tolerance is {MAX_SLIPPAGE_BPS_TOLERANCE} bps (1.50%). Worse quotes are rejected.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold">Rail</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['mpesa', 'mtn', 'airtel', 'bank'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRail(item)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${rail === item ? 'border-primary bg-primary/10 text-primary' : ''}`}
                  >
                    {item === 'mpesa' ? 'M-Pesa' : item === 'mtn' ? 'MTN MoMo' : item === 'airtel' ? 'Airtel' : 'Bank'}
                  </button>
                ))}
              </div>
            </div>

            {plan.exceeds && (
              <div className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
                Amount exceeds Safaricom per-transaction ceiling (KES 250,000). System will split this payout into {plan.trancheCount} tranches of {formatKSh(Number(plan.amountsMinor[0]) / 100)}.
              </div>
            )}

            <button
              type="button"
              disabled={frozen || busy || !e164}
              title={frozen ? DISBURSEMENT_LOCKED_COPY : undefined}
              onClick={() => void handleSend()}
              className="btn-warm w-full justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {frozen ? 'Send payout locked' : plan.exceeds && !confirmTranches ? 'Review tranche split' : 'Send payout'}
            </button>
          </div>

          {step && (
            <div className="mt-6 baraza-card p-5">
              <h2 className="font-display text-base font-semibold">Payout status</h2>
              <ol className="mt-4 space-y-3 text-sm">
                {(Object.keys(STEP_COPY) as OfframpStep[]).map((code) => (
                  <li key={code} className={code === step ? 'font-semibold text-primary' : 'text-muted-foreground'}>
                    {code.replace(/_/g, ' ')}
                    {code === step ? ` — ${STEP_COPY[code]}` : ''}
                  </li>
                ))}
              </ol>
              {step === 'SETTLED' && (
                <p className="mt-4 text-sm">
                  Safaricom receipt {receipt || 'posted'}. Amount received: {settledKes != null ? formatKSh(settledKes) : 'confirmed'}.
                </p>
              )}
              {step === 'FAILED' && <p className="mt-4 text-sm text-destructive">{STEP_COPY.FAILED}</p>}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
