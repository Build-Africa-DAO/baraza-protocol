Reference Soroban contracts for community registry, membership, governance, payment attestation,
and treasury custody. Build target: `wasm32v1-none`.

`treasury_vault` supports community-signer-controlled bounty payouts. A separate coordinator may
create a payout proposal, but only the configured signer threshold can make it executable. The vault
token is fixed at initialization; the first production bounty vault must use Circle USDC. Deploy a new
contract for this version and record its contract and token addresses. Do not overwrite previously
recorded deployed addresses.

Run the vault tests with:

```bash
cargo test -p treasury-vault
```

See `docs/BOUNTY_PAYOUT_CONTRACT_SPEC.md` for the payout lifecycle and deployment gates.
