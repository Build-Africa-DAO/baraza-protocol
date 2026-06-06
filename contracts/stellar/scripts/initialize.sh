#!/usr/bin/env bash
# Call `initialize` on each deployed contract.
# Must be run after deploy.sh — reads addresses from addresses/<network>.json.
#
# Usage:
#   ADMIN_ADDRESS=G... ./initialize.sh
#   STELLAR_NETWORK=mainnet ADMIN_ADDRESS=G... ./initialize.sh

set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${SOURCE_ACCOUNT:-default}"
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADDRESSES_FILE="${WORKSPACE_DIR}/addresses/${NETWORK}.json"

if [[ ! -f "${ADDRESSES_FILE}" ]]; then
  echo "ERROR: ${ADDRESSES_FILE} not found — run deploy.sh first." >&2
  exit 1
fi

if [[ -z "${ADMIN_ADDRESS:-}" ]]; then
  echo "ERROR: ADMIN_ADDRESS must be set to a Stellar G-account." >&2
  exit 1
fi

# ── Read contract IDs ─────────────────────────────────────────────────────────
read_id() {
  grep "\"$1\"" "${ADDRESSES_FILE}" | sed 's/.*: "\(.*\)".*/\1/'
}

PAYMENT_ATTESTATION_ID=$(read_id "payment_attestation")
TREASURY_VAULT_ID=$(read_id "treasury_vault")
COMMUNITY_REGISTRY_ID=$(read_id "community_registry")
MEMBERSHIP_ID=$(read_id "membership")
GOVERNANCE_ID=$(read_id "governance")

invoke() {
  local contract="$1"; shift
  stellar contract invoke \
    --id "${contract}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- "$@"
}

echo "==> Initializing contracts on ${NETWORK}..."

echo "  payment_attestation..."
invoke "${PAYMENT_ATTESTATION_ID}" initialize --admin "${ADMIN_ADDRESS}"

echo "  community_registry..."
invoke "${COMMUNITY_REGISTRY_ID}" initialize --owner "${ADMIN_ADDRESS}"

echo "  membership..."
invoke "${MEMBERSHIP_ID}" initialize \
  --admin "${ADMIN_ADDRESS}" \
  --registry "${COMMUNITY_REGISTRY_ID}"

echo "  governance..."
invoke "${GOVERNANCE_ID}" initialize \
  --admin "${ADMIN_ADDRESS}" \
  --membership "${MEMBERSHIP_ID}" \
  --voting_period null

echo ""
echo "==> All contracts initialized."
echo ""
echo "Note: treasury_vault requires per-community initialization."
echo "Call: stellar contract invoke --id ${TREASURY_VAULT_ID} -- initialize"
echo "  --community_id <id> --token <token_address>"
echo "  --signers '[\"G...\",\"G...\"]' --threshold <n>"
