import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';

interface WalletGuardOptions {
  /** Action name shown in toasts e.g. "vote", "join community" */
  action?: string;
}

interface WalletGuardResult {
  /** Wraps an async action with Solana account connection check */
  requireWallet: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  /** Whether the Solana account is ready (connected + public key present) */
  isReady: boolean;
  /** The connected account's public key string */
  address: string | null;
}

/**
 * Provides a gated wrapper that requires Solana account connection before executing.
 * Automatically opens the account modal if not connected, shows helpful toasts.
 */
export function useWalletGuard(options: WalletGuardOptions = {}): WalletGuardResult {
  const { connected, publicKey, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  const requireWallet = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (connecting) {
        toast({
          title: 'Connecting Solana account...',
          description: 'Please wait while your Solana account connects.',
        });
        return undefined;
      }

      if (!connected || !publicKey) {
        // Opening the account modal already tells the member what to do.
        // a parallel toast just competes with it.
        setVisible(true);
        return undefined;
      }

      try {
        return await fn();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed.';

        // Match the rejection vocab across Phantom, Solflare, Backpack, Coinbase, etc.
        if (/user (rejected|denied|cancell?ed)|rejected by user|approval denied/i.test(message)) {
          toast({
            title: 'Approval cancelled',
            description: `Tap ${options.action ?? 'the action'} when you're ready to sign.`,
          });
          return undefined;
        }

        toast({
          title: 'Transaction failed',
          description: message,
          variant: 'destructive',
        });
        return undefined;
      }
    },
    [connected, connecting, publicKey, setVisible, toast, options.action]
  );

  return {
    requireWallet,
    isReady: connected && !!publicKey,
    address: publicKey?.toBase58() ?? null,
  };
}
