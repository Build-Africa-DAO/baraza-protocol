// Synchronous polyfills for Solana wallet adapters in the browser.
// Imported first from main.tsx so this module's body executes before any
// wallet adapter code is evaluated.

import { Buffer } from 'buffer';

type GlobalShim = { Buffer?: typeof Buffer; global?: Window };

const g = globalThis as unknown as GlobalShim;

if (!g.Buffer) g.Buffer = Buffer;
if (typeof window !== 'undefined' && !g.global) g.global = window;
