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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/hooks/**'],
      exclude: ['src/lib/constants.ts', 'src/hooks/use-toast.ts'],
    },
  },
});
