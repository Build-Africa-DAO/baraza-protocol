import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import AuthModal, { type AuthIntent } from '@/components/auth/AuthModal';
import { useTheme } from '@/hooks/useTheme';
import {
  getAccountCountry,
  readAccountCountry,
  writeAccountCountry,
  type AccountCountry,
  type AccountCountryCode,
} from '@/lib/accountLocale';
import { getPrivyAppId, isPrivyPhoneAuthEnabled } from '@/lib/wallet/mpc';

interface AccountContextValue {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  accountId: string | null;
  displayName: string;
  country: AccountCountry;
  setCountry: (country: AccountCountryCode) => void;
  login: () => void;
  createAccount: () => void;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

interface AccountBridgeProps {
  country: AccountCountry;
  setCountry: (country: AccountCountryCode) => void;
  children: React.ReactNode;
}

function AccountBridge({ country, setCountry, children }: AccountBridgeProps) {
  const { ready, authenticated, user, logout } = usePrivy();
  const [authIntent, setAuthIntent] = useState<AuthIntent | null>(null);
  const displayName =
    user?.google?.name
    ?? user?.email?.address
    ?? user?.phone?.number
    ?? user?.google?.email
    ?? 'Baraza member';
  const accountId = user?.wallet?.address ?? user?.id ?? null;
  const closeAuth = useCallback(() => setAuthIntent(null), []);

  useEffect(() => {
    if (authenticated) setAuthIntent(null);
  }, [authenticated]);

  const value = useMemo<AccountContextValue>(() => ({
    configured: true,
    ready,
    authenticated,
    accountId,
    displayName,
    country,
    setCountry,
    login: () => setAuthIntent('signin'),
    createAccount: () => setAuthIntent('signup'),
    logout,
  }), [accountId, authenticated, country, displayName, logout, ready, setCountry]);

  return (
    <AccountContext.Provider value={value}>
      {children}
      {authIntent && (
        <AuthModal
          intent={authIntent}
          countryCode={country.code}
          onIntentChange={setAuthIntent}
          onClose={closeAuth}
        />
      )}
    </AccountContext.Provider>
  );
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const appId = getPrivyAppId();
  const { theme } = useTheme();
  const [countryCode, setCountryCode] = useState<AccountCountryCode>(() => readAccountCountry());
  const country = getAccountCountry(countryCode);
  const setCountry = useCallback((nextCountry: AccountCountryCode) => {
    writeAccountCountry(nextCountry);
    setCountryCode(nextCountry);
  }, []);

  if (!appId) {
    return (
      <AccountContext.Provider value={{
        configured: false,
        ready: true,
        authenticated: false,
        accountId: null,
        displayName: 'Baraza member',
        country,
        setCountry,
        login: () => undefined,
        createAccount: () => undefined,
        logout: async () => undefined,
      }}>
        {children}
      </AccountContext.Provider>
    );
  }

  const phoneAuthEnabled = isPrivyPhoneAuthEnabled();

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: phoneAuthEnabled ? ['email', 'sms', 'google'] : ['email', 'google'],
        intl: { defaultCountry: country.code },
        appearance: {
          theme: theme === 'dark' ? 'dark' : 'light',
          accentColor: '#f97316',
          logo: '',
          landingHeader: 'Welcome to Baraza',
          loginMessage: phoneAuthEnabled
            ? 'Use your phone number or email to continue.'
            : 'Use your email to continue.',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'users-without-wallets' },
          showWalletUIs: false,
        },
      }}
    >
      <AccountBridge country={country} setCountry={setCountry}>
        {children}
      </AccountBridge>
    </PrivyProvider>
  );
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider');
  return value;
}
