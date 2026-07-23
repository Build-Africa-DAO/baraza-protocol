# Multichain Reconciliation Audit

**Classification:** INTERNAL

**Pass:** 1, audit only

**Repository:** `Build-Africa-DAO/baraza-protocol`

**Audited base:** `org/main` at `5181a7735afef9e49cf07c6cacaa1dff69bf29c1`

**Audit date:** 2026-07-23

**Builder OSS comparison:** `BuilderOSS/nouns-protocol` at `ee88e32a284e275020cdad974def07d3444c2427`

This document records repository and upstream evidence only. It does not green-light a
chain, validate a mainnet deployment, establish legal advice, or implement Pass 2.
Directive-provided deployment and live-database statements are identified separately
from evidence independently present in this repository.

## 1. Executive Summary

| Classification | Area | Assessment | Evidence and launch consequence |
|---|---|---|---|
| INTERNAL | Overall launch state | `blocked` | No chain satisfies all seven `launch_candidate` criteria in repository evidence. No green-light is recommended. |
| INTERNAL | Reusable code | `partial` | Five Soroban V2 contracts, five Anchor programs, the Builder-derived EVM contract set, frontend proposal screens, payment adapters, and Privy scaffolding are reusable. Their existence is not deployment evidence. |
| INTERNAL | Stellar | `in_preparation` | The current V2 contracts pass 21 unit tests, but the only committed testnet registry is legacy V1. No V2 deployment record, smoke record, founder-controlled custody record, sample deployment, cost model, or end-to-end adapter proposal path exists. |
| INTERNAL | Base | `in_preparation` | The Builder contract set and tests are present, but every local EVM address registry entry is zero, Forge was unavailable, no Base Sepolia record exists, and the app adapter only supports voting and token-balance membership. |
| INTERNAL | Solana | `in_preparation` | All five programs remain present and five Rust identity tests pass. `Anchor.toml` targets localnet, current program IDs are documented as local keys, and no accepted devnet deployment/smoke record exists on `main`. |
| INTERNAL | Proposals | `blocked` | Chain-neutral adapters omit create/get/list. Frontend creation falls back to an in-memory store; cards vote inline and do not link to the detail route. Stellar has contract create/get but no adapter/list, Solana stores only a metadata URI, and EVM text retrieval requires event indexing or another body store. |
| INTERNAL | Membership axes | `conflicting` | `verifyBaseMembership()` treats a positive NFT balance as membership. Builder Governor voting is NFT-token weighted. The directive requires membership, voting weight, and fundraising assets to be independent. |
| INTERNAL | Product architecture | `conflicting` | `AGENTS.md` and existing architecture documents describe Africa focus, universal Stellar settlement, Solana governance, EVM read-only, and user chain selection. The directive establishes global scope, fit-to-strength routing, Base launch candidacy, and no user chain choice. |
| INTERNAL | Mobile money | `conflicting` | Core code is Kenya-only, M-Pesa appears as a selectable “chain,” and the requested provider/account fields do not exist as a normalized model. |
| INTERNAL | Security | `blocked` | Migration `003` creates `payment_attestations` without RLS. The directive reports live RLS disabled. The fixed `is_community_admin()` body exists only in draft migration `026`, so repository evidence does not prove the live fix is applied. |
| INTERNAL | Tests | `partial` | App: 501/501 passing, typecheck/build clean, lint 0 errors and 31 warnings. Stellar: 21/21 unit tests. Root Rust: 5/5 tests. Forge and Anchor smoke tests were not run because their CLIs are unavailable. |
| INTERNAL | Documentation | `missing` | All 18 canonical documents named by the directive are absent at the requested paths. Existing documents contain decisions now superseded by the directive. |
| INTERNAL | License | `blocked` | Both current upstream repositories inspected are MIT, not GPL-family. MIT still requires preservation of copyright and license notices. The local vendored contract license replaces Builder OSS attribution, while the repository root proposes BSL 1.1. Counsel must decide remediation and derivative-work scope. |

### Stop conditions reached

| Classification | Stop condition | Evidence | Required decision |
|---|---|---|---|
| INTERNAL | License obligations affect Baraza | Upstream `nouns-protocol` and `nouns-builder` are MIT; copied/substantial portions must retain the MIT notice. Local `contracts/evm/LICENSE.md` names Baraza OSS instead of Builder OSS. | Counsel must determine required attribution, provenance, and compatibility with the proposed root BSL license. |
| INTERNAL | Builder Governor cannot express all requested Base behavior | Governor is ERC-721 vote-weighted and timelock-executed. It does not natively express independent verified membership, one-member-one-vote, officer workflows, welfare verification, disputes, or delayed exits. | Maintainer must narrow Base presets or approve custom-contract scope. |
| INTERNAL | Proposal readability needs an architecture decision | Solana stores only `metadata_uri`; EVM proposal descriptions are event data rather than returned by `getProposal`; no shared index/body store exists. | Maintainer must approve an off-chain body/index with an on-chain hash/description anchor, or select another evidenced design. |
| INTERNAL | Established decisions conflict with repository source-of-truth files | `AGENTS.md`, `docs/architecture.md`, and `CDR-0001` encode superseded product and chain decisions. | Maintainer must approve the terminology/decision-document reconciliation after this audit. |

## 2. Viable-Launch Map

The distance column counts unresolved mandatory criteria, not calendar time. The seven
criteria are: adapter implemented, current contracts deployed to testnet, smoke tests
passing, sample community deployed, founder-controlled deploy custody, cost model
documented, and proposals working end to end.

