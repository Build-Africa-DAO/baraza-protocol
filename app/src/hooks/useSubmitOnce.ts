import { useCallback, useRef, useState } from 'react';

/**
 * Submit-once for a component: `run` ignores a second call while the first is
 * in flight and exposes `pending` for the button state. Pair with the
 * `disabled` prop so a double tap on Approve Send, Pay or Vote sends one
 * request. The backend does not de-duplicate mutations yet.
 */
export function useSubmitOnce() {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, []);

  return { run, pending };
}
