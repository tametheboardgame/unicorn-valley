---
id: ENG-WP3.6
title: Evaluate parallel Tier 2 selected browser execution
status: in_progress
autonomy: amber
depends_on: [ENG-WP3]
parallel_safe: false
human_gate: engineering merge review
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Isolated selected-browser CI configuration only; no gameplay, assertions, Tier 3/4, global timeout or test ownership changes
---

# ENG-WP3.6 — Tier 2 selected Chromium execution health

Tracking: [CI health issue #347](https://github.com/tametheboardgame/unicorn-valley/issues/347). Independent of World [C23C PR #346](https://github.com/tametheboardgame/unicorn-valley/pull/346).

## Verified entry evidence (4 November 2026)

- C23C draft run [#41796982038](https://github.com/tametheboardgame/unicorn-valley/actions/runs/41796982038) selected **125 tests with one worker** and passed 75 without an assertion failure before the Tier 2 job was cancelled at the existing 25-minute limit. Its Merge Gate correctly failed. All seven new C23C.1/C23C.2 browser tests, numbered 20–26, passed.
- An earlier C23C selected run [#41664853873](https://github.com/tametheboardgame/unicorn-valley/actions/runs/41664853873) similarly passed 74 before cancellation. Increasing the runner's worker count to two does not distribute tests within one spec while the inherited Playwright `fullyParallel` value is false.
- The original full six-shard Chromium execution, seven browser compatibility profiles, verification ownership and Merge Gate remain the protected baseline; no user-visible Crystalarium release or merge is authorised.

## Bounded trial

1. Keep `playwright.config.ts` and `playwright.compat.config.ts` unchanged. Introduce a CI-only `playwright.selected.config.ts` inheriting the baseline but enabling `fullyParallel: true` with three isolated workers.
2. Switch only `runSelectedBrowserTests.mjs` to this selected config when `CI` is set. Preserve all selected spec paths, fail-closed validation, all original tests, assertions, timeouts, artefacts and the 25-minute Tier 2 job limit. Local and final full-qualification commands retain their existing configs.
3. Observe a fresh selected run of the **entire** Crystalarium spec after adoption in an independent engineering qualification. Require the complete discovered identity inventory to execute exactly once (actual skips may remain, but must be accounted for), zero unexpected/flaky regressions, green Tier 2 and protected Merge Gate. A partially green or cancelled run does not qualify.
4. Measure elapsed Tier 2 wall time and rough runner occupancy against the recorded serial 75/125-at-25-minute baseline. Review browser worker contention and test isolation from actual logs; retain the change only on observed stable evidence.
5. Before integration, prove static-six Tier 3, Tier 4 profiles and full merge qualification remain green on the **exact** head. Evaluate compatibility with currently active World and Story House PRs; no direct merge or main push.

## Independent selected-suite canary

The path-filtered `.github/workflows/tier2-selected-validation.yml` runs only for edits to this selected runner or its proof machinery. It discovers all Crystalarium test identities using the identical selected config, executes the complete unchanged spec through the production ownership-selected wrapper, and uses the already-qualified WP3.1 normaliser and exact-cover reconciler for a 1/1 execution proof. Full protected CI remains a separate requirement. Cancellation, missing identities, unexpected outcomes and a non-green job do not qualify this experiment.

## Rollback and exit

Rollback is confined to deleting `playwright.selected.config.ts` and restoring the prior selected runner invocation. No change to test inventory, product state or authoritative configuration is required. Keep this work package draft until selected-run evidence, isolated code review and the separate engineering merge decision are recorded; otherwise retain the established baseline and investigate splitting the large Crystalarium spec without losing identities.