| Classification | Chain | Registry state supported by evidence | Satisfied criteria | Missing evidence | Distance to `launch_candidate` | Recommendation |
|---|---|---|---:|---|---:|---|
| INTERNAL | Stellar | `in_preparation` | 0/7 | Current adapter; V2 testnet addresses; V2 smoke record; sample; custody; cost model; proposal create/list/get through UI and adapter | 7 unresolved | Closest reusable launch candidate because current contracts and unit tests exist, but do not green-light. |
| INTERNAL | Base | `in_preparation` | 0/7 | Complete Builder wrapper adapter; Base Sepolia deployment; Forge/smoke evidence; sample; custody; cost model; independent membership and readable proposals | 7 unresolved | Keep as target launch candidate; resolve license, governance scope, and proposal storage before deployment work. |
| INTERNAL | Solana | `in_preparation` | 0/7 | Complete adapter; accepted devnet record; reproducible smoke evidence; event sample; founder custody; cost model; proposal body retrieval | 7 unresolved | Preserve as Phase 2. Directive-reported deployment/smoke results are not corroborated on `main` and are not counted. |
| INTERNAL | Ethereum | `in_preparation` | 0/7 | Local addresses are zero; no Baraza deployment, adapter readiness, sample, custody, cost, or proposal E2E evidence | 7 unresolved | Prepare only after Base proves the integration. |
| INTERNAL | Optimism | `in_preparation` | 0/7 | Same gaps as Ethereum; upstream address records are not Baraza deployment evidence | 7 unresolved | Prepare only after Base. |
| INTERNAL | Zora | `in_preparation` | 0/7 | Inherited contracts and upstream records exist, but local addresses are zero and the app has no Zora adapter mapping | 7 unresolved | Prepare only after Base. |
| INTERNAL | Arbitrum, Polygon | `not_started` | 0/7 | Required registry-only entries are themselves absent | 7 unresolved | Future registry entries only. |
| INTERNAL | Research chains | `not_started` | 0/7 | Registry entries and evidence matrix absent | 7 unresolved | Research only; keep Celo labels out of live UI. |

**INTERNAL — viable-launch conclusion:** no chain is launchable now. Stellar has the
shortest code path to a future candidate, but all seven acceptance criteria remain
unproven as complete. Base should not be green-lit before the license, governance
scope, membership-axis, and proposal-body decisions. Solana must not be degraded while
those launch-candidate tracks proceed.

## 3. Repository Evidence Table

