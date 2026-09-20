// app/api/_lib/circuit-breaker.ts
// Standard: S&P 500 Enterprise Fintech / Basel III Capital Safeguards / Zero-Trust Architecture
// Reference: Migration 042 & Master Runbook §8.1

import { getSupabaseAdmin } from './supabase';

export interface CircuitBreakerState {
  isPaused: boolean;
  reason: string;
  pausedAt: string | null;
  pausedBy: string | null;
  affectedRails: string[];
}

interface CachedCircuitBreaker {
  state: CircuitBreakerState;
  cachedAt: number;
}

let memoryCache: CachedCircuitBreaker | null = null;
const CACHE_TTL_MS = 5_000; // 5 seconds in-memory TTL to prevent DB load spikes

const DEFAULT_ACTIVE_STATE: CircuitBreakerState = {
  isPaused: false,
  reason: '',
  pausedAt: null,
  pausedBy: null,
  affectedRails: ['mpesa', 'minisend', 'soroban', 'cron'],
};

/**
 * Checks if the global emergency circuit breaker is active.
 *
 * @param rail Optional rail identifier (e.g. 'mpesa', 'minisend', 'cron', 'soroban')
 * @returns { active: boolean, reason: string }
 */
export async function isCircuitBreakerActive(
  rail?: string,
): Promise<{ active: boolean; reason: string }> {
  // 1. Check process environment override (instantaneous cold-start killswitch)
  if (process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE === 'true') {
    return {
      active: true,
      reason: process.env.EMERGENCY_CIRCUIT_BREAKER_REASON || 'Global emergency freeze active via environment override.',
    };
  }

  // 2. Check in-memory cache
  const now = Date.now();
  if (memoryCache && now - memoryCache.cachedAt < CACHE_TTL_MS) {
    return evaluateState(memoryCache.state, rail);
  }

  // 3. Query PostgreSQL system_config table
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'circuit_breaker')
      .maybeSingle();

    if (error || !data || !data.value) {
      // If table is unpopulated or error occurs, fall back to safe default (unpaused)
      memoryCache = { state: DEFAULT_ACTIVE_STATE, cachedAt: now };
      return { active: false, reason: '' };
    }

    const val = data.value as {
      is_emergency_paused?: boolean;
      reason?: string;
      paused_at?: string | null;
      paused_by?: string | null;
      affected_rails?: string[];
    };

    const state: CircuitBreakerState = {
      isPaused: Boolean(val.is_emergency_paused),
      reason: val.reason || 'Emergency maintenance in progress.',
      pausedAt: val.paused_at || null,
      pausedBy: val.paused_by || null,
      affectedRails: Array.isArray(val.affected_rails)
        ? val.affected_rails
        : ['mpesa', 'minisend', 'soroban', 'cron'],
    };

    memoryCache = { state, cachedAt: now };
    return evaluateState(state, rail);
  } catch {
    // Non-fatal fallback
    return { active: false, reason: '' };
  }
}

function evaluateState(
  state: CircuitBreakerState,
  rail?: string,
): { active: boolean; reason: string } {
  if (!state.isPaused) {
    return { active: false, reason: '' };
  }

  if (!rail) {
    return { active: true, reason: state.reason };
  }

  const isAffected =
    state.affectedRails.includes('all') || state.affectedRails.includes(rail.toLowerCase());

  return {
    active: isAffected,
    reason: state.reason,
  };
}

/**
 * Updates circuit breaker state in PostgreSQL (administrative / testing control).
 */
export async function setCircuitBreakerState(
  update: Partial<CircuitBreakerState>,
): Promise<CircuitBreakerState> {
  const current = memoryCache?.state || DEFAULT_ACTIVE_STATE;
  const next: CircuitBreakerState = {
    ...current,
    ...update,
    pausedAt: update.isPaused ? new Date().toISOString() : null,
  };

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('system_config').upsert({
      key: 'circuit_breaker',
      value: {
        is_emergency_paused: next.isPaused,
        reason: next.reason,
        paused_at: next.pausedAt,
        paused_by: next.pausedBy,
        affected_rails: next.affectedRails,
      },
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal if DB is unreachable in unit test environments
  }

  memoryCache = { state: next, cachedAt: Date.now() };
  return next;
}

/**
 * Resets the circuit breaker state to unpaused in both memory cache and PostgreSQL (test harness hygiene).
 */
export async function resetCircuitBreakerForTesting(): Promise<void> {
  memoryCache = null;
  delete process.env.EMERGENCY_CIRCUIT_BREAKER_ACTIVE;
  delete process.env.EMERGENCY_CIRCUIT_BREAKER_REASON;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('system_config').upsert({
      key: 'circuit_breaker',
      value: {
        is_emergency_paused: false,
        reason: '',
        paused_at: null,
        paused_by: null,
        affected_rails: ['mpesa', 'minisend', 'soroban', 'cron'],
      },
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal if DB is unreachable in unit test environments
  }
}

/**
 * Clears the in-memory cache for isolated testing.
 */
export function clearCircuitBreakerCache(): void {
  memoryCache = null;
}

export const clearCircuitBreakerMemoryCache = clearCircuitBreakerCache;

