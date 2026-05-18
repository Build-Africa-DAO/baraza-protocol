import React, { createContext, useCallback, useMemo, useState } from 'react';
import { CHAINS, type Chain, type ChainMeta, readStoredChain, writeStoredChain } from '@/lib/chain';

export interface ChainContextValue {
  chain: Chain;
  chainMeta: ChainMeta;
  setChain: (chain: Chain) => void;
}

// Exported for the `useChain` hook in `@/hooks/useChain`. Kept here so the
// context + provider stay in one place; consumers import via the hook.
export const ChainContext = createContext<ChainContextValue | undefined>(undefined);

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
