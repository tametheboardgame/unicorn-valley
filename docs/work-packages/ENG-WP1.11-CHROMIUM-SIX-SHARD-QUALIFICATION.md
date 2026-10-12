---
id: ENG-WP1.11
title: Six-Shard Chromium Qualification and Performance Comparison
status: complete
autonomy: green
depends_on: [ENG-WP1]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
---

# ENG-WP1.11 — Six-Shard Chromium Qualification

## Objective

Reduce the critical-path duration of authoritative Tier 3 Chromium qualification by changing Playwright sharding from three to six independent GitHub Actions jobs, with a deliberately simple and independently revertible switch.

Tracking issue: [#300](https://github.com/tametheboardgame/unicorn-valley/issues/300).
Successor: [ENG-WP2](https://github.com/tametheboardgame/unicorn-valley/issues/301).

## Prerequisite: established green baseline

ENG-WP1 PR [#299](https://github.com/tametheboardgame/unicorn-valley/pull/299) merged into `main` as `0231c1d8b68c90c5f62519419d73853f297a92c9`. Its exact-head [CI #38160902089](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38160902089) passed all required checks including full Chromium (three jobs), cross-browser and Merge Gate.

The Chromium job durations below were measured from their actual GitHub Actions logs (first to last timestamp), not estimated test durations:

| Tier 3 job | Selected | Passed | Skipped | GitHub job elapsed |
| --- | ---: | ---: | ---: | ---: |
| Chromium 1/3 | 103 | 102 | 1 | 20.5 min |
| Chromium 2/3 | 105 | 103 | 2 | 29.9 min |
| Chromium 3/3 | 99 | 99 | 0 | 20.4 min |
| **Total / critical path** | **307** | **304** | **3** | **~70.8 aggregate runner-min / 29.9 min slowest job** |

Run Tier 4 cross-browser completed successfully in 10.4 min. The three Chromium jobs started concurrently; the 29.9-minute second shard was the slowest required browser job. These are **one-run baseline measurements**, not an empirical guarantee of future times or billed usage.

## Scope / invariants

- Only the CI Tier 3 shard matrix (1–6), shard denominators, artifact names, corresponding static policy verification and operator documentation change.
- Keep the same `tests/play/**` suite, `workers: 1`, `fullyParallel: false`, default test timeouts, `fail-fast: false` and `timeout-minutes: 45`.
- The GitHub Actions matrix must still be a **single required aggregate Tier 3 job**: no Merge Gate relaxation and no per-shard bypass.
- Do not alter product logic, accepted tests, skips or test thresholds for speed.
- Keep all changes implementing the six-shard switch together in **one isolated git commit**, separate from this package/state-record commit and unrelated WP2 work.

## Execution checkpoints

### A — Baseline and rollback boundary

- This package, status and project-state reconciliation are their own commit.
- Record the exact passing three-shard run and performance evidence above.
- Preserve an explicit decision boundary: do not merge an unqualified or measurably inferior six-shard PR.

### B — Isolated six-shard switch

- Change `.github/workflows/ci.yml` matrix, display job names, `--shard=N/6` and artifact suffixes coherently.
- Update `TESTING.md`.
- Add a fast policy test validating the six numeric shard entries and matching command/name/artifact denominator.
- Stage all the above **in one implementation commit** whose SHA is recorded in the PR.

### C — Qualification and decision

- First allow one draft CI to validate static/policy/build or selected checks.
- Mark Ready for Review only after draft is green; run one exact-head full qualification.
- Require **6/6 Chromium jobs**, Tier 0/1, build, smoke, Tier 4 and Merge Gate success; inspect reported per-job counts to ensure all 307 selected test cases remain accounted for (subject to any contemporaneous suite changes).
- Check whether six jobs genuinely overlap; benchmark the slowest job, total runner-minutes, setup overhead and any queue latency against the baseline.
- Keep the PR unmerged if qualification is red, or if six-shard wall time is not meaningfully better. Review runner-minute trade-off if wall-time gain is small.
- Treat improvements under ~15% with material additional runner costs (e.g. >25%) as a reason to revert or revise rather than blindly accept.
- Record evidence and a decision in this package and issue #300 before moving to ENG-WP2.

## Immediate backout / rollback

**Before merge:** close the draft or qualified six-shard PR; `main` remains on the proven three-shard setup.

**After merge:** revert **only the isolated six-shard implementation commit** (the matrix, matching policy test and `TESTING.md` are in the same commit), without reverting this package/baseline record or ENG-WP1. For example:

```bash
git switch -c revert/eng-wp1-11-six-shards main
git revert <SIX_SHARD_IMPLEMENTATION_COMMIT_SHA>
git push -u origin revert/eng-wp1-11-six-shards
```

Open a small rollback PR, verify required CI, merge. The revert restores `[1, 2, 3]`, `--shard=N/3`, artifacts ending `-of-3`, prior docs and their accompanying policy expectation. Do not force-push `main` or weaken Merge Gate. The exact SHA will be recorded on PR creation.

## Exclusions

- No moving tests between files or writing a custom sharder in this checkpoint.
- No six-runner guarantee until observed; GitHub runner concurrency/queueing is an external constraint.
- No change to browser compatibility matrix or to production deployment.
- No ENG-WP2 test-contract work in this PR.

## Completion

**Completed 11 October 2026.** The isolated six-shard implementation commit `940d0c34cdb6f74273cc72a920206846db8c86ce` passed draft [CI #38163775839](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38163775839) and authoritative exact-head [CI #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951), including all six full Chromium shards, cross-browser, unit/build/smoke and Merge Gate. [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302) merged into `main` as `e9985075d9aebd129eebfe5550b2ace90d13d50a`.

Observed draft Chromium job durations: **14.36, 6.03, 13.15, 11.06, 14.13 and 7.09 min**. Six shards finished all 307 selected tests (304 passed, 3 skipped), compared with the three-shard critical path of 29.9 min. The six-shard critical path was **14.36 min (~52% faster)** and the aggregate runner-job elapsed was **65.82 min (~7% less)**. No observed GitHub queueing of the six runners in the trial; one-run measurement, not a long-term guarantee.

**Revertible implementation:** `git revert 940d0c34cdb6f74273cc72a920206846db8c86ce` in its own branch/PR returns exactly to static three shards while preserving all earlier ENG-WP1 hardening and this baseline record. For the next evolution use [ENG-WP2](ENG-WP2-TEST-CONTRACT-LIFECYCLE.md) and [ENG-WP3](ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md); any new adaptive change should use **static six** as its immediate fallback.
