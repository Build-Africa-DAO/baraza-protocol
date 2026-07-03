import { createContext } from 'react';
import type { Chain, ChainMeta } from '@/lib/chain';

export interface ChainContextValue {
  chain: Chain;
  chainMeta: ChainMeta;
  setChain: (chain: Chain) => void;
}

export const ChainContext = createContext<ChainContextValue | undefined>(undefined);
