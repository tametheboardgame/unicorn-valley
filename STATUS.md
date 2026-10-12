# Project Status

Last updated: 2026-10-12

## Integrated engineering baseline

**ENG-WP1 and ENG-WP1.11 — complete.** The exact-head Merge Gate and the static six-shard Chromium baseline are retained. The qualification reference is [CI #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951); six-shard integration landed with [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302).

**ENG-WP2.1 — complete and merged.** [PR #305](https://github.com/tametheboardgame/unicorn-valley/pull/305) established the contract inventory with historical unmapped tests visible, not omitted. Its recorded baseline was 110 browser spec files, 166 unit spec files and 82 unmapped browser specs; live counts must be recomputed, not assumed fixed.

**ENG-WP2.2 — complete and merged.** [PR #307](https://github.com/tametheboardgame/unicorn-valley/pull/307) merged as `54e38b882a0f58f4f0873e3a987b71273d149b34`. Draft PRs retain provisional test-impact reviews and fast previews; Ready-for-review requires the complete actual-diff assessment and authoritative qualification.

**ENG-WP2.3A — complete and merged.** [PR #308](https://github.com/tametheboardgame/unicorn-valley/pull/308) merged as `d874e6d1155e1fa38c3821327b64dce42a948972` after [CI #38251348719](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38251348719) passed Tier 0, unit, production build, whole-game smoke, **all six Chromium shards**, cross-browser compatibility and exact-head Merge Gate. The checkpoint repaired scene readiness, Chess Academy Escape dispatch, Rainbow Disc defence observation, Settings test traversal, Story House physics assertions and one documented end-to-end smoke budget.

**Accepted integrated `main` at this hand-off:** `d874e6d1155e1fa38c3821327b64dce42a948972`. No production deployment authorised.

## Active work — ENG-WP3.1 Test Instrumentation

Branch: `agent/eng-wp3-1-test-evidence`. Bounded package: [ENG-WP3.1](docs/work-packages/ENG-WP3.1-TEST-INSTRUMENTATION.md). Roadmap: [ENG-WP3](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md), [issue #303](https://github.com/tametheboardgame/unicorn-valley/issues/303).

Goal: add **machine-readable, source-revision-bound Playwright discovery and per-shard execution evidence** including test identities, result statuses, skips and durations. Reconcile missing and duplicate identities with unit-tested fail-closed reporting. **Do not change the six static Chromium shards, browser coverage, assertions, automatic retry policy or exact-head Merge Gate.** WP3.1 initially collects evidence; WP2.4 will own policy/health thresholds and WP3.2 will experiment with scheduling in shadow mode.

Current stage: initial instrumentation branch and provisional impact assessment. Technical qualification and merge are not yet complete. `PROJECT_STATE.json.latest_commit` records the last verified integrated base at this branch's creation, not a promise that draft commits are qualified.

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
