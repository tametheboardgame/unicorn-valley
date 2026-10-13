# Project Status

Last updated: 2026-10-13

## Integrated mainline — authoritative hand-off

- Main SHA at work-package start: `b43934a0464d67fb87c4ef67f87d6f0862c062fa` — [ENG-WP2.5 PR #312](https://github.com/tametheboardgame/unicorn-valley/pull/312), final [CI #38374304240](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38374304240) green after one WebKit retry.
- ENG-WP1 and WP1.11, WP2.1, WP2.2, WP2.3A, WP2.4, WP2.5 and WP3.1 are **merged**. The six static Chromium shards, seven cross-browser profiles, complete unit/build/smoke checks, reviewed test impact and exact-head/latest-main Merge Gate remain the accepted baseline.
- The [Protect Main ruleset](https://github.com/tametheboardgame/unicorn-valley/rules/24999228) is **active** and requires PRs, strict up-to-date `Merge Gate`, no force pushes or branch deletion, and has no bypass actors. Configuration and GitHub Actions check-source binding verified. [WP2.5E issue #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) stays open pending a non-destructive stale-but-otherwise-green PR mergeability negative test.
- WP2.1 inventory initially observed 82 historically unowned browser spec files, retained and visible in suite health. Do not assume this number is permanent or omit existing coverage. No production deployment authorised.

## Current work — ENG-WP3.2 Shadow Scheduler

[ENG-WP3.2](docs/work-packages/ENG-WP3.2-DURATION-AWARE-SHADOW-SCHEDULER.md) is the active engineering package, branch `agent/eng-wp3-2-shadow-scheduler`. Implement duration-aware **observational** plans for 6/8/10/12 shards using the WP3.1 per-file evidence and eligible clean history; compare projected critical-path/test-work and runner cost to the existing static-six baseline. Include deterministic negative tests, SHA/run provenance, multiple-run comparison when history exists, and honest no-history reporting.

**Do not activate** the proposed scheduler or modify the six-shard GitHub matrix, test inventory authority, merge rules or gameplay in WP3.2. [ENG-WP3.3](docs/work-packages/ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md) is the next separately qualified activation checkpoint. WP3.4 compatibility optimisation remains optional; WP3.5 is operational handover.

## Parallel streams and close-out discipline

- World, Just Games, Story House and Engineering have independent records in `docs/streams/state/`. Their draft branches and previews remain isolated; product PRs do **not** all rewrite root state.
- [Just Games MG-WP7 PR #289](https://github.com/tametheboardgame/unicorn-valley/pull/289), [Story House Alice PR #261](https://github.com/tametheboardgame/unicorn-valley/pull/261) and historic open PRs #230/#176 need latest-main reconciliation before final integration.
- Every completed engineering/integration work package must reconcile `AGENTS.md`, `PROJECT_STATE.json`, `STATUS.md` and its work-package status. A product-stream package updates its own state and leaves a clear integration-summary checkpoint; do not create overlapping root-state edits in every product PR. The completion check is enforced on final engineering integration PRs and documented for other streams.

## Delivery

Current ENG-WP3.2 PR is **draft / in progress** until code, documentation and TEST_IMPACT_V1 review plus authoritative exact-head full CI are green. No merge or production deployment implied by an observational shadow report.