| Classification | Path | Component | Chain | Status | Evidence | Next action |
|---|---|---|---|---|---|---|
| INTERNAL | `AGENTS.md` | Repository instructions | All | `conflicting` | Defines Africa scope, Stellar-only treasury settlement, Solana governance, EVM read-only, and chain labels in onboarding. | Preserve as historical context; supersede through an approved decision/terminology PR. |
| INTERNAL | `README.md` | Product overview | All | `conflicting` | States “Never touch payments,” while the directive makes money movement a core revenue and routing concern. | Reconcile only after maintainer approval. |
| INTERNAL | `docs/architecture.md` | Architecture | All | `conflicting` | Renders a user chain selector and treats Stellar, Solana, and Base as active choices without readiness gates. | Supersede, do not delete. |
| INTERNAL | `docs/decisions/CDR-0001.md` | Prior chain decision | All | `obsolete` | Defers to `AGENTS.md`, which conflicts with the final directive. | Add explicit superseding records in a separate concern. |
| INTERNAL | `app/src/lib/adapters/index.ts:12` | Shared adapter interface | All | `partial` | Governance surface contains only `vote`; create/get/list/execute/readiness methods are absent. | Pass 2 adapter-interface PR after proposal architecture approval. |
| INTERNAL | `app/src/lib/adapters/stellar.ts` | Stellar adapter | Stellar | `prototype` | Treasury payment preview exists; no community deployment or proposal methods. | Map current Soroban APIs behind the shared interface. |
| INTERNAL | `app/src/lib/adapters/solana.ts` | Solana adapter | Solana | `prototype` | Vote and reward/treasury previews exist; membership verification always returns false; no proposal retrieval. | Preserve and complete in Phase 2. |
| INTERNAL | `app/src/lib/adapters/evm.ts:70` | EVM adapter | EVM | `conflicting` | A positive Base NFT balance is treated as membership. Vote support depends on env-configured Governor/Token addresses. | Separate membership from voting weight before Base samples. |
| INTERNAL | `app/src/lib/adapters/celo.ts` | Celo scaffold | Celo | `prototype` | Disabled GoodDollar scaffold; no launch evidence. | Retain disabled as research only. |
| INTERNAL | `app/src/lib/wallet/mpc.ts` | Privy wallet abstraction | All | `partial` | Privy helpers exist, but no normalized phone-to-user-to-wallet-to-deployment mapping is implemented. | Define mapping in a dedicated identity/domain-model concern. |
| INTERNAL | `app/src/lib/chain.ts` | Chain selector metadata | All | `conflicting` | Exposes Stellar, Solana, Base, and M-Pesa as peer selectable chains. | Replace with internal routing only after registry/router design approval. |
| INTERNAL | `app/src/lib/phone.ts:1` | Phone normalization | Payments | `conflicting` | Explicitly Kenya-only and returns only Kenyan E.164 numbers. | Introduce country-aware normalization with provider-independent identity fields. |
| INTERNAL | `app/src/lib/tokenGate.ts:25` | Action authorization | All | `partial` | Proposal submission is active-membership/admin gated. It does not gate reads directly. | Preserve member creation controls; add explicit tests that read access ignores payment state. |
| INTERNAL | `app/src/lib/dataStore.ts` | Proposal persistence | All | `prototype` | Decisions, including full descriptions, live in process-memory Maps and seeded data. | Replace as proposal source of truth through approved adapter/body-store design. |
| INTERNAL | `app/src/hooks/useBarazaData.ts:183` | Proposal creation hook | Solana/local | `prototype` | Attempts Solana creation with an empty metadata URI, then always writes the local in-memory decision. | Do not treat as durable or cross-chain creation. |
| INTERNAL | `app/src/components/DecisionCard.tsx:98` | Proposal list card | Frontend | `partial` | Renders title, body, author, status, and inline voting, but contains no link to the detail route. | Add chain-neutral list-to-detail navigation in the proposals PR. |
| INTERNAL | `app/src/pages/ProposalDetail.tsx` | Proposal detail | Frontend | `partial` | Route and full-body rendering exist, but data comes from local store rather than adapter retrieval. Read rendering itself is not payment-gated. | Back with `getProposal` and test non-admin reads. |
| INTERNAL | `app/src/pages/CreateDecision.tsx:115` | Proposal creation | Frontend | `partial` | Requires token-gate membership/admin status and writes through the prototype hook. | Retain appropriate member authorization but remove chain/tier/payment coupling. |
| INTERNAL | `app/src/pages/CommunityDashboard.tsx:516` | Proposal list | Frontend | `partial` | Lists cards for visitors and shows create only to members; cards vote inline without detail navigation. | Add a required detail link and adapter-backed list query. |
| INTERNAL | `supabase/migrations/010_proposals_votes_schema_gaps.sql` | Proposal schema | Backend | `partial` | Defines title, description, author, status, and voting times plus public SELECT. No app write/read integration or applied-state evidence exists. | Decide whether this becomes the body/index layer; record applied status separately. |
| INTERNAL | `contracts/stellar/governance/src/lib.rs` | Soroban governance | Stellar | `functional_but_undocumented` | Proposal stores title and description; create/get exist and five unit tests pass. No list method or app adapter path exists. | Add list/index strategy only after architecture approval. |
| INTERNAL | `programs/governance/src/lib.rs` | Anchor governance | Solana | `partial` | Proposal account stores `metadata_uri`, not full body; create and vote instructions exist. | Approve body store and anchor semantics before Pass 2. |
| INTERNAL | `app/src/lib/programs/client.ts` | Solana client | Solana | `partial` | Can create and fetch a proposal account; no shared adapter list/get and no body fetch. | Wrap rather than call directly from hooks. |
| INTERNAL | `contracts/evm/src/governance/governor/Governor.sol` | Builder Governor | EVM | `usable_after_modification` | Propose, token-weighted vote, queue, execute, cancel, veto, and timelock lifecycle exist. Proposal text is emitted as event description and hashed for execution. | Add indexing/body retrieval and independent identity/membership mapping. |
| INTERNAL | `contracts/evm/src/manager/Manager.sol` | Builder deployer | EVM | `usable_after_modification` | Deploys Token, Metadata Renderer, Auction, Governor, and Treasury and initializes the full set. | BaseAdapter must wrap this Manager; do not reimplement it. |
| INTERNAL | `contracts/evm/src/auction/Auction.sol` | Builder auction | EVM | `usable_after_modification` | Auction is deployed for every DAO and starts when unpaused. Pausing is possible, but independent fundraising-only operation is not proven. | Maintainer must decide supported Base presets and auction mode. |
| INTERNAL | `contracts/evm/addresses/*.json` | EVM address registry | EVM | `missing_configuration` | Ethereum, Optimism, Sepolia, Zora, Base, and Base Sepolia files contain only zero addresses. | Populate only from an evidenced testnet deployment in a later deployment PR. |
| INTERNAL | `contracts/evm/deploys/*.txt` | Inherited deployment logs | EVM | `conflicting` | Nonzero Builder deployment artifacts are vendored, while Baraza address JSON is zero. They are upstream artifacts, not Baraza deployments. | Label provenance clearly; never cite them as Baraza deployment evidence. |
| INTERNAL | `contracts/evm/LICENSE.md` | Vendored license | EVM | `conflicting` | MIT text names Baraza OSS and omits the Builder OSS copyright found upstream. | Counsel review and attribution correction required before distribution decisions. |
| INTERNAL | `LICENSE` and `NOTICE` | Repository licensing | All | `blocked` | Root proposes BSL 1.1 and a split model pending counsel. | Counsel must determine compatibility and covered works. |
| INTERNAL | `contracts/stellar/addresses/testnet-v1.json` | Testnet registry | Stellar | `obsolete` | Records legacy V1 deployments from 2026-06-23. Current V2 README warns V1 is not V2 deployment evidence. | Preserve; add a separate V2 registry only after deployment. |
| INTERNAL | `contracts/stellar/README.md` | Soroban deployment status | Stellar | `partial` | Documents V2 contract set and warns against reusing V1 state. No V2 testnet registry exists. | Complete V2 testnet deployment evidence in a later concern. |
| INTERNAL | `Anchor.toml` | Anchor environment | Solana | `missing_configuration` | Provider cluster is `localnet`; committed program IDs are local identities. | Do not infer devnet readiness. |
| INTERNAL | `tests/anchor-smoke.mjs` | Solana smoke test | Solana | `partial` | Script exists, but no accepted output is committed and Anchor CLI is unavailable in this audit environment. | Re-run after custody and devnet configuration are resolved. |
| INTERNAL | `supabase/migrations/003_payment_attestations.sql` | Payment attestations | Backend | `blocked` | Table is created without enabling RLS or policies. | Security-remediation PR after live posture is confirmed. |
| INTERNAL | `supabase/migrations/026_leverage_foundation.sql` | Admin authorization fix | Backend | `partial` | Corrected community-scoped `auth.uid()` membership check is present; migration is explicitly Draft only. | Confirm applied live state without exposing credentials. |
| INTERNAL | `supabase/migrations/021_identity_links.sql` and `021_retro_rounds_opened_by.sql` | Migration ordering | Backend | `conflicting` | Both use migration number `021`; filenames are zero-padded but numbering is not unique. | Renumber through a dedicated schema reconciliation after checking applied history. |
| INTERNAL | `.env.example` | Environment template | All | `partial` | Testnet/mainnet variables exist, but no complete Base Sepolia/registry/custody template exists. | Expand in deployment concern; never default to mainnet. |
| INTERNAL | `app/.env.local.example` | Local payment example | Payments | `blocked` | Gitleaks flags a value shaped like an API credential; repository evidence does not establish whether it is a real secret. | Human owner must verify and rotate/remove if real without publishing the value. |
| INTERNAL | `app/src/lib/knowledgeGraph.ts` | Architecture registry | All | `conflicting` | Encodes current chain/payment assumptions but has no rolling readiness states or cost log. | Reconcile only with registry/router PR. |
| INTERNAL | `app/src/lib/dataStore.ts` | Demo communities | All | `prototype` | Seed/demo records are not testnet sample-community deployment evidence. | Build each required sample as a separate later concern. |
| INTERNAL | `.github/workflows/ci.yml` | CI | All | `partial` | App checks exist; no demonstrated EVM Forge or current Soroban/Anchor deployment verification gate was established in this audit. | Add chain-specific verification after toolchains and scope are approved. |

