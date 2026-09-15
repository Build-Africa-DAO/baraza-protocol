import { apiFetch } from '@/lib/api';

/**
 * Web Push, done properly: a service worker, a `PushSubscription` from the
 * browser, and the subscription posted to `POST /api/user/notifications/push-subscribe`
 * in the shape the backend validates (`{subscription: {endpoint, keys: {p256dh, auth}}}`).
 *
 * Needs the server's VAPID public key in `VITE_VAPID_PUBLIC_KEY`. Without it
 * the switch stays honest: browser permission can be granted, but no
 * subscription is created and nothing is posted.
 */

export const SERVICE_WORKER_PATH = '/sw.js';

export function getVapidPublicKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? '';
}

export function isWebPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Base64url VAPID key → the `Uint8Array` `pushManager.subscribe` wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalised);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export interface PushResult {
  ok: boolean;
  /** `unavailable` = browser or deployment cannot do push; `denied` = the person said no. */
  reason?: 'unavailable' | 'denied' | 'not_configured' | 'rejected' | 'network';
  message: string;
}

export async function subscribeWebPush(): Promise<PushResult> {
  if (!isWebPushSupported()) {
    return { ok: false, reason: 'unavailable', message: 'This browser does not support push notifications.' };
  }
  const vapid = getVapidPublicKey();
  if (!vapid) {
    return { ok: false, reason: 'not_configured', message: 'Push notifications are not set up on this deployment yet. Nothing was changed.' };
  }

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied', message: 'Notifications were not allowed in the browser.' };
  }

  let subscription: PushSubscription;
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
    await navigator.serviceWorker.ready;
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource }));
  } catch {
    return { ok: false, reason: 'unavailable', message: 'The browser could not create a push subscription.' };
  }

  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  if (!json.endpoint || !keys.p256dh || !keys.auth) {
    return { ok: false, reason: 'unavailable', message: 'The browser returned an incomplete push subscription.' };
  }

  const result = await apiFetch<{ ok?: boolean; subscriptionId?: string }>('/api/user/notifications/push-subscribe', {
    method: 'POST',
    body: { subscription: { endpoint: json.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }, userAgent: navigator.userAgent },
  });
  if (!result.ok) {
    return {
      ok: false,
      reason: result.error.kind === 'network' ? 'network' : 'rejected',
      message:
        result.error.kind === 'not_found' || result.error.kind === 'misconfigured'
          ? 'Push notifications are not available on this deployment yet.'
          : result.error.message,
    };
  }
  return { ok: true, message: 'Push notifications are on for votes, dues and sends.' };
}
