import React, { useCallback, useMemo, useState } from 'react';
import { CHAINS, type Chain, readStoredChain, writeStoredChain } from '@/lib/chain';
import { ChainContext } from '@/contexts/chain-context';

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
