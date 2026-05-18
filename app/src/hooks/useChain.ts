import { useContext } from 'react';
import { ChainContext, type ChainContextValue } from '@/components/ChainProvider';

export function useChain(): ChainContextValue {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error('useChain must be used within a ChainProvider');
  return ctx;
}
