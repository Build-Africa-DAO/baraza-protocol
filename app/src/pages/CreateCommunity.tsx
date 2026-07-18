import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Phone,
  Wallet,
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Layout from '@/components/Layout';
import CommunityPurpose from '@/components/onboarding/CommunityPurpose';
import { AskAkili } from '@/akili/AskAkili';
import {
  COMMUNITY_TYPES,
  DAO_CREATION_FEE_KES,
  PAYBILL_ADDON_FEE_KES,
  USSD_ADDON_FEE_KES,
} from '@/lib/constants';
import { formatKSh } from '@/lib/utils';
import { normaliseKenyanPhone } from '@/lib/phone';
import { createCommunityRecord } from '@/lib/communities';
import { communityPda, toSlug } from '@/lib/programs';
import { saveCommunityChainMapping } from '@/lib/chainMappings';
import { buildWalletProofHeaders } from '@/lib/walletProof';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { useSeo } from '@/lib/seo';
import { useBarazaChain } from '@/hooks/useBarazaData';
import { useCommunityDraft } from '@/hooks/useCommunityDraft';
import type { Chain } from '@/lib/chain';
import type { CommunitySetupStep } from '@/lib/communityDraft';

type TreasuryPolicy = 'multisig-ready' | 'proposal-only' | 'manual-review';
type AccountNetwork = Extract<Chain, 'solana' | 'stellar' | 'base'>;

const STEP_ORDER: CommunitySetupStep[] = ['basics', 'contributions', 'decisions', 'account'];
const STEP_LABELS: Record<CommunitySetupStep, string> = {
  basics: 'About your group',
  contributions: 'Contributions',
  decisions: 'Decision rules',
  account: 'Account setup',
};

const DEFAULT_FORM = {
  name: '',
  type: '',
  fee: '',
  description: '',
  phone: '',
  quorum: '51',
  approvalThreshold: '66',
  votingPeriod: '7',
  treasuryPolicy: 'multisig-ready',
};

const GOVERNANCE_PRESETS: Record<string, {
  label: string;
  summary: string;
  quorum: string;
  approvalThreshold: string;
  votingPeriod: string;
  treasuryPolicy: TreasuryPolicy;
}> = {
  savings: {
    label: 'Chama / savings group',
    summary: 'A majority of members take part, and important spending needs clear support.',
    quorum: '51', approvalThreshold: '60', votingPeriod: '7', treasuryPolicy: 'proposal-only',
  },
  cooperative: {
    label: 'Cooperative',
    summary: 'Member decisions remain visible while designated officers help approve withdrawals.',
    quorum: '50', approvalThreshold: '66', votingPeriod: '14', treasuryPolicy: 'multisig-ready',
  },
  sacco: {
    label: 'SACCO',
    summary: 'Higher participation and an officer review are recommended for member savings decisions.',
    quorum: '60', approvalThreshold: '75', votingPeriod: '14', treasuryPolicy: 'manual-review',
  },
  housing: {
    label: 'Housing group',
    summary: 'Land and housing decisions use higher participation and a longer review period.',
    quorum: '60', approvalThreshold: '75', votingPeriod: '30', treasuryPolicy: 'manual-review',
  },
  investment: {
    label: 'Investment club',
    summary: 'Shared investments use stronger approval and more than one withdrawal approver.',
    quorum: '60', approvalThreshold: '75', votingPeriod: '14', treasuryPolicy: 'multisig-ready',
  },
};

function provisionPaybill(communityName: string): string {
  const seed = Array.from(communityName).reduce((total, character) => total + character.charCodeAt(0), 0) + (Date.now() % 9000);
  return String(400100 + (seed % 9900));
}

function provisionUssdShortcode(communityName: string): string {
  const seed = Array.from(communityName).reduce((total, character) => total + character.charCodeAt(0), 0) + ((Date.now() >> 2) % 900);
  return `*384*${100 + (seed % 900)}#`;
}

