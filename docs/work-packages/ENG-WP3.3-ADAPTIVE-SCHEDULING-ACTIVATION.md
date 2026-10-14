---
id: ENG-WP3.3
title: Activate Bounded Adaptive Tier 3 Chromium
status: in_progress
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

## Engineering review and qualified foundation — 14 October 2026

**Current stage:** safe six-shard execution foundation reviewed on [draft PR #316](https://github.com/tametheboardgame/unicorn-valley/pull/316). **WP3.3 is not complete**: 8/10/12-way actual execution, independently reconciled non-six artifacts, robust variable-count rollback and statistically useful comparative measurements remain outstanding. A reviewed foundation may be independently merged before activation, but **do not** change the static-six main default or call the package complete.

### Reviewed actual diff and safety boundary

- `adaptiveShardPlan.mjs` builds exact-cover SHA/run-bound proposals for 6/8/10/12 from current discovery and healthy history, includes unknown specs conservatively and locks activation recommendation to six. `adaptiveShardPlan.test.mjs` exercises stale/missing/duplicate evidence, new specs, skew and bypass attempts.
- `tier3Matrix.mjs` and `runAdaptiveShard.mjs` validate actual six-way manifests, invoke Playwright with the **complete assigned spec file list**, and independently reject missing/wrong/duplicate/failed tests. Their positive/negative contracts live in `tier3Matrix.test.mjs`; `verificationPolicy.test.mjs` checks strict Tier 3/fallback/Merge Gate continuity.
- `.github/workflows/ci.yml` adds a guarded `fromJSON` six-entry matrix, **PR #316-only** `manifest6` trial, and static-six for all other execution. The selector must run for the static fallback even if the observational discovery job fails; only the canary requires its artifact. The full browser suite, compatibility profiles and Merge Gate are unchanged.
- `package.json` integrates new policy tests; `TESTING.md`, this record, parent roadmap and root status document the stage and actual evidence. No game sources or browser assertions changed; no test retirement, increased timeout or production deployment.
- The initial code-review correction uncouples static fallback from missing observational discovery, while leaving manifest canary evidence fail-closed. **This correction requires fresh CI on PR #316's revised head.**

### Actual proof already collected

| Run | Mode | End-to-end workflow | Slowest Chromium job | Six shard-job elapsed |
| --- | --- | ---: | ---: | ---: |
| [#38547129599](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38547129599) | manifest6 canary | 14m48s | ~12.7m | ~69.1m |
| [#38526137461](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38526137461) | static6 | 17m33s | ~15.5m | ~61.7m |
| [#38540530743](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38540530743) | static6 | 19m42s | ~17.8m | ~71.9m |
| [#38538955816](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38538955816) | static6 | 21m30s | ~17.7m | ~64.0m |

All listed Chromium full runs were green. Manifest-six independently reconciled **311/311** current test identities (308 expected, three genuine skips, zero unexpected/flaky) with the seven cross-browser profiles and Merge Gate passing.

**Rollback exercised:** [PR #317](https://github.com/tametheboardgame/unicorn-valley/pull/317) is closed **without merging**. Its corrected main-targeted [CI #38559848055](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38559848055) attempt 2 passed **all six original static Playwright shards**, seven compatibility profiles, 311/311 reconciled identities and exact-head Merge Gate. First attempt failed only one WebKit-tablet test's 45-second `page.evaluate()` timeout; it passed on retry without weakening assertions or test limits.

### Performance decision and next independent checkpoint

An observed 14m48s manifest-six workflow is **not enough** to claim a stable reduction from static-six. Baselines occurred at different times/commits; queues, runtime variance, additional selection/discovery overhead and billed runner consumption are not controlled. Manifest-six's ~69.1 aggregate shard job-minutes is not below every static comparator, and job-minutes are only a **cost proxy**.

**Decision: further measurements required before activation.** Keep static-six on main. Only proceed to actual 8/10/12 bounded matrices after separately implementing variable evidence naming and shard reconciliation, proving negative missing/cancelled/duplicate cases for each count, running repeatable full authoritative side-by-side trials, evaluating real time-to-Merge-Gate and cost/queue impact, and independently exercising rollback. If no repeatable benefit appears, retain six static shards and record a deliberate no-activation decision rather than weaken controls.

### Final foundation integration gate

1. Complete the actual full-diff/TEST_IMPACT_V1 review and reconcile `AGENTS.md`, `PROJECT_STATE.json`, `STATUS.md`, this package, parent roadmap and `TESTING.md` in PR #316; keep WP3.3 front matter `in_progress`.
2. Mark the foundation PR Ready for review only with the reviewed impact block. **Run the full exact-head Tier 0/unit/build/whole-game smoke/six Chromium/seven-browser/Merge Gate after the last substantive commit.** No green evidence from an older head authorises merging.
3. Merge only once the protected checks are fully green and the intended output is explicitly a **foundation**, not activated non-six behaviour. Record actual merged SHA and successful CI in the next mandatory integration checkpoint before resuming WP3.3 activation.

