import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/**
 * Google Identity Services button. Google issues ID tokens only through its
 * own rendered button or One Tap, so this mounts their button (outline theme,
 * full width) and hands the credential to the caller. The script loads on
 * first use from accounts.google.com; the CSP in `public/_headers` allows it.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: 'popup' | 'redirect'; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded.')), { once: true });
  });
  return gisPromise;
}

export interface GoogleIdentityButtonProps {
  clientId: string;
  isSignUp: boolean;
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}

export function GoogleIdentityButton({ clientId, isSignUp, disabled, onCredential, onError }: GoogleIdentityButtonProps) {
  const host = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !host.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          auto_select: false,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
            else onError('Google did not return a sign-in. Try again.');
          },
        });
        host.current.innerHTML = '';
        window.google.accounts.id.renderButton(host.current, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: isSignUp ? 'signup_with' : 'continue_with',
          logo_alignment: 'left',
          width: Math.max(200, Math.min(400, host.current.clientWidth || 360)),
        });
        setState('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState('failed');
        onError(err instanceof Error ? err.message : 'Google sign-in could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, isSignUp, onCredential, onError, theme]);

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : undefined} aria-busy={state === 'loading'}>
      {state === 'loading' ? (
        <div className="flex h-11 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Loading Google…
        </div>
      ) : null}
      <div ref={host} className="flex justify-center" />
    </div>
  );
}