function isAccountNetwork(value: string | undefined): value is AccountNetwork {
  return value === 'solana' || value === 'stellar' || value === 'base';
}

export default function CreateCommunity() {
  useSeo({
    title: 'Start a community',
    description: 'Set up a chama, SACCO, cooperative, association, or community with guided questions and sensible starting rules.',
    path: '/create',
  });

  const navigate = useNavigate();
  const wallet = useWallet();
  const chainClient = useBarazaChain();
  const { toast } = useToast();
  const { savedDraft, saveDraft, clearDraft } = useCommunityDraft();
  const { requireWallet, isReady, address: founderAddress } = useWalletGuard({ action: 'set up a community account' });

  const [currentStep, setCurrentStep] = useState<CommunitySetupStep>(savedDraft?.step ?? 'basics');
  const [form, setForm] = useState(savedDraft?.form ?? DEFAULT_FORM);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'wallet'>(savedDraft?.paymentMethod ?? 'mpesa');
  const [addPaybill, setAddPaybill] = useState(savedDraft?.addPaybill ?? false);
  const [addUssd, setAddUssd] = useState(savedDraft?.addUssd ?? false);
  const [walletChain, setWalletChain] = useState<AccountNetwork>(
    isAccountNetwork(savedDraft?.walletChain) ? savedDraft.walletChain : 'stellar',
  );
  const [isPending, setIsPending] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);
  const [assignedPaybill, setAssignedPaybill] = useState<string | null>(null);
  const [assignedUssd, setAssignedUssd] = useState<string | null>(null);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const selectedPreset = GOVERNANCE_PRESETS[form.type];
  const normalisedPhone = normaliseKenyanPhone(form.phone);
  const totalFeeKes = DAO_CREATION_FEE_KES + (addPaybill ? PAYBILL_ADDON_FEE_KES : 0) + (addUssd ? USSD_ADDON_FEE_KES : 0);
  const needsConnectedAccount = paymentMethod === 'wallet' && walletChain === 'solana';
  const canContinue = currentStep === 'basics'
    ? Boolean(form.name.trim() && form.type && form.description.trim())
    : currentStep === 'contributions'
      ? form.fee !== '' && Number(form.fee) >= 0
      : true;
  const canSubmit = Boolean(
    form.name.trim() && form.type && form.description.trim() && form.fee !== '' &&
    (paymentMethod === 'wallet' || normalisedPhone),
  );

  React.useEffect(() => {
    if (isCreated) return;
    saveDraft({ step: currentStep, form, paymentMethod, addPaybill, addUssd, walletChain });
  }, [addPaybill, addUssd, currentStep, form, isCreated, paymentMethod, saveDraft, walletChain]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function applyCommunityType(value: string) {
    const preset = GOVERNANCE_PRESETS[value];
    setForm((current) => ({
      ...current,
      type: value,
      ...(preset ? {
        quorum: preset.quorum,
        approvalThreshold: preset.approvalThreshold,
        votingPeriod: preset.votingPeriod,
        treasuryPolicy: preset.treasuryPolicy,
      } : {}),
    }));
  }

  function goToStep(step: CommunitySetupStep) {
    const index = STEP_ORDER.indexOf(step);
    if (index <= currentStepIndex) setCurrentStep(step);
  }

  function continueForward() {
    const next = STEP_ORDER[currentStepIndex + 1];
    if (next && canContinue) setCurrentStep(next);
  }

  function goBack() {
    const previous = STEP_ORDER[currentStepIndex - 1];
    if (previous) setCurrentStep(previous);
    else navigate('/communities');
  }

  async function chargeCreationFee(): Promise<{ orderId: string; persisted: boolean }> {
    try {
      const response = await fetch('/api/mpesa/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: `+254${normalisedPhone}`,
          communityId: 'community-creation-pending',
          amount: totalFeeKes,
          currency: 'KES',
        }),
      });
      if (response.ok) {
        const data = await response.json() as { orderId?: string; persisted?: boolean };
        if (data.orderId) return { orderId: data.orderId, persisted: data.persisted ?? false };
      }
    } catch {
      // Local development can create the community without the payment simulator.
    }
    return { orderId: `ord_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, persisted: false };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || (paymentMethod === 'mpesa' && !normalisedPhone)) return;

    const createCommunity = async () => {
      setIsPending(true);
      try {
        const charge = paymentMethod === 'mpesa'
          ? await chargeCreationFee()
          : { orderId: `ord_${walletChain}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, persisted: false };

        let chainResult: { slug: string; communityAddress: string; signature: string } | null = null;
        if (walletChain === 'solana' && chainClient) {
          const slug = toSlug(form.name);
          try {
            const signature = await chainClient.createCommunity(slug, form.name, '');
            const [communityKey] = communityPda(slug);
            chainResult = { slug, communityAddress: communityKey.toBase58(), signature };
          } catch (chainError) {
            console.warn('[baraza] account registration failed; saved locally instead:', chainError);
          }
        }

        const paybill = addPaybill ? provisionPaybill(form.name) : undefined;
        const ussd = addUssd ? provisionUssdShortcode(form.name) : undefined;
        const walletProofHeaders = founderAddress ? await buildWalletProofHeaders(wallet, 'create-community') : undefined;
        const community = await createCommunityRecord({
          name: form.name,
          type: form.type,
          description: form.description,
          membershipFee: Number(form.fee),
          chain: walletChain,
          quorumPct: Number(form.quorum),
          approvalThresholdPct: Number(form.approvalThreshold),
          votingPeriodDays: Number(form.votingPeriod),
          treasuryPolicy: form.treasuryPolicy as TreasuryPolicy,
          paybillNumber: paybill,
          ussdShortcode: ussd,
          createdBy: founderAddress ?? undefined,
          walletProofHeaders,
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

        setAssignedPaybill(paybill ?? null);
        setAssignedUssd(ussd ?? null);
        setCreatedCommunityId(community.id);
        setIsCreated(true);
        clearDraft();
        toast({
          title: charge.persisted ? 'Setup payment received' : 'Community created',
          description: charge.persisted
            ? `${form.name} is ready. Payment reference ${charge.orderId.slice(0, 12)}…`
            : 'Saved on this device. Payment was skipped in local development.',
        });
      } catch (error) {
        toast({
          title: 'Community setup could not be completed',
          description: error instanceof Error ? error.message : 'Check the details and try again.',
          variant: 'destructive',
        });
      } finally {
        setIsPending(false);
      }
    };

    if (needsConnectedAccount && !isReady) {
      await requireWallet(createCommunity);
      return;
    }
    await createCommunity();
  }

  if (isCreated) {
    return (
      <Layout>
        <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-confirmed/15 text-confirmed">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-balance font-display text-3xl font-bold text-foreground">{form.name} is ready</h1>
          <p className="mt-3 text-pretty text-base leading-7 text-muted-foreground">
            Invite your members, confirm who can approve withdrawals, and open your first decision.
          </p>
          {(assignedPaybill || assignedUssd) && (
            <div className="mt-7 rounded-xl border border-border bg-card p-5 text-left">
              {assignedPaybill && <p className="text-sm"><strong>Paybill:</strong> {assignedPaybill}</p>}
              {assignedUssd && <p className="mt-2 text-sm"><strong>Member shortcode:</strong> {assignedUssd}</p>}
            </div>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => createdCommunityId && navigate(`/dashboard/${createdCommunityId}`)}
              disabled={!createdCommunityId}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Open community home
            </button>
            <button type="button" onClick={() => navigate('/communities')} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold">
              View all communities
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {currentStepIndex === 0 ? 'Back to Explore' : 'Previous step'}
        </button>

        <div className="mt-7 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside>
            <p className="text-sm font-semibold text-primary">Start a community</p>
            <h1 className="mt-2 text-balance font-display text-3xl font-bold text-foreground">A few clear decisions, one step at a time.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Your progress is saved automatically on this device.</p>

            <ol className="mt-7 space-y-2" aria-label="Community setup progress">
              {STEP_ORDER.map((step, index) => {
                const complete = index < currentStepIndex;
                const active = step === currentStep;
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => goToStep(step)}
                      disabled={index > currentStepIndex}
                      aria-current={active ? 'step' : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        active ? 'bg-primary/10 font-semibold text-foreground' : complete ? 'text-foreground hover:bg-muted' : 'text-muted-foreground'
                      }`}
                    >
                      <span className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${active || complete ? 'border-primary text-primary' : 'border-border'}`}>
                        {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      {STEP_LABELS[step]}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <form onSubmit={handleSubmit} className="min-w-0 rounded-xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <p className="text-sm text-muted-foreground">Step {currentStepIndex + 1} of {STEP_ORDER.length}</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">{STEP_LABELS[currentStep]}</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Saved</span>
            </div>

            {currentStep === 'basics' && (
              <div className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Group name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="For example, Milele Chama"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <CommunityPurpose value={form.type} onChange={applyCommunityType} options={COMMUNITY_TYPES} />
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">What do members do together?</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="For example, we save monthly and provide emergency support to members"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            )}

            {currentStep === 'contributions' && (
              <div className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">How much does each member contribute per month?</span>
                  <span className="relative block">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
                    <input
                      type="number"
                      min="0"
                      value={form.fee}
                      onChange={(event) => updateField('fee', event.target.value)}
                      placeholder="500"
                      className="w-full rounded-lg border border-border bg-background py-3 pl-14 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">Enter 0 if contributions are optional.</span>
                </label>

                <details className="rounded-lg border border-border/70 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">Optional ways for members to pay and participate</summary>
                  <div className="mt-4 space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/45 p-3">
                      <input type="checkbox" checked={addPaybill} onChange={(event) => setAddPaybill(event.target.checked)} className="mt-1" />
                      <span className="text-sm"><strong>Dedicated M-Pesa Paybill</strong><br /><span className="text-muted-foreground">Members pay without using an organizer’s personal number. Adds {formatKSh(PAYBILL_ADDON_FEE_KES)}.</span></span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/45 p-3">
                      <input type="checkbox" checked={addUssd} onChange={(event) => setAddUssd(event.target.checked)} className="mt-1" />
                      <span className="text-sm"><strong>Feature-phone shortcode</strong><br /><span className="text-muted-foreground">Members can check updates and participate without a smartphone. Adds {formatKSh(USSD_ADDON_FEE_KES)}.</span></span>
                    </label>
                  </div>
                </details>
              </div>
            )}

            {currentStep === 'decisions' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-muted/45 p-4">
                  <p className="font-semibold text-foreground">Recommended for {selectedPreset?.label ?? 'your group'}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {selectedPreset?.summary ?? 'These starting rules can be changed now or after setup.'}
                  </p>
                  <div className="mt-3">
                    <AskAkili prompt={`Explain suitable decision rules for a ${form.type || 'community'} with monthly contributions of KES ${form.fee || '0'}`} label="Ask Akili to explain" variant="chip" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Members needed</span>
                    <select value={form.quorum} onChange={(event) => updateField('quorum', event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm">
                      <option value="35">35%</option><option value="40">40%</option><option value="50">50%</option><option value="51">51%</option><option value="60">60%</option><option value="75">75%</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Support to pass</span>
                    <select value={form.approvalThreshold} onChange={(event) => updateField('approvalThreshold', event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm">
                      <option value="51">Simple majority</option><option value="60">60%</option><option value="66">Two-thirds</option><option value="75">Three-quarters</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Time to respond</span>
                    <select value={form.votingPeriod} onChange={(event) => updateField('votingPeriod', event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm">
                      <option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold">Who confirms withdrawals?</legend>
                  <div className="mt-3 space-y-2">
                    {[
                      ['multisig-ready', 'Two or more trusted approvers', 'Good for cooperatives and shared officer responsibility.'],
                      ['proposal-only', 'Members approve each withdrawal', 'Good for smaller groups that decide directly.'],
                      ['manual-review', 'Members approve, then a treasurer reviews', 'Good for registered groups with formal checks.'],
                    ].map(([value, label, detail]) => (
                      <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${form.treasuryPolicy === value ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <input type="radio" name="treasuryPolicy" value={value} checked={form.treasuryPolicy === value} onChange={(event) => updateField('treasuryPolicy', event.target.value)} className="mt-1" />
                        <span className="text-sm"><strong>{label}</strong><br /><span className="text-muted-foreground">{detail}</span></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {currentStep === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">How would you like to pay the setup charge?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">M-Pesa is recommended. Technical account choices are optional.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setPaymentMethod('mpesa')} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold ${paymentMethod === 'mpesa' ? 'border-primary bg-primary/8 text-foreground' : 'border-border text-muted-foreground'}`}>
                    <Phone className="h-4 w-4" /> M-Pesa
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('wallet')} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold ${paymentMethod === 'wallet' ? 'border-primary bg-primary/8 text-foreground' : 'border-border text-muted-foreground'}`}>
                    <Wallet className="h-4 w-4" /> Digital account
                  </button>
                </div>

                {paymentMethod === 'mpesa' ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">M-Pesa number</span>
                    <span className="flex rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="border-r border-border px-3 py-3 text-sm text-muted-foreground">+254</span>
                      <input
                        value={form.phone}
                        onChange={(event) => updateField('phone', event.target.value)}
                        type="tel"
                        inputMode="numeric"
                        placeholder="712 345 678"
                        aria-invalid={form.phone.length > 0 && normalisedPhone === null}
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                      />
                    </span>
                    {form.phone.length > 0 && normalisedPhone === null && <span className="mt-2 block text-sm text-destructive">Enter a valid Kenyan mobile number.</span>}
                  </label>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-semibold" htmlFor="account-network">Community account network</label>
                    <select id="account-network" value={walletChain} onChange={(event) => setWalletChain(event.target.value as AccountNetwork)} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm">
                      <option value="stellar">Stellar</option>
                      <option value="solana">Solana</option>
                      <option value="base">Base</option>
                    </select>
                    <details className="mt-3 rounded-lg border border-border/70 p-4">
                      <summary className="cursor-pointer text-sm font-semibold">Technical setup details</summary>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">The selected network is recorded for setup. Baraza supports Phantom, Solflare, and Coinbase Wallet only.</p>
                    </details>
                  </div>
                )}

                <div className="rounded-lg bg-muted/45 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4"><span>Community setup</span><strong>{formatKSh(DAO_CREATION_FEE_KES)}</strong></div>
                  {addPaybill && <div className="mt-2 flex items-center justify-between gap-4"><span>Dedicated Paybill</span><strong>+ {formatKSh(PAYBILL_ADDON_FEE_KES)}</strong></div>}
                  {addUssd && <div className="mt-2 flex items-center justify-between gap-4"><span>Feature-phone shortcode</span><strong>+ {formatKSh(USSD_ADDON_FEE_KES)}</strong></div>}
                  <div className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3 text-base"><span>Total</span><strong>{formatKSh(totalFeeKes)}</strong></div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Changes are saved automatically on this device.</p>
              {currentStep !== 'account' ? (
                <button type="button" onClick={continueForward} disabled={!canContinue} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : needsConnectedAccount && !isReady ? (
                <button type="button" onClick={() => requireWallet(async () => undefined)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
                  Connect supported account
                </button>
              ) : (
                <button type="submit" disabled={!canSubmit || isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45">
                  {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating community…</> : <>Finish setup <ArrowRight className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
