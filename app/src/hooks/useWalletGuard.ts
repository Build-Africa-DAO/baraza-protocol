import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { getPhoneAuthSession } from '@/lib/phoneAuth';

interface WalletGuardOptions {
  /** Action name shown in toasts e.g. "vote", "join community" */
  action?: string;
}

interface WalletGuardResult {
  /** Wraps an async action with an identity check (Solana account, or phone/email session) */
  requireWallet: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  /** Whether an identity is ready — Solana publicKey OR phone/email session */
  isReady: boolean;
  /** Identity key — Solana base58 publicKey, or `phone:<number>` / `email:<address>` */
  address: string | null;
}

// Phone/email identity uses the same shape as USSD memberships (`phone:${phoneNumber}`)
// so the local datastore and Supabase rows line up across rails.
function phoneIdentityKey(): string | null {
  const session = getPhoneAuthSession();
  if (session.phone) return `phone:${session.phone}`;
  if (session.email) return `email:${session.email}`;
  return null;
}

/**
 * Provides a gated wrapper that requires a member identity before executing.
 * Accepts a connected Solana account OR a saved phone/email session. Opens the
 * Solana modal only when neither identity is available.
 */
export function useWalletGuard(options: WalletGuardOptions = {}): WalletGuardResult {
  const { connected, publicKey, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;
  const phoneIdentity = walletAddress ? null : phoneIdentityKey();
  const identity = walletAddress ?? phoneIdentity;

  const requireWallet = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (connecting) {
        toast({
          title: 'Connecting Baraza account...',
          description: 'Please wait while your Baraza account connects.',
        });
        return undefined;
      }

      if (!walletAddress && !phoneIdentity) {
        // No identity at all — open the account modal. The modal itself tells the
        // member what to do, so we skip a parallel toast that would just compete.
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
    [walletAddress, phoneIdentity, connecting, setVisible, toast, options.action]
  );

  return {
    requireWallet,
    isReady: identity !== null,
    address: identity,
  };
}
