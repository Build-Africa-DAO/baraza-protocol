import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@integrations': path.resolve(import.meta.dirname, '../packages/integrations/src'),
      '@coop-templates': path.resolve(import.meta.dirname, '../packages/coop-templates/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      VITE_BRZA_ISSUER_ADDRESS: '',
      BRZA_ISSUER_ADDRESS: '',
      STELLAR_NETWORK: 'testnet',
      VITE_STELLAR_NETWORK: 'testnet',
      SUPABASE_URL: '',
      VITE_SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    // Database-dependent integration suites share a mutable Supabase instance.
    // Running them in parallel causes cascade-delete cross-pollution between
    // suites' beforeAll/afterAll hooks. Serialize file execution so each suite
    // gets a clean database view. Pure unit tests still run fast because the
    // suites themselves are internally sequential (no concurrent: true).
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/hooks/**'],
      exclude: ['src/lib/constants.ts', 'src/hooks/use-toast.ts'],
    },
  },
});
