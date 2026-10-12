---
id: ENG-WP2
title: Test Contract Lifecycle and Work-Package Impact Reviews
status: in_progress
autonomy: green
depends_on: [ENG-WP1, ENG-WP1.11]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Stage-aware final review enforcement for independent development PRs
---

# ENG-WP2 — Test Contract Lifecycle and Test-Impact Assessments

Tracking: [#301](https://github.com/tametheboardgame/unicorn-valley/issues/301). This is the **active engineering package** following the successful six-shard ENG-WP1.11 baseline. This document fixes the intended architectural contract and checkpoint order; implementation has started with WP2.1.

## Objective

Prevent repeated historical-test crises by making test maintenance an enforced **work-package finalisation and pre-merge** requirement, without slowing down draft visual/feature iteration.

ENG-WP2 is the **source of truth for which behavioural contracts exist, who owns them, what is being reviewed and which changes require new/updated/replaced coverage**. [ENG-WP3](ENG-WP3-ADAPTIVE-TEST-ARCHITECTURE.md) consumes that metadata to make execution faster. Neither creates a second verification-ownership system.

## Existing foundations (retain)

- `scripts/verification/verificationOwnership.mjs`: existing source/test ownership relationships.
- `scripts/verification/verificationSelection.mjs`, `verificationPolicy.mjs` and `planVerification.mjs`: incremental risk and tier selection.
- `scripts/ai/validate-project-state.py`: project-state/front-matter validation.
- `AGENTS.md`, `TESTING.md`, `docs/work-packages/README.md`, PR template: author and reviewer guidance.
- Exact-head Merge Gate and static six-shard CI remain authoritative throughout implementation.

## Bounded checkpoints

### WP2.1 — Contract inventory, ownership and lifecycle

Inventory active browser/unit/smoke/cross-browser contracts. Define metadata derived from or integrated with the current ownership map: stable contract identity, affected behaviour, owner, status (active/replaced/retired/quarantined), replacement/rationale, last-reviewed checkpoint and quarantine expiry. Inventory reports missing references, orphaned specs, unmapped changed subsystems, new tests without owners and obsolete contracts. Do not bulk-edit past closed work packages.

**Acceptance:** actionable integrity report, machine tests detecting missing/retired paths or bad ownership, migration example. No runtime sharding change.

### WP2.2 — Progressive assessment, mandatory final test review

Add an explicit **Test Impact Assessment** to the new/current work-package template and PR evidence, using two stages:

- **Provisional (draft):** identify affected area/behaviours, obvious risks and likely test owners. `TBC during finalisation` is acceptable. Several small UI/content/positioning updates must produce quick working preview URLs with light checks, **not** full suite or documentation/test-contract audits on every draft commit. Incomplete final-stage review must not fail a draft.
- **Reviewed (finalisation before Ready for review):** once the visual/functional work is approved, tidy code/architecture, reconcile documentation, and review tests against the **actual final diff**. Identify affected behavioural contracts and source-to-test owners, update/add/replace tests where necessary, or explicitly record `tests unchanged — reviewed, with reason`. Check unit, smoke, browser, compatibility, persistence, keyboard/mouse/touch and accessibility as applicable. Record risk, reviewer, human acceptance and supporting test evidence.

Implement machine-readable stage metadata in `validate-project-state.py` and review evidence in `AGENTS.md`, `TESTING.md`, the WP template and PR checklist. Apply to new/current-next packages only; do not retrofit closed work packages. CI must **allow incomplete provisional drafts**, validate the structure and optionally warn about unresolved items, and **reject incomplete, false or unchecked final-stage assessments** on non-draft heads. Compare assessment claims to changed files; never auto-rewrite, delete or weaken assertions.

Keep the risk-selected draft tests and existing high-risk-current-delta escalation. Full exact-head Tier 0–4 qualification still occurs **after finalisation**, immediately before merge. Do not treat a preview as qualification.

**Acceptance:** cosmetic-only and feature-change worked examples; negative policy tests showing incomplete draft is allowed and unreviewed Ready-for-review is blocked; diff-to-coverage evidence; no additional per-preview full test burden.
### WP2.3 — Stable, player-observable contracts

Harden reusable browser test fixtures: observable readiness, bounded waits with diagnostics, scene lifecycle, no screenshot polling loops, input modality coverage; improve actual flaky test families only when a current contract is understood. Keep functional assertions intact; no speculative timeouts or mass skips.

**Acceptance:** representative before/after reliability evidence and documented fixture usage.

### WP2.4 — Test health ownership, not scheduler duplication

Own suite-health definitions and review process: owner-less/ageing contracts, retries, recurrent flakes, skips, quarantine expiry, last confirmation, slowest specs and test additions/retirements. Define warning vs blocking thresholds and regular review cadence. ENG-WP3 supplies execution-duration telemetry and manifests; WP2 owns the **test-health policy**.

**Acceptance:** actionable health report and deliberate lifecycle review evidence, without changing the full-suite protection threshold.

## Policy lifecycle for any future feature PR

1. **Plan lightly:** scope, invariants, provisional test-impact note and human gate.
2. **Iterate and preview:** draft PR, fast build/preview URL, proportionate focused validation, repeated human feedback.
3. **Approve/freeze:** complete the functional/visual revision and record necessary human approval.
4. **Code/documentation review:** tidy architecture, implementation and current documentation.
5. **Final test-impact review:** reconcile the final diff with behavioural contracts and ownership; update tests or justify no changes.
6. **Ready for review:** run the complete exact-head unit/build/smoke/Chromium/cross-browser CI and Merge Gate; fix and rerun as needed.
7. **Merge and maintain:** merge only after green gate and human approval; retain lifecycle/health evidence. Production deployment remains separate.

**WP2.2 must enforce the assessment only at finalisation; normal draft preview edits must remain fast.**

## WP2.5 — Independent workstream and merge-safety governance (follow-up)

Tracking [#306](https://github.com/tametheboardgame/unicorn-valley/issues/306) and policy `docs/architecture/PARALLEL-DEVELOPMENT-STREAMS.md`. Main World, Just Games and Story House are independently previewed and qualified workstreams. WP2.5 will add per-stream durable status records, overlapping-file ownership detection and **latest-`main` integration freshness** to complement the existing exact-head gate; it must preserve quick draft previews.

World-first mini-game registration remains atomic in the originating world package. Just Games enhances that same scene and gameplay only after handoff; Story House owns title-local content plus deterministic regeneration of the shared catalogue. Shared architectural files require one responsible PR. **This section is planning only; the WP2.1 PR does not yet implement the technical freshness/state mechanisms.**


## Scope limits / rollback

No production gameplay changes, no reducing full qualification, no mass-retrofit of historical closed packages, no test deletion solely to go green. Each checkpoint gets an independently reviewable PR and a simple rollback. Maintain the proven static-six Chromium fallback.

## Completion record

**WP2.1 code and documentation review complete; authoritative qualification pending.** Branch `agent/eng-wp2-1-contract-inventory` adds a filesystem-discovered unit/browser contract inventory, validates smoke and compatibility references, and derives ownership from the existing `verificationOwnership.mjs`. The existing historical unowned browser files are captured in a frozen baseline so newly added unowned contracts fail inventory validation while legacy debt remains visible.

Initial inventory: **110 browser spec files**, **166 unit spec files**, **82 browser specs without an explicit ownership group**. These 82 are still executed by full Chromium CI and are not presumed obsolete; review/mapping belongs in subsequent deliberate slices. The lifecycle metadata (active, retired, replaced, quarantined and expiry/replacement integrity) has a first documented example in the canonical ownership module.

Finalisation audit (12 October 2026): inventory derives ownership from existing `verificationOwnership.mjs`, reports rather than deletes the **82 existing unmapped** browser specifications, and detects newly unowned specs/missing references/invalid lifecycle records. All existing gameplay and browser assertions remain unchanged. Tier 0, unit, build, whole-game smoke and initial Chromium shards passed on [draft CI #38210251505](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38210251505); that run was not merge-authoritative. [PR #305](https://github.com/tametheboardgame/unicorn-valley/pull/305) requires a final **Ready-for-review exact-head** qualification before merge, with the six Chromium shards and compatibility all green. Do not call WP2.1 complete or merged before those results are verified.

Decision [UV-D028](../../DECISIONS.md) preserves rapid preview iteration with a progressive test-impact review at finalisation, and [UV-D029](../../DECISIONS.md) governs concurrent World, Just Games and Story House streams. Their technical enforcement remains explicitly future work: WP2.2 stage-sensitive impact validation, and [WP2.5 / #306](https://github.com/tametheboardgame/unicorn-valley/issues/306) per-stream status, overlap detection and latest-main merge freshness. WP2.3 browser fixture work and WP2.4 suite health are likewise **not implemented**.


### ENG-WP2.2 implementation checkpoint (12 October 2026)

Branch: agent/eng-wp2-2-progressive-impact-review. PR-local JSON review contracts live in TEST_IMPACT_V1 comments in the PR body; stage=provisional on drafts is informational, never a full-test blocker. On Ready for review, a full cumulative PR diff is reconciled against declared stream areas and changed test files, with substantive retained-test reasoning required when no tests change. New WP front matter has explicit test_impact_stage and test_impact_scope, validated structurally. This is enforced for PR #307 onwards, exempting existing older open PRs, and applies across World, Just Games, Story House and engineering rather than modifying central state per PR.

First implementation adds a Node validator and negative tests to the Tier 0 suite, fires CI on PR description edits, and preserves six static Chromium shards and the exact-head Merge Gate. Its draft Tier 0 policy tests and static checks passed in prior run #38219310208. The additional test-retirement coverage passed its policy tests in run #38219547539 (which failed only Biome formatting). Code, documentation and impact review have now been reconciled. **Authoritative exact-head CI and merge are still pending**; do not mark WP2.2 complete until those conditions are met. WP2.3 flake analysis, WP2.4 health policy and WP2.5 latest-main/stream-state checks remain separate.

### WP2.3A — Observable scene readiness (first reliability checkpoint)

Scope: existing environment-production regression (Chromium shard 3 of CI #38219943960 failed once and passed unchanged on rerun), Just Games Pond Leap launch/return, Coach Match save/resume and the reusable browser diagnostics fixture. No production-game code, sharding change or global timeout adjustment.

Failure mechanisms and bounded fixes:
- Environment production originally awaited scene and anchor in separate browser calls before a third snapshot; a scene can transition between calls. The new waitForReadySceneSnapshot returns the **same diagnostic scene** in which both the active scene and its visible anchor were observed. Every existing required-layer and non-interactivity assertion remains unchanged.
- Pond Leap launch/return previously accepted scene activation alone. The contract now requires the visible pond-leap:frog marker; Chess Academy similarly requires sunbeam-chess:teacher before interacting.
- Coach Match resume previously clicked the destination immediately after pawn selection. It now waits for the visible coaching feedback indicating selection succeeded and for the resulting pawn location, retaining all pre-existing move/resume assertions.

Acceptance: check all changed regressions and full CI, document before/after pass/fail evidence, preserve original negative outcomes, do not use arbitrary waits, retries or weakened assertions. Marigold/Nova long multi-scene smoke remains a separate WP2.3 follow-up pending evidence, not a blanket timeout change.

**Status:** first patch committed on agent/eng-wp2-3-browser-readiness; draft CI and final human/merge gate pending.
