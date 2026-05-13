import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, ArrowLeft, Info, Loader2, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { formatKSh } from '@/lib/utils';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { useCommunity } from '@/hooks/useCommunities';
import CommunityBanner from '@/components/CommunityBanner';

const CreateDecision: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { requireWallet, isReady } = useWalletGuard({ action: 'submit governance proposals' });
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    fundingAmount: '',
    duration: '7',
  });
  const [isPending, setIsPending] = useState(false);

  const { community, isLoading, error } = useCommunity(id);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValid = !!(form.title.trim() && form.description.trim() && form.fundingAmount);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="baraza-card h-48 max-w-lg mx-auto animate-pulse" />
          </div>
        </section>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Community not found
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {error?.message ?? 'This proposal cannot be created because the community is not available in the current data.'}
            </p>
            <Link to="/communities" className="btn-primary text-sm inline-flex">
              View Communities
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const overBudget = Number(form.fundingAmount) > community.fundBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || overBudget) return;
    await requireWallet(async () => {
      setIsPending(true);
      try {
        toast({
          title: 'Proposal submission — coming soon',
          description: 'Voting opens once the on-chain governance program ships. Thanks for trying it early.',
        });
      } finally {
        setIsPending(false);
      }
    });
  };

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {community.name}
            </button>

            <CommunityBanner type={community.type} className="mb-6 p-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Submit a Governance Proposal</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Submit a proposal for the community DAO to vote on. Include how much funding is needed from the treasury.
              </p>
            </motion.div>
            </CommunityBanner>

            {/* Fund info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="baraza-card p-4 mb-4 flex items-center gap-3 bg-surface"
            >
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Available DAO Treasury</p>
                <p className="text-sm font-bold text-accent">{formatKSh(community.fundBalance)}</p>
              </div>
            </motion.div>

            {/* Governance rules */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mb-6 rounded-lg border border-primary/20 bg-primary/8 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Governance rules
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                This DAO requires <strong className="text-foreground">50% quorum</strong> and{" "}
                <strong className="text-foreground">60% approval</strong>. Voting closes automatically when the period ends.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Proposal Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Purchase Shared Equipment"
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                />
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
                  placeholder="Describe the decision, why it's needed, and how funds will be used..."
                  rows={5}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all resize-none"
                />
              </div>

              {/* Funding amount */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Funding Amount (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">KSh</span>
                  <input
                    type="number"
                    name="fundingAmount"
                    value={form.fundingAmount}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className="w-full bg-surface rounded-xl pl-14 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border transition-all"
                  />
                </div>
                {overBudget && (
                  <p className="text-xs text-destructive mt-1.5">
                    This exceeds the available DAO treasury of {formatKSh(community.fundBalance)}
                  </p>
                )}
              </div>

              {/* Voting period */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Voting Period
                </label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 border border-border cursor-pointer appearance-none"
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              {/* Submit */}
              {!isReady ? (
                <div className="baraza-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Connect your wallet to submit a governance proposal
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isValid || isPending || overBudget}
                  className="w-full btn-primary text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Proposal for Vote'
                  )}
                </button>
              )}
            </motion.form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CreateDecision;
