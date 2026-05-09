import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'asha' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'asha',
    text: "Habari! I'm Asha, your guide to Baraza. I can help you create a community, understand how decisions work, or navigate the platform. What would you like to know?",
  },
];

const QUICK_REPLIES = [
  'How do I create a group?',
  'How does voting work?',
  'Where do I see my membership?',
  'How are funds managed?',
];

const getAshaResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (lower.includes('create') || lower.includes('start') || lower.includes('group') || lower.includes('community')) {
    return "To create a group, tap 'Start a Group' from the menu. You'll fill in your group name, select the type (like Chama or Sacco), set a monthly membership fee in KSh, and add a description. Once created, share the link with your members!";
  }
  if (lower.includes('vote') || lower.includes('voting') || lower.includes('decision')) {
    return "Decisions are proposals that any member can create. Each decision has a title, description, and funding amount from the group's fund. All members can either support or object. When voting ends, the majority wins. It's simple and fair!";
  }
  if (lower.includes('member') || lower.includes('card') || lower.includes('join')) {
    return "When you join a community, you get a digital membership card. It shows your name, member ID, and join date. To join a group, find it in the Communities section and pay the membership fee. You'll become a member immediately!";
  }
  if (lower.includes('fund') || lower.includes('money') || lower.includes('fee') || lower.includes('pay') || lower.includes('shilling')) {
    return "Every group has a community fund built from membership fees. All members can see the fund balance on the dashboard. When someone proposes a decision that requires funding, the group votes on it. If approved, the funds are released. Complete transparency!";
  }
  if (lower.includes('dashboard') || lower.includes('manage')) {
    return "Your community dashboard shows everything at a glance — total fund balance, number of members, active decisions waiting for votes, and past completed decisions. It's your group's control center.";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('habari') || lower.includes('hey')) {
    return "Habari! Great to see you here. Feel free to ask me anything about Baraza — creating groups, managing funds, making decisions, or anything else!";
  }
  if (lower.includes('thank')) {
    return "Karibu sana! Happy to help. Let me know if there's anything else you'd like to know about Baraza.";
  }

  return "That's a great question! Baraza helps communities make decisions together and manage funds transparently. You can create a group, invite members, propose decisions, and vote — all in one place. Try asking about creating a group, how voting works, or how funds are managed!";
};

const AshaChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate Asha typing
    setTimeout(() => {
      const ashaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'asha',
        text: getAshaResponse(text),
      };
      setMessages((prev) => [...prev, ashaMsg]);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow transition-transform hover:scale-110"
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-border overflow-hidden"
            style={{ background: 'hsl(var(--card))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50" style={{ background: 'var(--gradient-primary)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary-foreground">Asha</h4>
                  <p className="text-[10px] text-primary-foreground/60">Your Baraza guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/30 transition-colors"
              >
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-md text-primary-foreground'
                        : 'bg-surface rounded-bl-md text-foreground'
                    }`}
                    style={msg.role === 'user' ? { background: 'var(--gradient-primary)' } : undefined}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Asha anything..."
                className="flex-1 bg-surface rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: input.trim() ? 'var(--gradient-warm)' : undefined }}
              >
                <Send className="w-4 h-4 text-warm-foreground" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AshaChat;
