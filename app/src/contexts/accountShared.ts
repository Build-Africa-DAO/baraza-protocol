import React, { createContext, useCallback, useRef, useState } from 'react';
import type { AuthIntent } from '@/components/auth/AuthModalView';
import type { AccountCountry, AccountCountryCode } from '@/lib/accountLocale';
import { currentLocationPath, isSafeReturnTo, isStayPath } from '@/lib/postAuth';

/**
 * Shared shape of the account context, whichever sign-in provider is mounted.
 * Lives apart from the providers so the Privy bundle can load lazily.
 */
export interface AuthHandoff {
  entryPath: string;
  returnTo: string | null;
}

export interface AccountContextValue {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  accountId: string | null;
  displayName: string;
  country: AccountCountry;
  setCountry: (country: AccountCountryCode) => void;
  login: (returnTo?: string) => void;
  createAccount: (returnTo?: string) => void;
  consumeAuthHandoff: () => AuthHandoff;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

export const EMPTY_HANDOFF: AuthHandoff = { entryPath: '/', returnTo: null };

export const AccountContext = createContext<AccountContextValue | null>(null);

export interface AccountBridgeProps {
  country: AccountCountry;
  setCountry: (country: AccountCountryCode) => void;
  children: React.ReactNode;
}

export const SESSION_EXPIRED_NOTICE = 'Your session has expired. Sign in to continue what you were doing; nothing you typed is lost.';

/** Remembers where sign-in started so `PostAuthRedirect` can return there. */
const HANDOFF_STORAGE_KEY = 'baraza_auth_handoff';

function saveHandoffToStorage(handoff: AuthHandoff) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(handoff));
  } catch {}
}

function readHandoffFromStorage(): AuthHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearHandoffFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
  } catch {}
}

export function useAuthHandoff() {
  const [authIntent, setAuthIntent] = useState<AuthIntent | null>(null);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const handoffRef = useRef<AuthHandoff>(EMPTY_HANDOFF);
  const reauthRef = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  const closeAuth = useCallback(() => {
    setAuthIntent(null);
    setNotice(undefined);
    reauthRef.current?.reject();
    reauthRef.current = null;
  }, []);

  /** Called by the API client on a 401 mid-session. Opens sign-in in place; the request replays on success. */
  const promptReauth = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        reauthRef.current?.reject();
        reauthRef.current = { resolve, reject };
        const handoff = { entryPath: currentLocationPath(), returnTo: currentLocationPath() };
        handoffRef.current = handoff;
        saveHandoffToStorage(handoff);
        setNotice(SESSION_EXPIRED_NOTICE);
        setAuthIntent('signin');
      }),
    [],
  );

  const settleReauth = useCallback(() => {
    reauthRef.current?.resolve();
    reauthRef.current = null;
    setNotice(undefined);
  }, []);

  const captureHandoff = useCallback((returnTo?: string) => {
    const current = currentLocationPath();
    const requested = returnTo && isSafeReturnTo(returnTo) ? returnTo : null;
    const handoff: AuthHandoff = {
      entryPath: current,
      returnTo: requested ?? (isStayPath(current) ? current : null),
    };
    handoffRef.current = handoff;
    saveHandoffToStorage(handoff);
  }, []);

  const consumeAuthHandoff = useCallback(() => {
    const stored = readHandoffFromStorage();
    clearHandoffFromStorage();
    if (stored && stored.entryPath && stored.entryPath !== '/') {
      handoffRef.current = EMPTY_HANDOFF;
      return stored;
    }
    const current = handoffRef.current;
    handoffRef.current = EMPTY_HANDOFF;
    return current;
  }, []);

  return { authIntent, setAuthIntent, closeAuth, captureHandoff, consumeAuthHandoff, notice, promptReauth, settleReauth };
}

