import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import BackendStatus from '@/components/BackendStatus';
import AppShell from '@/components/app/AppShell';
import WalletGate from '@/components/auth/WalletGate';
import { useAccount } from '@/contexts/AccountContext';

interface LayoutProps {
  children: React.ReactNode;
  gate?: boolean | { title?: string; description?: string };
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        className="flex-1 pb-24 pt-16 md:pb-0"
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <BackendStatus />
    </div>
  );
}

const Layout: React.FC<LayoutProps> = ({ children, gate }) => {
  const account = useAccount();
  const gated = Boolean(gate);
  const gateCopy = typeof gate === 'object' ? gate : undefined;
  const body = gated ? (
    <WalletGate title={gateCopy?.title} description={gateCopy?.description}>
      {children}
    </WalletGate>
  ) : children;

  if (account.authenticated) {
    return <AppShell>{body}</AppShell>;
  }

  return <PublicShell>{body}</PublicShell>;
};

export default Layout;
