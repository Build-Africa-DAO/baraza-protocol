/**
 * Lightweight EVM account connection hook.
 *
 * Uses window.ethereum directly (MetaMask / Coinbase Wallet / Rabby / any
 * injected EIP-1193 provider) without requiring wagmi or viem.
 *
 * To add full signing support later:
 *   npm install wagmi viem @tanstack/react-query
 *   Replace this hook with wagmi's useAccount + useConnect pattern.
 */

import { useCallback, useEffect, useState } from 'react';
import { createBarazaEvmReadClient, type EvmCommunityInfo } from '@/lib/programs/evmClient';
import { CHAINS, type Chain } from '@/lib/chain';

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
}

type EthereumWindow = Window & { ethereum?: EthereumProvider };

function getEthereumProvider(): EthereumProvider | undefined {
  return typeof window === 'undefined' ? undefined : (window as EthereumWindow).ethereum;
}

export interface UseEvmChainResult {
  /** Connected EVM account address, or null if not connected. */
  evmAddress: string | null;
  /** EVM chain ID the account app is currently on, or null. */
  evmChainId: number | null;
  /** Whether window.ethereum is available in the browser. */
  isEvmAvailable: boolean;
  /** True while connecting. */
  isConnecting: boolean;
  /** Error message from the last connect/switch attempt. */
  evmError: string | null;
  /** Connect the injected EVM account app. */
  connectEvm: () => Promise<void>;
  /** Disconnect by clearing local state; injected account apps have no disconnect API. */
  disconnectEvm: () => void;
  /** Request the account app to switch to the selected Baraza rail. */
  switchEvmChain: (barazaChain: Chain) => Promise<void>;
  /** Community info for the active EVM rail, or null if not loaded. */
  evmCommunityInfo: EvmCommunityInfo | null;
  /** True while fetching community info. */
  isLoadingEvmInfo: boolean;
}

export function useEvmChain(): UseEvmChainResult {
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [evmChainId, setEvmChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [evmError, setEvmError] = useState<string | null>(null);
  const [evmCommunityInfo, setEvmCommunityInfo] = useState<EvmCommunityInfo | null>(null);
  const [isLoadingEvmInfo, setIsLoadingEvmInfo] = useState(false);

  const isEvmAvailable = !!getEthereumProvider();

  useEffect(() => {
    if (!isEvmAvailable) return;

    const eth = getEthereumProvider()!;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      setEvmAddress(list.length > 0 ? list[0] : null);
    };

    const handleChainChanged = (chainId: unknown) => {
      setEvmChainId(parseInt(chainId as string, 16));
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    eth
      .request({ method: 'eth_accounts' })
      .then((accounts: unknown) => {
        const list = accounts as string[];
        if (list.length > 0) setEvmAddress(list[0]);
      })
      .catch(() => {
        // Non-prompting account lookup can fail in locked account apps.
      });

    eth
      .request({ method: 'eth_chainId' })
      .then((id: unknown) => setEvmChainId(parseInt(id as string, 16)))
      .catch(() => {
        // Rail lookup can fail before the account app is approved.
      });

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [isEvmAvailable]);

  useEffect(() => {
    if (!evmChainId) return;
    setIsLoadingEvmInfo(true);
    const client = createBarazaEvmReadClient(evmChainId);
    client
      .fetchCommunityInfo()
      .then(setEvmCommunityInfo)
      .catch(() => setEvmCommunityInfo(null))
      .finally(() => setIsLoadingEvmInfo(false));
  }, [evmChainId]);

  const connectEvm = useCallback(async () => {
    if (!isEvmAvailable) {
      setEvmError('No EVM account app detected. Install MetaMask, Coinbase Wallet, or Rabby.');
      return;
    }
    setIsConnecting(true);
    setEvmError(null);
    try {
      const accounts = (await getEthereumProvider()!.request({
        method: 'eth_requestAccounts',
      })) as string[];
      setEvmAddress(accounts[0] ?? null);
      const chainId = (await getEthereumProvider()!.request({ method: 'eth_chainId' })) as string;
      setEvmChainId(parseInt(chainId, 16));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection rejected';
      setEvmError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [isEvmAvailable]);

  const disconnectEvm = useCallback(() => {
    setEvmAddress(null);
    setEvmChainId(null);
    setEvmCommunityInfo(null);
    setEvmError(null);
  }, []);

  const switchEvmChain = useCallback(
    async (barazaChain: Chain) => {
      if (!isEvmAvailable) return;
      const meta = CHAINS[barazaChain];
      const targetId = meta.testnet.chainId;
      if (!targetId) return;
      const hexId = `0x${targetId.toString(16)}`;
      setEvmError(null);
      try {
        await getEthereumProvider()!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexId }],
        });
      } catch (err: unknown) {
        const code = (err as { code?: number })?.code;
        if (code === 4902) {
          try {
            await getEthereumProvider()!.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: hexId,
                chainName: meta.testnet.label,
                nativeCurrency: {
                  name: meta.testnet.nativeSymbol,
                  symbol: meta.testnet.nativeSymbol,
                  decimals: 18,
                },
                blockExplorerUrls: [meta.testnet.explorerUrl],
              }],
            });
          } catch {
            setEvmError(`${meta.testnet.label} could not be added. Add it in ${meta.suggestedWallet} and try again.`);
          }
        } else {
          setEvmError(err instanceof Error ? err.message : `${meta.testnet.label} switch was rejected.`);
        }
      }
    },
    [isEvmAvailable],
  );

  return {
    evmAddress,
    evmChainId,
    isEvmAvailable,
    isConnecting,
    evmError,
    connectEvm,
    disconnectEvm,
    switchEvmChain,
    evmCommunityInfo,
    isLoadingEvmInfo,
  };
}