## 4. Proposals Gap Report

### Current storage and read paths

| Classification | Surface | Create | Full-body storage | Get/list | Assessment |
|---|---|---|---|---|---|
| INTERNAL | Frontend/local store | `useCreateDecision()` writes a local `Decision` | `Decision.description` in process memory | `getDecision()` / `getDecisionsForCommunity()` | Prototype only; not durable and not chain-backed. |
| INTERNAL | Supabase migration | Table shape exists | `proposals.description` | Public SELECT policy is drafted in migration `010` | Not wired to app; applied status unknown. |
| INTERNAL | Stellar V2 | `create_proposal` exists | Title and description on-chain | `get_proposal` exists; no list method | Contract-capable but absent from adapter/UI integration. |
| INTERNAL | Solana | `create_proposal` exists | Only `metadata_uri` on-chain | Account fetch exists; no body fetch/list adapter | Requires an approved off-chain body strategy. |
| INTERNAL | Base/Builder | Governor `propose` exists | Description appears in proposal event and hash inputs | `getProposal` returns lifecycle data, not description text | Requires event indexing or another approved body store. |
| INTERNAL | Shared adapter | Missing | Not defined | Missing `getProposal` and `listProposals` | Launch blocker on every chain. |

### Frontend routes

| Classification | Route/component | Current behavior | Gap |
|---|---|---|---|
| INTERNAL | `/dashboard/:id` governance tab | Visitors can read card title/body/author/status and see inline vote controls. | Cards have no detail link; list is fed from local store. |
| INTERNAL | `/dao/:id/proposals` | Routes to dashboard governance view. | Same local-store and no-detail-navigation gap. |
| INTERNAL | `/dashboard/:id/decisions/create` | Creation form exists and membership/admin gate applies. | No universal chain adapter path; Solana metadata URI is empty; local fallback masks failure. |
| INTERNAL | `/dashboard/:id/decisions/:decisionId` | Detail screen renders title, body, author, dates, status, decision/execution text, and vote controls. | Fetches local store only; newly created data is not durable or retrievable per chain. |

### Per-chain result

| Classification | Chain | Creation | Retrieval | Full body by non-admin member | Deposit routing |
|---|---|---|---|---|---|
| INTERNAL | Stellar | Contract method exists; adapter path missing | Contract get exists; list and adapter path missing | Not proven end to end | No proposal-deposit implementation found |
| INTERNAL | Base | Builder method exists; adapter path missing | Lifecycle getter exists; body retrieval/index missing | Not proven end to end | No proposal-deposit implementation found |
| INTERNAL | Solana | Program/client create exists; shared adapter missing | Proposal account can be fetched; body behind URI is not fetched | Not proven end to end | No proposal-deposit implementation found |

### Concrete fix plan

