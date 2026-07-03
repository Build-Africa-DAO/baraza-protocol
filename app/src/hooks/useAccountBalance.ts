import { useCallback, useEffect, useState } from 'react';
import type { AccountCountry } from '@/lib/accountLocale';
import { fetchAccountBalanceEstimate } from '@/lib/accountBalance';

interface AccountBalanceState {
  formatted: string | null;
  loading: boolean;
  error: boolean;
}

export function useAccountBalance(accountAddress: string | null, country: AccountCountry) {
  const [state, setState] = useState<AccountBalanceState>({
    formatted: null,
    loading: false,
    error: false,
  });

  const refresh = useCallback(async () => {
    if (!accountAddress) {
      setState({ formatted: null, loading: false, error: false });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: false }));
    try {
      const balance = await fetchAccountBalanceEstimate(accountAddress, country);
      setState({ formatted: balance.formatted, loading: false, error: false });
    } catch {
      setState({ formatted: null, loading: false, error: true });
    }
  }, [accountAddress, country]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
