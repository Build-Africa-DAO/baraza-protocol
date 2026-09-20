import { defineConfig, type Plugin, type Rollup } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * Which named vendor chunk a module belongs to, or undefined for the default
 * splitting. Vite 8 runs this through rolldown's manualChunks shim, which also
 * pulls a matched module's dependencies into its chunk unless they match a
 * rule of their own; every shared dependency therefore needs an explicit rule.
 */
function chunkName(id: string): string | undefined {
  if (id.includes('vite/preload-helper')) {
    return 'preload-helper';
  }

  // Finer wallet chunks: the auth SDK statically needs a slice of
  // @solana/web3.js for embedded wallets; the adapters, WalletConnect
  // and Torus are operator-only and must not ride along with it.
  if (id.includes('/node_modules/@solana/web3.js/') || id.includes('/node_modules/@solana/codecs') || id.includes('/node_modules/@solana/errors') || id.includes('/node_modules/@solana/rpc')) {
    return 'solana-web3';
  }
  if (id.includes('/node_modules/@solana/') || id.includes('/node_modules/@wallet-standard/')) {
    return 'wallet-adapter';
  }
  if (id.includes('/node_modules/@walletconnect/') || id.includes('/node_modules/@reown/') || id.includes('/node_modules/@toruslabs/')) {
    return 'walletconnect-vendor';
  }

  if (id.includes('/node_modules/@stellar/')) {
    return 'stellar-vendor';
  }

  // The Buffer polyfill is shared by the entry and the wallet chunks.
  // Left to Rollup it is hoisted into solana-web3, which then drags
  // 110 KiB of Solana and noble crypto onto every visitor page.
  if (id.includes('/node_modules/buffer/') || id.includes('/node_modules/base64-js/') || id.includes('/node_modules/ieee754/')) {
    return 'buffer-polyfill';
  }

  if (id.includes('/node_modules/@noble/')) {
    return 'noble-crypto';
  }

  if (id.includes('/node_modules/@scure/')) {
    return 'scure-crypto';
  }

  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/react-router-dom/')
  ) {
    return 'react-vendor';
  }

  // framer-motion is deliberately not named: only the lazy Akili panel and the
  // landing page import it, so default splitting gives them a shared chunk
  // that never sits on the first-paint path. (Naming it made rolldown's
  // manualChunks shim capture React itself into that chunk.)
  if (
    id.includes('/node_modules/lucide-react/') ||
    id.includes('/node_modules/clsx/') ||
    id.includes('/node_modules/tailwind-merge/')
  ) {
    return 'ui-vendor';
  }
  return undefined;
}

/**
 * Route entry chunks the visitor is most likely to need first, by URL. The
 * entry graph is preloaded from index.html; the page chunk behind each lazy
 * route still costs one more round trip on a slow connection. Cloudflare
 * Pages turns a `Link` header into a 103 Early Hint, so we append one per
 * route to the published `_headers` with the hashed file names of that
 * route's chunk and its private static imports. Wrong or stale hints only
 * cost a few kilobytes; they never break a page.
 */
const ROUTE_PRELOADS: Record<string, string[]> = {
  '/': ['Index'],
  '/groups': ['Communities'],
  '/help': ['Help'],
  '/home': ['Home'],
  '/dashboard/*': ['GroupWorkspace'],
};

function routePreloadHeaders(): Plugin {
  let outDir = 'dist';
  let lines: string[] = [];
  return {
    name: 'baraza:route-preload-headers',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    generateBundle(_options, bundle) {
      type Chunk = Rollup.OutputChunk;
      const chunks = Object.values(bundle).filter((item): item is Chunk => item.type === 'chunk');
      const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
      const closure = (start: Chunk): Set<string> => {
        const seen = new Set<string>();
        const stack = [start];
        while (stack.length) {
          const chunk = stack.pop()!;
          if (seen.has(chunk.fileName)) continue;
          seen.add(chunk.fileName);
          chunk.imports.forEach((file) => {
            const next = byFile.get(file);
            if (next) stack.push(next);
          });
        }
        return seen;
      };
      const entryGraph = new Set<string>();
      chunks.filter((chunk) => chunk.isEntry).forEach((entry) => closure(entry).forEach((file) => entryGraph.add(file)));

      lines = Object.entries(ROUTE_PRELOADS).flatMap(([route, names]) => {
        const files = new Set<string>();
        names.forEach((name) => {
          const chunk = chunks.find((candidate) => candidate.name === name && !candidate.isEntry);
          if (chunk) closure(chunk).forEach((file) => files.add(file));
        });
        entryGraph.forEach((file) => files.delete(file));
        if (files.size === 0) return [];
        const link = [...files].map((file) => `</${file}>; rel=modulepreload`).join(', ');
        return [route, `  Link: ${link}`, ''];
      });
    },
    closeBundle() {
      const target = path.resolve(outDir, '_headers');
      if (!existsSync(target) || lines.length === 0) return;
      const current = readFileSync(target, 'utf8');
      const block = ['', '# Generated at build time: per-route modulepreload hints (see vite.config.ts).', ...lines].join('\n');
      writeFileSync(target, current.trimEnd() + '\n' + block);
    },
  };
}

function edgeApiDevPlugin(): Plugin {
  return {
    name: 'baraza:edge-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }
        try {
          const { dispatchApiRoute } = await server.ssrLoadModule('../cloudflare/edgeRouter.ts');
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
          req.on('end', async () => {
            try {
              const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method || '') && chunks.length > 0;
              const body = hasBody ? Buffer.concat(chunks) : undefined;
              const fullUrl = `http://${req.headers.host || 'localhost:5173'}${req.url}`;
              const headers = new Headers();
              for (const [key, val] of Object.entries(req.headers)) {
                if (val !== undefined) {
                  if (Array.isArray(val)) {
                    val.forEach((v) => headers.append(key, v));
                  } else {
                    headers.set(key, val);
                  }
                }
              }
              const webReq = new Request(fullUrl, {
                method: req.method,
                headers,
                body,
              });
              const response = await dispatchApiRoute(webReq);
              res.statusCode = response.status;
              response.headers.forEach((val: string, key: string) => {
                res.setHeader(key, val);
              });
              const resBody = Buffer.from(await response.arrayBuffer());
              res.end(resBody);
            } catch (err) {
              next(err);
            }
          });
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), routePreloadHeaders(), edgeApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@integrations': path.resolve(import.meta.dirname, '../packages/integrations/src'),
      '@coop-templates': path.resolve(import.meta.dirname, '../packages/coop-templates/src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    // Preload the static import graph so the entry, react-vendor and ui-vendor
    // chunks download in parallel instead of one after another. The old CDN
    // cache mismatch this used to guard against was specific to the wallet
    // adapter chunks on the previous host; those chunks are now lazy and only
    // load on operator routes, so nothing preloads them.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: chunkName,
      },
    },
  },
});
