import React, { useCallback, useMemo } from 'react';
import { type Adapter, WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  AlphaWalletAdapter,
  AvanaWalletAdapter,
  BitgetWalletAdapter,
  BitpieWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  CoinhubWalletAdapter,
  FractalWalletAdapter,
  HuobiWalletAdapter,
  HyperPayWalletAdapter,
  KeystoneWalletAdapter,
  KrystalWalletAdapter,
  LedgerWalletAdapter,
  MathWalletAdapter,
  NekoWalletAdapter,
  NightlyWalletAdapter,
  NufiWalletAdapter,
  OntoWalletAdapter,
  ParticleAdapter,
  PhantomWalletAdapter,
  SafePalWalletAdapter,
  SaifuWalletAdapter,
  SalmonWalletAdapter,
  SkyWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  SpotWalletAdapter,
  TokenaryWalletAdapter,
  TokenPocketWalletAdapter,
  TorusWalletAdapter,
  TrezorWalletAdapter,
  TrustWalletAdapter,
  WalletConnectWalletAdapter,
  XDEFIWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { WALLET_ADAPTER_NETWORK } from '@/lib/network';
import BarazaWalletModalProvider from '@/components/BarazaWalletModalProvider';

const RPC_ENDPOINTS = [
  ...new Set(
    [
      import.meta.env.VITE_RPC_ENDPOINT,
      clusterApiUrl(WALLET_ADAPTER_NETWORK),
    ].filter(Boolean) as string[]
  ),
];

interface WalletProvidersProps {
  children: React.ReactNode;
}

export default function WalletProviders({ children }: WalletProvidersProps) {
  const endpoint = useMemo(() => RPC_ENDPOINTS[0], []);
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;
  const wallets = useMemo(
    () => {
      const adapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new CoinbaseWalletAdapter(),
      ];

      const broadAdapters: Adapter[] = [
        new AlphaWalletAdapter(),
        new AvanaWalletAdapter(),
        new BitgetWalletAdapter(),
        new BitpieWalletAdapter(),
        new CloverWalletAdapter(),
        new Coin98WalletAdapter(),
        new CoinhubWalletAdapter(),
        new FractalWalletAdapter(),
        new HuobiWalletAdapter(),
        new HyperPayWalletAdapter(),
        new KeystoneWalletAdapter(),
        new KrystalWalletAdapter(),
        new LedgerWalletAdapter(),
        new MathWalletAdapter(),
        new NekoWalletAdapter(),
        new NightlyWalletAdapter(),
        new NufiWalletAdapter(),
        new OntoWalletAdapter(),
        new ParticleAdapter(),
        new SafePalWalletAdapter(),
        new SaifuWalletAdapter(),
        new SalmonWalletAdapter({ network: WALLET_ADAPTER_NETWORK }),
        new SkyWalletAdapter(),
        new SolongWalletAdapter(),
        new SpotWalletAdapter(),
        new TokenaryWalletAdapter(),
        new TokenPocketWalletAdapter(),
        new TorusWalletAdapter(),
        new TrezorWalletAdapter({
          appName: 'Baraza Protocol',
          email: 'support@baraza.protocol',
        }),
        new TrustWalletAdapter(),
        new XDEFIWalletAdapter(),
      ];

      if (walletConnectProjectId) {
        broadAdapters.push(
          new WalletConnectWalletAdapter({
            network: WALLET_ADAPTER_NETWORK as WalletAdapterNetwork.Mainnet | WalletAdapterNetwork.Devnet,
            options: {
              projectId: walletConnectProjectId,
              metadata: {
                name: 'Baraza Protocol',
                description: 'Community DAO treasury, voting, and membership.',
                url: window.location.origin,
                icons: [`${window.location.origin}/favicon.svg`],
              },
            },
          }),
        );
      }

      return [...adapters, ...broadAdapters];
    },
    [walletConnectProjectId],
  );

  const onError = useCallback((error: Error) => console.error('[Wallet Error]', error.message), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <BarazaWalletModalProvider>{children}</BarazaWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
