# Test Count Delta

**Classification: INTERNAL**

## Verdict

The reported change from 509 to 501 is **not a regression in the current
`main` history**. A clean run and GitHub CI at the same commit both report
501/501. No commit containing a 509-test suite was found, so no originating
regression commit can be assigned.

## Reproduction

| Repository state | Relationship | Result |
|---|---|---|
| `org/main` at `5181a7735afef9e49cf07c6cacaa1dff69bf29c1` | Pass 1 base and current audit base | 45 files, 501/501 |
| GitHub Actions run `28883999088` at `5181a77` | Same commit and suite | 45 files, 501/501 |
| `claude/homepage-hero-design-yeyni7` at `f593fad` | Separate history; no merge base with `org/main` | 43 files, 498/498 |
| Same separate history at `fdaa4f8` | Separate history | 46 files, 506/506 |
| Same separate history at `9e96510` | Separate history | 52 files, 532/532 |

The separate history contains test-adding commits that move through 498, 501,
504, 506, 511, 513, 528, and 532 based on the committed test files and
reproduced checkpoints. It does not contain a reachable 509-test state.

## Origin assessment

- No tests were removed between the Pass 1 base and the exact CI run: they are
  the same commit and both pass 501 tests.
- Repository and GitHub code searches found no committed Sprint 001 record
  that establishes 509 as the count for this `main` history.
- The 509 baseline is therefore either an uncommitted/intermediate workspace
  state or a count from a different baseline. Repository evidence cannot
  distinguish those two possibilities.
- There is no evidence of an eight-test regression, and inventing an origin
  commit would be unsupported.

## Baseline for future passes

Use **501 passing tests at `5181a77`** as the auditable baseline for this
branch. If the maintainer has the artifact that produced 509, preserve its
commit SHA, command, and test output before changing this baseline.

