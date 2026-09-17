import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActivities, useDecision, useDecisions } from '@/hooks/useBarazaData';
import { listCommunityActivity } from '@/lib/activity';
import { isSupabaseConfigured } from '@/lib/communities';
import { RECONNECT_EVENT } from '@/contexts/OfflineContext';
import type { ActivityEvent, Decision } from '@/lib/dataStore';
import { getProposal, listProposals } from '@/lib/proposals';
import { proposalBucket } from '@/lib/proposalStatus';
import { isVotingOpen } from '@/lib/voteCopy';

/**
 * Votes and activity for a group, from the server. When Supabase is not
 * configured (local development with no database) these fall back to the
 * synthetic store so screens still have something to render.
 */

const OPEN_VOTE_REFRESH_MS = 15_000;

export interface ProposalsState {
  all: Decision[];
  active: Decision[];
  past: Decision[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useProposals(communityId: string): ProposalsState {
  const remote = isSupabaseConfigured();
  const local = useDecisions(communityId);
  const [rows, setRows] = useState<Decision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!remote || !communityId) return;
    let cancelled = false;
    listProposals(communityId)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Votes could not be loaded.');
        setRows((prev) => prev ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [communityId, remote, tick]);

  // Reload when the connection comes back.
  useEffect(() => {
    if (!remote) return;
    window.addEventListener(RECONNECT_EVENT, reload);
    return () => window.removeEventListener(RECONNECT_EVENT, reload);
  }, [reload, remote]);

  // Keep tallies fresh while a vote is open.
  const anyOpen = useMemo(() => (rows ?? []).some((d) => proposalBucket(d) === 'active' && isVotingOpen(d)), [rows]);
  useEffect(() => {
    if (!remote || !anyOpen) return;
    const timer = window.setInterval(reload, OPEN_VOTE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [anyOpen, reload, remote]);

  return useMemo(() => {
    const all = remote ? rows ?? [] : local.all;
    return {
      all,
      active: all.filter((d) => proposalBucket(d) === 'active'),
      past: all.filter((d) => proposalBucket(d) !== 'active'),
      isLoading: remote ? rows === null && error === null : false,
      error: remote ? error : null,
      reload,
    };
  }, [error, local.all, reload, remote, rows]);
}

export function useProposal(id: string): { decision: Decision | undefined; isLoading: boolean; error: string | null; reload: () => void } {
  const remote = isSupabaseConfigured();
  const local = useDecision(id);
  const [decision, setDecision] = useState<Decision | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!remote || !id) return;
    let cancelled = false;
    getProposal(id)
      .then((found) => {
        if (cancelled) return;
        setDecision(found);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'The vote could not be loaded.');
        setDecision(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, remote, tick]);

  useEffect(() => {
    if (!remote) return;
    window.addEventListener(RECONNECT_EVENT, reload);
    return () => window.removeEventListener(RECONNECT_EVENT, reload);
  }, [reload, remote]);

  const open = decision ? proposalBucket(decision) === 'active' && isVotingOpen(decision) : false;
  useEffect(() => {
    if (!remote || !open) return;
    const timer = window.setInterval(reload, OPEN_VOTE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [open, reload, remote]);

  if (!remote) return { decision: local, isLoading: false, error: null, reload };
  return { decision: decision ?? undefined, isLoading: decision === undefined && error === null, error, reload };
}

export function useCommunityActivity(communityId: string, limit = 20): { events: ActivityEvent[]; isLoading: boolean; error: string | null } {
  const remote = isSupabaseConfigured();
  const local = useActivities(communityId);
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!remote || !communityId) return;
    let cancelled = false;
    listCommunityActivity(communityId, limit)
      .then((list) => {
        if (!cancelled) {
          setEvents(list);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Activity could not be loaded.');
          setEvents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [communityId, limit, remote]);

  if (!remote) return { events: local, isLoading: false, error: null };
  return { events: events ?? [], isLoading: events === null && error === null, error };
}
