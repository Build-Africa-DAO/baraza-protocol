import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BarazaAuthModal, type AuthIntent } from '@/components/auth/AuthModalView';
import { getBarazaSessionToken, getBarazaUser, logout as barazaLogout, onBarazaAuthChange, restoreSession, type BarazaUser } from '@/lib/auth/baraza';
import { getAuthProvider } from '@/lib/auth/provider';
import {
  getAccountCountry,
  readAccountCountry,
  writeAccountCountry,
  type AccountCountryCode,
} from '@/lib/accountLocale';
import { getPrivyAppId } from '@/lib/wallet/mpc';
import { noteSessionState, registerAccessTokenProvider, registerAuthExpiredHandler } from '@/lib/auth/tokenProvider';
import { AccountContext, EMPTY_HANDOFF, useAuthHandoff, type AccountBridgeProps, type AccountContextValue, type AuthHandoff } from '@/contexts/accountShared';

export type { AccountContextValue, AuthHandoff };

const PrivyAccountProvider = lazy(() => import('@/contexts/PrivyAccountProvider'));

/**
 * Whether this browser probably holds a Privy session. Privy keeps its tokens
 * in localStorage under `privy:` keys; when none exist the person is a visitor
 * and the SDK can wait until they tap Sign In.
 */
export function hasPrivySessionHint(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i) ?? '';
      if (key.startsWith('privy:') && (key.includes('token') || key.includes('session'))) return true;
    }
  } catch {
    // Storage blocked: treat as a visitor.
  }
  return false;
}

/**
 * Account context on Baraza's own sign-in. Same contract as the Privy bridge:
 * `accountId` is the profile id, the token is the `brz_sess_` bearer held in
 * memory, and the modal is the same view with the Baraza actions.
 */
function BarazaAccountProvider({ country, setCountry, children }: AccountBridgeProps) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<BarazaUser | null>(() => getBarazaUser());
  const { authIntent, setAuthIntent, closeAuth, captureHandoff, consumeAuthHandoff, notice, promptReauth, settleReauth } = useAuthHandoff();

  useEffect(() => {
    let cancelled = false;
    void restoreSession().finally(() => {
      if (!cancelled) setReady(true);
    });
    const unsubscribe = onBarazaAuthChange(() => setUser(getBarazaUser()));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const authenticated = Boolean(user);
  useEffect(() => {
    if (authenticated) {
      setAuthIntent(null);
      settleReauth();
    }
    noteSessionState(authenticated);
  }, [authenticated, setAuthIntent, settleReauth]);

  const getAccessToken = useCallback(async () => getBarazaSessionToken(), []);
  useEffect(() => {
    registerAccessTokenProvider(getAccessToken);
    registerAuthExpiredHandler(promptReauth);
    return () => {
      registerAccessTokenProvider(null);
      registerAuthExpiredHandler(null);
    };
  }, [getAccessToken, promptReauth]);

  const value = useMemo<AccountContextValue>(() => ({
    configured: true,
    ready,
    authenticated,
    accountId: user?.id ?? null,
    displayName: user?.displayName ?? 'Baraza member',
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
    getAccessToken,
    logout: barazaLogout,
  }), [authenticated, captureHandoff, consumeAuthHandoff, country, getAccessToken, ready, setAuthIntent, setCountry, user]);

  return (
    <AccountContext.Provider value={value}>
      {children}
      {authIntent && (
        <BarazaAuthModal
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

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const provider = getAuthProvider();
  const appId = getPrivyAppId();
  const [countryCode, setCountryCode] = useState<AccountCountryCode>(() => readAccountCountry());
  const country = getAccountCountry(countryCode);
  const setCountry = useCallback((nextCountry: AccountCountryCode) => {
    writeAccountCountry(nextCountry);
    setCountryCode(nextCountry);
  }, []);

  // Privy mounts at once when a session is likely, otherwise on the first
  // Sign In / Create Account tap. Until then visitors get a light context.
  const [mountPrivy, setMountPrivy] = useState<boolean>(() => provider === 'privy' && Boolean(appId) && hasPrivySessionHint());
  const [initialIntent, setInitialIntent] = useState<AuthIntent | null>(null);
  const [initialReturnTo, setInitialReturnTo] = useState<string | undefined>(undefined);
  const requestPrivy = useCallback((intent: AuthIntent, returnTo?: string) => {
    setInitialIntent(intent);
    setInitialReturnTo(returnTo);
    setMountPrivy(true);
  }, []);

  const fallbackValue = useMemo<AccountContextValue>(() => ({
    configured: false,
    ready: true,
    authenticated: false,
    accountId: null,
    displayName: 'Baraza member',
    country,
    setCountry,
    login: () => undefined,
    createAccount: () => undefined,
    consumeAuthHandoff: () => EMPTY_HANDOFF,
    getAccessToken: async () => null,
    logout: async () => undefined,
  }), [country, setCountry]);

  /** Visitor context while Privy is not loaded: configured, signed out, and a tap loads the SDK. */
  const visitorValue = useMemo<AccountContextValue>(() => ({
    ...fallbackValue,
    configured: true,
    login: (returnTo?: string) => requestPrivy('signin', returnTo),
    createAccount: (returnTo?: string) => requestPrivy('signup', returnTo),
  }), [fallbackValue, requestPrivy]);

  /** While the Privy chunk downloads after a tap: same as visitor but not ready, so gates show a spinner rather than a second Sign In. */
  const loadingValue = useMemo<AccountContextValue>(() => ({ ...visitorValue, ready: false }), [visitorValue]);

  if (provider === 'baraza') {
    return (
      <BarazaAccountProvider country={country} setCountry={setCountry}>
        {children}
      </BarazaAccountProvider>
    );
  }

  if (!appId) {
    return (
      <AccountContext.Provider value={fallbackValue}>
        {children}
      </AccountContext.Provider>
    );
  }

  if (!mountPrivy) {
    return (
      <AccountContext.Provider value={visitorValue}>
        {children}
      </AccountContext.Provider>
    );
  }

  return (
    <Suspense fallback={<AccountContext.Provider value={loadingValue}>{children}</AccountContext.Provider>}>
      <PrivyAccountProvider appId={appId} country={country} setCountry={setCountry} initialIntent={initialIntent} initialReturnTo={initialReturnTo}>
        {children}
      </PrivyAccountProvider>
    </Suspense>
  );
}

/**
 * Same as `useAccount` but tolerates rendering outside `AccountProvider`.
 * Only for surfaces that must survive a broken tree, like the error boundary
 * and the status screens it renders.
 */
export function useOptionalAccount(): AccountContextValue | null {
  return useContext(AccountContext);
}

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider');
  return value;
}
