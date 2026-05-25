import { useState } from 'react';
import { ChevronUp, Lightbulb, PlusCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  communityId: string;
  title: string;
  description: string;
  author: string;
  category: string;
  votes: number;
  voters: string[];
  createdAt: string;
}

const SUGGESTION_KEY = 'baraza.suggestions.v1';

function readSuggestions(communityId: string): Suggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTION_KEY);
    const all: Suggestion[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.communityId === communityId);
  } catch {
    // Local vote storage is optional; ignore failures and keep the UI responsive.
    return [];
  }
}

function writeSuggestion(suggestion: Suggestion): void {
  try {
    const raw = localStorage.getItem(SUGGESTION_KEY);
    const all: Suggestion[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(SUGGESTION_KEY, JSON.stringify([suggestion, ...all]));
  } catch {
    // Suggestions still appear in component state if local persistence fails.
  }
}

function updateVotes(id: string, voterTag: string): Suggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTION_KEY);
    const all: Suggestion[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((s) => s.id === id);
    if (idx < 0) return all;
    const s = all[idx];
    if (s.voters.includes(voterTag)) {
      all[idx] = { ...s, votes: s.votes - 1, voters: s.voters.filter((v) => v !== voterTag) };
    } else {
      all[idx] = { ...s, votes: s.votes + 1, voters: [...s.voters, voterTag] };
    }
    localStorage.setItem(SUGGESTION_KEY, JSON.stringify(all));
    return all;
  } catch {
    return [];
  }
}

const CATEGORIES = ['Feature', 'Event', 'Governance', 'Tooling', 'Community', 'Other'];

const SEED_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-seed-1',
    communityId: '__seed__',
    title: 'Monthly member spotlight',
    description: 'Highlight one active contributor each month in the newsletter and community feed.',
    author: 'Amara T.',
    category: 'Community',
    votes: 14,
    voters: [],
    createdAt: '2026-05-10T09:00:00Z',
  },
  {
    id: 'sug-seed-2',
    communityId: '__seed__',
    title: 'Mobile M-Pesa top-up shortcode',
    description: 'Add a USSD shortcode or Paybill number so members can contribute from feature phones.',
    author: 'David K.',
    category: 'Feature',
    votes: 22,
    voters: [],
    createdAt: '2026-05-08T14:30:00Z',
  },
  {
    id: 'sug-seed-3',
    communityId: '__seed__',
    title: 'Quarterly in-person meetup',
    description: 'Organise a physical gathering every quarter for bonding, skills sharing, and governance review.',
    author: 'Wanjiru M.',
    category: 'Event',
    votes: 9,
    voters: [],
    createdAt: '2026-05-15T11:00:00Z',
  },
];

interface Props {
  communityId: string;
}

export default function CommunitySuggestions({ communityId }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => {
    const local = readSuggestions(communityId);
    // Merge seed suggestions (tagged with __seed__ but re-tagged to this community for display)
    const seeds = SEED_SUGGESTIONS.map((s) => ({ ...s, communityId }));
    const localIds = new Set(local.map((s) => s.id));
    return [...local, ...seeds.filter((s) => !localIds.has(s.id))].sort(
      (a, b) => b.votes - a.votes,
    );
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', author: '', category: 'Feature' });
  const [error, setError] = useState<string | null>(null);
  const [voterTag] = useState(() => `v-${Math.random().toString(36).slice(2, 8)}`);

  const handleSubmit = () => {
    if (!form.title.trim()) { setError('Add a title.'); return; }
    if (!form.author.trim()) { setError('Add your name.'); return; }
    const suggestion: Suggestion = {
      id: `sug-${Date.now().toString(36)}`,
      communityId,
      title: form.title.trim(),
      description: form.description.trim(),
      author: form.author.trim(),
      category: form.category,
      votes: 0,
      voters: [],
      createdAt: new Date().toISOString(),
    };
    writeSuggestion(suggestion);
    setSuggestions((prev) => [suggestion, ...prev].sort((a, b) => b.votes - a.votes));
    setForm({ title: '', description: '', author: '', category: 'Feature' });
    setShowForm(false);
    setError(null);
  };

  const handleVote = (id: string) => {
    updateVotes(id, voterTag);
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const voted = s.voters.includes(voterTag);
        return {
          ...s,
          votes: voted ? s.votes - 1 : s.votes + 1,
          voters: voted ? s.voters.filter((v) => v !== voterTag) : [...s.voters, voterTag],
        };
      }).sort((a, b) => b.votes - a.votes),
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="baraza-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold">Community suggestions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Share ideas, upvote what matters. Top suggestions can be elevated to governance proposals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setError(null); }}
            className="btn-primary flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New suggestion
          </button>
        </div>

        {showForm && (
          <div className="mt-4 grid gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="What do you suggest?"
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your name *</label>
                <input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold transition-all',
                      form.category === cat
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Give enough detail for others to understand and vote…"
                rows={3}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm leading-6 outline-none focus:border-primary/50 resize-none"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
              >
                Post suggestion
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="baraza-card p-10 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-display text-sm font-semibold">No suggestions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Be the first to post an idea.</p>
          </div>
        ) : (
          suggestions.map((s) => {
            const voted = s.voters.includes(voterTag);
            return (
              <article key={s.id} className="baraza-card flex gap-4 p-4">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleVote(s.id)}
                    className={cn(
                      'flex h-8 w-8 flex-col items-center justify-center rounded-lg border transition-all',
                      voted
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                    aria-label={voted ? 'Remove vote' : 'Upvote'}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold tabular-nums">{s.votes}</span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" />
                      {s.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{s.author}</span>
                    <span className="text-[11px] text-muted-foreground/60">·</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {new Date(s.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">{s.title}</h4>
                  {s.description && (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{s.description}</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
