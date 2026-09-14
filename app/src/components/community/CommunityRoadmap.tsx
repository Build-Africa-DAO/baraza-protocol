import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, CircleDot, Map, PlusCircle } from 'lucide-react';
import { cn, formatRailDate } from '@/lib/utils';
import { useChain } from '@/hooks/useChain';
import { asRecordList, tryWorkspaceGet, tryWorkspaceMutate } from '@/lib/workspaceApi';

type MilestoneStatus = 'planned' | 'in_progress' | 'completed';

interface Milestone {
  id: string;
  communityId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  targetDate: string;
  tags: string[];
}

const ROADMAP_KEY = 'baraza.roadmap.v1';

function readMilestones(communityId: string): Milestone[] {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    const all: Milestone[] = raw ? JSON.parse(raw) : [];
    return all.filter((m) => m.communityId === communityId);
  } catch {
    // Local storage may be unavailable in private browsing.
    return [];
  }
}

function writeMilestone(m: Milestone): void {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    const all: Milestone[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(ROADMAP_KEY, JSON.stringify([m, ...all]));
  } catch {
    // Keep the roadmap usable even when local persistence is blocked.
  }
}

function updateMilestoneStatus(id: string, status: MilestoneStatus): void {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    const all: Milestone[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((m) => m.id === id);
    if (idx >= 0) all[idx] = { ...all[idx], status };
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(all));
  } catch {
    // Status changes are kept in component state if local persistence fails.
  }
}


const STATUS_CONFIG: Record<MilestoneStatus, {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  colClass: string;
}> = {
  planned: {
    label: 'Planned',
    icon: Circle,
    badgeClass: 'border-border/60 bg-surface/60 text-muted-foreground',
    colClass: 'border-border/50',
  },
  in_progress: {
    label: 'In Progress',
    icon: CircleDot,
    badgeClass: 'border-foreground/50 bg-transparent text-foreground',
    colClass: 'border-foreground/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'border-confirmed/40 bg-confirmed/10 text-confirmed',
    colClass: 'border-confirmed/30',
  },
};

const COLUMNS: MilestoneStatus[] = ['planned', 'in_progress', 'completed'];

interface Props {
  communityId: string;
}

export default function CommunityRoadmap({ communityId }: Props) {
  const { chainMeta } = useChain();
  // Only what this device has saved or the API returns. No sample milestones.
  const [milestones, setMilestones] = useState<Milestone[]>(() => readMilestones(communityId));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', tags: '' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void tryWorkspaceGet(`/api/communities/${communityId}/roadmap`).then((payload) => {
      const remote = asRecordList<Milestone>(payload, 'milestones') ?? asRecordList<Milestone>(payload, 'roadmap');
      if (!cancelled && remote?.length) setMilestones(remote.map((item) => ({ ...item, communityId })));
    });
    return () => { cancelled = true; };
  }, [communityId]);

  const handleAdd = () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.targetDate) { setFormError('Target date is required.'); return; }
    const m: Milestone = {
      id: `rm-${Date.now().toString(36)}`,
      communityId,
      title: form.title.trim(),
      description: form.description.trim(),
      status: 'planned',
      targetDate: form.targetDate,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    writeMilestone(m);
    setMilestones((prev) => [m, ...prev]);
    void tryWorkspaceMutate(`/api/communities/${communityId}/roadmap`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(m),
    });
    setForm({ title: '', description: '', targetDate: '', tags: '' });
    setShowForm(false);
    setFormError(null);
  };

  const handleAdvance = (id: string, current: MilestoneStatus) => {
    const next: MilestoneStatus =
      current === 'planned' ? 'in_progress' :
      current === 'in_progress' ? 'completed' : 'completed';
    updateMilestoneStatus(id, next);
    setMilestones((prev) =>
      prev.map((m) => m.id === id ? { ...m, status: next } : m),
    );
    void tryWorkspaceMutate(`/api/communities/${communityId}/roadmap`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="baraza-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-display text-base font-semibold">Community roadmap</h3>
              <p className="text-xs text-muted-foreground">Milestones, launches, and long-term goals.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="btn-wipe flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add milestone
          </button>
        </div>

        {showForm && (
          <div className="mt-4 grid gap-3 rounded-xl border border-border/60 bg-surface/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Launch membership portal"
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target date *</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What needs to be done and why it matters…"
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm leading-6 outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Savings, Transport, Welfare"
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={handleAdd} className="btn-wipe px-4 py-2 text-xs">
                Add to roadmap
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-wipe-outline px-4 py-2 text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kanban columns */}
      <div className="overflow-x-auto pb-2">
        <div className="grid gap-3 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const cfg = STATUS_CONFIG[col];
            const ColIcon = cfg.icon;
            const items = milestones.filter((m) => m.status === col);
            return (
              <div key={col} className="flex flex-col gap-2">
                {/* Column header */}
                <div className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2',
                  cfg.colClass,
                  'bg-surface/40',
                )}>
                  <ColIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold">{cfg.label}</span>
                  <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/40 p-4 text-center">
                    <p className="text-xs text-muted-foreground/60">No items</p>
                  </div>
                ) : (
                  items.map((m) => {
                    const badgeCfg = STATUS_CONFIG[m.status];
                    const BadgeIcon = badgeCfg.icon;
                    const canAdvance = m.status !== 'completed';
                    return (
                      <div key={m.id} className="rounded-xl border border-border/60 bg-card/70 p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold',
                            badgeCfg.badgeClass,
                          )}>
                            <BadgeIcon className="h-2.5 w-2.5" />
                            {badgeCfg.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-2.5 w-2.5" />
                            {formatRailDate(m.targetDate, chainMeta, { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="font-display text-xs font-bold leading-snug">{m.title}</p>
                        {m.description && (
                          <p className="mt-1 text-xs leading-4 text-muted-foreground line-clamp-2">{m.description}</p>
                        )}
                        {m.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-border/40 px-1.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}
                        {canAdvance && (
                          <button
                            type="button"
                            onClick={() => handleAdvance(m.id, m.status)}
                            className="btn-wipe-outline mt-2 w-full py-1.5 text-xs"
                          >
                            {m.status === 'planned' ? 'Mark in progress' : 'Mark completed'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