| Classification | Order | Proposed fix | Acceptance evidence |
|---|---:|---|---|
| INTERNAL | 1 | Obtain maintainer approval for a shared body/index architecture. Candidate for review: Supabase body plus immutable hash/description anchor, without payment-gated SELECT. | Written decision record and threat/access review. |
| INTERNAL | 2 | Add normalized Proposal types and mandatory create/get/list methods to the shared adapter. | Contract tests preventing vote-only adapters. |
| INTERNAL | 3 | Implement Stellar mapping to current Soroban create/get and an approved list index. | Create, list, detail, non-admin read, and treasury-deposit tests. |
| INTERNAL | 4 | Implement Base mapping over Builder Manager/Governor plus the approved description index. | Base Sepolia integration tests after deployment. |
| INTERNAL | 5 | Implement Solana URI/hash body retrieval while preserving existing programs. | Devnet integration tests after Phase 2 approval. |
| INTERNAL | 6 | Make list cards navigate to detail and remove local fallback as success evidence. | UI tests for list/detail and unpaid/non-admin member reads. |
| INTERNAL | 7 | Implement proposal deposits only where configured and assert the recipient equals the community treasury. | Per-chain transfer-recipient tests. |

## 5. Builder OSS Fork and Governance Gaps

### Fork identity, contract set, and license

| Classification | Finding | Evidence | Assessment |
|---|---|---|---|
| INTERNAL | Actual vendored source | `contracts/evm` matches the structure of `BuilderOSS/nouns-protocol`, not the `nouns-builder` frontend repository. All 65 compared source files differ from current upstream, primarily headers/renaming plus some logic. | `usable_after_modification`; provenance and semantic diff require preservation. |
| INTERNAL | Exact upstream license | Current `BuilderOSS/nouns-protocol` and `BuilderOSS/nouns-builder` both declare MIT. | Directive’s expected GPL-family license is not confirmed. |
| INTERNAL | MIT obligation | Upstream MIT requires the copyright and permission notice in copies or substantial portions. | Counsel decision required; no same-license frontend copyleft requirement was found. |
| INTERNAL | Contract set | Manager, ERC-721 Token, Metadata Renderer, Auction, Governor, and Treasury timelock are present. | Expected set confirmed. |
| INTERNAL | Safe | No Safe integration code was found. | Do not claim Safe support. Builder Treasury is the evidenced Base executor. |

### Address evidence

Baraza's local `contracts/evm/addresses/*.json` files contain zero addresses for every
configured chain. Current upstream registries contain the following nonzero Manager
addresses; those are Builder OSS records, not independent on-chain verification and not
Baraza deployments.

| Classification | Chain/environment | Upstream chain ID | Upstream Manager registry value | Baraza local registry |
|---|---|---:|---|---|
| INTERNAL | Ethereum mainnet | 1 | `0xd310a3041dfcf14def5ccbc508668974b5da7174` | zero |
| INTERNAL | Optimism mainnet | 10 | `0x3ac0e64fe2931f8e082c6bb29283540de9b5371c` | zero |
| INTERNAL | Ethereum Sepolia | 11155111 | `0x0ca90a96ac58f19b1f69f67103245c9263bc4bfc` | zero |
| INTERNAL | Optimism Sepolia | 11155420 | `0x1004e43b540af4dfde2737c29893716817b0a1d7` | zero |
| INTERNAL | Zora mainnet | 7777777 | `0x3ac0e64fe2931f8e082c6bb29283540de9b5371c` | zero |
| INTERNAL | Base mainnet | 8453 | `0x3ac0e64fe2931f8e082c6bb29283540de9b5371c` | zero |
| INTERNAL | Base Sepolia | 84532 | `0x550c326d688fd51ae65ac6a2d48749e631023a03` | zero |
| INTERNAL | Zora Sepolia | 999999999 | `0x550c326d688fd51ae65ac6a2d48749e631023a03` | absent |

The upstream files also contain Token, Metadata Renderer, Auction, Governor, and Treasury
implementation records. Their presence demonstrates upstream configuration, not a
Baraza community deployment.

### Governance parity

| Classification | Capability | Builder Governor | Baraza conclusion |
|---|---|---|---|
| INTERNAL | ERC-721 token-weighted proposals and votes | Native | Suitable only where token-weighted voting is explicitly selected. |
| INTERNAL | Proposal threshold, quorum, delay, period | Native | Reusable for token-governance presets. |
| INTERNAL | Timelock queue and execution | Native | Reusable; whether it satisfies each multisig preset remains a maintainer decision. |
| INTERNAL | Cancel and veto | Native | Reusable with role/configuration review. |
| INTERNAL | One-member-one-vote independent of NFT ownership | Not native | Requires a different voting-power source or must not be offered on Base. |
| INTERNAL | Verified/guarantor membership | Not native | Custom identity/membership layer or unsupported on Base. |
| INTERNAL | Officer roles and elections | Not native | Custom contracts/workflow or unsupported on Base. |
| INTERNAL | Officer-verified welfare payouts | Not native | Custom contracts/workflow or unsupported on Base. |
| INTERNAL | Challenge-and-review disputes | Not native | Custom contracts/workflow or unsupported on Base. |
| INTERNAL | Delayed exit settlement | Not native | Custom contracts/workflow or unsupported on Base. |
| INTERNAL | Scoped pause | Partial | Auction pause exists; approved Soroban-style scoped governance pause is not evidenced. |
| INTERNAL | Secretary-approved hash-anchored records | Not native | Needs separate record workflow or unsupported on Base. |
| INTERNAL | Independent NFT fundraising | Not proven | Auction can be paused, but Manager always deploys and initializes Auction, Token, Governor, and Treasury together. Buyer/member/vote separation is absent in app code. |

### Multisig gap

