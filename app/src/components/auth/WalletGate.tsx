import React from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/AccountContext';
import { toTitleCase } from '@/lib/utils';

interface WalletGateProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

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
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="baraza-card w-full max-w-sm p-6">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
          <LogIn className="h-5 w-5 text-primary" />
        </div>
        <h2 className="mb-2 font-display text-xl font-bold">{toTitleCase(title)}</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => account.login()} disabled={!account.configured}>
            Sign In
          </Button>
          <Button type="button" variant="outline" onClick={() => account.createAccount()} disabled={!account.configured}>
            Create Account
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Phone or email is enough. You do not need a crypto wallet.
        </p>
      </div>
    </div>
  );
};

export default WalletGate;
