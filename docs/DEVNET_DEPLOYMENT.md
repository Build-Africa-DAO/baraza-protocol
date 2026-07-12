# Solana Devnet Deployment & Smoke Test

## Deployed Programs

| Program | Devnet Address | Explorer |
|---------|---------------|----------|
| Community Registry | `Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD` | [View](https://explorer.solana.com/address/Ggj4e8YjiDdpbcudKz6BLx5arT9nf7BQR498VnLXd7eD?cluster=devnet) |
| Governance | `DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A` | [View](https://explorer.solana.com/address/DzMhDFtq2s2bUn4LNDVzDLLnbbRQ8jW1FKeWPQDDq25A?cluster=devnet) |
| Membership | `34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK` | [View](https://explorer.solana.com/address/34MQRw2XSScvMYTiyYLix31qnrmh9vARwpmXM6ycNtuK?cluster=devnet) |
| Payment Attestation | `Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT` | [View](https://explorer.solana.com/address/Az2CdHJFBLxRY6pigkYSsni6A8N1dQo3JUp3d62NGVpT?cluster=devnet) |
| Treasury Vault | `ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy` | [View](https://explorer.solana.com/address/ApPdkfooQLdVN8gAXRnddbtttruYNihiwjanYtXUnxYy?cluster=devnet) |

## Deploy Transaction Signatures

Deployment transactions are recorded on-chain. Verify each program deployment:

```bash
solana confirm -v <transaction-signature> --cluster devnet
```

## Smoke Test

### Prerequisites

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
```

### Run Smoke Test

```bash
anchor test --skip-deploy --provider.cluster devnet
```

Expected output: All 5 programs respond with valid account data.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cluster not reachable | Check RPC at https://api.devnet.solana.com |
| Account not found | Verify program ID matches the deployed address |
| Insufficient funds | Run `solana airdrop 2` for devnet SOL |
| Program mismatch | Rebuild with `anchor build` and redeploy |
