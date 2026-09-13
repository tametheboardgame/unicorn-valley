# WP19H0 execution tracker

## Authority and delivery

David authorised Work orchestration of H0A-H0K in strict order, with Codex performing one bounded sub-phase at a time through GitHub PR task comments. This document establishes tracking only; it contains no new measurements or implementation evidence.

- Verified starting main: `ba60ede9ba8697f6015bfb3d79e98152a972403d` (13 September 2026).
- Planning PRs #170 and #171 are merged. No open PR was returned by the preflight check.
- Delivery branch: `agent/r6.5-wp19h0-consolidation`.
- Canonical contract: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`, read in full by Work before dispatch.
- Dispatch status: David explicitly authorised GitHub dispatch in PR #172 and Codex
  executed bounded H0A only.

## Phase state

- H0A: evidence implemented and locally validated; pending Work inspection/acceptance.
- H0B: not started.
- H0C: not started.
- H0D: not started.
- H0E: not started.
- H0F: not started.
- H0G: not started.
- H0H: not started.
- H0I: not started.
- H0J: not started.
- H0K: not started.

## Baseline evidence status

The canonical specification reports inherited approximately 650.3 KiB total-JS gzip against the legacy 650 KiB ceiling. This is inherited reported evidence, not a fresh measurement. H0A must reproduce and attribute entry, initial/title, first-playable, lazy chunks, total JS and chunk count, with commands, environment and commit provenance.

PR #171 head `8a632e6870486127d216e8056776ec992321d62e` has completed Actions evidence: CI run `34751726537` failed; project-contract run `34751726541` and immutable smoke run `34751726607` succeeded. These do not qualify this delivery branch. Stage/shard timing and failure attribution remain H0A work.

H0A evidence now comprises `baseline-architecture.md`,
`architecture-test-inventory.json`, `baseline-bundle.json`,
`ci-timing-baseline.json`, raw Actions job responses and
`retirement-candidates.md`. `scripts/architecture/reportWp19h0Bundle.mjs` and the
package command reproduce bundle attribution.

Evidence/tooling checkpoint: `03565680b52653d57e233288622ef9091e6acf65`.
The following state checkpoint records validation and the Work inspection gate.

At source checkpoint `97167f6b78913c16012f636b5733d04e3e7bff41`, the report
records 471,915 raw entry bytes, 523,453 gzip initial/title/first-playable static
dependency bytes, 666,008 total-JS gzip bytes and 81 JS chunks. The total reproduces
the inherited failure by 408 bytes against the unchanged 650 KiB ceiling; entry
remains below the visible 520 KiB raw metric. Static dependency bytes are explicitly
not runtime timing. No reliable calibrated startup timing was available, so none is
claimed.

Actions evidence is bound to exact run/job/commit URLs and separates queue,
execution, skipped and failed states. Current checkpoint CI fails at performance and
skips browser jobs; preceding successful full runs provide shard timing context only.
No production code, budget, test or CI behaviour is changed by H0A.

Local H0A checks: audio catalogue, format, lint (34 inherited warnings), type-check,
all 120 Vitest files / 465 tests, production manifest build, bundle reproduction,
static smoke and project-contract validation passed. The unchanged performance check
failed exactly as expected at 650.4 KiB gzip versus 650 KiB. Browser suites were not
re-run locally because H0A has no production behaviour change; exact preceding
Actions shard evidence and current-sha skipped status are recorded rather than
presented as H0A qualification.

## Handoff and gates

The Codex worker must first read AGENTS.md, STATUS.md, PROJECT_STATE.json, PROJECT.md, ROADMAP.md and linked canonical phase documents, relevant accepted DECISIONS.md entries, TESTING.md, ACCEPTANCE.md and the complete H0 specification. Inspect current main, this branch, open PRs, recent commits and CI before substantive work. Resolve stale historical state using repository precedence and current explicit authority.

H0A is analysis/evidence only. Work must inspect the committed evidence,
reproducibility and acceptance before dispatching H0B; apply the same gate to each
later phase. H0B-H0K remain unstarted.

Preserve saves/IDs/progression/navigation/movement/races, approved UI, responsive/accessibility, conversation/interaction and WP19H audio behaviour. Do not raise budgets, delete valuable tests for speed or introduce production refactoring in H0A. Unknown risk escalates test selection. H0K requires the complete specified suite, cross-browser coverage and immutable preview smoke.

Stop after H0K technical qualification for David's explicit approval. No merge, production deployment or H1-H13 work is authorised. Preview qualification does not authorise production release.
