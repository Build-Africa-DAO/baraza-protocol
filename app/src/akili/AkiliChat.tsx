import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useAkiliChat } from '@/akili/useAkiliChat';
import type { AkiliChatMode } from '@/akili/akili-chat-context';
import { useChain } from '@/hooks/useChain';
import { useLocation } from 'react-router-dom';
import type { ChainMeta } from '@/lib/chain';
import { ChatStreamError, getFacilitatorFallback, streamAkiliResponse } from '@/lib/akiliTransport';

interface Message {
  id: string;
  role: 'akili' | 'user';
  text: string;
  time: string;
}

const timestamp = (chainMeta: ChainMeta) =>
  new Date().toLocaleTimeString(chainMeta.currency.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: chainMeta.timeZone,
  });

// Route context — Akili tailors its first message and its suggested follow-ups
// to where the member is on the site. The classifier reads location.pathname
// against the route table in App.tsx and falls back to 'landing' for anything
// it doesn't recognise.
type RouteContext =
  | 'profile'
  | 'create'
  | 'join'
  | 'join-status'
  | 'proposal'
  | 'community'
  | 'communities'
  | 'bounties'
  | 'evaluate'
  | 'admin'
  | 'onboarding'
  | 'landing';

function classifyRoute(pathname: string): RouteContext {
  if (pathname === '/' || pathname === '/home') return 'landing';
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/create')) return 'create';
  if (/^\/join\/[^/]+\/status/.test(pathname)) return 'join-status';
  if (pathname.startsWith('/join/')) return 'join';
  if (/^\/(dashboard|dao)\/[^/]+\/(decisions|proposals)\/[^/]+/.test(pathname)) return 'proposal';
  if (/^\/(dashboard|dao)\/[^/]+/.test(pathname)) return 'community';
  if (pathname.startsWith('/communities')) return 'communities';
  if (pathname.startsWith('/bounties')) return 'bounties';
  if (pathname.startsWith('/evaluate')) return 'evaluate';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/onboarding')) return 'onboarding';
  return 'landing';
}

// First-message copy, keyed by route. Voice is consistent — "Habari" opener,
// short, names what Akili can do FROM THIS PAGE specifically, not in general.
const GREETING_BY_ROUTE: Record<RouteContext, string> = {
  landing:
    "Habari! I'm Akili, your Baraza guide. Ask me how chamas, SACCOs, cooperatives, or associations work on Baraza — or how to start one.",
  profile:
    "Habari! I'm Akili. Want help joining your first community, checking your contributions, or understanding your member record? Just ask.",
  create:
    "Habari! I'm Akili. Setting up a community? I can explain participation rules, approval levels, contributions, and a review period that fits your group size.",
  join:
    "Habari! I'm Akili. Want me to walk you through M-Pesa vs account payment, or explain what activation means? Just ask.",
  'join-status':
    "Habari! I'm Akili. Watching a payment confirm? Ask me what each step does, or what to do if confirmation takes longer than expected.",
  proposal:
    "Habari! I'm Akili. I can summarise this proposal, explain the participation rules, or clarify the difference between yes, no, and abstain without choosing for you.",
  community:
    "Habari! I'm Akili. Ask me anything about this community — group funds, members, active decisions, or how to write a clear proposal.",
  communities:
    "Habari! I'm Akili. I can help you compare communities, decide which one fits, or explain how each group is organised.",
  bounties:
    "Habari! I'm Akili. Browsing community work? I can explain the payment, what reviewers check, and how to submit your work.",
  evaluate:
    "Habari! I'm Akili. Use the checklist on this page; ask me whenever a question deserves a longer answer than a checkbox.",
  admin:
    "Habari! I'm Akili. Reconciliation tools sit on this page. Ask me what a flag means or what to investigate first.",
  onboarding:
    "Habari! I'm Akili. New here? Ask me anything — how votes work, how dues flow, how membership activates after payment.",
};

const initialMessage = (chainMeta: ChainMeta, route: RouteContext): Message => ({
  id: '1',
  role: 'akili',
  text: GREETING_BY_ROUTE[route],
  time: timestamp(chainMeta),
});

const FACILITATOR_GREETING = 'I can summarise this community discussion, preserve different views, list unanswered questions, or translate between English and Kiswahili. I will not recommend or cast a vote.';

