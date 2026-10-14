---
id: ENG-WP3.3
title: Activate Bounded Adaptive Tier 3 Chromium
status: approved
autonomy: green
depends_on: [ENG-WP3.2, ENG-WP2.5]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: reviewed
test_impact_scope: Engineering-only activation plan, manifest integrity, strict CI matrix and reversible static-six fallback; no selection or assertion reduction
---

# ENG-WP3.3 — Bounded Adaptive Chromium Test Scheduling

Parent: [ENG-WP3](ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md); tracking [issue #303](https://github.com/tametheboardgame/unicorn-valley/issues/303).

## Entry and dependencies

WP3.2 shadow-only planner merged on 14 October 2026 (PR #314; CI #38526137461). Six static Playwright shards are the **only qualified** actual execution mechanism. A single comparable historical run does not justify unconditional 8, 10 or 12-shard activation.

## Scope — independently revertible

1. Derive a **SHA-bound exact-cover discovery manifest** from the same current source, Playwright configuration and test identities as WP3.1, with deterministic file-level assignments using complete observed durations and healthy history. Unknown/new tests must be included with conservative weights.
2. Emit an explicit bounded (6/8/10/12, max 12) GitHub matrix from a planning job, subject to total runner time, setup/queue overhead, concurrency and measured end-to-end Merge Gate latency. Treat durations as estimates; do not claim measured results from shadow modelling.
3. Each shard must execute precisely its assigned spec files through supported Playwright CLI arguments, preserving all contained test identities and actual runtime skips. Validate no missing/duplicated/out-of-source assignments or stale hashes, and reject incomplete, cancelled or mismatched observations.
4. Keep a deliberately selectable **static-six fallback**, from the already-qualified workflow, with no weakening of Tier 3, Tier 4, Tier 0/1, whole-game smoke, latest-main/exact-head Merge Gate or the one aggregate Tier 3 dependency.
5. Preserve cheap draft previews. Final READY-for-review and any high-risk current delta continue the full exact-head qualification. Non-static activation needs independent full end-to-end CI evidence, identity reconciliation, rollback exercise and repeatable favourable performance/cost comparison; no speculative speed claim.
6. Integration close-out reconciles `AGENTS.md`, `PROJECT_STATE.json`, `STATUS.md`, final test-impact record and this package.

## Acceptance gates

- Negative unit tests: missing/duplicate file or identity, unknown newly added file, stale SHA/run ID, history gaps, intentional skips, expired quarantine, non-green/cancelled shard, absent result, empty shard, manifest tampering and partial execution.
- Full authoritative green with **all 311 discovered identities** reconciled exactly once (or the live discovered count if tests change), same skips and browser-profile coverage.
- Fully reversible separate scheduling change to restore the qualified static-six execution without unwinding WP2 contract governance, WP3.1 telemetry or WP3.2 observation.
- Measured wall-clock *time to Merge Gate* and runner-minutes across comparable runs; if benefit is not established, retain six-shard assignment or postpone non-six activation rather than lower controls.
- No game code, assertion weakening or production deployment.

## First implementation checkpoint

Implementation not started at documentation close-out. Start in a **new branch based on reconciled main**, audit the exact live workflow/evidence schemas, add plan and negative tests in draft, then qualify safely.
