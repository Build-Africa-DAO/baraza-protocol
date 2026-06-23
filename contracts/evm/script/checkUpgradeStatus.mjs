#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { SUPPORTED_NETWORKS, byAlias } from "./networkConfig.mjs";

dotenv.config({ quiet: true });

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const NETWORK = process.env.NETWORK || "mainnet";

// Known legacy bases for explicit registration checks.
// Mainnet has both 1.1.0 and 1.2.0 cohorts.
const LEGACY_BASES_BY_CHAIN = {
  1: {
    token: [
      "0xe6322201ceD0a4D6595968411285A39ccf9d5989",
      "0xAeD75D1e5c1821E2EC29D5d24b794b13C34c5d63",
    ],
    auction: [
      "0x2661fe1a882AbFD28AE0c2769a90F327850397c6",
      "0x785708d09b89C470aD7B5b3f8ac804cE72B6b282",
    ],
    governor: [
      "0x9eefEF0891b1895af967fe48C5D7D96E984B96a3",
      "0x46eA3fd17DEb7B291AeA60E67E5cB3a104FEa11D",
    ],
  },
};

function cast(args, rpcAlias) {
  return execFileSync("cast", [...args, "--rpc-url", rpcAlias], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  }).trim();
}

function getChainId(rpcAlias) {
  try {
    return cast(["chain-id"], rpcAlias);
  } catch (error) {
    const details = error?.stderr?.toString()?.trim() || error?.message || "unknown error";
    throw new Error(`failed to resolve chain id for NETWORK=${rpcAlias}: ${details}`);
  }
}

function safeCall(address, signature, rpcAlias, extra = []) {
  try {
    return cast(["call", address, signature, ...extra], rpcAlias);
  } catch (error) {
    const details = error?.stderr?.toString()?.trim() || error?.message || "unknown error";
    return `<error: ${details}>`;
  }
}

function boolRegistered(manager, baseImpl, upgradeImpl, rpcAlias) {
  const out = safeCall(manager, "isRegisteredUpgrade(address,address)(bool)", rpcAlias, [
    baseImpl,
    upgradeImpl,
  ]);
  return out.toLowerCase() === "true" ? "true" : out.toLowerCase() === "false" ? "false" : out;
}

function main() {
  const cfg = byAlias(NETWORK);
  if (!cfg) {
    const known = SUPPORTED_NETWORKS.map((n) => n.alias).join(", ");
    throw new Error(`Unsupported NETWORK=${NETWORK}. Known networks: ${known}`);
  }

  const rpcAlias = NETWORK;
  const chainId = getChainId(rpcAlias);

  if (chainId !== cfg.chainId) {
    console.error(
      `Chain mismatch: NETWORK=${NETWORK} expects chain ${cfg.chainId} but RPC alias '${rpcAlias}' resolved to chain ${chainId}. Aborting to prevent cross-chain report.`
    );
    process.exit(1);
  }

  const addressesPath = path.join(process.cwd(), "addresses", `${chainId}.json`);
  const addrs = JSON.parse(readFileSync(addressesPath, "utf8"));

  const manager = addrs.Manager;
  const tokenUpgradeImpl = addrs.Token;
  const auctionUpgradeImpl = addrs.Auction;
  const governorUpgradeImpl = addrs.Governor;

  const missingKeys = [];
  for (const [key, val] of [
    ["Manager", manager],
    ["Token", tokenUpgradeImpl],
    ["Auction", auctionUpgradeImpl],
    ["Governor", governorUpgradeImpl],
  ]) {
    if (!ADDRESS_RE.test(val || "")) {
      missingKeys.push(key);
    }
  }
  if (missingKeys.length > 0) {
    console.error(
      `Config error in addresses/${chainId}.json: missing or invalid fields: ${missingKeys.join(
        ", "
      )}.`
    );
    process.exit(1);
  }

  console.log(`Network: ${cfg.label} (${chainId})`);
  console.log(`RPC alias: ${rpcAlias}`);
  console.log(`Address file: addresses/${chainId}.json`);
  console.log(`Manager: ${manager}`);
  console.log("");

  console.log("== Manager Latest State ==");
  console.log("owner:", safeCall(manager, "owner()(address)", rpcAlias));
  console.log("tokenImpl:", safeCall(manager, "tokenImpl()(address)", rpcAlias));
  console.log("metadataImpl:", safeCall(manager, "metadataImpl()(address)", rpcAlias));
  console.log("auctionImpl:", safeCall(manager, "auctionImpl()(address)", rpcAlias));
  console.log("treasuryImpl:", safeCall(manager, "treasuryImpl()(address)", rpcAlias));
  console.log("governorImpl:", safeCall(manager, "governorImpl()(address)", rpcAlias));
  console.log(
    "getLatestVersions:",
    safeCall(manager, "getLatestVersions()((string,string,string,string,string))", rpcAlias)
  );
  console.log("");

  console.log("== Target Upgrade Implementations ==");
  console.log("token target:", tokenUpgradeImpl);
  console.log("auction target:", auctionUpgradeImpl);
  console.log("governor target:", governorUpgradeImpl);
  console.log("");

  const legacyBases = LEGACY_BASES_BY_CHAIN[chainId];
  if (!legacyBases) {
    console.log("No explicit legacy base matrix configured for this chain.");
    return;
  }

  console.log("== Registered Upgrades ==");
  for (const base of legacyBases.token) {
    console.log(
      `token ${base} -> ${tokenUpgradeImpl}:`,
      boolRegistered(manager, base, tokenUpgradeImpl, rpcAlias)
    );
  }
  for (const base of legacyBases.auction) {
    console.log(
      `auction ${base} -> ${auctionUpgradeImpl}:`,
      boolRegistered(manager, base, auctionUpgradeImpl, rpcAlias)
    );
  }
  for (const base of legacyBases.governor) {
    console.log(
      `governor ${base} -> ${governorUpgradeImpl}:`,
      boolRegistered(manager, base, governorUpgradeImpl, rpcAlias)
    );
  }

  console.log("");
  console.log("== Target Versions ==");
  console.log("token version:", safeCall(tokenUpgradeImpl, "contractVersion()(string)", rpcAlias));
  console.log(
    "auction version:",
    safeCall(auctionUpgradeImpl, "contractVersion()(string)", rpcAlias)
  );
  console.log(
    "governor version:",
    safeCall(governorUpgradeImpl, "contractVersion()(string)", rpcAlias)
  );
}

main();
