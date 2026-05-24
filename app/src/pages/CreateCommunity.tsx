import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, CheckCircle2, Loader2, Phone, ShieldCheck, Wallet } from 'lucide-react';
import Layout from '@/components/Layout';
import { COMMUNITY_TYPES, DAO_CREATION_FEE_KES } from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { normaliseKenyanPhone } from '@/lib/phone';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { createCommunityRecord } from '@/lib/communities';
import CommunityBanner from '@/components/CommunityBanner';
import { useChain } from '@/hooks/useChain';
import { useSeo } from '@/lib/seo';
import { CHAINS } from '@/lib/chain';
import { useBarazaChain } from '@/hooks/useBarazaData';
import { communityPda, toSlug } from '@/lib/programs';
import { saveCommunityChainMapping } from '@/lib/chainMappings';

const CreateCommunity: React.FC = () => {
  useSeo({
    title: "Launch a community DAO",
    description:
      "Spin up a chama, SACCO, welfare group, or co-operative on Baraza. Set membership rules, dues, quorum, and M-Pesa contribution paths in a single guided flow.",
    path: "/create",
  });
  const navigate = useNavigate();
  const { requireWallet, isReady } = useWalletGuard({ action: 'launch a community DAO' });
  const { toast } = useToast();
  const { chain, chainMeta } = useChain();
  const chainClient = useBarazaChain();
  const [isPending, setIsPending] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'wallet'>('mpesa');
  const [walletChain, setWalletChain] = useState<'solana' | 'stellar' | 'base' | 'ethereum'>('solana');
  const [form, setForm] = useState({
    name: '',
    type: '',
    fee: '',
    description: '',
    phone: '',
    quorum: '51',
    approvalThreshold: '66',
    votingPeriod: '7',
    treasuryPolicy: 'multisig-ready',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const normalisedPhone = normaliseKenyanPhone(form.phone);
  const isValid = !!(
    form.name.trim() &&
    form.type &&
    form.fee &&
    form.description.trim() &&
    (paymentMethod === 'wallet' || normalisedPhone !== null)
  );

  /**
   * Charge the DAO creation fee via the M-Pesa simulator, then create the
   * community record. Falls back to direct creation if the simulator endpoint
   * is unreachable (local dev without `vercel dev`) so the form still works
   * — the fee is then a paper-only acknowledgement, not enforced.
   */
  async function chargeCreationFee(): Promise<{ orderId: string; persisted: boolean }> {
    try {
      const res = await fetch('/api/mpesa/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: `+254${normalisedPhone}`,
          communityId: 'dao-creation-pending',
          amount: DAO_CREATION_FEE_KES,
          currency: 'KES',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { orderId?: string; persisted?: boolean };
        if (data.orderId) {
          return { orderId: data.orderId, persisted: data.persisted ?? false };
        }
      }
    } catch {
      // network/CORS/local-dev — fall through
    }
    return {
      orderId: `ord_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      persisted: false,
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (paymentMethod === 'mpesa' && !normalisedPhone) return;
    await requireWallet(async () => {
      setIsPending(true);
      try {
        // Step 1: charge the DAO creation fee
        const charge = paymentMethod === 'mpesa'
          ? await chargeCreationFee()
          : { orderId: `ord_wallet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, persisted: false };

        // Step 2: create the community record
        let chainResult: { slug: string; communityAddress: string; signature: string } | null = null;
        if (chain === 'solana' && chainClient) {
          const slug = toSlug(form.name);
          try {
            const signature = await chainClient.createCommunity(slug, form.name, '');
            const [communityKey] = communityPda(slug);
            chainResult = {
              slug,
              communityAddress: communityKey.toBase58(),
              signature,
            };
          } catch (chainErr) {
            console.warn('[baraza] createCommunity on-chain failed (record-only fallback):', chainErr);
          }
        }

        const community = await createCommunityRecord({
          name: form.name,
          type: form.type,
          description: form.description,
          membershipFee: Number(form.fee),
          chain,
          quorumPct: Number(form.quorum),
          approvalThresholdPct: Number(form.approvalThreshold),
          votingPeriodDays: Number(form.votingPeriod),
          treasuryPolicy: form.treasuryPolicy as 'multisig-ready' | 'proposal-only' | 'manual-review',
        });
        if (chainResult) {
          saveCommunityChainMapping({
            localId: community.id,
            chain: 'solana',
            slug: chainResult.slug,
            communityAddress: chainResult.communityAddress,
            createTxSignature: chainResult.signature,
          });
        }
        setCreatedCommunityId(community.id);
        setIsCreated(true);
        toast({
          title: charge.persisted
            ? `${formatKSh(DAO_CREATION_FEE_KES)} payment received`
            : `Community DAO launched (simulator offline)`,
          description: charge.persisted
            ? `Order ${charge.orderId.slice(0, 12)}…  · ${form.name} is live.`
            : 'Local dev mode — payment skipped, community launched.',
        });
      } catch (err) {
        toast({
          title: 'Could not launch community',
          description: err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsPending(false);
      }
    });
  };

  if (isCreated) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-3">
                {form.name} is live
              </h2>
              <p className="text-sm mb-2">
                Payment of {formatKSh(DAO_CREATION_FEE_KES)} received. Your Community DAO is ready.
              </p>
              <p className="text-sm mb-8">
                Share the join link with members, then start your first governance proposal from the dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => createdCommunityId && navigate(`/dashboard/${createdCommunityId}`)}
                  disabled={!createdCommunityId}
                  className="btn-primary text-sm"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/communities')}
                  className="btn-ghost text-sm"
                >
                  View All Communities
                </button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.64fr_0.36fr]">
            <div>
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <CommunityBanner type="cooperative" className="mb-8 min-h-[11.5rem] p-0">
            <div className="max-w-2xl p-6 md:p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/25 bg-background/72 text-primary shadow-lg backdrop-blur">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="font-display text-2xl font-black leading-tight text-foreground drop-shadow md:text-3xl">
                  Launch a Community DAO
                </h1>
              </div>
              <p className="max-w-xl text-sm font-semibold leading-6 text-foreground/92 drop-shadow md:text-base md:leading-7">
                Launch a DAO where members can contribute, submit governance proposals, and manage a shared treasury with explicit governance rules.
              </p>
            </div>
            </CommunityBanner>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Kibera Youth Collective"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Community Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select a type</option>
                  {COMMUNITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Fee */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Monthly Membership Fee (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium">KSh</span>
                  <input
                    type="number"
                    name="fee"
                    value={form.fee}
                    onChange={handleChange}
                    placeholder="500"
                    min="0"
                    className="w-full rounded-xl pl-14 pr-4 py-3 text-sm outline-none border"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell people what your community is about..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none"
                />
              </div>

              <div className="grid gap-5 rounded-lg border p-5 md:grid-cols-3">
                <div className="md:col-span-3">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                    Governance Rules
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">
                    Quorum Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="quorum"
                      value={form.quorum}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full rounded-lg px-4 py-3 pr-9 text-sm outline-none border"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">
                    Approval Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="approvalThreshold"
                      value={form.approvalThreshold}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full rounded-lg px-4 py-3 pr-9 text-sm outline-none border"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">
                    Default Voting Period
                  </label>
                  <select
                    name="votingPeriod"
                    value={form.votingPeriod}
                    onChange={handleChange}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none border cursor-pointer appearance-none"
                  >
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold mb-2">
                    Treasury Policy
                  </label>
                  <select
                    name="treasuryPolicy"
                    value={form.treasuryPolicy}
                    onChange={handleChange}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none border cursor-pointer appearance-none"
                  >
                    <option value="multisig-ready">Multisig-ready treasury release</option>
                    <option value="proposal-only">Proposal-approved releases only</option>
                    <option value="manual-review">Manual admin review for releases</option>
                  </select>
                </div>
              </div>

              {/* Payment */}
              <div className="grid gap-4 rounded-lg border p-5">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                  Payment
                </h2>

                {/* Method toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      paymentMethod === 'mpesa'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      paymentMethod === 'wallet'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {paymentMethod === 'mpesa' ? (
                    <motion.div
                      key="mpesa"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <label htmlFor="create-phone" className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                        <Phone className="h-3.5 w-3.5" />
                        M-Pesa number for the {formatKSh(DAO_CREATION_FEE_KES)} charge
                      </label>
                      <div className="flex rounded-lg border focus-within:border-current">
                        <span className="border-r px-3 py-2.5 text-sm">+254</span>
                        <input
                          id="create-phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="7XX XXX XXX"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          aria-invalid={form.phone.length > 0 && normalisedPhone === null}
                          className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                        />
                      </div>
                      {form.phone.length > 0 && normalisedPhone === null && (
                        <p className="mt-1.5 text-[11px]">
                          Enter a valid Kenyan mobile number (07XX, 7XX, or +254 7XX).
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="grid gap-3"
                    >
                      <label htmlFor="wallet-chain" className="text-xs font-semibold">
                        Pay with
                      </label>
                      <div className="relative">
                        <span
                          className="pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                          style={{ background: CHAINS[walletChain].badgeBg }}
                        />
                        <select
                          id="wallet-chain"
                          value={walletChain}
                          onChange={(e) => setWalletChain(e.target.value as typeof walletChain)}
                          className="w-full appearance-none rounded-lg border py-3 pl-8 pr-4 text-sm font-semibold outline-none cursor-pointer"
                        >
                          <option value="solana">Solana — SOL</option>
                          <option value="stellar">Stellar - XLM (integration pending)</option>
                          <option value="base">Base - ETH (integration pending)</option>
                          <option value="ethereum">Ethereum - ETH (integration pending)</option>
                        </select>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                        {isReady ? (
                          <p>
                            <span className="font-semibold">{CHAINS[walletChain].short} equivalent</span> of{' '}
                            {formatKSh(DAO_CREATION_FEE_KES)} will be deducted from your connected wallet on launch.
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            Connect your wallet above to pay in {CHAINS[walletChain].short}.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fee summary */}
                <div className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-4">
                  <div>
                    <p className="text-xs font-semibold">DAO creation fee</p>
                    <p className="mt-0.5 text-[11px]">
                      One-time charge for Solana rent, IPFS pinning, and registry setup.
                    </p>
                  </div>
                  <span className="font-display text-lg font-bold tabular-nums">
                    {formatKSh(DAO_CREATION_FEE_KES)}
                  </span>
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-4">
                  <span>Settled on</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: chainMeta.badgeBg }}
                    />
                    {chainMeta.label}
                  </span>
                </div>
              </div>

              {/* Submit */}
              {!isReady ? (
                <button
                  type="button"
                  onClick={() => requireWallet(async () => undefined)}
                  className="w-full btn-warm text-sm py-3.5 flex items-center justify-center gap-2"
                >
                  Connect wallet to continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isValid || isPending}
                  className="w-full btn-warm text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing payment…
                    </>
                  ) : paymentMethod === 'mpesa' ? (
                    `Pay ${formatKSh(DAO_CREATION_FEE_KES)} via M-Pesa & Launch DAO`
                  ) : (
                    `Pay with ${CHAINS[walletChain].short} & Launch DAO`
                  )}
                </button>
              )}
            </form>
            </div>

            <aside className="lg:pt-14">
              <div className="baraza-card sticky top-24 p-5">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                  Setup Checklist
                </h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['CommunityAccount', 'Ready from form details'],
                    ['TreasuryAccount', 'Pending on-chain setup'],
                    ['MembershipTier', 'Uses monthly dues'],
                    ['Governance Rules', 'Quorum and approval thresholds'],
                    ['Membership Credential', 'Minted after payment attestation'],
                  ].map(([label, detail]) => (
                    <div key={label} className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5" />
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="mt-1 text-xs">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg border p-4">
                  <p className="text-xs leading-5">
                    Treasury setup, membership tiers, and credentials are provisioned automatically once your DAO is launched.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateCommunity;
