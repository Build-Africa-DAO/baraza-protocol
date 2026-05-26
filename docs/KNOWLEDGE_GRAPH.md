# Baraza Knowledge Graph

The knowledge graph is the project memory for Baraza. It links communities, chain rails, proposals, bounties, Asha security checks, and readiness tasks so product and engineering decisions stay connected as the build moves toward testnet.

## Source

The current graph is generated in:

- `app/src/lib/knowledgeGraph.ts`

It is intentionally local and version-controlled. It can later be backed by The Graph, Supabase, Neo4j, or another graph database without changing the product language.

## Current node types

- `community`
- `chain`
- `proposal`
- `bounty`
- `security-review`
- `readiness-task`
- `capability`

## Current edge types

- `uses-chain`
- `has-proposal`
- `has-bounty`
- `has-review`
- `needs-task`
- `supports-capability`
- `settles-on`

## Update rule while building

When adding a feature, also update the graph if the feature changes one of these:

- A new chain rail, wallet, testnet, RPC, or contract address
- A new community workflow such as proposals, bounties, dues, payouts, or membership
- A new security check or Asha review outcome
- A new blocker or testnet readiness task
- A new settlement route such as SOL, XLM, G$, M-Pesa, or community token

## Admin surface

The admin dashboard reads the graph summary and shows:

- Node and edge count
- Risk and watch review counts
- Testnet-ready chain rails
- Coming-soon chain rails
- Top readiness tasks

## Next graph upgrades

1. Persist graph snapshots to Supabase after migrations are live.
2. Add proposal and bounty event history as graph edges.
3. Add member and role nodes once membership data is durable.
4. Add payment order nodes for M-Pesa, Stellar, and treasury releases.
5. Add export to Mermaid or JSON for reviewer docs and architecture diagrams.
