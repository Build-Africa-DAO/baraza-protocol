import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { COMMUNITY_TYPES } from '@/lib/constants';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { createCommunityRecord } from '@/lib/communities';
import CommunityBanner from '@/components/CommunityBanner';

const CreateCommunity: React.FC = () => {
  const navigate = useNavigate();
  const { requireWallet, isReady } = useWalletGuard({ action: 'create a community DAO' });
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    fee: '',
    description: '',
    quorum: '51',
    approvalThreshold: '66',
    votingPeriod: '7',
    treasuryPolicy: 'multisig-ready',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid = !!(form.name.trim() && form.type && form.fee && form.description.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await requireWallet(async () => {
      setIsPending(true);
      try {
        const community = await createCommunityRecord({
          name: form.name,
          type: form.type,
          description: form.description,
          membershipFee: Number(form.fee),
        });
        setCreatedCommunityId(community.id);
        setIsCreated(true);
        toast({
          title: 'Community DAO created',
          description: 'Share the join link with members to get started.',
        });
      } catch (err) {
        toast({
          title: 'Could not create community',
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {form.name} is live
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Your Community DAO is ready. Share the join link with members, then create your first governance proposal from the dashboard.
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
            </motion.div>
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
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <CommunityBanner className="mb-8 p-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Create a Community DAO</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Launch a DAO where members can contribute, submit governance proposals, and manage a shared treasury with explicit governance rules.
              </p>
            </motion.div>
            </CommunityBanner>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Kibera Youth Collective"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Community Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select a type</option>
                  {COMMUNITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Fee */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Monthly Membership Fee (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">KSh</span>
                  <input
                    type="number"
                    name="fee"
                    value={form.fee}
                    onChange={handleChange}
                    placeholder="500"
                    min="0"
                    className="w-full bg-surface rounded-xl pl-14 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell people what your community is about..."
                  rows={4}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all resize-none"
                />
              </div>

              <div className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
                <div className="md:col-span-3">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Governance Rules
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
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
                      className="w-full bg-surface rounded-lg px-4 py-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
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
                      className="w-full bg-surface rounded-lg px-4 py-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Default Voting Period
                  </label>
                  <select
                    name="votingPeriod"
                    value={form.votingPeriod}
                    onChange={handleChange}
                    className="w-full bg-surface rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border cursor-pointer appearance-none"
                  >
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Treasury Policy
                  </label>
                  <select
                    name="treasuryPolicy"
                    value={form.treasuryPolicy}
                    onChange={handleChange}
                    className="w-full bg-surface rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border cursor-pointer appearance-none"
                  >
                    <option value="multisig-ready">Multisig-ready treasury release</option>
                    <option value="proposal-only">Proposal-approved releases only</option>
                    <option value="manual-review">Manual admin review for releases</option>
                  </select>
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
                      Creating…
                    </>
                  ) : (
                    'Create Community DAO'
                  )}
                </button>
              )}
            </motion.form>
            </div>

            <aside className="lg:pt-14">
              <div className="baraza-card sticky top-24 p-5">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Setup Checklist
                </h2>
                <div className="mt-5 space-y-4">
                  {[
                    ['CommunityAccount', 'Ready from form details'],
                    ['TreasuryAccount', 'Pending on-chain setup'],
                    ['MembershipTier', 'Uses monthly dues'],
                    ['Governance Rules', 'Quorum and approval thresholds'],
                    ['Membership Credential', 'Minted after payment attestation'],
                  ].map(([label, detail], index) => (
                    <div key={label} className="flex gap-3">
                      <ShieldCheck className={index === 0 ? 'mt-0.5 h-5 w-5 text-confirmed' : 'mt-0.5 h-5 w-5 text-primary'} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/8 p-4">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Treasury setup, membership tiers, and credentials are provisioned automatically once your DAO is created.
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
