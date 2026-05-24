#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { SUPPORTED_NETWORKS } from "./networkConfig.mjs";

dotenv.config({ quiet: true });

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function parseArgs(argv) {
  const args = { write: false, chainIds: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--write") {
      args.write = true;
      continue;
    }

    if (arg.startsWith("--chain-ids=")) {
      const value = arg.split("=")[1] || "";
      args.chainIds = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }

    if (arg === "--chain-ids") {
      const next = argv[i + 1] || "";
      args.chainIds = next
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i++;
      continue;
    }
  }

  return args;
}

function getOwner(manager, rpcAlias) {
  const out = execFileSync("cast", ["call", manager, "owner()(address)", "--rpc-url", rpcAlias], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  }).trim();

  if (!ADDRESS_RE.test(out)) {
    throw new Error(`invalid owner response: ${out}`);
  }

  return out;
}

function run() {
  const { write, chainIds } = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const addressesDir = path.join(repoRoot, "addresses");

  const configByChainId = Object.fromEntries(SUPPORTED_NETWORKS.map((n) => [n.chainId, n]));

  const selectedChains = chainIds.length
    ? chainIds.filter((id) => configByChainId[id])
    : SUPPORTED_NETWORKS.map((n) => n.chainId);
  const skipped = chainIds.filter((id) => !configByChainId[id]);

  if (skipped.length > 0) {
    console.log(`Skipping unsupported chain ids: ${skipped.join(", ")}`);
  }

  let changed = 0;
  let checked = 0;

  for (const chainId of selectedChains) {
    const cfg = configByChainId[chainId];
    const filePath = path.join(addressesDir, `${chainId}.json`);

    if (!existsSync(filePath)) {
      console.log(`[${chainId}] ${cfg.label}: addresses file not found, skipping`);
      continue;
    }

    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    const manager = parsed.Manager;

    if (!ADDRESS_RE.test(manager || "")) {
      console.log(`[${chainId}] ${cfg.label}: invalid Manager address, skipping`);
      continue;
    }

    let owner;
    try {
      owner = getOwner(manager, cfg.alias);
    } catch (error) {
      const details = error?.stderr?.toString()?.trim() || error?.message || "unknown error";
      console.log(
        `[${chainId}] ${cfg.label}: failed to read owner (manager=${manager}, rpcAlias=${cfg.alias}): ${details}`
      );
      continue;
    }

    checked++;

    const previous = parsed.ManagerOwner;
    const isDifferent = previous !== owner;

    if (isDifferent) {
      parsed.ManagerOwner = owner;
      changed++;
      console.log(`[${chainId}] ${cfg.label}: ${previous || "<missing>"} -> ${owner}`);

      if (write) {
        writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
      }
    } else {
      console.log(`[${chainId}] ${cfg.label}: up to date (${owner})`);
    }
  }

  console.log(
    `\nChecked ${checked} chain(s), ${changed} change(s)${write ? " written" : " detected"}.`
  );
  if (!write && changed > 0) {
    process.exitCode = 1;
  }
}

run();
