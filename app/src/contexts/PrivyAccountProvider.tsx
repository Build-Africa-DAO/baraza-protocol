import '@/polyfill';
import { useCallback, useEffect, useMemo } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import AuthModal, { type AuthIntent } from '@/components/auth/AuthModal';
import { useTheme } from '@/hooks/useTheme';
import { isPrivyPhoneAuthEnabled } from '@/lib/wallet/mpc';
import { noteSessionState, registerAccessTokenProvider, registerAuthExpiredHandler } from '@/lib/auth/tokenProvider';
import { AccountContext, useAuthHandoff, type AccountBridgeProps, type AccountContextValue } from '@/contexts/accountShared';

/**
 * The Privy half of the account context. Loaded lazily by `AccountProvider`
 * so a visitor who never signs in does not download the Privy SDK and its
 * WalletConnect dependency (about 1 MB gzipped) to read a group page.
 */
function AccountBridge({ country, setCountry, children, initialIntent, initialReturnTo }: AccountBridgeProps & { initialIntent: AuthIntent | null; initialReturnTo?: string }) {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { authIntent, setAuthIntent, closeAuth, captureHandoff, consumeAuthHandoff, notice, promptReauth, settleReauth } = useAuthHandoff();

  // A tap on Sign In before this chunk loaded is carried in as `initialIntent`.
  useEffect(() => {
    if (initialIntent && ready && !authenticated) {
      captureHandoff(initialReturnTo);
      setAuthIntent(initialIntent);
    }
  }, [authenticated, captureHandoff, initialIntent, initialReturnTo, ready, setAuthIntent]);
  const displayName =
    user?.google?.name
    ?? user?.email?.address
    ?? user?.phone?.number
    ?? user?.google?.email
    ?? 'Baraza member';
  const accountId = user?.wallet?.address ?? user?.id ?? null;

  const readAccessToken = useCallback(async () => {
    if (!authenticated) return null;
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }, [authenticated, getAccessToken]);

  useEffect(() => {
    if (authenticated) {
      setAuthIntent(null);
      settleReauth();
    }
    noteSessionState(authenticated);
  }, [authenticated, setAuthIntent, settleReauth]);

  // The API client asks this provider for the bearer token on every call, and
  // for a sign-in prompt when a call comes back 401 mid-session.
  useEffect(() => {
    registerAccessTokenProvider(readAccessToken);
    registerAuthExpiredHandler(promptReauth);
    return () => {
      registerAccessTokenProvider(null);
      registerAuthExpiredHandler(null);
    };
  }, [promptReauth, readAccessToken]);

  const value = useMemo<AccountContextValue>(() => ({
    configured: true,
    ready,
    authenticated,
    accountId,
    displayName,
    country,
    setCountry,
    login: (returnTo?: string) => {
      captureHandoff(returnTo);
      setAuthIntent('signin');
    },
    createAccount: (returnTo?: string) => {
      captureHandoff(returnTo);
      setAuthIntent('signup');
    },
    consumeAuthHandoff,
    getAccessToken: readAccessToken,
    logout,
  }), [accountId, authenticated, captureHandoff, consumeAuthHandoff, country, displayName, logout, readAccessToken, ready, setCountry]);

  return (
    <AccountContext.Provider value={value}>
      {children}
      {authIntent && (
        <AuthModal
          intent={authIntent}
          countryCode={country.code}
          onIntentChange={setAuthIntent}
          onClose={closeAuth}
          notice={notice}
        />
      )}
    </AccountContext.Provider>
  );
}


export default function PrivyAccountProvider({ appId, country, setCountry, children, initialIntent, initialReturnTo }: AccountBridgeProps & { appId: string; initialIntent: AuthIntent | null; initialReturnTo?: string }) {
  const { theme } = useTheme();
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
      <AccountBridge country={country} setCountry={setCountry} initialIntent={initialIntent} initialReturnTo={initialReturnTo}>
        {children}
      </AccountBridge>
    </PrivyProvider>
  );
}

