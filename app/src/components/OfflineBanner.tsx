import { Wifi, WifiOff } from 'lucide-react';
import { useOptionalOffline } from '@/contexts/OfflineContext';
import { toTitleCase } from '@/lib/utils';

/**
 * Two states, one strip. Offline: you can read what is cached, you cannot pay
 * or vote. Back online: a brief green line while the screens refresh.
 */
export default function OfflineBanner() {
  const offline = useOptionalOffline();
  if (!offline) return null;
  const { isOnline, justReconnected, queueSize } = offline;

  if (isOnline && justReconnected) {
    return (
      <div role="status" className="bg-confirmed px-4 py-2 text-center text-sm text-white" data-testid="online-banner">
        <span className="inline-flex items-center justify-center gap-2 font-semibold">
          <Wifi className="h-4 w-4 shrink-0" aria-hidden />
          {toTitleCase('Back online')}
        </span>
        <span className="opacity-90"> Refreshing the latest updates.</span>
      </div>
    );
  }
  if (isOnline) return null;

  const queued = queueSize > 0 ? ` ${queueSize} queued ${queueSize === 1 ? 'action waits' : 'actions wait'} to send.` : '';
  return (
    <div role="status" className="bg-foreground px-4 py-2 text-center text-sm text-background" data-testid="offline-banner">
      <span className="inline-flex items-center justify-center gap-2 font-semibold">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        {toTitleCase("You're Offline")}
      </span>
      <span className="opacity-80"> You can read what was loaded. You cannot pay or vote until the connection returns.{queued}</span>
    </div>
  );
}