**INTERNAL — finding:** the repository supports option (a) only as an unapproved
possibility: Builder Treasury timelock is present, but no evidence proves it satisfies
all Baraza presets. Options (b) and (c) cannot be claimed because Safe is absent.
Stellar contract code contains threshold controls, while the direct Stellar adapter
allows a threshold of one, conflicting with the no-single-signer directive. Solana
documentation mentions a future Squads handoff, but implementation/deployment evidence
is absent.

## 6. Documentation Gap Report

| Classification | Required document | Repository state | Gap |
|---|---|---|---|
| INTERNAL | `docs/product/PRD.md` | Missing; `app/docs/PRD.md` exists | Existing PRD is not canonical and predates the final routing model. |
| INTERNAL | `docs/product/APP-FLOW.md` | Missing | No canonical chain-neutral questionnaire/confirmation flow. |
| INTERNAL | `docs/product/PROPOSALS-SPEC.md` | Missing | Universal readable-proposal contract is undocumented. |
| INTERNAL | `docs/architecture/TECHNICAL-DESIGN.md` | Missing | Existing architecture conflicts with no-chain-choice routing. |
| INTERNAL | `docs/architecture/MULTICHAIN-ARCHITECTURE.md` | Missing | No rolling per-chain green-light architecture. |
| INTERNAL | `docs/architecture/CHAIN-SELECTION-MATRIX.md` | Missing | No evidence-based fit-to-strength matrix/router. |
| INTERNAL | `docs/architecture/CHAIN-READINESS-AND-GREENLIGHT.md` | Missing | No readiness state machine or approval boundary. |
| INTERNAL | `docs/architecture/MULTISIG-ARCHITECTURE.md` | Missing | Safe versus Builder timelock is unresolved. |
| INTERNAL | `docs/architecture/BUILDER-OSS-FORK-INTEGRATION.md` | Missing | Fork provenance, Manager wrapping, address state, and auction coupling are undocumented. |
| INTERNAL | `docs/architecture/GOVERNANCE-PARITY-MATRIX.md` | Missing | Soroban/Builder/Anchor parity is undocumented. |
| INTERNAL | `docs/legal/FORK-LICENSE-OBLIGATIONS.md` | Missing | MIT attribution and root BSL interaction need counsel. |
| INTERNAL | `docs/design/DESIGN-BRIEF.md` | Missing | Plain-language disclosure and chain-neutral UI are not canonicalized. |
| INTERNAL | `docs/data/BACKEND-SCHEMA.md` | Missing | Applied versus draft migrations and normalized identity/mobile money are undocumented. |
| INTERNAL | `docs/engineering/ENGINEERING-PLAN.md` | Missing | Dependency-ordered final-directive plan is absent. |
| INTERNAL | `docs/deployment/DEPLOYMENT-GUIDE.md` | Missing | No unified testnet-first, custody-gated guide. |
| INTERNAL | `docs/deployment/SAMPLE-COMMUNITIES.md` | Missing | Required samples are not specified/deployed as evidence. |
| INTERNAL | `docs/payments/MOBILE-MONEY-ARCHITECTURE.md` | Missing | Current implementation is M-Pesa/Kenya-specific. |
| INTERNAL | `docs/pricing/COST-MODEL.md` | Missing | Routing/deployment cost log is absent. |

**INTERNAL — documentation conclusion:** create these documents by concern after this
audit is reviewed. The main README should link to canonical documents only after they
exist. Prior decisions must be marked superseded rather than deleted.

## 7. Launch Readiness Matrix

| Classification | Area | Status | Evidence | Blocker |
|---|---|---|---|---|
| INTERNAL | Stellar | `in_preparation` | Current V2 code and 21 unit tests | No V2 testnet/smoke/sample/custody/cost/proposal E2E evidence |
| INTERNAL | Base | `in_preparation` | Builder-derived contract set and app vote adapter | License, zero addresses, no Forge result, membership conflict, proposal body gap |
| INTERNAL | Solana | `in_preparation` | Five programs preserved; five Rust tests | Localnet config, deployment evidence absent on main, custody unresolved, body gap |
| INTERNAL | Ethereum/Optimism/Zora | `in_preparation` | Inherited upstream code/address records | No local operational addresses or Baraza readiness artifacts |
| INTERNAL | Proposals | `blocked` | UI, local store, and chain-specific fragments exist | No mandatory shared create/get/list or durable full-body read |
| INTERNAL | Mobile money | `blocked` | Kotani/M-Pesa flow exists | Kenya-only identity, no provider abstraction/model |
| INTERNAL | Multisig | `blocked` | Soroban thresholds and Builder timelock exist | Safe absent; presets and no-single-signer enforcement unresolved |
| INTERNAL | Sample communities | `missing` | Demo seed data only | No required testnet deployment artifacts |
| INTERNAL | Backend | `partial` | Supabase migrations and payment APIs exist | Applied state unknown, duplicate `021`, normalized models absent |
| INTERNAL | Frontend | `partial` | List/create/detail screens exist | In-memory proposals, missing detail links, user chain selection remains |
| INTERNAL | Tests | `partial` | App 501, Stellar 21, root Rust 5 all pass | Declared 509 baseline not met; Forge/Anchor smoke unavailable |
| INTERNAL | Security | `blocked` | Webhook HMAC checks and treasury safety defaults exist | Payment RLS, draft-only admin fix, possible example credential, single-signer path |
| INTERNAL | Documentation | `missing` | Historical docs exist | All 18 canonical outputs absent |
| INTERNAL | Deployment | `blocked` | Scripts and legacy records exist | No chain meets all current testnet/custody/sample/cost/proposal criteria |
| INTERNAL | Legal/license | `blocked` | Upstream MIT and proposed root BSL identified | Counsel decision required |

