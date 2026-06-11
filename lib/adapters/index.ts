// Single entry point for all chain interactions.
// Components MUST import from here — never import stellar.ts or solana.ts directly.
export { stellarAdapter } from './stellar';
export { solanaAdapter } from './solana';
