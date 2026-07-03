#!/usr/bin/env node
// SPDX-License-Identifier: BUSL-1.1

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

function castCall(address, signature, rpcAlias) {
  try {
    return execFileSync("cast", ["call", address, signature, "--rpc-url", rpcAlias], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    }).trim();
  } catch (error) {
    const details = error?.stderr?.toString()?.trim() || error?.message || "unknown error";
    throw new Error(
      `cast call failed (address=${address}, signature=${signature}, rpcAlias=${rpcAlias}): ${details}`
    );
  }
}

function getBarazaRewardsRecipient(manager, rpcAlias) {
  const out = castCall(manager, "barazaRewardsRecipient()(address)", rpcAlias);
  if (!ADDRESS_RE.test(out)) {
    throw new Error(`invalid recipient response: ${out}`);
  }
  return out;
}

function getBps(auctionImpl, rpcAlias) {
  const baraza = castCall(auctionImpl, "barazaRewardsBPS()(uint16)", rpcAlias);
  const referral = castCall(auctionImpl, "referralRewardsBPS()(uint16)", rpcAlias);
  return { baraza, referral };
}

function run() {
  const { write, chainIds } = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const addressesDir = path.join(repoRoot, "addresses");

  const configByChainId = Object.fromEntries(SUPPORTED_NETWORKS.map((n) => [n.chainId, n]));
  const configByAlias = Object.fromEntries(SUPPORTED_NETWORKS.map((n) => [n.alias, n]));

  const selectedChains = chainIds.length
    ? chainIds.filter((id) => configByChainId[id])
    : SUPPORTED_NETWORKS.map((n) => n.chainId);
  const unsupportedChainIds = chainIds.filter((id) => !configByChainId[id]);

  if (unsupportedChainIds.length > 0) {
    console.log(`Skipping unsupported chain ids: ${unsupportedChainIds.join(", ")}`);
  }

  let checked = 0;
  let changed = 0;

  for (const chainId of selectedChains) {
    const cfg = configByChainId[chainId];
    const aliasChain = configByAlias[cfg.alias];
    if (aliasChain.chainId !== chainId) {
      console.error(
        `[${chainId}] ${cfg.label}: RPC alias '${cfg.alias}' resolves to chain ${aliasChain.chainId} — skipping to prevent wrong-chain write.`
      );
      continue;
    }
    const filePath = path.join(addressesDir, `${chainId}.json`);

    if (!existsSync(filePath)) {
      console.log(`[${chainId}] ${cfg.label}: addresses file not found, skipping`);
      continue;
    }

    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    const manager = parsed.Manager;
    const auctionImpl = parsed.Auction;
    const configuredRecipient = parsed.BarazaRewardsRecipient;

    if (!ADDRESS_RE.test(manager || "")) {
      console.log(`[${chainId}] ${cfg.label}: invalid Manager address, skipping`);
      continue;
    }
    if (!ADDRESS_RE.test(auctionImpl || "")) {
      console.log(`[${chainId}] ${cfg.label}: invalid Auction address, skipping`);
      continue;
    }

    let onchainRecipient = null;
    let recipientStatus = "UNAVAILABLE";
    let recipientReason = "";
    let bpsOutput = "N/A";
    let bpsReason = "";

    try {
      onchainRecipient = getBarazaRewardsRecipient(manager, cfg.alias);
      recipientStatus =
        ADDRESS_RE.test(configuredRecipient || "") &&
        configuredRecipient.toLowerCase() === onchainRecipient.toLowerCase()
          ? "MATCH"
          : "MISMATCH";

      if (recipientStatus === "MISMATCH") {
        changed++;
        if (write) {
          parsed.BarazaRewardsRecipient = onchainRecipient;
          writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
        }
      }
    } catch (error) {
      recipientStatus = "UNAVAILABLE";
      const msg = error.message || "unknown error";
      recipientReason = msg.includes("execution reverted")
        ? "legacy or not exposed on current manager"
        : msg;
    }

    try {
      const bps = getBps(auctionImpl, cfg.alias);
      bpsOutput = `${bps.baraza}/${bps.referral}`;
    } catch (error) {
      bpsOutput = "N/A";
      const msg = error.message || "unknown error";
      bpsReason = msg.includes("execution reverted")
        ? "legacy or not exposed on current auction"
        : msg;
    }

    checked++;
    console.log(
      `[${chainId}] ${cfg.label}: recipient=${configuredRecipient || "<missing>"} onchain=${
        onchainRecipient || "<unavailable>"
      } status=${recipientStatus}${
        recipientReason ? ` (${recipientReason})` : ""
      } bps(baraza/referral)=${bpsOutput}${bpsReason ? ` (${bpsReason})` : ""}`
    );
  }

  console.log(`\nChecked ${checked} chain(s), ${changed} file(s) updated.`);
  if (!write && changed > 0) {
    process.exitCode = 1;
  }
}

run();

