# Architecture

Baraza is a governance compiler for communities. A group answers plain-language
questions about treasury control, membership, contributions, and approvals, and
Baraza produces a working governance deployment that matches those rules.

The public protocol layer uses one module interface and many chain adapters.
`interface/SPEC.md` defines the shared behavior. `contracts/stellar/` is the
reference implementation. Other chains implement the same modules natively to
their own contract and account models, but they must preserve identical
observable behavior for communities.

The module model is standard core plus type packs:

- Standard core: community registry, membership, governance and proposals,
  voting, treasury, contribution tracking, and basic reporting.
- Type-unlocked or opt-in packs: reputation, token, season artifact, asset
  ownership, and license-gated credit flow.

Baraza is non-custodial by design. The protocol never holds community funds or
private keys, and it never touches payments. Payments may be observed,
attested, or recorded, but the protocol layer does not become the custodian.

The product layer is separate from this public repo. The onboarding compiler,
AI layer, backend, and product applications are proprietary and sit above this
protocol layer rather than inside it.

`baraza-master-prompt.md` is the higher-level source of truth for product and
governance intent; this document is the public protocol summary.
