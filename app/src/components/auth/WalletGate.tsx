import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Users, Vote } from 'lucide-react';
import { useAccount } from '@/contexts/AccountContext';

interface WalletGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const perks = [
  { icon: Users, text: 'Create and manage your groups' },
  { icon: Vote, text: 'Propose and vote on decisions' },
  { icon: Shield, text: 'Secure account-based identity - no passwords' },
];

const WalletGate: React.FC<WalletGateProps> = ({
  children,
  title = 'Sign in to continue',
  description = 'Connect your Baraza account to access this page.',
}) => {
  const account = useAccount();

  if (account.authenticated) return <>{children}</>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="baraza-card overflow-hidden">
          {/* Gradient header strip */}
          <div className="h-1.5 w-full" style={{ background: 'var(--gradient-warm)' }} />

          <div className="p-8">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}>
              <LogIn className="w-7 h-7 text-white" />
            </div>

            {/* Heading */}
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
              {description}
            </p>

            {/* Perks */}
            <ul className="space-y-3 mb-8">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>

            {/* Account button */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={account.login} disabled={!account.configured || !account.ready} className="btn-warm justify-center">
                Log in
              </button>
              <button type="button" onClick={account.createAccount} disabled={!account.configured || !account.ready} className="btn-ghost justify-center">
                Create account
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-4">
              Secure account access powered by Privy
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default WalletGate;
