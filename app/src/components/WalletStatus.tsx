import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { Copy, LogOut, RefreshCw, ChevronDown, AlertTriangle } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EXPECTED_GENESIS, NETWORK_LABEL } from '@/lib/network';

/** Branded wallet button + dropdown with disconnect / copy / change wallet */
const WalletStatus: React.FC = () => {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [networkState, setNetworkState] = useState<'unknown' | 'right' | 'wrong'>('unknown');
  const ref = useRef<HTMLDivElement>(null);

  // Detect wrong chain by comparing genesis hash. On RPC failure we deliberately
  // stay 'unknown' instead of asserting 'right' — silently treating an unreachable
  // RPC as the correct network is how users end up signing on the wrong chain.
  useEffect(() => {
    if (!connected) { setNetworkState('unknown'); return; }
    let cancelled = false;
    connection.getGenesisHash().then((hash) => {
      if (cancelled) return;
      setNetworkState(hash === EXPECTED_GENESIS ? 'right' : 'wrong');
    }).catch(() => {
      if (cancelled) return;
      setNetworkState('unknown');
    });
    return () => { cancelled = true; };
  }, [connected, connection]);

  const wrongChain = networkState === 'wrong';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    toast({ title: 'Address copied!' });
    setOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
  };

  if (connecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm font-semibold opacity-70 cursor-not-allowed"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Connecting…
      </button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="btn-primary text-sm px-4 py-2"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {wrongChain && (
        <div className="absolute -top-8 right-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-[11px] font-medium">
          <AlertTriangle className="w-3 h-3" />
          Wrong network — switch to {NETWORK_LABEL}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-semibold ${
          wrongChain
            ? 'bg-destructive/10 border-destructive/40 text-destructive'
            : 'bg-surface border-border hover:border-primary/50 text-foreground'
        }`}
      >
        {wallet?.adapter.icon && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="w-4 h-4 rounded-sm"
          />
        )}
        {truncateAddress(publicKey.toBase58())}
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
            onClick={() => { setVisible(true); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            Change wallet
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