## 8. Security Review

| Classification | Check | Result | Evidence and posture |
|---|---|---|---|
| INTERNAL | Committed secrets | No confirmed production secret; one unresolved candidate | Redacted Gitleaks 8.30.1 scan produced 25 findings, mostly public addresses, storage-key names, and test fixtures. `app/.env.local.example` contains a credential-shaped value requiring owner verification. No sensitive value is reproduced here. |
| INTERNAL | `payment_attestations` RLS | Launch blocker | Migration `003` does not enable RLS. The directive states the live table has RLS disabled; live state was not independently queried because the local repo is not linked with database credentials. |
| INTERNAL | `is_community_admin()` fix | Present in source, live state unproven | Draft migration `026` scopes the member check to `community_id`, `auth.uid()`, active status, and privileged roles. The migration labels itself Draft only. |
| INTERNAL | `SECURITY DEFINER` functions | One found | `public.is_community_admin(uuid)` is the only repository match. It has an authorization check and fixed `search_path`, but no explicit `REVOKE EXECUTE`; exposure and applied posture require live review. |
| INTERNAL | Webhook signatures | Present | Kotani and Africa's Talking webhook handlers use HMAC verification and timing-safe comparison. |
| INTERNAL | Replay/idempotency | Partial | Payment orders use idempotency controls; a full per-chain governance replay audit was not established. |
| INTERNAL | Phone verification | Weak/global-incompatible | Core normalizer is Kenya-only; normalized verification status/provider model is absent. |
| INTERNAL | Treasury execution | Partial | Solana withdrawals default disabled and authority handoff is staged. EVM uses timelock ownership. Stellar direct threshold can be one. |
| INTERNAL | Upgrade permissions | Needs custody review | EVM Manager upgrades are owner-controlled; founder-controlled signer evidence is absent. Solana custody is directive-reported unresolved. |
| INTERNAL | Mainnet safety | Partial | Environment switches exist, but no test proves deployment commands cannot silently target mainnet. |

## 9. Branch, PR, and Issue Evidence

| Classification | Item | Finding | Action |
|---|---|---|---|
| INTERNAL | PR #26 / #32 / #46 identity | PR #26 does not exist; #26 is an open Solana deployment issue. PR #32 is a closed code/config/smoke change. PR #46 is a closed documentation-only deployment guide. They are not duplicate PRs. | No close/merge action. |
| INTERNAL | PR #36 identity | GitHub shows one merged PR #36, “feat: onboarding + activation foundation (multi-chain),” merge SHA `5181a77`. It is the leverage-foundation merge described by branch metadata, not a separate same-number PR. | Record discrepancy as resolved by GitHub identity. |
| INTERNAL | PR #35 | Directive identifies confidential pricing in history. | Do not inspect or touch confidential content. History purge remains maintainer work. |
| INTERNAL | PR #40 | Directive reports checks pass but branch history fails gitleaks. | Preserve patch and rebuild on clean history; no action in Pass 1. |
| INTERNAL | PR #29 | Open and diverged per directive/GitHub state. | Narrow rebuild only; no action in Pass 1. |
| INTERNAL | Issues #27 and #28 | Both remain open. | Preserve as independent work. |
| INTERNAL | CI #186-188 | Explicitly out of scope. | No investigation performed. |

## 10. Verification Baseline

| Classification | Command | Result |
|---|---|---|
| INTERNAL | `npm test -- --run` in `app` | 45 files, 501 tests passed |
| INTERNAL | `npm run typecheck` in `app` | Passed |
| INTERNAL | `npm run lint` in `app` | Passed with 0 errors and 31 warnings across 25 files |
| INTERNAL | `npm run build` in `app` | Passed |
| INTERNAL | `cargo test --workspace` in `contracts/stellar` | 21 tests passed; 10 deprecation warnings |
| INTERNAL | `cargo test --workspace` at repository root | 5 tests passed |
| INTERNAL | `forge test` | Not run; Forge CLI unavailable |
| INTERNAL | Anchor smoke/deploy tests | Not run; Anchor CLI unavailable and no deployment was attempted |

**INTERNAL — baseline conclusion:** starting and ending app counts are 501/501 for this
audit-only pass. This is eight below the directive's stated Sprint 001 ending baseline
of 509, although no tests were removed by this pass. The discrepancy is a launch
readiness issue, not a refactor allowance.

## 11. Ordered Implementation Plan

This is a draft plan only. No Pass 2 work is authorized.

