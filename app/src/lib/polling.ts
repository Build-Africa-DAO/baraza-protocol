/**
 * Polling cadence for payment confirmation. The order status route sets no
 * cache headers and the promote job advances one hop per tick, so the client
 * polls quickly while a person is watching and then eases off: every 2.5 s
 * for the first minute, every 15 s after that.
 */
export const POLL_FAST_MS = 2_500;
export const POLL_SLOW_MS = 15_000;
export const POLL_FAST_WINDOW_MS = 60_000;

export function nextPollDelay(startedAtMs: number, nowMs: number = Date.now()): number {
  return nowMs - startedAtMs < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS;
}
