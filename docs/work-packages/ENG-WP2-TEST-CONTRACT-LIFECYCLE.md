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

## Scope limits / rollback

No production gameplay changes, no reducing full qualification, no mass-retrofit of historical closed packages, no test deletion solely to go green. Each checkpoint gets an independently reviewable PR and a simple rollback. Maintain the proven static-six Chromium fallback.

## Completion record

**WP2.1 implementation committed, awaiting CI.** Branch `agent/eng-wp2-1-contract-inventory` adds a filesystem-discovered unit/browser contract inventory, validates smoke and compatibility references, and derives ownership from the existing `verificationOwnership.mjs`. The existing historical unowned browser files are captured in a frozen baseline so newly added unowned contracts fail inventory validation while legacy debt remains visible.

Initial inventory: **110 browser spec files**, **166 unit spec files**, **82 browser specs without an explicit ownership group**. These 82 are still executed by full Chromium CI and are not presumed obsolete; review/mapping belongs in subsequent deliberate slices. The lifecycle metadata (active, retired, replaced, quarantined and expiry/replacement integrity) has a first documented example in the canonical ownership module.

WP2.2 mandatory new/current WP impact enforcement, WP2.3 browser fixture work and WP2.4 suite-health policy are **not implemented**. This checkpoint is not yet CI-qualified.
