---
id: ENG-WP2
title: Test Contract Lifecycle and Work-Package Impact Reviews
status: in_progress
autonomy: green
depends_on: [ENG-WP1, ENG-WP1.11]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
---

# ENG-WP2 — Test Contract Lifecycle and Test-Impact Assessments

Tracking: [#301](https://github.com/tametheboardgame/unicorn-valley/issues/301). This is the **active engineering package** following the successful six-shard ENG-WP1.11 baseline. This document fixes the intended architectural contract and checkpoint order; implementation has started with WP2.1.

## Objective

Prevent a repeat of the historical-test cleanup crisis by making test maintenance part of **every new or active work package and its code review**, rather than relying on occasional whole-suite repair.

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

### WP2.2 — Mandatory impact assessment for future work packages

Add a **Test Impact Assessment** to new and current/next package template and PR evidence:
- player behaviour(s) added, changed or deliberately removed;
- existing behavioural contract IDs/files and source-to-test ownership;
- tests to add/update/replace/retire, or explicit `reviewed: no test change` with reason;
- risk level and relevant smoke/compatibility, save/progression, keyboard/mouse/touch and accessibility requirements;
- expected validation tiers, named reviewer/acceptance evidence and unresolved exceptions.

Add machine-readable metadata validated by `validate-project-state.py`, compare stated impact to the **actual diff** through appropriate CI policy checks. New and current/next packages only, not all previously closed packages. A change without credible assessment must fail the relevant pre-merge check; a valid no-test-change decision remains possible. Detect mismatches but never automatically rewrite, delete or weaken an assertion.

**Acceptance:** positive example covering a feature and negative tests proving missing/false/unchecked assessment is rejected.

### WP2.3 — Stable, player-observable contracts

Harden reusable browser test fixtures: observable readiness, bounded waits with diagnostics, scene lifecycle, no screenshot polling loops, input modality coverage; improve actual flaky test families only when a current contract is understood. Keep functional assertions intact; no speculative timeouts or mass skips.

**Acceptance:** representative before/after reliability evidence and documented fixture usage.

### WP2.4 — Test health ownership, not scheduler duplication

Own suite-health definitions and review process: owner-less/ageing contracts, retries, recurrent flakes, skips, quarantine expiry, last confirmation, slowest specs and test additions/retirements. Define warning vs blocking thresholds and regular review cadence. ENG-WP3 supplies execution-duration telemetry and manifests; WP2 owns the **test-health policy**.

**Acceptance:** actionable health report and deliberate lifecycle review evidence, without changing the full-suite protection threshold.

## Policy lifecycle for any future feature PR

1. **Plan:** an impact assessment identifies affected behavioural contracts and expected tests.
2. **Develop:** draft PR runs cheap risk/ownership-selected tests; changes to tests and mappings accompany the feature delta where appropriate.
3. **Review:** compare assessment and files changed; account for new, replaced, removed, skipped or unowned tests. Require justified `no test change` when appropriate.
4. **Qualify:** human product/UX acceptance remains separate. Non-draft exact-head full suite (all Chromium shards, cross-browser, unit, smoke, build and Merge Gate) still required before merging.
5. **Maintain:** ownership, last-reviewed evidence and health exceptions remain recorded and visible.

## Scope limits / rollback

No production gameplay changes, no reducing full qualification, no mass-retrofit of historical closed packages, no test deletion solely to go green. Each checkpoint gets an independently reviewable PR and a simple rollback. Maintain the proven static-six Chromium fallback.

## Completion record

**WP2.1 implementation committed, awaiting CI.** Branch `agent/eng-wp2-1-contract-inventory` adds a filesystem-discovered unit/browser contract inventory, validates smoke and compatibility references, and derives ownership from the existing `verificationOwnership.mjs`. The existing historical unowned browser files are captured in a frozen baseline so newly added unowned contracts fail inventory validation while legacy debt remains visible.

Initial inventory: **110 browser spec files**, **166 unit spec files**, **82 browser specs without an explicit ownership group**. These 82 are still executed by full Chromium CI and are not presumed obsolete; review/mapping belongs in subsequent deliberate slices. The lifecycle metadata (active, retired, replaced, quarantined and expiry/replacement integrity) has a first documented example in the canonical ownership module.

WP2.2 mandatory new/current WP impact enforcement, WP2.3 browser fixture work and WP2.4 suite-health policy are **not implemented**. This checkpoint is not yet CI-qualified.
