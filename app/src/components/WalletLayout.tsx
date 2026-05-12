import React from 'react';
import Layout from '@/components/Layout';
import WalletStatus from '@/components/WalletStatus';

interface WalletLayoutProps {
  children: React.ReactNode;
}

export default function WalletLayout({ children }: WalletLayoutProps) {
  return <Layout walletSlot={<WalletStatus />}>{children}</Layout>;
}
