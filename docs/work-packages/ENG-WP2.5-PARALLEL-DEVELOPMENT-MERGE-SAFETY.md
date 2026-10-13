---
id: ENG-WP2.5
title: Parallel Development and Merge Safety
status: in_progress
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP2.4]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: reviewed
test_impact_scope: Reviewed independent stream ownership and state, latest-main merge gate, live overlap and story catalogue integration tests
---

# ENG-WP2.5 — Parallel Development and Merge Safety

Tracking: [issue #306](https://github.com/tametheboardgame/unicorn-valley/issues/306). Branch `agent/eng-wp2-5-parallel-merge-safety`, created from qualified [PR #311](https://github.com/tametheboardgame/unicorn-valley/pull/311) merge commit `715959e469638af379003368d8d2fde595047dea`.

## Objective
Let Main World, Just Games and Story House develop in parallel without competing root state updates, overwriting shared registrations or mistaking old-main qualifications for merge-ready CI. Maintain existing fast draft previews, six static Chromium shards and exact-head Merge Gate.

## Checkpoints
- **A — policy:** canonical stream ownership, safe/shared surfaces, world-first registration, story catalogue regeneration, topic branch and preview isolation. Explicitly reserve shared files and require PR overlap review.
- **B — independent state:** four stream-specific JSON records (world, just-games, story-house and engineering), validated for consistency with filename/id, branch, package, timestamps and legal states. Root `STATUS.md` / `PROJECT_STATE.json` remain integration summaries, not PR-by-PR content stream status. Add negative tests for malformed and other-stream edits.
- **C — freshness:** live compare of ready-for-review candidate commit with current integration `main`, fail closed if main is not an ancestor, while preserving provisional draft CI. Include a passing old-head/newer-main counterexample. No new test selection or CI gate authority.
- **D — independent integration:** evaluate three simultaneous stream PRs and branch previews, detect shared-file overlaps, validate deterministic story index regeneration and merged-main exact-head qualifications. Do not invent previews or merge unapproved content branches simply for a demonstration.

## Risk and limits
GitHub branch protection read is forbidden (403); rulesets endpoint returned an empty list on 12 October 2026. In-repository checks cannot stop a direct push or eliminate the time-of-check-to-merge race. Repository admin must make `Merge Gate` a required check with strict up-to-date branch/merge-queue protection, and disallow unqualified direct changes before full enforcement can be claimed.

No gameplay changes, test removal, blanket retries, new permanent integration branches, CI-run polling loops or production deployment.

## Test Impact Assessment
Stage: reviewed against the complete PR diff. Areas: engineering and world (one existing weather browser regression repaired). The five changed test contracts cover stream state, latest-main freshness, concurrent overlap, the real Story House generator and Phaser weather key input reliability. No assertion is removed, no gameplay code or test-selection architecture changed. The PR body records the final TEST_IMPACT_V1 review and exact file list. Authoritative non-draft CI remains required before merge.

## Initial baseline
- `main`: `715959e469638af379003368d8d2fde595047dea` (ENG-WP2.4 merged).
- Existing `mergeGatePolicy.mjs` checks exact PR head but not current main ancestry.
- `scripts/ai/validate-project-state.py` validates one root state and work-package front matter only.
- GitHub CI concurrency is PR-scoped; existing static Chromium is six shards.
- PR #289 Just Games, PR #261 Story House and related legacy drafts need current-main refresh before finalisation; independent preview builds are not yet demonstrated in this package.

## Completion record
Implementation and final qualification pending.

## A/B/C implementation checkpoint

Draft PR #312 now includes four independent JSON stream-state records, negative-policy tests for wrong-stream/global state mutations, and a live-main merge ancestry test integrated into final exact-head CI. Engineering-only root state is updated at this checkpoint. Scope A policies for shared file registry and branch previews are documented in the architecture guide. End-to-end stream integration and platform branch protection remain unverified; no new Merge Gate authority is claimed beyond the explicitly tested condition.

## ENG-WP2.5D delivery and integration audit — 13 October 2026

See [ENG-WP2.5D evidence](ENG-WP2.5D-PARALLEL-INTEGRATION-EVIDENCE.md). This checkpoint now includes an actual open-PR changed-file overlap inventory, head-bound Cloudflare deployment comments for distinct World (#176), Just Games (#289) and Story House (#261) previews, deterministic real-catalogue generation tests in both merge orders, and policy tests simulating opposite stream integration sequences. New final product PRs query live paginated open-PR file lists and reject unresolved path collisions; no historical feature branch was modified or merged for a demonstration.

Draft run [#38360120193](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38360120193) passed Tier 0, including format, lint, stream-state ownership, simulated parallel integration and actual Story House generator tests. This is **not** full authoritatively qualified CI and does not demonstrate three simultaneously running live browser sessions.

Remaining external qualification: direct HTTP/browser verification of all three branch previews could not be completed from this environment; provider-reported deployments remain the evidence. GitHub branch-protection lookup returned 403 and rulesets were absent. [ENG-WP2.5E #313](https://github.com/tametheboardgame/unicorn-valley/issues/313) tracks repository-admin strict required `Merge Gate` and current-base enforcement, including final merge-time race testing. The software work may be integrated after final full CI while the wider platform-enforcement objective remains explicitly open. Do not claim full platform protection merely because CI passed.

No production deployment or product PR merge. This parent work package stays in progress until the admin enforcement and preview verification gaps are resolved.
