import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import WalletLayout from '@/components/WalletLayout';
import { COMMUNITY_TYPES } from '@/lib/constants';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import { useToast } from '@/hooks/use-toast';
import { createCommunityRecord } from '@/lib/communities';

const CreateCommunity: React.FC = () => {
  const navigate = useNavigate();
  const { requireWallet, isReady } = useWalletGuard({ action: 'create a community' });
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    fee: '',
    description: '',
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
          title: 'Community saved',
          description: 'The community record is ready. On-chain setup is still pending.',
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
      <WalletLayout>
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
                {form.name} record created
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                The app record is ready. On-chain setup, payment reconciliation, and membership minting are still pending.
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
      </WalletLayout>
    );
  }

  return (
    <WalletLayout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Start a Group</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Create a community where members can contribute, make decisions, and manage funds together.
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

              {/* Submit */}
              {!isReady ? (
                <div className="baraza-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Connect your wallet to create a community
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!isValid || isPending}
                  className="w-full btn-warm text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Community'
                  )}
                </button>
              )}
            </motion.form>
          </div>
        </div>
      </section>
    </WalletLayout>
  );
};

export default CreateCommunity;
