# Project Status

Last updated: 2026-09-13

## Current work

`R6.5-WP19H0 - Architecture, UI, Test and Performance Consolidation` is active on draft PR #172 / branch `agent/r6.5-wp19h0-consolidation`.

H0A-H0J are implementation-complete and accepted. H0K final qualification is active. Nothing from this branch has been merged or production deployed.

H0G established deterministic affected-test ownership and fail-safe escalation. H0H replaced the obsolete total-JavaScript breadth failure with measured player-visible loading budgets while retaining total JavaScript as a trend metric. H0I codified the canonical architecture, scene, UI, overlay, testing and performance standards. H0J removed the proven-obsolete pre-R6 `VillageInteriorScene.ts`, added a guard against its return and recorded explicit owners/review milestones for compatibility paths that still own accepted runtime behaviour.

The H0J code/evidence checkpoint is `69c75662572d9bf38406ed8b393d5c9b914f04b2`. CI run `34767743173` has passed Tier 0, the complete unit suite (124 files / 479 tests), production build, static smoke and the H0H performance architecture checks. The authoritative three-shard Chromium and Chromium/Firefox/WebKit jobs are queued/running as part of the same full-qualification run.

Current measured bundle evidence on that checkpoint:

- entry: 469.5 KiB raw / 126.0 KiB gzip, against a 520 KiB raw hard budget;
- initial/title/first-playable graph: 514.6 KiB gzip across 26 chunks, against a 560 KiB hard budget;
- largest lazy JavaScript chunk: 7.8 KiB gzip, against a 32 KiB hard budget;
- JavaScript chunks: 82, against a 112 hard budget;
- total JavaScript breadth: 654.1 KiB gzip, retained as trend evidence rather than a startup gate;
- diagnostics remain outside the initial graph.

`R6.5-WP19H - Audio Integration and Authoring Guide` remains complete, human-approved, merged and production released through PR #169.

## H0 programme

Path: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`

- H0A: complete and accepted.
- H0B: complete and accepted.
- H0C: complete and accepted.
- H0D: complete and accepted.
- H0E: complete and accepted.
- H0F: complete and accepted.
- H0G: complete and accepted.
- H0H: complete and accepted.
- H0I: complete and accepted.
- H0J: complete and accepted.
- H0K: active.

## Next work

Qualify the final H0K candidate with the complete authoritative CI path, then run the exact-candidate immutable Cloudflare Pages startup/save/reload/Continue smoke. Once technical qualification is complete, stop for David's explicit approval. No merge, production deployment or `R6.5-WP19H1`-`H13` work is authorised before that approval.
