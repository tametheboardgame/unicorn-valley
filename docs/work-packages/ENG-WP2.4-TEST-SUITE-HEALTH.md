---
id: ENG-WP2.4
title: Test Suite Health and Contract Review Policy
status: proposed
autonomy: green
depends_on: [ENG-WP2.1, ENG-WP2.2, ENG-WP3.1]
parallel_safe: false
human_gate: none
mini_game_platform_impact: none
test_impact_stage: provisional
test_impact_scope: Health thresholds and review evidence for existing CI test contracts
---

# ENG-WP2.4 — Test Suite Health and Contract Review Policy

Tracking: [ENG-WP2 #301](https://github.com/tametheboardgame/unicorn-valley/issues/301). Based on the completed [ENG-WP3.1 evidence package](ENG-WP3.1-TEST-INSTRUMENTATION.md). **Planning only: no new CI behaviour has been implemented by this document.**

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

Provisional. Engineering test-metadata/reporting only. Expected test updates are Node policy and evidence-analysis unit tests; existing gameplay/Chromium contracts remain intact. A complete actual-diff reviewed assessment is required before Ready for review.

## Completion record

Proposed after the WP3.1 merge on 12 October 2026; implementation not started.
