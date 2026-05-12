import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PublicWalletSlot from '@/components/PublicWalletSlot';

interface LayoutProps {
  children: React.ReactNode;
  walletSlot?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, walletSlot }) => {
  const headerWalletSlot = walletSlot ?? <PublicWalletSlot />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header walletSlot={headerWalletSlot} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
