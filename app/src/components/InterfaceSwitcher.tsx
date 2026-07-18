import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterfaceSwitcherProps {
  returnTo?: string;
  compact?: boolean;
}

function safePath(value: string | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/akili') ? value : '/communities';
}

export default function InterfaceSwitcher({ returnTo, compact = false }: InterfaceSwitcherProps) {
  const location = useLocation();
  const isChat = location.pathname === '/akili';
  const platformPath = safePath(returnTo);
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const chatPath = `/akili?from=${encodeURIComponent(isChat ? platformPath : currentPath)}`;
  const itemClass = compact ? 'h-8 gap-1.5 px-2.5 text-xs' : 'h-9 gap-2 px-3 text-sm';

  return (
    <div className="inline-flex rounded-lg border border-border/70 bg-surface/80 p-1" aria-label="Choose interface">
      <Link to={platformPath} onClick={() => window.localStorage.setItem('baraza.interface.last', 'platform')} aria-current={!isChat ? 'page' : undefined} className={cn('inline-flex items-center rounded-md font-semibold transition-colors', itemClass, !isChat ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
        <LayoutGrid className="h-4 w-4" /> Platform
      </Link>
      <Link to={chatPath} onClick={() => window.localStorage.setItem('baraza.interface.last', 'chat')} aria-current={isChat ? 'page' : undefined} className={cn('inline-flex items-center rounded-md font-semibold transition-colors', itemClass, isChat ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
        <MessageCircle className="h-4 w-4" /> Ask Akili
      </Link>
    </div>
  );
}
