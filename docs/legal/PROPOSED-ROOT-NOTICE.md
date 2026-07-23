# Proposed Root Notice

> **DRAFT PREPARED FOR COUNSEL REVIEW.** The precedence language below has not
> been approved. Counsel should approve or redraft it before use.

## Draft

Except for the path listed below, the license in the repository root applies to
this repository.

The contents of `contracts/evm/` are subject to the license stated in
`contracts/evm/LICENSE.md`, notwithstanding the license in the repository root.
Files within that path may also carry per-file license identifiers or
third-party provenance notices. The relationship between those file-level
statements and the directory license is reserved for the final language
approved by counsel.

No other directory exception is declared by this notice.

## Paths derived from the component extraction

- `contracts/evm/`

Evidence:

- `contracts/evm/LICENSE.md:1-3` contains the subtree license title and
  copyright line.
- `contracts/evm/package.json:2-13` identifies the EVM package and its license
  field.
- `docs/legal/FILE-PROVENANCE.md` enumerates the per-file headers that differ
  from the directory declaration.
- `docs/legal/FORK-LICENSE-OBLIGATIONS.md:12-14` identifies the upstream
  repositories and the Baraza root/subtree declarations used by the component
  extraction.

No Builder OSS frontend package appears as a copied subdirectory in the
inspected Baraza repository, so no additional repository path is listed here.
