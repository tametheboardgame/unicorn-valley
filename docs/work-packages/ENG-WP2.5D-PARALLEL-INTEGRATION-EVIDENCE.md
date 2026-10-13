---
id: ENG-WP2.5D
title: Parallel Integration Validation Evidence
status: in_progress
autonomy: green
depends_on: [ENG-WP2.5]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Real concurrent PR deployment evidence, overlap diagnostics and deterministic story catalogue integration tests
---

# ENG-WP2.5D — Concurrent Stream Integration Evidence

Evidence collected 13 October 2026 for [issue #306](https://github.com/tametheboardgame/unicorn-valley/issues/306) and [draft PR #312](https://github.com/tametheboardgame/unicorn-valley/pull/312).

## Actual simultaneous PRs and deployment provenance

These are **three distinct open product PRs** (not fabricated branches or test duplicates). GitHub Cloudflare bot comments report successful deployments for each PR's current head at the checked snapshot.

| Stream | PR | Current head | Bot-reported branch preview | Verification |
| --- | --- | --- | --- | --- |
| World | [#176](https://github.com/tametheboardgame/unicorn-valley/pull/176) | `df945758b3646ea7f971abc02654e6533c183e19` | https://agent-r6-5-wp19h2-moonflower.unicorn-valley.pages.dev | [Deployment comment](https://github.com/tametheboardgame/unicorn-valley/pull/176#issuecomment-5750250044) binds `df94575` |
| Just Games | [#289](https://github.com/tametheboardgame/unicorn-valley/pull/289) | `15a6e77707db60671dcb1a69e2b16e670639b80b` | https://agent-mg-wp7-pond-leap.unicorn-valley.pages.dev | [Deployment comment](https://github.com/tametheboardgame/unicorn-valley/pull/289#issuecomment-6022011836) binds `15a6e77` |
| Story House | [#261](https://github.com/tametheboardgame/unicorn-valley/pull/261) | `0e732089ee51ab71e51824609e8fc2de151eaa41` | https://agent-story-house-alice-mode.unicorn-valley.pages.dev | [Deployment comment](https://github.com/tametheboardgame/unicorn-valley/pull/261#issuecomment-5969463904) binds `0e73208` |

All three PRs target `main`, their branch preview names differ and the deployment comments identify different current commit prefixes. GitHub's PR-scoped CI concurrency expression, `ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`, prevents a push to one PR cancelling another's run.

**Verification boundary:** these are provider-reported deployments, not three manually exercised live browsers. Direct attempts to resolve the three preview hosts were unavailable in this environment. Do not treat the old World #176 preview as current `main` or merge acceptance.

## Actual open-PR changed-file collision audit

Scanned every changed-file page for the five open PRs (#312, #289, #261, #230, #176), including 105 files across two pages for historic World #176. Exact path overlaps were:

| PR pair | Exact shared paths | Integration disposition |
| --- | --- | --- |
| #289 Just Games / #176 World | `src/game/testing/BrowserDiagnostics.ts` | **Real cross-stream source collision.** Do not merge either candidate without assigning an owner and reviewing/reconciling both changes on latest main |
| #312 Engineering / #176 World | `AGENTS.md`, `PROJECT_STATE.json`, `STATUS.md` | **Global governance/status overlap.** #176 is a historical pre-enforcement branch; do not allow its old root-state content to replace newer main governance |
| Other examined pairs | No exact-file overlap in the checked snapshots | Not proof of absence of semantic coupling; final integration still needs area review |

A new final product PR (rollout boundary #312) now checks other *live open PRs* through the GitHub API, including paginated changed files. Unresolved exact-path overlaps fail its final ownership validation; old PRs are not retroactively denied draft feedback. Policy tests exercise collisions involving browser diagnostics and canonical game registration. A warning still identifies shared integration surfaces even without an actual overlapping PR.

## Deterministic Story House catalogue proof

The existing `scripts/generateStoryCatalogue.mjs` is the authority: it discovers per-title `book.json` source, rejects duplicates, includes published entries and sorts the output by title. `parallelStoryGenerator.test.mjs` runs that **real generator** in isolated temporary directory fixtures, adding two independent valid published titles in *both orders*. It compares the exact generated catalogue bytes, verifies all three expected IDs survive, and calls the generator's `--check` mode. Companion pure tests reject conflicting IDs and confirm that an integration projection does not erase another title.

This demonstrates deterministic generation for non-overlapping title assets, not that the currently open Alice/Lion PRs have been rebased and merged. After an actual Story PR integrates current main, regenerate `public/stories/catalogue.json` and run `npm run story:catalogue:check`.

## Merge-order and source freshness

The tested stale-main scenario uses an unchanged green candidate head with a newer integrated `main`. `mergeFreshnessPolicy.test.mjs` rejects that candidate; it accepts current-main ancestry when compare evidence matches the live main ref. The real final Merge Gate independently checks the live head and main ancestry and re-reads main after comparison; GitHub API failures fail closed. The three independent stream-state records are verified in isolation in `streamStatePolicy.test.mjs`; no stream overwrites the other's JSON file.

**Not asserted:** no two real unapproved feature PRs were forcibly merged in different orders; this is a safe policy + synthetic integration demonstration. The final race between green CI and a subsequent main merge still requires protected required checks configured with strict up-to-date enforcement or a GitHub merge queue.

## Evidence disposition

- Policy and merge-order regression tests: implemented, CI qualification pending on the latest PR #312 head.
- Three real concurrent PR branches and provider-reported current-head branch previews: evidenced in GitHub.
- Live HTTP/browser validation for all three preview endpoints: **not verified** from this environment.
- Real overlapping source and governance paths: identified, not silently auto-resolved.
- Repository protection read: HTTP 403; ruleset list empty at audit time. **Admin action outstanding** before platform-enforced merge safety can be claimed.
- No product PRs modified or merged. Existing game/browser test suites retained.
