import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { Copy, LogOut, RefreshCw, ChevronDown, AlertTriangle, ExternalLink } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EXPECTED_GENESIS, NETWORK_LABEL } from '@/lib/network';
import { useChain } from '@/hooks/useChain';
import { useEvmChain } from '@/hooks/useEvmChain';
import type { Chain } from '@/lib/chain';

interface FreighterApi {
  isConnected?: () => Promise<boolean> | boolean;
  getPublicKey?: () => Promise<string> | string;
  requestAccess?: () => Promise<string> | string;
}

declare global {
  interface Window {
    freighterApi?: FreighterApi;
    freighter?: FreighterApi;
  }
}

const EVM_CHAINS = new Set<Chain>(['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'celo', 'bnb']);

/** Branded Solana account button + dropdown with disconnect / copy / change account */
const WalletStatus: React.FC = () => {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const { chain, chainMeta } = useChain();
  const {
    evmAddress,
    isConnecting: isConnectingEvm,
    evmError,
    connectEvm,
    disconnectEvm,
    switchEvmChain,
  } = useEvmChain();
  const [open, setOpen] = useState(false);
  const [networkState, setNetworkState] = useState<'unknown' | 'right' | 'wrong'>('unknown');
  const [stellarAddress, setStellarAddress] = useState<string | null>(null);
  const [isConnectingStellar, setIsConnectingStellar] = useState(false);
  const [stellarError, setStellarError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Detect wrong chain by comparing genesis hash. On RPC failure we deliberately
  // stay 'unknown' instead of asserting 'right' — silently treating an unreachable
  // RPC as the correct network is how users end up signing on the wrong chain.
  useEffect(() => {
    if (chain !== 'solana' || !connected) { setNetworkState('unknown'); return; }
    let cancelled = false;
    connection.getGenesisHash().then((hash) => {
      if (cancelled) return;
      setNetworkState(hash === EXPECTED_GENESIS ? 'right' : 'wrong');
    }).catch(() => {
      if (cancelled) return;
      setNetworkState('unknown');
    });
    return () => { cancelled = true; };
  }, [chain, connected, connection]);

  useEffect(() => {
    if (chain !== 'stellar') return;
    const freighter = window.freighterApi ?? window.freighter;
    if (!freighter?.getPublicKey) return;
    let cancelled = false;
    Promise.resolve(freighter.getPublicKey())
      .then((address) => {
        if (!cancelled && address) setStellarAddress(address);
      })
      .catch(() => {
        // Freighter may reject this until the member approves access.
      });
    return () => { cancelled = true; };
  }, [chain]);

  useEffect(() => {
    if (!EVM_CHAINS.has(chain)) return;
    void switchEvmChain(chain);
  }, [chain, switchEvmChain]);

  const wrongChain = chain === 'solana' && networkState === 'wrong';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    const address = chain === 'solana'
      ? publicKey?.toBase58()
      : chain === 'stellar'
        ? stellarAddress
        : evmAddress;
    if (!address) return;
    void navigator.clipboard.writeText(address);
    toast({ title: 'Address copied!' });
    setOpen(false);
  };

  const handleDisconnect = () => {
    if (chain === 'solana') {
      void disconnect();
    } else if (chain === 'stellar') {
      setStellarAddress(null);
      setStellarError(null);
    } else {
      disconnectEvm();
    }
    setOpen(false);
  };

  const handleConnectStellar = async () => {
    const freighter = window.freighterApi ?? window.freighter;
    if (!freighter) {
      setStellarError('Freighter not detected. Install Freighter or use a Stellar-compatible account app.');
      return;
    }
    setIsConnectingStellar(true);
    setStellarError(null);
    try {
      const address = freighter.requestAccess
        ? await Promise.resolve(freighter.requestAccess())
        : await Promise.resolve(freighter.getPublicKey?.());
      if (!address) {
        setStellarError('Stellar account connection failed. Unlock Freighter and try again.');
        return;
      }
      setStellarAddress(address);
    } catch (err) {
      setStellarError(err instanceof Error ? err.message : 'Stellar account connection was rejected.');
    } finally {
      setIsConnectingStellar(false);
    }
  };

  const handleConnect = () => {
    if (chain === 'solana') {
      setVisible(true);
      return;
    }
    if (chain === 'stellar') {
      void handleConnectStellar();
      return;
    }
    void connectEvm().then(() => switchEvmChain(chain));
  };

  const isConnectingSelected = chain === 'solana'
    ? connecting
    : chain === 'stellar'
      ? isConnectingStellar
      : isConnectingEvm;

  const selectedAddress = chain === 'solana'
    ? publicKey?.toBase58() ?? null
    : chain === 'stellar'
      ? stellarAddress
      : evmAddress;

  if (isConnectingSelected) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm font-semibold opacity-70 cursor-not-allowed"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!selectedAddress) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className="rounded-md bg-secondary px-6 py-2.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          {chainMeta.accountCta}
        </button>
        <p className="mt-1 hidden text-[10px] font-semibold text-muted-foreground lg:block">
          Suggested: {chainMeta.suggestedWallet}
        </p>
        {(stellarError || evmError) && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-destructive/30 bg-card p-3 text-xs leading-5 text-destructive shadow-[var(--shadow-deep)]">
            {stellarError ?? evmError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {wrongChain && (
        <div className="absolute -top-8 right-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-[11px] font-medium">
          <AlertTriangle className="w-3 h-3" />
          Wrong Solana setup - switch to {NETWORK_LABEL}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-all ${
          wrongChain
            ? 'bg-destructive/10 border-destructive/40 text-destructive'
            : 'bg-surface border-border hover:border-primary/50 text-foreground'
        }`}
      >
        {chain === 'solana' && wallet?.adapter.icon && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-4 h-4 rounded-sm"
          />
        )}
        {chain !== 'solana' && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: chainMeta.badgeBg }}
          />
        )}
        {truncateAddress(selectedAddress)}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 baraza-card py-1 z-50 animate-fade-in">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            Copy address
          </button>
          <button
            onClick={() => {
              if (chain === 'solana') setVisible(true);
              else handleConnect();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
          >
            {chain === 'stellar' ? <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /> : <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />}
            Change {chainMeta.label} account
          </button>
          <div className="border-t border-border/50 my-1" />
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletStatus;
