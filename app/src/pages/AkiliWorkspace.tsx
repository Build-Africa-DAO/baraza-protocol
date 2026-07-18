import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ExternalLink, Menu, Plus, Send, Sparkles, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import InterfaceSwitcher from '@/components/InterfaceSwitcher';
import { COMMUNITY_QUESTIONS, type AkiliWorkspaceMessage } from '@/lib/akiliConversations';
import type { AkiliResourceRef } from '@/lib/akiliCapabilities';
import { useAkiliWorkspace } from '@/hooks/useAkiliWorkspace';
import { useMembershipAccess } from '@/hooks/useMembershipAccess';
import { useSeo } from '@/lib/seo';

const destinations = [
  { label: 'Communities', href: '/communities' },
  { label: 'Community work', href: '/bounties' },
  { label: 'Start a community', href: '/create' },
];

function safeReturnPath(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/akili') ? value : '/communities';
}

export default function AkiliWorkspace() {
  useSeo({
    title: 'Ask Akili',
    description: 'Find communities, understand open decisions, and navigate to the right next step.',
    path: '/akili',
  });
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('from'));
  const workspace = useAkiliWorkspace();
  const { communityIds } = useMembershipAccess();
  const [input, setInput] = useState('');
  const [railOpen, setRailOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workspace.activeConversation.messages]);

  const submit = (value = input) => {
    if (!value.trim()) return;
    void workspace.ask(value);
    setInput('');
    inputRef.current?.focus();
  };

  const resourceDetails = (resource: AkiliResourceRef) => {
    if (resource.kind === 'community') {
      const community = workspace.communities.find((item) => item.id === resource.id);
      return community ? {
        title: community.name,
        description: community.description,
        meta: `${community.memberCount} members · KES ${community.membershipFee.toLocaleString()} regular contribution`,
        status: communityIds.includes(community.id) ? 'Member' : `${community.activeDecisions} open decisions`,
      } : null;
    }
    if (resource.kind === 'decision' || resource.kind === 'discussion') {
      const decision = workspace.decisions.find((item) => item.id === resource.id);
      const community = decision ? workspace.communities.find((item) => item.id === decision.communityId) : undefined;
      return decision ? {
        title: decision.title,
        description: decision.description,
        meta: `${community?.name ?? 'Community'} · KES ${decision.fundingAmount.toLocaleString()}`,
        status: decision.status === 'active' ? 'Open' : 'Closed',
      } : null;
    }
    if (resource.kind === 'task') {
      const task = workspace.bounties.find((item) => item.id === resource.id);
      return task ? {
        title: task.title,
        description: task.summary,
        meta: `${task.postedBy} · KES ${task.rewardKes.toLocaleString()}`,
        status: task.status.replace('_', ' '),
      } : null;
    }
    const destination = resource.id === 'create'
      ? { title: 'Start a community', description: 'Guided setup with saved progress.', meta: 'Platform', status: 'Available' }
      : resource.id === 'bounties'
        ? { title: 'Community work', description: 'Browse tasks posted by communities.', meta: 'Platform', status: 'Available' }
        : { title: 'Find a community', description: 'Compare groups and ask to join.', meta: 'Platform', status: 'Available' };
    return destination;
  };

  const Message = ({ message }: { message: AkiliWorkspaceMessage }) => (
    <article className={`mb-8 flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'akili' && <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></span>}
      <div className={message.role === 'user' ? 'max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-3 text-sm' : 'min-w-0 max-w-[calc(100%-2.75rem)] flex-1'}>
        <p className="whitespace-pre-line text-pretty text-sm leading-6">{message.text || 'Thinking…'}</p>
        {message.resources && message.resources.length > 0 && (
          <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
            {message.resources.map((resource) => {
              const details = resourceDetails(resource);
              if (!details) return null;
              return (
                <div key={`${resource.kind}-${resource.id}`} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-primary">{details.meta}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">{details.status}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold">{details.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{details.description}</p>
                  <Link to={resource.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    {resource.actionLabel}<ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {message.suggestions && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => submit(suggestion)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">{suggestion}</button>)}
          </div>
        )}
      </div>
    </article>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={`${railOpen ? 'flex' : 'hidden'} fixed inset-0 z-50 flex-col border-r border-border bg-card p-4 md:static md:flex md:w-72 md:shrink-0`}>
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Baraza home"><BrandLogo size="sm" /></Link>
          <button type="button" onClick={() => setRailOpen(false)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted md:hidden" aria-label="Close menu"><X className="h-4 w-4" /></button>
        </div>
        <button type="button" onClick={() => { workspace.startNewConversation(); setRailOpen(false); }} className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold hover:border-primary/50"><Plus className="h-4 w-4" />New conversation</button>
        <div className="mt-7 min-h-0 flex-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-muted-foreground">Recent chats</p>
          <div className="mt-2 space-y-1">
            {workspace.conversations.slice(0, 6).map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => { workspace.setActiveId(conversation.id); setRailOpen(false); }} className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm ${workspace.activeId === conversation.id ? 'bg-muted font-semibold' : 'text-foreground/75 hover:bg-muted/60'}`}>{conversation.title}</button>
            ))}
          </div>
          <p className="mt-7 px-3 text-xs font-semibold text-muted-foreground">Community questions</p>
          <div className="mt-2 space-y-1">
            {COMMUNITY_QUESTIONS.map((question) => <button key={question} type="button" onClick={() => { submit(question); setRailOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs leading-5 text-foreground/70 hover:bg-muted/60 hover:text-foreground">{question}</button>)}
          </div>
          <nav className="mt-7 border-t border-border/60 pt-4" aria-label="Platform shortcuts">
            {destinations.map((destination) => <Link key={destination.href} to={destination.href} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground/75 hover:bg-muted/60 hover:text-foreground">{destination.label}<ArrowRight className="h-3.5 w-3.5" /></Link>)}
          </nav>
        </div>
        <p className="mt-4 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Akili can explain and navigate. Joining, submissions, payments, and voting keep their normal confirmation screens.</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-3 backdrop-blur sm:px-5">
          <button type="button" onClick={() => setRailOpen(true)} className="grid h-9 w-9 place-items-center rounded-md border border-border md:hidden" aria-label="Open menu"><Menu className="h-4 w-4" /></button>
          <div className="hidden sm:block"><p className="text-sm font-semibold">Akili</p><p className="text-xs text-muted-foreground">Private guide · read-only</p></div>
          <InterfaceSwitcher returnTo={returnTo} compact />
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
            {workspace.activeConversation.messages.map((message) => <Message key={message.id} message={message} />)}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-border/70 bg-background p-3 sm:p-4">
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
            <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} rows={1} placeholder="Ask about a community, decision, or task…" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" />
            <button type="submit" disabled={!input.trim() || workspace.isResponding} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message"><Send className="h-4 w-4" /></button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">Confirm important details on the linked platform record.</p>
        </div>
      </main>
    </div>
  );
}
