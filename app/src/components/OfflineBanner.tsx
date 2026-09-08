import { WifiOff } from 'lucide-react';
import { useOptionalOffline } from '@/contexts/OfflineContext';
import { toTitleCase } from '@/lib/utils';

export default function OfflineBanner() {
  const offline = useOptionalOffline();
  if (!offline || offline.isOnline) return null;
  const { queueSize } = offline;

  const queued =
    queueSize > 0
      ? ` ${queueSize} queued ${queueSize === 1 ? 'action waits' : 'actions wait'} to send.`
      : '';

  return (
    <div
      role="status"
      className="border-b border-primary/25 bg-primary/10 px-4 py-2 text-center text-sm"
    >
      <span className="inline-flex items-center justify-center gap-2 font-semibold">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        {toTitleCase("You're Offline")}
      </span>
      <span className="text-muted-foreground">
        {' '}
        Baraza will catch up when the connection returns.
        {queued}
      </span>
    </div>
  );
}
