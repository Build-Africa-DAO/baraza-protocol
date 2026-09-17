// Synchronous polyfills for the wallet SDKs in the browser. The Privy core
// and the Solana adapters read a global `Buffer`, so this is the first import
// of every module that loads them (PrivyAccountProvider, WalletProviders,
// OperatorShell). It is deliberately not imported from main.tsx: visitors
// never need it and it costs 8 KiB on the first paint.

import { Buffer } from 'buffer';

type GlobalShim = { Buffer?: typeof Buffer; global?: Window };

const g = globalThis as unknown as GlobalShim;

if (!g.Buffer) g.Buffer = Buffer;
if (typeof window !== 'undefined' && !g.global) g.global = window;