// Suggested next-asks per route. 4 chips max so the row never wraps awkwardly
// on a 320-wide mobile drawer. The first chip is the highest-intent action
// for that route.
const QUICK_REPLIES_BY_ROUTE: Record<RouteContext, string[]> = {
  landing: [
    'How do I create a group?',
    'How does voting work?',
    'What is a chama?',
    'How are funds managed?',
  ],
  profile: [
    'How do I check my contribution record?',
    'How do I join a community?',
    'What does voting weight mean?',
    'How do referrals work?',
  ],
  create: [
    'Suggest participation and approval rules for a 20-member chama',
    'What is a fair monthly dues amount?',
    'How long should the voting period be?',
    'Run a security review on my setup',
  ],
  join: [
    'M-Pesa or account — which should I pick?',
    'What is the activation secret?',
    'How long does payment confirmation take?',
    'What happens after I pay?',
  ],
  'join-status': [
    'My payment is stuck — what now?',
    'What does each step in this tracker do?',
    'Can I cancel and retry?',
    'When will my membership activate?',
  ],
  proposal: [
    'Summarise this proposal',
    'What does the security review flag?',
    'How many members need to take part?',
    'Explain yes, no, and abstain',
  ],
  community: [
    'How do I propose using group funds?',
    'How are contributions shown here?',
    'What recent decisions did this group make?',
    'Run a security review on this community',
  ],
  communities: [
    'Which community fits a youth savings group?',
    'How do I compare participation rules?',
    'What does "active" vs "draft" mean?',
    'How do I join one?',
  ],
  bounties: [
    'Which community tasks are paid?',
    'How do I submit work for review?',
    'What do verifiers check?',
    'How are disputes resolved?',
  ],
  evaluate: [
    'Walk me through this checklist',
    'What is the security score?',
    'What are the highest-risk items?',
    'How do I fix a flagged issue?',
  ],
  admin: [
    'What does this flag mean?',
    'How do I reconcile a mismatch?',
    'What should I investigate first?',
    'How do payouts get reviewed?',
  ],
  onboarding: [
    'How do I create a community?',
    'How do dues work?',
    'How does voting work?',
    'How are member contributions tracked?',
  ],
};

const RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['ai', 'asha', 'akili', 'guide', 'copilot', 'assistant', 'platform', 'use baraza'],
    reply:
      'Baraza combines community discovery, setup, group funds, decisions, and Akili guidance in one flow. Use Explore to find a group, Launch to start one, and each community home to follow contributions and decisions.',
  },
  {
    keywords: ['plan', 'setup', 'best setup', 'rules', 'quorum', 'threshold'],
    reply:
      'A solid setup starts with your group type, monthly dues in KES, quorum, approval threshold, and voting period. For most welfare groups, start with 51% quorum, 66% approval, a 7-day vote window, and clear rules for emergency spending. Then invite members to review before joining.',
  },
  {
    keywords: ['create', 'start', 'new group', 'community', 'chama', 'sacco'],
    reply:
      'To start a community, tap "Launch" in the menu. Add the group name, choose the group type, set the monthly contribution in KES, and write a short purpose. Once created, share the link so members can ask to join.',
  },
  {
    keywords: ['vote', 'voting', 'decision', 'propose', 'proposal'],
    reply:
      "An eligible member can propose using group funds. Give it a clear title, reason, amount in KES, and review period. Members can discuss it and then vote yes, no, or abstain under the group's agreed rules.",
  },
  {
    keywords: ['fund', 'money', 'KES', 'shilling', 'fee', 'pay', 'balance', 'treasury'],
    reply:
      'Each community has shared group funds built from member contributions. Members can see the balance and money updates. An approved decision still needs the group’s required withdrawal approvals before money can move.',
  },
  {
    keywords: ['join', 'member', 'membership', 'card', 'how to join'],
    reply:
      'To join a community, find it on Explore and choose "Ask to join". Review the contribution and group rules, then follow the payment and approval steps.',
  },
  {
    keywords: ['dashboard', 'stats', 'overview', 'manage'],
    reply:
      "The Community Dashboard is your group's control centre. It shows fund balance, total members, active decisions, and past decisions - all updating in real time.",
  },
  {
    keywords: ['wallet', 'phantom', 'solflare', 'connect', 'sign in', 'login'],
    reply:
      'Account setup supports Phantom, Solflare, and Coinbase Wallet. If your account will not connect, check that you selected one of those supported options and then try again.',
  },
  {
    keywords: ['solana', 'blockchain', 'on-chain', 'web3', 'crypto'],
    reply:
      "Baraza records membership, fund balances, and vote results in a shared public record so they do not rely on any single organiser. Your community keeps a clear history.",
  },
  {
    keywords: ['mpesa', 'm-pesa', 'mobile money', 'phone', 'pay with phone'],
    reply:
      "Baraza includes a phone-first M-Pesa flow for KES membership dues. In local preview it simulates the payment order, and in production it connects to payment confirmation and membership activation.",
  },
  {
    keywords: ['what is chama', 'chama meaning', 'what is a chama'],
    reply:
      'A Chama is a traditional Kenyan group savings model where members pool money regularly and share it in rotation or use it for group investments. Baraza digitises the Chama - making it transparent, governed by votes, and accessible from any phone.',
  },
  {
    keywords: ['security', 'safe', 'trust', 'secure', 'hack', 'vet', 'review', 'risk'],
    reply:
      'Akili runs an AI-assisted security review on group rules, bounties, proposals, and treasury releases. It checks for unclear dues, weak voting rules, expired tasks, large fund requests, and missing member records. Akili can flag risk, but members and admins still make the final decision.',
  },
  {
    keywords: ['hello', 'hi', 'habari', 'hey', 'hola', 'sasa'],
    reply:
      'Habari! Ask me about starting a community, how voting works, managing group funds, joining a group, or what to do next.',
  },
  {
    keywords: ['thank', 'thanks', 'asante', 'awesome', 'great', 'perfect'],
    reply:
      'Karibu sana! If you get stuck anywhere in Baraza, ask me for the next step.',
  },
];

