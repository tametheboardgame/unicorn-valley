# Project Status

Last updated: 2026-10-12

## Integrated engineering baseline

**ENG-WP1 and ENG-WP1.11 — complete.** The exact-head Merge Gate and the static six-shard Chromium baseline are retained. The qualification reference is [CI #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951); six-shard integration landed with [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302).

**ENG-WP2.1 — complete and merged.** [PR #305](https://github.com/tametheboardgame/unicorn-valley/pull/305) established the contract inventory with historical unmapped tests visible, not omitted. Its recorded baseline was 110 browser spec files, 166 unit spec files and 82 unmapped browser specs; live counts must be recomputed, not assumed fixed.

**ENG-WP2.2 — complete and merged.** [PR #307](https://github.com/tametheboardgame/unicorn-valley/pull/307) merged as `54e38b882a0f58f4f0873e3a987b71273d149b34`. Draft PRs retain provisional test-impact reviews and fast previews; Ready-for-review requires the complete actual-diff assessment and authoritative qualification.

**ENG-WP2.3A — complete and merged.** [PR #308](https://github.com/tametheboardgame/unicorn-valley/pull/308) merged as `d874e6d1155e1fa38c3821327b64dce42a948972` after [CI #38251348719](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38251348719) passed Tier 0, unit, production build, whole-game smoke, **all six Chromium shards**, cross-browser compatibility and exact-head Merge Gate. The checkpoint repaired scene readiness, Chess Academy Escape dispatch, Rainbow Disc defence observation, Settings test traversal, Story House physics assertions and one documented end-to-end smoke budget.

**Accepted integrated `main` at this hand-off:** `118669255e42890092a7ad1ac2862ecfc2aaecd3` (ENG-WP3.1). No production deployment authorised.

## Completed work — ENG-WP3.1 Test Instrumentation

**ENG-WP3.1 — complete and merged.** [PR #309](https://github.com/tametheboardgame/unicorn-valley/pull/309) passed all required exact-head checks on [CI #38269906778](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38269906778) at `630a0a7a0ee480acde09f7917dd10c4c43a11572`, then merged into `main` as `118669255e42890092a7ad1ac2862ecfc2aaecd3`.

Its independent SHA-bound manifest and execution evidence reconciled **311/311 test identities across all six Chromium shards**: 308 expected, three real runtime skips, zero missing/duplicate/unknown identities and zero unexpected/flaky outcomes. Per-test and per-file execution durations are archived with the CI artifacts. The existing static six-shard scheduler, test assertions, cross-browser profiles and exact-head Merge Gate were not altered. Evidence collection is observational in WP3.1; future changes to gate authority require separate qualifications.

**Completed technical package:** [ENG-WP2.4 Test Suite Health](docs/work-packages/ENG-WP2.4-TEST-SUITE-HEALTH.md), which now produces observational ownership, flake-history, slow-test and lifecycle health reports using WP3.1's evidence. [ENG-WP3.2](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md) can subsequently model balancing in shadow mode; no scheduler switch is authorised yet.

## Concurrent workstreams and remaining engineering packages

- **Just Games:** [MG-WP7 Pond Leap PR #289](https://github.com/tametheboardgame/unicorn-valley/pull/289), draft, must integrate from current `main` and resolve any shared diagnostics ownership before final CI.
- **Story House:** [Alice illustrations PR #261](https://github.com/tametheboardgame/unicorn-valley/pull/261), draft; [Lion and Mouse PR #230](https://github.com/tametheboardgame/unicorn-valley/pull/230) remains open and must be assessed separately. Historical [PR #176](https://github.com/tametheboardgame/unicorn-valley/pull/176) also remains draft.
- **Main World:** Crystal Brook H6.6 Crystal Cup Race Hub is the next deferred main-world package.
- **ENG-WP2.4:** suite-health ownership, recurring flake/age/unowned/skip reviews, after WP3.1 evidence.
- **ENG-WP2.5:** independent stream state and latest-`main` merge-freshness protection, [issue #306](https://github.com/tametheboardgame/unicorn-valley/issues/306).
- **ENG-WP3.2 onwards:** duration-based sharding in shadow mode before any separately qualified scheduling switch.

The root status/state files are an integration checkpoint; independent content streams must keep draft progress on their own PRs instead of competing to write one global active branch. Merge freshness relative to newer `main` remains a manual requirement until WP2.5 automates it.

## Qualification and governance

Fast, proportional tests on drafts; after final code/documentation/test-impact review, all Tier 0–4 checks, every required shard and live-head Merge Gate must pass. Do not claim success for a skipped required job. GitHub repository-admin branch protection requiring Merge Gate remains to be verified; an in-repository gate alone is not platform enforcement. Do not deploy production.

## ENG-WP2.4 implementation checkpoint — 12 October 2026

Branch: `agent/eng-wp2-4-suite-health`. PR #311 implements a source-bound test-health report combining WP2.1 contract inventory and WP3.1 Chromium evidence. Legacy ownership debt must remain visible; new or invalid contracts must fail the existing policy. Six static shards and exact-head Merge Gate remain unchanged. No production deployment.

## ENG-WP2.4 history and governance checkpoint — 12 October 2026

[Draft PR #311](https://github.com/tametheboardgame/unicorn-valley/pull/311): the first full suite-health [CI #38279756359](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38279756359) passed six shards, seven compatibility profiles and exact-head Merge Gate at `95b503f375481b7ceecd091aa5e1709daaaf3d4d`. Its 311/311 identity reconciliation showed zero missing or flaky tests, three actual skips; the health artifact observed all 110 browser specs, found 82 existing unowned browser specs, 3 slow files, zero hard errors and 107 warnings.

Final history and governance implementation was qualified in [CI #38286844656](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38286844656) (six shards, cross-browser, unit, build, smoke and Merge Gate all passing). The new suite-health artifact reports 110/110 inventoried browser specs observed, 311/311 individual test outcomes, 107 explained warnings and no integrity errors. History retrieval correctly returned `no-eligible-history` on initial rollout. Daily test fixing, static shard counts and Merge Gate authority are unchanged. Engineering maintains weekly health triage, monthly ownership-debt review and quarterly lifecycle review. **PR #311's close-out commit awaits final non-draft exact-head CI before merge.**

## ENG-WP2.5 checkpoint — 12 October 2026

[Issue #306](https://github.com/tametheboardgame/unicorn-valley/issues/306), [draft PR #312](https://github.com/tametheboardgame/unicorn-valley/pull/312): started from the qualified ENG-WP2.4 merge `715959e469638af379003368d8d2fde595047dea`. Four independent stream-state records, wrong-stream/root-state review policy and a current-main ancestry check are implemented on the draft branch, with CI qualification still pending. Six Chromium shards and provisional drafts remain unchanged. GitHub branch-protection read returned 403; ruleset listing was empty. Strict required platform checks need repository-admin verification before any guarantee against bypass or merge races.
