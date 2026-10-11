# Project Status

Last updated: 2026-10-11

## Current work

**ENG-WP1.11 — Six-Shard Chromium Qualification** is the active bounded engineering package.

- Branch: `agent/eng-wp1-11-six-chromium-shards`
- Tracking issue: [#300](https://github.com/tametheboardgame/unicorn-valley/issues/300)
- Detailed package: `docs/work-packages/ENG-WP1.11-CHROMIUM-SIX-SHARD-QUALIFICATION.md`
- State: baseline captured; six-shard implementation and comparison pending. This change has a dedicated, single-commit rollback boundary.
- Next engineering programme: [ENG-WP2 — work-package test assessments and contract lifecycle, #301](https://github.com/tametheboardgame/unicorn-valley/issues/301).

## Accepted engineering baseline

ENG-WP1 is **complete**. [PR #299](https://github.com/tametheboardgame/unicorn-valley/pull/299) was merged into `main` on 11 October 2026 (`0231c1d8b68c90c5f62519419d73853f297a92c9`).

Authoritative [CI #38160902089](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38160902089) passed Tier 0, Tier 1, build/performance, current whole-game smoke, three full Chromium shards, Tier 4 compatibility and the exact-head Merge Gate on PR head `13c52cc990ee3ff885550c1924f8f0be4ad28f73`. The earlier 47-browser-failure baseline was remediated.

Three-shard performance benchmark from that run: 20.5 / 29.9 / 20.4 minutes; **307 tests selected, 304 passed, 3 skipped**. The slowest Chromium shard was 29.9 minutes. See ENG-WP1.11 for measurements and reversal rules.

**Repository administration action still outstanding:** require `Merge Gate` via GitHub branch protection on `main`; the integration cannot set protected-branch configuration.

## Product baseline and paused features

- Story House: complete through SH1.8, including Alice, Peter Rabbit, Jemima Puddle-Duck and The Lantern at the Edge of the Woods.
- Crystal Brook: H6.0–H6.5 human-approved; H6.6 Crystal Cup Race Hub maturity is the next world checkpoint.
- Mini-games: MG-WP0–MG-WP6 complete; MG-WP7 Pond Leap expansion remains paused.
- Rainbow Run final racing-area review remains deferred.
- Keep product feature development separate from the short engineering optimisation and ENG-WP2 governance work; no production deployment is authorised by this work.

## Next decisions

1. Qualify six-shard CI in its own PR and compare real elapsed time and runner costs against the three-shard baseline.
2. If worse, do not merge; if merged and later found worse, revert the isolated six-shard implementation commit by PR.
3. Start ENG-WP2 only after an explicit recorded disposition for this trial.

Do not repeatedly poll CI; on a user request check once, diagnose terminal failures, and stop if awaiting an external run. Reconnect GitHub automatically after connection loss.
