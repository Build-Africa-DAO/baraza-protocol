import React from 'react';
import { Loader2, LogIn, Shield, Users, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/AccountContext';

interface WalletGateProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

const perks = [
  { icon: Users, text: 'Create and manage your groups' },
  { icon: Vote, text: 'Propose and vote on decisions' },
  { icon: Shield, text: 'Phone or email is enough — no seed phrase' },
];

const WalletGate: React.FC<WalletGateProps> = ({
  children,
  title = 'Sign in to continue',
  description = 'Log in to your Baraza account to access this page.',
}) => {
  const account = useAccount();

  if (!account.ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your account
      </div>
    );
  }

  if (account.authenticated) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="baraza-card w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="p-8">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-center font-display text-2xl font-bold">{title}</h2>
          <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground">{description}</p>
          <ul className="mb-8 space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => account.login()} disabled={!account.configured}>
              Log in
            </Button>
            <Button type="button" onClick={() => account.createAccount()} disabled={!account.configured}>
              Sign up
            </Button>
          </div>
          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            No seed phrases. Phone, email, or Google is enough.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletGate;
