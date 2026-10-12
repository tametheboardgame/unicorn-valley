# Project Status

Last updated: 2026-10-12

## Engineering checkpoint

**ENG-WP1 — complete.** [PR #299](https://github.com/tametheboardgame/unicorn-valley/pull/299) passed its exact-head Merge Gate and merged on 11 October 2026.

**ENG-WP1.11 — complete.** [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302) merged as `e9985075d9aebd129eebfe5550b2ace90d13d50a` after exact-head [CI #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951) passed all six Chromium shards, cross-browser, unit, static, build, smoke and Merge Gate.

Initial measured Chromium critical path changed from **29.9 min (3 shards)** to **14.36 min (6 shards)**. Same 307 selected tests (304 passed, 3 skipped); six-shard combined runner elapsed 65.82 min against ~70.8 min before. This is an initial comparison of successful runs, not a permanent performance guarantee. The isolated six-shard switch can be reverted via commit `940d0c34cdb6f74273cc72a920206846db8c86ce`.

## Current engineering implementation — ENG-WP2.1

Active branch: `agent/eng-wp2-1-contract-inventory`, PR #305 targeting `main`. Roadmap PR #304 qualified and merged as `fa48da5ea450cfc9bbd188fd5d9dcb5c285ef7ef`.

A first inventory pass found **110 full Chromium spec files, 166 unit test files and 82 browser specs not referenced by current BROWSER_GROUPS**. These are unowned for targeted selection, not automatically stale or missing from the full suite.

WP2.1 adds a derived contract inventory and a frozen legacy-unowned list. New unowned Chromium specs, missing mapped files, broken smoke/cross-browser references, stale exceptions, expired quarantines and invalid retirement declarations are errors. Prior ownership debt remains visible pending deliberate review. This checkpoint changes **no product behaviour, test selection, assertions, sharding or Merge Gate rules**.

Validation: all draft Tier 0, selected unit/build and whole-game smoke checks passed on [CI #38210251505](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38210251505), with Chromium and compatibility qualification still to be verified. Code/documentation/test-impact finalisation complete; PR #305 is moving to Ready for review for authoritative exact-head full qualification. Six-shard main baseline is unchanged. **Do not claim WP2.1 complete or merged until full qualification and merge are confirmed.**

Accepted governance: **UV-D028** keeps repeated preview edits rapid with review/CI at finalisation; **UV-D029** defines three parallel World/Just Games/Story House streams. **WP2.2** must implement draft-versus-final test-impact enforcement; **WP2.5 issue #306** owns machine-enforced per-stream state, overlap detection and merge freshness. These future checks have not been implemented by WP2.1.

## Engineering roadmap

1. **[ENG-WP2 — Test Contract Lifecycle and Work-Package Impact Reviews](docs/work-packages/ENG-WP2-TEST-CONTRACT-LIFECYCLE.md)**, [issue #301](https://github.com/tametheboardgame/unicorn-valley/issues/301): active implementation package. Owns finalisation-stage test-impact review for new/current work packages, contract ownership and health policy.
2. **[ENG-WP3 — Adaptive Test Architecture](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md)**, [issue #303](https://github.com/tametheboardgame/unicorn-valley/issues/303): subsequent bounded architecture work. Owns duration history, dynamic balancing and optional cross-browser optimisation. Consumes WP2's registry/impact policy rather than competing with it.

Proposed order: WP2.1 contract identity and WP2.2 mandatory change assessment first; WP3.1 evidence and WP3.2 shadow balancing next, with WP2.3/2.4 hardening/health. Dynamic production of CI shard matrices requires a separately qualified WP3.3 PR and static-six rollback.

**Current engineering code work:** WP2.1 inventory work is implemented on a draft branch, pending qualification. Existing six-shard `main` is the accepted CI baseline. No production deployment performed.

## Product scope

- Story House complete through SH1.8; Alice, Peter Rabbit, Jemima Puddle-Duck and The Lantern at the Edge of the Woods approved and merged.
- Crystal Brook H6.0–H6.5 approved; H6.6 Crystal Cup Race Hub is the next deferred world package.
- MG-WP0–MG-WP6 complete; MG-WP7 Pond Leap expansion is paused.
- Rainbow Run final area/racing review remains deferred. Resume product packages independently of this testing architecture roadmap when authorised; new/current packages will be subject to WP2 impact review once enforced.

## Governance reminder

`main` still requires GitHub repository-administrator branch protection to make **Merge Gate** a platform-required check; in-repository gate alone is not platform protection.

Keep CI checks bounded, maintain the exact-head merge requirement, and do not poll repeatedly. Reconnect GitHub automatically if access fails. Each new substantive package is a bounded PR with a clear rollback.
