---
id: ENG-WP3.1
title: Test Inventory and Execution Evidence
status: in_progress
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP2.3A]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: reviewed
test_impact_scope: Non-gameplay Playwright discovery and execution telemetry for static six-shard CI
---

# ENG-WP3.1 — Test Inventory and Execution Evidence

Tracking: [ENG-WP3 #303](https://github.com/tametheboardgame/unicorn-valley/issues/303). Source plan: [ENG-WP3 adaptive architecture](ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md). Integration baseline `d874e6d1155e1fa38c3821327b64dce42a948972`.

## Objective

Make every authoritative CI run yield source-SHA-bound machine-readable evidence of which Chromium tests were discovered, executed, passed, failed or explicitly skipped, how long they took and which of the existing six shards ran them. Keep the WP2.1 contract inventory as the source of ownership/lifecycle truth and **do not change execution scheduling**.

## Bounded implementation

1. Capture Playwright's supported discovery output against the actual checkout revision and project config. Record deterministic per-test identity, source spec path, project/title path, run/head SHA and explicit skip markers where supported.
2. Produce per-shard JSON execution reports for all six static Chromium shards; preserve existing list/HTML reporters. Extract per-file and per-test duration, status and attempt information, with an explicit provenance record (actual checked-out tree SHA, planned PR head, run ID and shard).
3. Add deterministic unit/negative tests for missing execution, duplicate test identity, unknown executed identity, invalid/mismatched revision, and recorded skips. Reconciliation is report-only during WP3.1: failure to build *credible evidence* is visible and cannot be labelled complete; do not newly block the existing merge gate without separately qualified evidence.
4. Publish bounded JSON artifacts from CI only when the full Chromium suite is already required; use the existing six runners/shards, without extra browser executions. Show the completeness and duration report with known caveats.
5. Document retention, missing-report behaviour, exact provenance and hand-off into ENG-WP2.4 (health policy) and ENG-WP3.2 (shadow sharding).

## Invariants

No gameplay changes; no test deletions, blanket skips or automatic retries; no global timeout or Playwright test semantics changes. Static `--shard=N/6`, full current smoke, seven cross-browser profiles, fast provisional draft previews and existing exact-head Merge Gate are unchanged. No production deployment. Rollback instrumentation without disturbing WP2 ownership/impact governance.

## Test Impact Assessment

- Stage: reviewed (final actual-diff assessment completed 12 October 2026).
- Affected behaviours: CI reporting and provenance only; test execution behaviour and coverage unchanged.
- Source owner: engineering verification; existing `scripts/verification/contractInventory.mjs` remains inventory/ownership authority.
- Proposed tests: reporter-JSON parsing and reconciliation positives and negatives, missing/duplicated/unknown identity, SHA mismatch, skipped outcome; real final-run evidence before qualification.
- Scope: Node unit/policy, Tier 0 and full exact-head CI at finalisation. No gameplay or human visual acceptance.
- Risk: a partial or malformed report could be mistaken for complete coverage; fail closed in evidence checker, and avoid modifying the Merge Gate before evidence is proven.
- Final reviewer/evidence: engineering review of full PR #309 diff. Independent discovery and six-shard reconciliation succeeded in [CI #38267022053](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38267022053): 311 identities, 110 spec files, 311 recorded across six distinct shards, 308 expected, three actual skips, zero missing/duplicate/unknown or flaky. Tier 0, unit, build, whole-game smoke, cross-browser and Merge Gate all passed on that inspected draft head. Final changed head requires separate authoritative Ready-for-review qualification.

## Acceptance

Machine report and manifest are archived with each required Chromium shard; every discovered test has exactly one recorded terminal result (including explicit skips), every executed test is discovered, revision/shard identity is coherent and per-spec duration is available. Negative tests demonstrate omissions/duplicates and mismatched SHA are rejected. Demonstrate reports on one real six-shard qualifying run, preserving unchanged required checks.

## Completion record

Started 12 October 2026, after approved ENG-WP2.3A merge. Draft implementation in progress; no claim of qualification, approval or merge.

## Implementation checkpoint — 12 October 2026

The existing `playwright.config.ts` retains list/HTML reporting and adds the built-in JSON reporter. The six existing Chromium shard jobs now emit provenance-bound `test-evidence.json` beside the unmodified Playwright report. The evidence normaliser records per-test identity, run/head/source SHA, status, explicit skips, attempts and total duration, plus grouped per-spec totals. Node negative tests reject malformed reports, duplicate IDs, unreported identities, missing shards and mismatched provenance. During WP3.1 these artifacts are observational; the evidence step is `continue-on-error` and the proven exact-head Merge Gate is unchanged. A second checkpoint must produce and verify an independently enumerated full discovery manifest and run the reconciliation on real artifacts before WP3.1 is finalised.

## WP3.1 observed runner contract, 12 October 2026

CI #38263972891 qualified Tier 0/unit/build/smoke/cross-browser and its first Chromium shards, but an **observational** reporter step in a passing shard failed to produce `test-evidence.json`: Playwright 1.55 serialises spec paths relative to the configured `tests/play` root. The normaliser now accepts this actual format and rejects traversal/absolute paths. It also has a discovery-only mode for `npx playwright test --list --reporter=json` (no browser launches). A separate job stores the complete SHA-bound manifest; a read-only aggregation job attempts exact identity reconciliation against each of the existing six shard artifacts. Reconciliation remains observational in WP3.1 and does **not** change `merge-gate.needs`. Failed or absent evidence is reported rather than treated as valid; the original static-six game tests still control merge qualification. The actual real-run reconciliation must be inspected before finalisation.

## Verified evidence and remaining gate (12 October 2026)

The real full-run evidence aggregator on [CI #38267022053](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38267022053), source head `f44e7388a421a258adff8370eab63c6df8ffdcdf`, confirms a **complete test-identity partition**, exactly 311 unique discovered and recorded identities across six shards, with 308 expected outcomes and three actual skips. Per-test/file duration evidence is present; the slowest observed files were Chess Academy (~301s) and freeze-stability (~270s). This is observational telemetry, not a new scheduling estimate.

The discovery-only JSON reporter labels all cases `skipped` because `--list` does not execute tests. The normalised discovery manifest now uses `status: discovered` and a separate `summary.discovered` field, avoiding false skipped-test counts. Only shard **execution** manifests contribute runtime pass/skip/flaky/fail counts.

No static-six matrix, test identities, assertion, global timeouts, retries, compatibility profiles or Merge Gate dependency changed. The separate evidence aggregator is fail-closed internally; its result is observational and not added as a required Merge Gate input in WP3.1. Finalisation: this correction must pass a fresh exact-head full run after PR #309 is marked Ready for review; then merge only after current-main freshness and all original required checks are green.
