# Project Status

Last updated: 2026-09-13

## Current work

`R6.5-WP19H0 - Architecture, UI, Test and Performance Consolidation` is active on
draft PR #172 / branch `agent/r6.5-wp19h0-consolidation`.

H0A is accepted. The inspection confirmed that its committed changes are limited to
evidence/reporting tooling and durable project state, with no production `src/` or
CI behaviour changes. Project-contract validation and immutable deployment smoke pass;
formatting, lint, type-check, all 120 Vitest files / 465 tests and the production build
pass. CI still fails only at the inherited 650.4 KiB total-JavaScript gzip check against
the unchanged 650 KiB legacy ceiling, so that failure is baseline evidence rather than
an H0A regression.

H0B is now active. Its first bounded slice establishes explicit runtime layering,
service-lifetime rules and executable dependency boundaries, then migrates one
representative cross-cutting owner without changing player behaviour.

`R6.5-WP19H - Audio Integration and Authoring Guide` is **complete, human-approved, merged and production released** through PR #169.

Main/production merge SHA: `b38820675e37e3e98d00fd163c185a3f3cc4ecd1`.

The durable audio authoring workflow is `docs/AUDIO-UPLOAD-GUIDE.md`.

## H0 programme

Path: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`

H0 owns:

- architecture inventory/boundaries/lifecycle ownership;
- canonical reusable UI/design tokens and a Phaser-canvas/DOM-overlay contract;
- composition-first scene standardisation and new-scene scaffolding;
- test-suite contract audit and brittle-test remediation;
- tiered/selective CI for small fixes versus full WP/release qualification;
- change-to-test ownership/classification with fail-safe escalation;
- measured startup/first-playable/lazy-chunk performance architecture;
- engineering standards and mechanical guardrails;
- migration/deletion of proven-obsolete legacy/duplicate paths;
- final before/after engineering evidence and full qualification.

The current known CI failure remains inherited WP19H total-JavaScript performance
envelope pressure: H0A reproduced 666,008 gzip bytes (650.398 KiB) against the
unchanged 665,600-byte/650 KiB limit. Entry remains 471,915 raw bytes (460.9 KiB)
against the visible 520 KiB metric. This is not an H0A regression or a pass.

## Next work

Complete and validate H0B before beginning H0C. H0C-H0K have not started.

H0 remains behaviour-preserving and must stop after H0K technical qualification for David's explicit approval before merge/production or `R6.5-WP19H1`.