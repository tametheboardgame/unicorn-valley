---
id: ENG-WP2.5
title: Parallel Development and Merge Safety
status: in_progress
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP2.4]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Stream-specific state and review enforcement plus current-main freshness in exact-head merge gate
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
Stage: provisional. Areas: engineering/shared governance. Positive and negative Node policy tests and Python state-validation checks; existing gameplay/browser test cases unchanged. Full PR-wide review required before Ready for review.

## Initial baseline
- `main`: `715959e469638af379003368d8d2fde595047dea` (ENG-WP2.4 merged).
- Existing `mergeGatePolicy.mjs` checks exact PR head but not current main ancestry.
- `scripts/ai/validate-project-state.py` validates one root state and work-package front matter only.
- GitHub CI concurrency is PR-scoped; existing static Chromium is six shards.
- PR #289 Just Games, PR #261 Story House and related legacy drafts need current-main refresh before finalisation; independent preview builds are not yet demonstrated in this package.

## Completion record
Implementation and final qualification pending.
