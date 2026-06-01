import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useAshaChat } from '@/hooks/useAshaChat';
import { useChain } from '@/hooks/useChain';
import type { ChainMeta } from '@/lib/chain';

interface Message {
  id: string;
  role: 'asha' | 'user';
  text: string;
  time: string;
}

const timestamp = (chainMeta: ChainMeta) =>
  new Date().toLocaleTimeString(chainMeta.currency.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: chainMeta.timeZone,
  });

const initialMessage = (chainMeta: ChainMeta): Message => ({
    id: '1',
    role: 'asha',
    text: "Habari! I'm Asha, your Baraza guide. I can help you understand the website, launch a DAO or community, manage members, or plan a vote.",
    time: timestamp(chainMeta),
});

const QUICK_REPLIES = [
  'How do I create a group?',
  'Help me set up my DAO',
  'Run a security review',
  'How does voting work?',
  'How are funds managed?',
];

const RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['ai', 'asha', 'guide', 'copilot', 'assistant', 'platform', 'use baraza'],
    reply:
      'Baraza combines the website, the operating platform, and Asha AI in one flow. Use the website to understand the model, Explore to find DAOs and communities, Launch to create one, dashboards to manage KSh treasury and votes, and ask me when you need help choosing settings or explaining the next action.',
  },
  {
    keywords: ['plan', 'setup', 'best setup', 'rules', 'quorum', 'threshold'],
    reply:
      'A solid setup starts with your group type, monthly dues in KSh, quorum, approval threshold, and voting period. For most welfare groups, start with 51% quorum, 66% approval, a 7-day vote window, and clear rules for emergency spending. Then invite members to review before joining.',
  },
  {
    keywords: ['create', 'start', 'new group', 'community', 'chama', 'sacco'],
    reply:
      'To create a DAO or community, tap "Launch" in the menu. Fill in your group name, choose a type (DAO, Chama, SACCO, Cooperative, etc.), set monthly dues in KSh, and write a short description. Once created, share the link so members can join instantly.',
  },
  {
    keywords: ['vote', 'voting', 'decision', 'propose', 'proposal'],
    reply:
      "Any member can create a proposal to spend DAO or community funds. Give it a title, description, and funding amount in KSh, then set a voting window. All members vote Support or Object. When time's up, the majority wins. Simple, transparent, and fair.",
  },
  {
    keywords: ['fund', 'money', 'KES', 'shilling', 'fee', 'pay', 'balance', 'treasury'],
    reply:
      'Every DAO or community has a shared KSh fund built from monthly membership dues. The balance is always visible to all members on the dashboard. When a Decision is approved, funds are released and every transaction is logged.',
  },
  {
    keywords: ['join', 'member', 'membership', 'card', 'how to join'],
    reply:
      'To join a DAO or community, find it on Explore and click "Become a member". After paying the monthly dues, your membership is issued after payment proof and approval.',
  },
  {
    keywords: ['dashboard', 'stats', 'overview', 'manage'],
    reply:
      "The Community Dashboard is your group's control centre. It shows fund balance, total members, active decisions, and past decisions - all updating in real time.",
  },
  {
    keywords: ['wallet', 'phantom', 'solflare', 'connect', 'sign in', 'login'],
    reply:
      'Different rails use different accounts. Baraza Token actions use Phantom, Solflare, or Backpack. Stellar uses Freighter, Lobstr, or Albedo. Celo can use Valora or MetaMask.',
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
      'Asha runs an AI-assisted security review on group rules, bounties, proposals, and treasury releases. It checks for unclear dues, weak voting rules, expired tasks, large fund requests, and missing member records. Asha can flag risk, but members and admins still make the final decision.',
  },
  {
    keywords: ['hello', 'hi', 'habari', 'hey', 'hola', 'sasa'],
    reply:
      'Habari! Great to have you here. Ask me about launching a DAO or community, how voting works, managing KSh funds, joining a group, or anything else. What would you like to know?',
  },
  {
    keywords: ['thank', 'thanks', 'asante', 'awesome', 'great', 'perfect'],
    reply:
      'Karibu sana! Happy to help anytime. If you get stuck anywhere in Baraza, just ask. Good luck with your DAO or community!',
  },
];

const getAshaResponse = (input: string): string => {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of RESPONSES) {
    if (keywords.some((kw) => lower.includes(kw))) return reply;
  }
  return 'Great question! Baraza helps DAOs, communities and SACCOs manage KSh funds and make decisions together. Try asking me about launching a DAO or community, how voting works, the shared fund, or how to join an existing group.';
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

const AshaChat: React.FC = () => {
  const { isOpen, close, pendingMessage, clearPending } = useAshaChat();
  const { chainMeta } = useChain();
  const [messages, setMessages] = useState<Message[]>(() => [initialMessage(chainMeta)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Send pending message from hero search bar
  useEffect(() => {
    if (isOpen && pendingMessage) {
      clearPending();
      sendMessage(pendingMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMessage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      time: timestamp(chainMeta),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (responseTimerRef.current !== null) clearTimeout(responseTimerRef.current);
    responseTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      const ashaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'asha',
        text: getAshaResponse(text),
        time: timestamp(chainMeta),
      };
      setMessages((prev) => [...prev, ashaMsg]);
    }, 900 + Math.random() * 400);
  }, [chainMeta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showQuickReplies = messages.length <= 2 && !isTyping;

  return (
    <>
      {/* Trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            disabled
            aria-label="Asha chat coming soon"
            title="Asha AI guide is coming soon"
            className="fixed bottom-5 right-5 z-50 hidden h-14 w-14 cursor-not-allowed rounded-full opacity-70 md:flex items-center justify-center shadow-lg"
            style={{ background: 'var(--gradient-warm)' }}
          >
            <MessageCircle className="w-6 h-6 text-warm-foreground" />
            <span className="sr-only">Coming soon</span>
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
            className="fixed bottom-5 right-5 z-50 hidden w-[340px] max-w-[calc(100vw-1.25rem)] h-[500px] max-h-[calc(100vh-5rem)] md:flex flex-col rounded-2xl border border-border overflow-hidden shadow-2xl"
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
                  <h4 className="text-sm font-semibold text-primary-foreground leading-none">Asha</h4>
                  <p className="text-[10px] text-primary-foreground/70 mt-0.5">Your Baraza guide</p>
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
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">{msg.time}</span>
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
              {showQuickReplies && (
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
                placeholder="Ask Asha anything…"
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

export default AshaChat;
