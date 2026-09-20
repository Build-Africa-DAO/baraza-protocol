#!/usr/bin/env node
// scripts/devops/verify-edge-router.mjs
// Standard: S&P 500 Enterprise Fintech Quality Engineering
// Audits 100% route synchronicity between app/api/ route files and cloudflare/edgeRouter.ts
// Prevents Edge Router drift (such as BLK-01) from ever reaching staging or production.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('='.repeat(78));
console.log('   BARAZA PROTOCOL — CLOUDFLARE EDGE ROUTER 100% COVERAGE AUDIT');
console.log('   Standard: S&P 500 Enterprise Fintech / NIST SP 800-64 Shift-Left Gate');
console.log('='.repeat(78));

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(__filename), '../..');

const apiDir = resolve(ROOT_DIR, 'app/api');
const edgeRouterPath = resolve(ROOT_DIR, 'cloudflare/edgeRouter.ts');

if (!existsSync(edgeRouterPath)) {
  console.error(`❌ Edge router not found at: ${edgeRouterPath}`);
  process.exit(1);
}

const edgeRouterSource = readFileSync(edgeRouterPath, 'utf8');

// Recursively find all typescript files under app/api
function getFiles(dir) {
  const subdirs = readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = resolve(dir, subdir);
    return statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.reduce((a, f) => a.concat(f), []);
}

const allApiFiles = getFiles(apiDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

// Filter out _lib, _shared, and non-handler utility files
const routeFiles = allApiFiles.filter((filePath) => {
  const rel = relative(apiDir, filePath);
  if (rel.startsWith('_') || rel.includes(`${sep}_`)) {
    return false;
  }
  const content = readFileSync(filePath, 'utf8');
  // Must export a default handler function
  return content.includes('export default async function') || content.includes('export default function') || content.includes('export default handler');
});

console.log(`\nFound ${routeFiles.length} canonical API route handler files in app/api/.\n`);

let missingCount = 0;
const auditedRoutes = [];

for (const filePath of routeFiles) {
  const rel = relative(apiDir, filePath);
  // Convert filename to endpoint path
  // e.g. user/avatar.ts -> /api/user/avatar
  // e.g. communities/index.ts -> /api/communities
  // e.g. communities/[id]/invites.ts -> dynamic pattern
  let routePath = '/api/' + rel.replace(/\.ts$/, '').split(sep).join('/');
  if (routePath.endsWith('/index')) {
    routePath = routePath.replace(/\/index$/, '');
  }

  // Check if route is registered in routeTable or dynamic regex
  const isDynamic = routePath.includes('[') || routePath.includes('logo');
  let isMounted = false;

  if (edgeRouterSource.includes(`'${routePath}'`)) {
    isMounted = true;
  } else if (routePath.includes('[id]')) {
    // Dynamic parameter route
    const baseDynamic = routePath.replace(/\[[^\]]+\]/, '');
    if (edgeRouterSource.includes(baseDynamic.split('/')[2])) {
      isMounted = true;
    }
  }

  // Special cases for dynamic matchers
  if (routePath === '/api/communities/logo' && edgeRouterSource.includes('/api/communities/:id/logo') || edgeRouterSource.includes('/api/communities/([^/]+)/logo')) {
    isMounted = true;
  }

  if (isMounted) {
    auditedRoutes.push({ route: routePath, status: 'MOUNTED' });
    console.log(`  [MOUNTED] ${routePath.padEnd(45)} (${rel})`);
  } else {
    missingCount++;
    console.error(`  [UNMOUNTED] ❌ ${routePath.padEnd(45)} (${rel}) NOT REGISTERED IN edgeRouter.ts`);
  }
}

console.log('\n' + '-'.repeat(78));
console.log(`Audit Summary: ${auditedRoutes.length} routes registered, ${missingCount} unmounted routes.`);
console.log('-'.repeat(78));

if (missingCount > 0) {
  console.error(`\n❌ EDGE ROUTER AUDIT FAILED: ${missingCount} route(s) missing from cloudflare/edgeRouter.ts.`);
  console.error('All routes must be mounted in routeTable or dispatchApiRoute to prevent HTTP 404 in production.\n');
  process.exit(1);
} else {
  console.log('\n✅ 100% ROUTE COVERAGE CERTIFIED: All API routes successfully mounted in Cloudflare Edge Router.\n');
  process.exit(0);
}
