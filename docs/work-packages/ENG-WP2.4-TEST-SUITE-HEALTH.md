---
id: ENG-WP2.4
title: Test Suite Health and Contract Review Policy
status: in_progress
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP3.1]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Implementation PR #311 under provisional review until exact-head CI qualification
---

# ENG-WP2.4 — Test Suite Health and Contract Review Policy

Tracking: [ENG-WP2 #301](https://github.com/tametheboardgame/unicorn-valley/issues/301). Based on the completed [ENG-WP3.1 evidence package](ENG-WP3.1-TEST-INSTRUMENTATION.md). **Implementation in draft PR #311.** Health reporting is observational; no new Merge Gate dependency or shard selection rule.

## Goal

Expose ageing, unowned, slow and repeatedly failing tests early enough for their owning workstreams to maintain them during ordinary finalisation, without silently skipping them or impeding rapid provisional preview iterations.

## Proposed bounded scope

1. Consume the WP2.1 `contractInventory.mjs` inventory and WP3.1 run-scoped identity/duration/skip reports. WP2 owns policy and disposition; WP3 remains owner of execution instrumentation and future scheduling.
2. Report currently unmapped specs by path; contracts needing lifecycle review; explicit skips, quarantines/expiry, replacements, changed test inventory and last-known health. No automatic retirements.
3. Produce a machine-readable and human-readable report with per-spec observations and clear source/run provenance. Separate confirmed multi-run patterns from a single slow run. Never infer flakiness from one passing run.
4. Define owner, review cadence and warning/blocking rules. Only established integrity violations should fail closed; historical debt remains visible, not retroactively forbidden.
5. Demonstrate positive and negative policy tests: missing owner for a new test, vanished file references, expired quarantine, unreviewed test-change diff and honest owner disposition.
6. Measure baseline before/after report coverage and describe hand-off to WP3.2's shadow scheduler, without dynamically changing shards or Merge Gate authority.

## Non-goals

No gameplay changes, arbitrary timeout increases, blanket retries, test deletions, automatic quarantine, scheduling matrix changes or production deployment. Keep current six-shard exact-head qualification and fast draft previews.

## Test Impact Assessment

PR #310 only introduced the proposal. PR #311 implements the first reporting and validation checkpoint. Its test-impact assessment remains provisional pending final review. Existing browser gameplay contracts and test selectors remain unchanged.

## Implementation checkpoint

Started 12 October 2026 on a dedicated branch from the qualified WP3.1 close-out. Phase A: source-bound health reporting, inventory evidence correlation, explicit status and duration warnings, integrity checks, and Node policy tests. Phase B: CI artifact integration and actual-diff review, without new merge requirements or shard changes. Latest draft CI found formatting, suite-health test fixture and project-state errors; the test fixture and state have been corrected. No passing full authoritative run or merge yet.

## Implemented checkpoint (draft)

- `scripts/verification/suiteHealth.mjs` consumes WP2.1 contract inventory and complete source/run-bound WP3.1 six-shard results; produces JSON and Markdown health evidence.
- Reports legacy unowned tests as debt, genuine skips, slow spec observations, missing review/expired quarantine provenance through inventory, unobserved specs, and repeated failures only after distinct historical run evidence.
- `scripts/verification/suiteHealth.test.mjs` covers positive/negative policy cases; included in Tier 0 via the existing verification policy test entrypoint.
- CI generates an observational `suite-health` artifact with both formats after WP3.1 reconciliation. It does not add any Merge Gate dependency, change static six-shard selection or modify browser assertions.
- The optional `--history=history.json` argument expects previously validated health report objects; CI currently supplies only its current run and must not claim historical flakiness without actual archived records. Future history ingestion and retention needs operational qualification.

## Health policy

Hard contract integrity failures are inherited from WP2.1 and fail Tier 0: new unowned browser specs, missing ownership/file/replacement references, invalid or expired quarantines. Newly added suite-health Node tests fail Tier 0 if invalid evidence is accepted. Single-run slow/skip/age findings and frozen legacy unowned specs remain warning-level. Missing or inconsistent reporting prevents a valid health report; during the introduction stage, the report step is observational and does not alter the existing authoritative Merge Gate.

