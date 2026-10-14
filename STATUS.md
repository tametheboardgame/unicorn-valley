# Project Status

Last updated: 2026-10-14

## Accepted integrated main — ENG-WP3.2 closed

- Accepted merged `main` integration SHA: `748d797b4c6298dd923cb410686a50898f14d663` from [ENG-WP3.2 PR #314](https://github.com/tametheboardgame/unicorn-valley/pull/314). Final exact-head [CI #38526137461](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38526137461) passed Tier 0, unit, build, whole-game smoke, six of six Chromium shards, seven cross-browser profiles, test-evidence reconciliation and required Merge Gate.
- ENG-WP1/1.11, ENG-WP2.1, 2.2, 2.3A, 2.4, 2.5, and ENG-WP3.1–3.2 are merged. WP3.2 provides **shadow-only** duration-aware file allocations for 6/8/10/12 shards, with historical evidence provenance and conservative unknown-duration handling. Static-six execution and Merge Gate authority remain unchanged.
- WP3.2 final suite-health report observed **110/110 browser files, 311 tests**, three actual skips and **one valid independent historical run**. A second independent comparable run is needed before asserting multi-run speed improvement; estimates are not measured job-wall time.
- `AGENTS.md` now requires integration close-out reconciliation, and Tier 0 enforces engineering integration package state files plus independent product stream state. This follow-up PR remedies the post-merge root-state lag.
- The [Protect Main ruleset](https://github.com/tametheboardgame/unicorn-valley/rules/24999228) is active with strict up-to-date GitHub Actions Merge Gate, pull requests and no ordinary bypasses. [ENG-WP2.5E issue #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) remains open pending safe stale-otherwise-green PR rejection evidence. Do not claim it closed.
- Suite health retains historical debt: 82 existing unowned browser spec files in the last observed inventory, not deleted or weakened. No production deployment authorised.

## Next bounded package

**[ENG-WP3.3 — Activate Adaptive Tier 3](docs/work-packages/ENG-WP3.3-ADAPTIVE-SCHEDULING-ACTIVATION.md)** is next. Do not activate a non-static configuration based on a single historical run. Implement a full, SHA-bound, deterministic manifest-based planner, bounded dynamic matrix, independent completeness checking, negative tests and an explicit independently reversible **static-six fallback**. Prove the candidate against representative healthy evidence before enabling any non-six assignment; preserve exact-head Merge Gate and fast draft previews. Parent [ENG-WP3 roadmap](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md).

Independent World, Just Games and Story House PRs retain their own stream-state and draft preview contracts. Open drafts include [MG-WP7 PR #289](https://github.com/tametheboardgame/unicorn-valley/pull/289) and [Story House Alice PR #261](https://github.com/tametheboardgame/unicorn-valley/pull/261); older open PRs #230/#176 need conflict/latest-main review.

## Delivery and handoff

The WP3.2 close-out PR is a documentation/status integration correction and does not change the runner matrix, tests or game code. On its merge, record the resulting integration SHA in the **next** bounded WP3.3 status checkpoint; do not fabricate a future merge commit. ENG-WP3.4 (optional cross-browser split) and ENG-WP3.5 (handover) remain later.
