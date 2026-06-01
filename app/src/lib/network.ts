import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getPublicEnv } from '@/lib/env';

type NetworkName = 'mainnet' | 'devnet' | 'testnet';

const RAW = getPublicEnv().VITE_SOLANA_NETWORK.toLowerCase();

const NETWORK: NetworkName =
  RAW === 'mainnet' || RAW === 'mainnet-beta'
    ? 'mainnet'
    : RAW === 'testnet'
      ? 'testnet'
      : 'devnet';

const GENESIS_BY_NETWORK: Record<NetworkName, string> = {
  mainnet: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
  devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
  testnet: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY',
};

const LABEL_BY_NETWORK: Record<NetworkName, string> = {
  mainnet: 'Mainnet',
  devnet: 'Devnet',
  testnet: 'Testnet',
};

const ADAPTER_BY_NETWORK: Record<NetworkName, WalletAdapterNetwork> = {
  mainnet: WalletAdapterNetwork.Mainnet,
  devnet: WalletAdapterNetwork.Devnet,
  testnet: WalletAdapterNetwork.Testnet,
};

export const SOLANA_NETWORK = NETWORK;
export const EXPECTED_GENESIS = GENESIS_BY_NETWORK[NETWORK];
export const NETWORK_LABEL = LABEL_BY_NETWORK[NETWORK];
export const WALLET_ADAPTER_NETWORK = ADAPTER_BY_NETWORK[NETWORK];
