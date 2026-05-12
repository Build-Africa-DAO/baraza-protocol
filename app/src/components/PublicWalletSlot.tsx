import { lazy, Suspense, useEffect, useState } from 'react';

const WalletProviders = lazy(() => import('@/components/WalletProviders'));
const WalletHeaderContent = lazy(() => import('@/components/WalletHeaderContent'));

function WalletSlotFallback({
  onConnect,
  disabled = false,
}: {
  onConnect?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={disabled}
      className="btn-primary px-4 py-2 text-sm disabled:cursor-wait disabled:opacity-70"
    >
      Connect Wallet
    </button>
  );
}

export default function PublicWalletSlot() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [openOnReady, setOpenOnReady] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem('walletName')) {
      setShouldLoad(true);
    }
  }, []);

  const handleConnect = () => {
    setOpenOnReady(true);
    setShouldLoad(true);
  };

  if (!shouldLoad) {
    return <WalletSlotFallback onConnect={handleConnect} />;
  }

  return (
    <Suspense fallback={<WalletSlotFallback disabled />}>
      <WalletProviders>
        <WalletHeaderContent
          openOnReady={openOnReady}
          onPromptHandled={() => setOpenOnReady(false)}
        />
      </WalletProviders>
    </Suspense>
  );
}
