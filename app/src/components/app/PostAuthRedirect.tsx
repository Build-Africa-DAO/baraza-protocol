import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { useMyMemberships } from '@/hooks/useMyMemberships';
import { resolvePostAuthPath } from '@/lib/postAuth';

export default function PostAuthRedirect() {
  const account = useAccount();
  const { active, isLoading } = useMyMemberships();
  const location = useLocation();
  const navigate = useNavigate();
  const wasAuthenticated = useRef(account.authenticated);
  const pendingLogin = useRef(false);

  useEffect(() => {
    if (!account.ready) return;

    if (!wasAuthenticated.current && account.authenticated) {
      pendingLogin.current = true;
    }
    wasAuthenticated.current = account.authenticated;

    if (!account.authenticated) {
      pendingLogin.current = false;
      return;
    }

    if (isLoading) return;

    const memberships = active.map((item) => item.record);

    if (pendingLogin.current) {
      pendingLogin.current = false;
      const handoff = account.consumeAuthHandoff();
      const dest = resolvePostAuthPath({
        entryPath: handoff.entryPath || `${location.pathname}${location.search}`,
        returnTo: handoff.returnTo,
        memberships,
      });
      const current = `${location.pathname}${location.search}`;
      if (dest !== current) navigate(dest, { replace: true });
      return;
    }

    if (location.pathname === '/') {
      const dest = resolvePostAuthPath({ entryPath: '/', memberships });
      if (dest !== '/') navigate(dest, { replace: true });
    }
  }, [
    account.authenticated,
    account.ready,
    account.consumeAuthHandoff,
    active,
    isLoading,
    location.pathname,
    location.search,
    navigate,
  ]);

  return null;
}
