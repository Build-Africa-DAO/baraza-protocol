import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WalletStatus from '@/components/WalletStatus';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header walletSlot={<WalletStatus />} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
