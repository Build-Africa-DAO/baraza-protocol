/**
 * Compatibility re-exports for `@/lib/akili` (legacy path).
 * Canonical implementation lives in `@/akili` (`app/src/akili/`).
 * Restores TS2307 resolution for tests and docs that still import the old path.
 */
export * from '../../akili/index';