const getStaticResponse = (input: string): string => {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of RESPONSES) {
    if (keywords.some((kw) => lower.includes(kw))) return reply;
  }
  return 'Baraza helps communities manage KES contributions and make decisions together. Try asking about starting a group, how voting works, group funds, or how to join an existing community.';
};

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3.5 py-2.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

const AkiliChat: React.FC = () => {
  const { isOpen, open, close, pendingMessage, pendingMode, mode, setMode, clearPending } = useAkiliChat();
  const { chainMeta } = useChain();
  const location = useLocation();
  const routeContext = classifyRoute(location.pathname);
  const [messages, setMessages] = useState<Message[]>(() => [initialMessage(chainMeta, routeContext)]);
  // Quick replies are derived during render so they update when the route changes
  // (e.g. user opens Akili on Profile, then navigates to a proposal without closing).
  const QUICK_REPLIES = QUICK_REPLIES_BY_ROUTE[routeContext];
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract communityId from /dashboard/:id routes
  const communityId = location.pathname.match(/^\/dashboard\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 200);
    }
    return () => {
      if (focusTimerRef.current !== null) clearTimeout(focusTimerRef.current);
    };
  }, [isOpen]);

  // Refresh the greeting on each open IF the conversation hasn't started yet.
  // Lets a member navigate from Profile → ProposalDetail and see the proposal-
  // specific greeting next time they open Akili. Once they send a message,
  // we leave the history alone.
  //
  // Deps intentionally exclude `chainMeta` and `messages`:
  //  - `chainMeta` only feeds the greeting timestamp; rebuilding the greeting
  //    every time the chain meta object identity changes would clobber any
  //    in-flight conversation the user is having.
  //  - `messages` is the state we're conditionally writing to — including it
  //    would loop. The `messages.length === 1 && id === '1'` guard inside
  //    the effect is the real check against overwriting user history.
  useEffect(() => {
    if (isOpen && messages.length === 1 && messages[0].id === '1') {
      setMessages([initialMessage(chainMeta, routeContext)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, routeContext]);

  const sendMessage = useCallback(async (text: string, requestedMode: AkiliChatMode = mode) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      time: timestamp(chainMeta),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const akiliId = String(Date.now() + 1);

    // Build history from last 8 messages (excluding initial greeting)
    const history = messages.slice(1, -0).slice(-8).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

    try {
      // Add empty Akili message that we'll stream into
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: akiliId,
          role: 'akili',
          text: '',
          time: timestamp(chainMeta),
        },
      ]);

      await streamAkiliResponse(
        text.trim(),
        communityId,
        history,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === akiliId ? { ...m, text: m.text + chunk } : m))
          );
        },
        requestedMode,
      );
    } catch (err) {
      setIsTyping(false);
      // For classified server errors (credits out, auth failed, rate limit,
      // overloaded) the server's plain-English message is more helpful than
      // the keyword fallback — show it so the member knows the chat is
      // intentionally silent vs. broken. Unknown/network errors get the
      // static fallback so the conversation keeps moving.
      const isClassified =
        err instanceof ChatStreamError && err.category !== 'unknown';
      const replacement = isClassified
        ? (err as ChatStreamError).message
        : requestedMode === 'facilitator'
          ? getFacilitatorFallback(text)
          : getStaticResponse(text);
      setMessages((prev) =>
        prev.map((m) => (m.id === akiliId ? { ...m, text: replacement } : m))
      );
    }
  }, [chainMeta, communityId, isTyping, messages, mode]);

  // Send pending message from hero search bar
  useEffect(() => {
    if (isOpen && pendingMessage) {
      clearPending();
      void sendMessage(pendingMessage, pendingMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMessage, pendingMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const showQuickReplies = messages.length <= 2 && !isTyping;

  if (location.pathname === '/akili') return null;

  return (
    <>
      {/* Trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => open()}
            aria-label="Open Akili chat"
            className="fixed bottom-5 right-5 z-50 hidden w-14 h-14 rounded-full md:flex items-center justify-center shadow-lg animate-pulse-glow transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'var(--gradient-warm)' }}
          >
            <MessageCircle className="w-6 h-6 text-warm-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-2 bottom-20 z-50 flex h-[72vh] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl md:inset-x-auto md:bottom-5 md:right-5 md:h-[500px] md:max-h-[calc(100vh-5rem)] md:w-[340px]"
            style={{ background: 'hsl(var(--card))' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary-foreground leading-none">
                    Akili
                  </h4>
                  <p className="text-[10px] text-primary-foreground/70 mt-0.5 capitalize">
                    {mode === 'facilitator' ? 'Community facilitator' : 'Private guide'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close chat"
                className="w-8 h-8 rounded-full bg-primary-foreground/12 flex items-center justify-center text-primary-foreground ring-1 ring-primary-foreground/20 hover:bg-primary-foreground/22 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
              >
                <X className="w-4 h-4" strokeWidth={2.6} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm text-white'
                        : 'bg-surface rounded-bl-sm text-foreground'
                    }`}
                    style={msg.role === 'user' ? { background: 'var(--gradient-primary)' } : undefined}
                  >
                    {msg.id === '1' && msg.role === 'akili' && mode === 'facilitator'
                      ? FACILITATOR_GREETING
                      : msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {msg.time}
                  </span>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start"
                >
                  <div className="bg-surface rounded-2xl rounded-bl-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <AnimatePresence>
              {showQuickReplies && mode === 'private' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0"
                >
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-medium text-primary hover:bg-primary/15 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mx-3 mb-1 grid grid-cols-2 rounded-lg bg-surface p-1 text-[10px] font-semibold">
              <button type="button" onClick={() => setMode('private')} aria-pressed={mode === 'private'} className={mode === 'private' ? 'rounded-md bg-background px-2 py-1.5 text-foreground shadow-sm' : 'px-2 py-1.5 text-muted-foreground'}>
                Private guide
              </button>
              <button type="button" onClick={() => setMode('facilitator')} aria-pressed={mode === 'facilitator'} className={mode === 'facilitator' ? 'rounded-md bg-background px-2 py-1.5 text-foreground shadow-sm' : 'px-2 py-1.5 text-muted-foreground'}>
                Community facilitator
              </button>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-border/50 flex items-center gap-2 flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'facilitator' ? 'Ask for a neutral summary…' : 'Ask Akili privately…'}
                className="flex-1 bg-surface rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: input.trim() && !isTyping ? 'var(--gradient-warm)' : undefined }}
              >
                <Send
                  className={`w-4 h-4 ${
                    input.trim() && !isTyping ? 'text-warm-foreground' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AkiliChat;
