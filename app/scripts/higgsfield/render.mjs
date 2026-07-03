#!/usr/bin/env node
// Render the Baraza brand teaser via the Higgsfield Cloud API.
// Reads shots.json, generates a Soul image per shot, animates it via DoP,
// downloads each 5s mp4 into ./output/, then prints the ffmpeg concat command.
//
// Required env vars (read from process.env or app/.env.local):
//   HIGGSFIELD_API_KEY
//   HIGGSFIELD_API_KEY_SECRET
//
// Optional env vars:
//   HIGGSFIELD_API_BASE   default: https://platform.higgsfield.ai
//   POLL_INTERVAL_MS      default: 5000
//   POLL_TIMEOUT_MS       default: 600000  (10 min per job)
//
// Run:  node app/scripts/higgsfield/render.mjs
//       node app/scripts/higgsfield/render.mjs --only 01_cash,03_mpesa
//       node app/scripts/higgsfield/render.mjs --skip-image  (animate only — requires image_url per shot)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(HERE, 'output');
const SHOTS_PATH = join(HERE, 'shots.json');

const API_BASE = process.env.HIGGSFIELD_API_BASE ?? 'https://platform.higgsfield.ai';
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 5000);
const POLL_TIMEOUT_MS = Number(process.env.POLL_TIMEOUT_MS ?? 600_000);

await loadDotEnv(resolve(HERE, '../../.env.local'));

const apiKey = process.env.HIGGSFIELD_API_KEY;
const apiSecret = process.env.HIGGSFIELD_API_KEY_SECRET;
if (!apiKey || !apiSecret) {
  console.error('Missing HIGGSFIELD_API_KEY or HIGGSFIELD_API_KEY_SECRET. See app/docs/HIGGSFIELD_PROMPTS.md.');
  process.exit(1);
}
const AUTH_HEADER = `Key ${apiKey}:${apiSecret}`;

const args = parseArgs(process.argv.slice(2));
const config = JSON.parse(await readFile(SHOTS_PATH, 'utf8'));
const shots = filterShots(config.shots, args.only);

if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true });

const manifest = [];
for (const shot of shots) {
  console.log(`\n=== ${shot.id} — ${shot.title} ===`);

  let imageUrl = shot.image_url;
  if (!imageUrl && !args.skipImage) {
    console.log('  [image] submitting…');
    const { request_id } = await submit(config.defaults.image_model, {
      prompt: shot.image_prompt,
      aspect_ratio: config.defaults.aspect_ratio,
      resolution: config.defaults.resolution,
    });
    const result = await poll(request_id);
    imageUrl = result.images?.[0]?.url;
    if (!imageUrl) throw new Error(`No image URL returned for shot ${shot.id}`);
    console.log(`  [image] ${imageUrl}`);
  }
  if (!imageUrl) throw new Error(`Shot ${shot.id} has no image_url and --skip-image was set`);

  console.log('  [video] submitting…');
  const { request_id: videoReq } = await submit(config.defaults.video_model, {
    prompt: shot.motion_prompt,
    image_url: imageUrl,
    duration: config.defaults.duration,
    aspect_ratio: config.defaults.aspect_ratio,
    resolution: config.defaults.resolution,
  });
  const videoResult = await poll(videoReq);
  const videoUrl = videoResult.video?.url;
  if (!videoUrl) throw new Error(`No video URL returned for shot ${shot.id}`);
  console.log(`  [video] ${videoUrl}`);

  const dest = join(OUTPUT_DIR, `shot_${shot.id}.mp4`);
  await download(videoUrl, dest);
  console.log(`  [save] ${dest}`);
  manifest.push({ id: shot.id, title: shot.title, file: dest, image_url: imageUrl, video_url: videoUrl });
}

await writeFile(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('\n=== Done. Stitch with: ===\n');
console.log(`cd ${OUTPUT_DIR}`);
console.log(`(${manifest.map((m) => `echo file 'shot_${m.id}.mp4'`).join(' & ')}) > concat.txt`);
console.log(`ffmpeg -f concat -safe 0 -i concat.txt -c copy baraza-teaser-no-audio.mp4`);
console.log(`ffmpeg -i baraza-teaser-no-audio.mp4 -i music.mp3 -c:v copy -c:a aac -shortest baraza-teaser-30s.mp4`);

// ---------- helpers ----------

async function submit(modelId, body) {
  const res = await fetch(`${API_BASE}/${modelId}`, {
    method: 'POST',
    headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`submit ${modelId} -> ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (!json.request_id) throw new Error(`submit ${modelId} returned no request_id: ${JSON.stringify(json)}`);
  return json;
}

async function poll(requestId) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const res = await fetch(`${API_BASE}/requests/${requestId}/status`, {
      headers: { 'Authorization': AUTH_HEADER },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`poll ${requestId} -> ${res.status}: ${text}`);
    }
    const json = await res.json();
    if (json.status === 'completed') return json;
    if (json.status === 'failed') throw new Error(`Job ${requestId} failed: ${JSON.stringify(json)}`);
    if (json.status === 'nsfw') throw new Error(`Job ${requestId} flagged NSFW — rewrite the prompt`);
    process.stdout.write(`    ${json.status} (${Math.round((Date.now() - start) / 1000)}s)\r`);
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Job ${requestId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function parseArgs(argv) {
  const args = { only: null, skipImage: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') { args.only = argv[++i]?.split(',') ?? []; }
    else if (argv[i] === '--skip-image') { args.skipImage = true; }
  }
  return args;
}

function filterShots(all, only) {
  if (!only?.length) return all;
  const set = new Set(only);
  const matched = all.filter((s) => set.has(s.id));
  if (!matched.length) throw new Error(`No shots matched --only ${only.join(',')}`);
  return matched;
}

async function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = await readFile(path, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.replace(/^['"]|['"]$/g, '');
  }
}