| Classification | Priority | Task | Objective | Dependencies | Affected files | Acceptance criteria | Test method | Risk | Status |
|---|---|---|---|---|---|---|---|---|---|
| INTERNAL | P0 | Counsel/license decision | Establish lawful fork attribution and repository scope | Audit | License/NOTICE/legal docs | Written counsel/maintainer direction | Document review | High | `blocked` |
| INTERNAL | P0 | Proposal body architecture decision | Select durable readable body/index and anchor semantics | Audit, security review | Proposal spec/decision record | Written approved design | Threat/access review | High | `blocked` |
| INTERNAL | P0 | Universal proposals fix | Add adapter create/get/list and chain-neutral list/detail/create | Architecture approval | Adapters, hooks, pages, contracts/index | Per-chain create/read/list; unpaid non-admin read; treasury deposit | Unit, integration, UI, testnet | High | `blocked` |
| INTERNAL | P0 | Payment RLS/admin authorization verification | Close known live authorization blockers | Live access, applied-history review | Supabase migrations/policies | RLS enabled; function grants and checks verified | Live policy tests | High | `blocked` |
| INTERNAL | P1 | Canonical decision inventory | Supersede conflicting AGENTS/docs without deletion | Maintainer review | Decision docs, README | No active contradictory source of truth | Documentation checks | Medium | `pending` |
| INTERNAL | P1 | Mobile money schema reconciliation | Separate phone identity from provider account | Applied migration history | Types, migrations, forms, payment adapters | Provider enum, verification fields, global normalization | Unit/API/migration tests | High | `pending` |
| INTERNAL | P1 | Three-axis normalized domain model | Separate membership, voting weight, fundraising assets | Governance decision | Types, storage, adapters | NFT purchase grants neither membership nor votes by default | Domain/integration tests | High | `pending` |
| INTERNAL | P1 | Chain registry/readiness | Add full required schema and evidence states | Decisions, model | Chain config/knowledge graph | All required fields; approval-gated transitions | Registry/state tests | Medium | `pending` |
| INTERNAL | P1 | Router and cost logging | Route by requirements/readiness and log cheaper alternative | Registry, cost model | Router, questionnaire, confirmation | No deployment/estimate/reconfigure without cost log | Unit/UI tests | High | `pending` |
| INTERNAL | P1 | Stellar adapter verification | Map V2 contracts and proposal reads | Shared adapter, proposal design | Stellar adapter/contracts/scripts | Adapter tests and current V2 testnet evidence | Unit/smoke/testnet | High | `pending` |
| INTERNAL | P1 | Base adapter over Manager | Wrap Builder deployment/governance without reimplementation | Counsel, governance scope, adapter | EVM adapter/contracts/scripts | Forge tests and Base Sepolia evidence | Forge/integration/testnet | High | `blocked` |
| INTERNAL | P1 | Multisig decision/presets | Resolve timelock/Safe role and prohibit single signer | Governance/custody review | Treasury config/adapters/docs | Every preset threshold >1; provider evidenced | Unit/testnet execution | High | `blocked` |
| INTERNAL | P1 | Required sample communities | Produce separate evidence artifact per sample | Relevant chain candidate ready | Seeds/config/deployment records | Proposal create/read demonstrated per sample | Testnet E2E | High | `pending` |
| INTERNAL | P1 | Launch-readiness review | Recount criteria and recommend first candidate | All P0/P1 evidence | Audit/readiness docs | Evidence-complete recommendation; maintainer decides green-light | Independent review | High | `pending` |
| INTERNAL | P2 | Solana adapter and devnet verification | Preserve and complete Phase 2 rail | P0 interface/body design, custody | Solana adapter/program scripts | Adapter complete; reproducible devnet/sample evidence | Anchor/devnet smoke | High | `pending` |
| INTERNAL | P3 | Fork-inherited chains | Prepare Ethereum, Optimism, Zora individually | Base proven | Registry/adapters/deploy records | Per-chain criteria assessed independently | Testnet E2E | Medium | `pending` |
| INTERNAL | P3 | Future/research registry | Add registry-only entries | Registry schema | Chain registry | No live routing; limitations explicit | Registry tests | Low | `pending` |

## 12. Open Questions and Required Maintainer Decisions

| Classification | Decision | Why it cannot be inferred |
|---|---|---|
| INTERNAL | Approve or reject Supabase body/index plus on-chain hash/description anchor for proposals | Solana and EVM do not currently expose a complete adapter-readable body; choosing storage is architectural. |
| INTERNAL | Define which Base presets are allowed without custom contracts | Builder Governor does not satisfy all approved Soroban governance behavior or independent membership models. |
| INTERNAL | Decide whether Builder Treasury alone satisfies each Base multisig preset | Safe integration is absent; timelock equivalence is a product/security decision. |
| INTERNAL | Obtain counsel direction on MIT attribution and BSL compatibility | Legal obligations and covered derivative works are outside engineering authority. |
| INTERNAL | Confirm whether migration `026` is applied and remediate live `payment_attestations` RLS | Repository source cannot prove live database state. |
| INTERNAL | Confirm whether the credential-shaped value in `app/.env.local.example` is synthetic | Repository evidence is insufficient; the value must not be repeated publicly. |
| INTERNAL | Confirm founder-controlled deployment custody per chain | No repository artifact proves custody. |
| INTERNAL | Reconcile the 501 current app tests with the stated 509 Sprint 001 baseline | No test deletions occurred in this audit, but the expected eight tests are not identifiable from current `main` evidence alone. |

## 13. Exact Maintainer Handoff

**INTERNAL — next local review commands:**

```powershell
cd C:\Users\USER\Downloads\baraza-protocol-audit
git show --stat --oneline HEAD
git show -- docs/audits/MULTICHAIN-RECONCILIATION-AUDIT.md
```

**PUBLIC-FACING — approval-gated next action:**

> ⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: audit branch push and pull request — publish the Pass 1 audit against protected `main`

After Aziz explicitly approves publication, push only
`audit/multichain-reconciliation-pass-1` and open one audit-doc PR. The PR must state
what the audit changes, its repository/upstream evidence, that it deliberately changes
no runtime code or deployment state, and the counsel/architecture/security decisions
still required. Do not start Pass 2 until the audit is reviewed and explicitly approved.
