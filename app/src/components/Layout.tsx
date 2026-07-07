import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import BackendStatus from '@/components/BackendStatus';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isJoinFlow = location.pathname.startsWith('/join/');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        className={isJoinFlow ? 'flex-1 pt-14 md:pb-0' : 'flex-1 pt-14 pb-24 md:pb-0'}
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
      {!isJoinFlow && <MobileBottomNav />}
      <BackendStatus />
    </div>
  );
};

export default Layout;
