# Solana Devnet Deployment

> Baraza Protocol — five Anchor programs deployed to Solana devnet

## Programs

| # | Program | Description | Devnet Program ID | Explorer |
|---|---------|-------------|-------------------|----------|
| 1 | **community_registry** | Community creation, metadata, and registry management | `Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD` | [Solscan](https://solscan.io/account/Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD?cluster=devnet) |
| 2 | **governance** | Proposal creation, voting, and execution | `DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A` | [Solscan](https://solscan.io/account/DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A?cluster=devnet) |
| 3 | **membership** | Member credentials and access control | `34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK` | [Solscan](https://solscan.io/account/34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK?cluster=devnet) |
| 4 | **payment_attestation** | Payment verification and attestation | `Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT` | [Solscan](https://solscan.io/account/Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT?cluster=devnet) |
| 5 | **treasury_vault** | Treasury management and fund release | `ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy` | [Solscan](https://solscan.io/account/ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy?cluster=devnet) |

> **Note:** The program IDs above are the deterministic addresses derived from the deployer keypair at `~/.config/solana/id.json`. They match the `[programs.localnet]` section in `Anchor.toml`. When deploying with a different keypair, new IDs will be generated. See [Key Management](#key-management) below.

## Deploy Checklist

### Prerequisites

- Solana CLI ≥ 1.18
- Anchor CLI ≥ 0.30
- Rust ≥ 1.77
- Node.js ≥ 20

```bash
# Verify tooling
solana --version
anchor --version
rustc --version
node --version
```

### Step 1: Configure Solana CLI for Devnet

```bash
solana config set --url devnet
solana config get
# Expected: Config File → ~/.config/solana/cli/config.yml
#           RPC URL      → https://api.devnet.solana.com
#           Keypair Path → ~/.config/solana/id.json
```

### Step 2: Fund the Deployer Wallet

Devnet SOL is free and available from faucets:

```bash
# Show your deployer address
solana address

# Request devnet SOL
solana airdrop 5
# Repeat if needed — each airdrop gives 2 SOL; deploy requires ~3-4 SOL total
solana balance
```

Alternative faucets:
- [Solana Faucet](https://faucet.solana.com) — select Devnet
- `solana airdrop 2` (devnet default, may be rate-limited)

### Step 3: Build Programs

```bash
# From repo root
anchor build

# Verify all five programs compiled
ls -la target/deploy/
# Expected: baraza_community_registry.so, baraza_governance.so,
#           baraza_membership.so, baraza_payment_attestation.so,
#           baraza_treasury_vault.so
```

### Step 4: Update Anchor.toml for Devnet

Open `Anchor.toml` and change:

```toml
[provider]
cluster = "devnet"    # was: "localnet"
```

### Step 5: Deploy Programs

Deploy each program in order (community_registry first, as others may depend on it):

```bash
# Deploy individually (recommended for visibility)
anchor deploy --program-name community_registry
anchor deploy --program-name governance
anchor deploy --program-name membership
anchor deploy --program-name payment_attestation
anchor deploy --program-name treasury_vault

# Or deploy all at once
anchor deploy
```

**Expected output per deploy:**
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: ~/.config/solana/id.json
Signature: <base58-transaction-signature>
Program Id: <program-id>
```

### Step 6: Record Deploy Transaction Signatures

After deployment, record the on-chain signatures for each program:

```bash
# Example — replace with actual signatures from step 5
anchor deploy --program-name community_registry 2>&1 | grep "Signature:"
# → Deploy community_registry: 5KtN3...[signature]
```

Store the signatures in `protocol-artifacts/solana/devnet-deployments.json`:

```json
{
  "network": "devnet",
  "timestamp": "<ISO-8601>",
  "deployer": "<your-public-key>",
  "programs": {
    "community_registry": {
      "address": "Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD",
      "deploySignature": "<actual-signature>",
      "explorer": "https://solscan.io/account/Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD?cluster=devnet"
    },
    "governance": {
      "address": "DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A",
      "deploySignature": "<actual-signature>",
      "explorer": "https://solscan.io/account/DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A?cluster=devnet"
    },
    "membership": {
      "address": "34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK",
      "deploySignature": "<actual-signature>",
      "explorer": "https://solscan.io/account/34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK?cluster=devnet"
    },
    "payment_attestation": {
      "address": "Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT",
      "deploySignature": "<actual-signature>",
      "explorer": "https://solscan.io/account/Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT?cluster=devnet"
    },
    "treasury_vault": {
      "address": "ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy",
      "deploySignature": "<actual-signature>",
      "explorer": "https://solscan.io/account/ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy?cluster=devnet"
    }
  }
}
```

### Step 7: Run Smoke Test

```bash
# From repo root
npm install   # installs anchor + solana deps
npm run test:contracts:drift   # runs tests/anchor-smoke.mjs
```

The smoke test verifies:
- All five program IDs match the deployed addresses
- Drift guards: hardcoded program IDs in source match `Anchor.toml`
- Account discriminators match generated values
- PDA derivation produces expected addresses

**Expected output:**
```
✓ All program IDs match Anchor.toml
✓ Drift guards passed: governance, membership, payment_attestation, treasury_vault
✓ Account discriminators validated
```

### Step 8: Update Environment Variables

Update `app/.env.example` (and actual deployment env vars in Vercel):

```env
VITE_SOLANA_NETWORK=devnet
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
```

## Troubleshooting

### "Account not found" when deploying

The deployer keypair has insufficient devnet SOL. Re-airdrop:
```bash
solana airdrop 2
```

### "insufficient funds" during deploy

Each `.so` file is ~1-2 MB. A 2 MB program deploy costs ~2.5 SOL.
```bash
solana balance
# Minimum: 4 SOL for all five programs
```

### Transaction simulation failed: Blockhash not found

Devnet is congested. Retry with:
```bash
solana config set --url https://api.devnet.solana.com  # fresh connection
anchor deploy --program-name <name>  # retry
```

### Drift guard test fails after deploy

If you deployed with a different keypair, the program IDs in `Anchor.toml` and source code won't match. Either:
- Re-deploy with the original keypair, or
- Update program IDs in all source files

```bash
anchor keys list  # shows current derived IDs for your keypair
# Update Anchor.toml [programs.devnet] section
```

### npm run test:contracts:drift fails

Ensure you're running from the repo root and `npm install` completed:
```bash
npm install
ls tests/anchor-smoke.mjs  # must exist
npm run test:contracts:drift
```

## Key Management

- **Default keypair:** `~/.config/solana/id.json` — used by `anchor deploy`
- **Program ID derivation:** `anchor keys list` shows deterministic IDs for your keypair
- **Upgrade authority:** The deployer keypair is the upgrade authority by default
- **To use a different deployer:** Set `ANCHOR_WALLET` environment variable or update `wallet` in `Anchor.toml`

To rotate upgrade authority (recommended for production):
```bash
anchor upgrade --program-id <ID> --upgrade-authority <new-keypair> target/deploy/<program>.so
```

## Post-Deployment Verification

| Check | Command | Expected |
|-------|---------|----------|
| Program exists | `solana program show <program-id>` | Shows program data, slot, authority |
| Balance check | `solana balance` | ≥ 0.01 SOL (for tx fees) |
| Smoke test | `npm run test:contracts:drift` | All checks pass |
| Frontend loads | `VITE_SOLANA_NETWORK=devnet` build | UI shows devnet RPC |

---

> **Status:** Programs are deterministic-keypair-ready for devnet. Deploy steps above produce the addresses listed in the Programs table. After deployment, replace placeholder signatures in `protocol-artifacts/solana/devnet-deployments.json` with actual values from Step 6.
