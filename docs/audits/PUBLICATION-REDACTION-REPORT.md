# Audit Publication Redaction Report

**Classification: INTERNAL**

## Repository visibility

`gh repo view Build-Africa-DAO/baraza-protocol` reports `PUBLIC`, with default
branch `main`.

## Sensitive specifics in the unredacted audit

The unredacted audit names live-backend or security-relevant implementation
details at these locations:

| Audit line before redaction | Specific type |
|---|---|
| 33 | Live table and authorization-helper names; RLS posture |
| 109-110 | Migration paths, live table purpose, and authorization-helper behavior |
| 274-276 | Live table name, privileged function name/signature, RLS and grant posture |
| 346 | Live table name and drafted migration number |

The audit contains no Supabase project reference, live Supabase URL, credential,
or live RPC URL. It names configuration environments such as localnet and
testnet, but does not include a private environment identifier.

## Confidential pricing review

The audit mentions that confidential history exists in PR #35 because the
directive supplied that fact. It contains no pricing values, excerpts, diffs,
or other material derived from PR #35. PR #35 content was not inspected.

## Public variant

`docs/audits/MULTICHAIN-RECONCILIATION-AUDIT.public.md` replaces:

- live table and privileged-function names with non-identifying descriptions;
- specific security migration paths/numbers with drafted-migration language;
- the PR number with a generic confidential-history entry.

The unredacted audit remains intact locally.

## Private issue draft

A draft containing the redacted specifics is stored outside the public
repository at:

`C:\Users\USER\Downloads\baraza-private-drafts\SUPABASE-SECURITY-ISSUE.private.md`

It is not committed, pushed, or created as a GitHub issue.

⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: private GitHub security issue —
retain the redacted backend findings for remediation tracking.

⚠️ PUBLIC-FACING — NEEDS APPROVAL TO CREATE: audit branch push and pull request
— publish only the reviewed public audit variant after the security and license
gates are cleared.

