import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import WalletStatus from '@/components/WalletStatus';

interface WalletHeaderContentProps {
  openOnReady?: boolean;
  onPromptHandled?: () => void;
}

export default function WalletHeaderContent({
  openOnReady = false,
  onPromptHandled,
}: WalletHeaderContentProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!openOnReady || connected) return;
    setVisible(true);
    onPromptHandled?.();
  }, [connected, onPromptHandled, openOnReady, setVisible]);

  return <WalletStatus />;
}
