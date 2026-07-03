import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import {
  getAccountCountry,
  readAccountCountry,
  writeAccountCountry,
  type AccountCountry,
  type AccountCountryCode,
} from '@/lib/accountLocale';
import { getPrivyAppId, isPrivySmsEnabled } from '@/lib/wallet/mpc';
import {
  createMemberProfile,
  readMemberProfile,
  writeMemberProfile,
  type MemberProfile,
} from '@/lib/memberProfile';

interface AccountContextValue {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  accountId: string | null;
  walletAddress: string | null;
  walletReady: boolean;
  verifiedContact: string | null;
  displayName: string;
  profile: MemberProfile;
  updateProfile: (profile: MemberProfile) => void;
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
  smsEnabled: boolean;
  children: React.ReactNode;
}

function AccountBridge({ country, setCountry, smsEnabled, children }: AccountBridgeProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const verifiedContact = user?.email?.address ?? user?.phone?.number ?? null;
  const walletAddress = user?.wallet?.chainType === 'solana' ? user.wallet.address : null;
  const walletReady = ready;
  const accountId = walletAddress ?? user?.wallet?.address ?? user?.id ?? null;
  const profileId = user?.id ?? accountId;
  const [profile, setProfile] = useState<MemberProfile>(() => createMemberProfile(verifiedContact));

  useEffect(() => {
    setProfile(profileId
      ? readMemberProfile(profileId, verifiedContact)
      : createMemberProfile(verifiedContact));
  }, [profileId, verifiedContact]);

  const updateProfile = useCallback((nextProfile: MemberProfile) => {
    if (!profileId) return;
    setProfile(writeMemberProfile(profileId, nextProfile));
  }, [profileId]);

  const value = useMemo<AccountContextValue>(() => ({
    configured: true,
    ready,
    authenticated,
    accountId,
    walletAddress,
    walletReady,
    verifiedContact,
    displayName: profile.displayName,
    profile,
    updateProfile,
    country,
    setCountry,
    login: () => login({ loginMethods: smsEnabled ? ['email', 'sms'] : ['email'] }),
    createAccount: () => login({ loginMethods: smsEnabled ? ['email', 'sms'] : ['email'] }),
    logout,
  }), [accountId, authenticated, country, login, logout, profile, ready, setCountry, smsEnabled, updateProfile, verifiedContact, walletAddress, walletReady]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const appId = getPrivyAppId();
  const smsEnabled = isPrivySmsEnabled();
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
        walletAddress: null,
        walletReady: true,
        verifiedContact: null,
        displayName: 'Baraza member',
        profile: createMemberProfile(),
        updateProfile: () => undefined,
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

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: smsEnabled ? ['email', 'sms'] : ['email'],
        intl: { defaultCountry: country.code },
        appearance: {
          theme: 'dark',
          accentColor: '#f97316',
          landingHeader: 'Welcome to Baraza',
          loginMessage: smsEnabled
            ? 'Use your phone number or email to continue.'
            : 'Use your email to continue securely.',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'users-without-wallets' },
          showWalletUIs: false,
        },
      }}
    >
      <AccountBridge country={country} setCountry={setCountry} smsEnabled={smsEnabled}>
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
