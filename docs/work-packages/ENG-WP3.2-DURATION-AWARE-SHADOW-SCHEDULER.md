---
id: ENG-WP3.2
title: Duration-Aware Test Scheduler Shadow Mode
status: complete
autonomy: green
depends_on: [ENG-WP3.1, ENG-WP2.4, ENG-WP2.5]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: reviewed
test_impact_scope: Reviewed full PR diff: shadow duration planning, historical evidence parsing, mandatory integration close-out policy, and robust world movement performance regressions; no scheduling authority
---

# ENG-WP3.2 — Duration-Aware Scheduler (Shadow Mode)

Tracking: [ENG-WP3 #303](https://github.com/tametheboardgame/unicorn-valley/issues/303). Branch `agent/eng-wp3-2-shadow-scheduler`.

## Scope

- Read the existing **current** WP3.1 complete SHA/run-bound per-file execution and WP2.4 suite-health report. Accept only valid, complete, healthy historical snapshots with independent run IDs and correct provenance; historical data cannot replace the current complete inventory.
- Model deterministic longest-processing-time-first allocations at file granularity to 6, 8, 10 and 12 shards, conservative estimates for unknown files, and exact-cover/no-empty-shard assertions. No skipped, retired or unowned test may disappear from a proposal.
- For multiple clean, comparable historical runs, report actual static-six distribution where shard evidence exists and shadow-model comparisons across runs; record absent/partial evidence explicitly instead of inventing measured wins.
- Report predicted critical path, skew, total test duration, per-shard loads, estimated runner-minutes and assumptions. Incorporate queue/setup and cross-browser/smoke as gate-critical-path considerations, clearly separate theoretical from measured timing.
- Add bounded Node policy tests for deterministic ties and permutations, added/removed/renamed specs, incomplete/failed/cancelled or SHA-mismatched history, zero/unknown-duration specs, and adversarial skew.
- Output an observational CI artifact while **leaving static six-shard execution, Tier 3 authority, exact-head/live-main Merge Gate and draft preview selection untouched**.
- Enforce that completed engineering integration packages reconcile AGENTS, PROJECT_STATE, STATUS and their work-package record; retain separate stream-local close-out requirements and no simultaneous global product PR rewrites.

## Acceptance and stopping conditions

1. All validation rules are deterministic with positive/negative tests; no hidden drop or fabricated identity.
2. Observational shadow artifact clearly shows predicted 6/8/10/12 plans and available real-run comparisons. If clean comparable history is unavailable, reports `insufficient-history` truthfully.
3. CI's authoritative six Chromium shards and cross-browser profiles are untouched, with only a read-only reporting step added.
4. Draft CI and previews remain proportional. Final review must have complete TEST_IMPACT_V1, latest-main ancestry and every required check green.
5. Close-out state/rules are committed and verified before declaring this package complete. No production deployment. ENG-WP3.3 will separately activate any scheduler.

## Risks and backout

Bad duration history can propose imbalance; observational-only mode ensures it cannot omit any actual test. The new report must never be treated as a qualification gate. Revert isolated shadow scripts/report step without rolling back WP2/WP3.1 integrity checks. If historical artifacts expire or are inaccessible, report limited evidence rather than choosing misleading synthetic durations.

## Progress

Opened 2026-10-13 from merged ENG-WP2.5 commit `b43934a0464d67fb87c4ef67f87d6f0862c062fa`. Initial Tier 0, unit, build and smoke qualified on draft CI #38407906137; its cross-browser performance p95 test subsequently revealed a 12-frame nearest-rank sampling problem. Increased only the observation window to 60 frames while retaining the original p95/worst guardrails, corrected a malformed comment hiding the frame-count constant, and added unit tests verifying sustained slow frames still fail. The shadow history reader now uses WP2.4's actual flat JSON array, not the nonexistent `.reports` property.

**Complete and merged 2026-10-14:** [PR #314](https://github.com/tametheboardgame/unicorn-valley/pull/314) merge `748d797b4c6298dd923cb410686a50898f14d663`; [exact-head CI #38526137461](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38526137461) passed all six Chromium shards, unit/build/smoke, cross-browser and Merge Gate. Observed 110 spec files and 311 test identities; one comparable historical snapshot only, so speed improvements remain unproven. Static-six remains live.

Full actual-diff code, documentation and test-impact review completed 2026-10-14. Affected tests: `scripts/verification/integrationCloseoutPolicy.test.mjs`, `scripts/verification/shadowShardPlanner.test.mjs`, `src/game/performance/FramePerformance.test.ts`, and `tests/play/r6.5-wp19h3.11-r3.4-mobile-movement-performance.spec.ts`. Tier 0 and build were green at CI #38525695056; final authoritative non-draft exact-head qualification and real report inspection completed at CI #38526137461. No production deployment or scheduler activation.
