import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) {
            return 'preload-helper';
          }

          if (
            id.includes('/node_modules/@solana/') ||
            id.includes('/node_modules/@walletconnect/') ||
            id.includes('/node_modules/@reown/') ||
            id.includes('/node_modules/@toruslabs/') ||
            id.includes('/node_modules/@wallet-standard/') ||
            id.includes('/node_modules/base-x/') ||
            id.includes('/node_modules/bs58/') ||
            id.includes('/node_modules/eventemitter3/')
          ) {
            return 'wallet-vendor';
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }

          if (
            id.includes('/node_modules/framer-motion/') ||
            id.includes('/node_modules/lucide-react/') ||
            id.includes('/node_modules/clsx/') ||
            id.includes('/node_modules/tailwind-merge/')
          ) {
            return 'ui-vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: { global: 'globalThis' },
    },
  },
});
