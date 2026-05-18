import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CHAINS, type Chain, type ChainMeta, readStoredChain, writeStoredChain } from '@/lib/chain';

interface ChainContextValue {
  chain: Chain;
  chainMeta: ChainMeta;
  setChain: (chain: Chain) => void;
}

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export default function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chain, setChainState] = useState<Chain>(() => readStoredChain());

  const setChain = useCallback((next: Chain) => {
    writeStoredChain(next);
    setChainState(next);
  }, []);

  const value = useMemo(
    () => ({ chain, chainMeta: CHAINS[chain], setChain }),
    [chain, setChain],
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error('useChain must be used within a ChainProvider');
  return ctx;
}
