# Stellar contracts

Soroban reference implementation for the Baraza protocol. The current v2
workspace contains community registry, membership, governance, payment
attestation, and treasury vault contracts.

Build and deployment scripts live in `scripts/`. A v2 deployment writes its
five contract IDs to `addresses/<network>.json`. The legacy v1 testnet suite
(membership, governance, vesting, and its TBRZA test asset) is recorded
separately in `addresses/testnet-v1.json`; do not use that file to initialize v2.

Architecture and historical deployment decisions are recorded in
`docs/decisions/`.
