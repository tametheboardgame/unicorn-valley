# Project Status

Last updated: 2026-10-12

## Engineering checkpoint

**ENG-WP1 — complete.** [PR #299](https://github.com/tametheboardgame/unicorn-valley/pull/299) passed its exact-head Merge Gate and merged on 11 October 2026.

**ENG-WP1.11 — complete.** [PR #302](https://github.com/tametheboardgame/unicorn-valley/pull/302) merged as `e9985075d9aebd129eebfe5550b2ace90d13d50a` after exact-head [CI #38165098951](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38165098951) passed all six Chromium shards, cross-browser, unit, static, build, smoke and Merge Gate.

Initial measured Chromium critical path changed from **29.9 min (3 shards)** to **14.36 min (6 shards)**. Same 307 selected tests (304 passed, 3 skipped); six-shard combined runner elapsed 65.82 min against ~70.8 min before. This is an initial comparison of successful runs, not a permanent performance guarantee. The isolated six-shard switch can be reverted via commit `940d0c34cdb6f74273cc72a920206846db8c86ce`.

## Engineering progress

**ENG-WP2.1 — complete and merged.** PR #305 merged to main as 4c627ffff4aa22d69f8a62eaa74a897d161374fa on 12 October 2026, after authoritative CI #38212024744 attempt 2 passed all six Chromium shards, compatibility, unit/build/smoke and Merge Gate. The visible failed-first-attempt records are kept for WP2.3. Inventory: 110 browser files, 166 unit files, 82 legacy unmapped browser specs recorded as visible debt but still fully tested.

**ENG-WP2.2 — final review complete, authoritative CI pending.** PR #307 on agent/eng-wp2-2-progressive-impact-review implements PR-local, stage-sensitive Test Impact Assessments. Drafts remain permissive; final reviews must reconcile the cumulative PR changed-file list, affected areas, changed tests and valid replacement contracts. Policy/architecture/lint/unit validation passed on earlier draft checks; the latest change corrects formatting and records the accepted final impact review. No gameplay or Chromium sharding change. **Ready-for-review qualification and merge remain outstanding.**

Fast-development decision UV-D028 and concurrent World/Just Games/Story House decision UV-D029 are active policy on main. ENG-WP2.5 #306 still owns the distinct technical integration-base freshness, overlap and per-stream state safeguards; no claim that these mechanisms have already been implemented.

## Engineering roadmap

1. **[ENG-WP2 — Test Contract Lifecycle and Work-Package Impact Reviews](docs/work-packages/ENG-WP2-TEST-CONTRACT-LIFECYCLE.md)**, [issue #301](https://github.com/tametheboardgame/unicorn-valley/issues/301): active implementation package. Owns finalisation-stage test-impact review for new/current work packages, contract ownership and health policy.
2. **[ENG-WP3 — Adaptive Test Architecture](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md)**, [issue #303](https://github.com/tametheboardgame/unicorn-valley/issues/303): subsequent bounded architecture work. Owns duration history, dynamic balancing and optional cross-browser optimisation. Consumes WP2's registry/impact policy rather than competing with it.

Proposed order: WP2.1 contract identity and WP2.2 mandatory change assessment first; WP3.1 evidence and WP3.2 shadow balancing next, with WP2.3/2.4 hardening/health. Dynamic production of CI shard matrices requires a separately qualified WP3.3 PR and static-six rollback.

**Current engineering code work:** WP2.2 stage-aware validator is in development and awaiting CI qualification. Existing six-shard `main` is the accepted CI baseline. No production deployment performed.

## Product scope

- Story House complete through SH1.8; Alice, Peter Rabbit, Jemima Puddle-Duck and The Lantern at the Edge of the Woods approved and merged.
- Crystal Brook H6.0–H6.5 approved; H6.6 Crystal Cup Race Hub is the next deferred world package.
- MG-WP0–MG-WP6 complete; MG-WP7 Pond Leap expansion is paused.
- Rainbow Run final area/racing review remains deferred. Resume product packages independently of this testing architecture roadmap when authorised; new/current packages will be subject to WP2 impact review once enforced.

## Governance reminder

`main` still requires GitHub repository-administrator branch protection to make **Merge Gate** a platform-required check; in-repository gate alone is not platform protection.

Keep CI checks bounded, maintain the exact-head merge requirement, and do not poll repeatedly. Reconnect GitHub automatically if access fails. Each new substantive package is a bounded PR with a clear rollback.

## Current scoped reliability work — ENG-WP2.3A

Branch agent/eng-wp2-3-browser-readiness addresses three historical failure families: environment scene snapshot transitions, Pond Leap sandbox readiness and Chess Academy input sequencing. The first checkpoint adds atomic diagnostic scene/ready-object capture and stricter real-feedback assertions, without changing gameplay or reducing tests. **Not yet CI-qualified or merged.** WP2.5 still owns parallel-stream state and latest-main merge freshness.
