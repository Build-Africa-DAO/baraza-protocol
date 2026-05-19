import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { useAshaChat } from '@/contexts/AshaChatContext';

interface Message {
  id: string;
  role: 'asha' | 'user';
  text: string;
  time: string;
}

const timestamp = () =>
  new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'asha',
    text: "Habari! I'm Asha, your Baraza guide. Ask me anything about creating groups, managing funds, or voting.",
    time: timestamp(),
  },
];

const QUICK_REPLIES = [
  'How do I create a group?',
  'How does voting work?',
  'How are funds managed?',
  'What is a Chama?',
];

const RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ['create', 'start', 'new group', 'community', 'chama', 'sacco'],
    reply:
      'To create a group, tap "Start a Group" in the menu. Fill in your group name, choose a type (Chama, Sacco, Cooperative, etc.), set a monthly fee in KSh, and write a short description. Once created, share the link so members can join instantly!',
  },
  {
    keywords: ['vote', 'voting', 'decision', 'propose', 'proposal'],
    reply:
      "Any member can create a Decision — a proposal to spend community funds. Give it a title, description, and funding amount, then set a voting window. All members vote Support or Object. When time's up, the majority wins. Simple, transparent, and fair.",
  },
  {
    keywords: ['fund', 'money', 'ksh', 'shilling', 'fee', 'pay', 'balance', 'treasury'],
    reply:
      'Every group has a shared Community Fund built from monthly membership fees. The balance is always visible to all members on the dashboard. When a Decision is approved, funds are released — and every transaction is logged.',
  },
  {
    keywords: ['join', 'member', 'membership', 'card', 'how to join'],
    reply:
      'To join a community, find it on the Communities page and click "Join Group". After paying the monthly fee, your digital membership card is issued immediately — showing your name, member ID, and join date.',
  },
  {
    keywords: ['dashboard', 'stats', 'overview', 'manage'],
    reply:
      "The Community Dashboard is your group's control centre. It shows fund balance, total members, active decisions, and past decisions — all updating in real time.",
  },
  {
    keywords: ['wallet', 'phantom', 'solflare', 'connect', 'sign in', 'login'],
    reply:
      'Baraza uses Solana wallets (Phantom or Solflare) for secure sign-in — no passwords needed. Click "Sign In", choose your wallet, and approve the connection. Your wallet address becomes your Baraza identity.',
  },
  {
    keywords: ['solana', 'blockchain', 'on-chain', 'web3', 'crypto'],
    reply:
      "Baraza is built on Solana — a fast, low-cost blockchain. Membership records, fund balances, and vote results are tamper-proof and don't rely on any single company. You own your community data.",
  },
  {
    keywords: ['mpesa', 'm-pesa', 'mobile money', 'phone', 'pay with phone'],
    reply:
      "M-Pesa support is coming! We're building a bridge so members can pay membership fees directly from M-Pesa without needing a crypto wallet — perfect for members who aren't in web3 yet.",
  },
  {
    keywords: ['what is chama', 'chama meaning', 'what is a chama'],
    reply:
      'A Chama is a traditional Kenyan group savings model where members pool money regularly and share it in rotation or use it for group investments. Baraza digitises the Chama — making it transparent, governed by votes, and accessible from any phone.',
  },
  {
    keywords: ['security', 'safe', 'trust', 'secure', 'hack'],
    reply:
      "Baraza uses Solana's cryptographic security — your wallet signs every action, so no one can act on your behalf without approval. Fund releases require a vote majority, adding a second layer of protection.",
  },
  {
    keywords: ['hello', 'hi', 'habari', 'hey', 'hola', 'sasa'],
    reply:
      'Habari! Great to have you here. Ask me about creating a group, how voting works, managing funds, joining a community, or anything else. What would you like to know?',
  },
  {
    keywords: ['thank', 'thanks', 'asante', 'awesome', 'great', 'perfect'],
    reply:
      'Karibu sana! Happy to help anytime. If you get stuck anywhere in Baraza, just ask. Good luck with your community!',
  },
];

const getAshaResponse = (input: string): string => {
  const lower = input.toLowerCase();
  for (const { keywords, reply } of RESPONSES) {
    if (keywords.some((kw) => lower.includes(kw))) return reply;
  }
  return 'Great question! Baraza helps communities manage funds and make decisions together. Try asking me about creating a group, how voting works, the community fund, or how to join an existing group.';
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
  const { isOpen, open, close, pendingMessage, clearPending } = useAshaChat();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
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
      time: timestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const ashaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'asha',
        text: getAshaResponse(text),
        time: timestamp(),
      };
      setMessages((prev) => [...prev, ashaMsg]);
    }, 900 + Math.random() * 400);
  }, []);

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
            onClick={() => open()}
            aria-label="Open Asha chat"
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
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white leading-none">Asha</h4>
                  <p className="text-[10px] text-white/60 mt-0.5">Your Baraza guide</p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close chat"
                className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
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
