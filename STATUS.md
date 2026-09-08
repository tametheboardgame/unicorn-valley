# Project Status

Last updated: 2026-09-08

## Current phase

R6.5 - Valley Completeness and Breadth, human-playtest remediation.

## Current work package

`R6.5-WP18K - Architecture Consolidation and Legacy Retirement`

Path: `docs/work-packages/R6.5-WP18K-ARCHITECTURE-CONSOLIDATION-LEGACY-RETIREMENT.md`

State: **ready for Work-mode execution after WP18I/J integration**.

## Accepted baseline

R0-R6 are complete. R6.5-WP1 through WP16 are integrated. WP17 remains open because the daughter playthrough did not release R7 readiness.

WP18A-G are complete. WP18I and WP18J are now **human visually approved** following the 2026-09-08 responsive UI remediation and final Map clipping correction.

Final approved WP18I/J game-code head: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`.

Final approved immutable preview: `https://8292d7b9.unicorn-valley.pages.dev`.

Exact-head validation:

- project contract: passing;
- formatting/lint/type-check: passing;
- unit tests: passing;
- production build/static smoke: passing;
- hard 520 KiB application-entry budget: passing;
- Chromium/Firefox/WebKit compatibility: **48 passed / 15 skipped / 0 failed**;
- full serial Chromium playtest: still running when this handoff record was prepared; its final result must be read before WP18K closes, but it does not invalidate the already-green core/compatibility evidence.

## Canonical UI state to preserve

- one concept-grade shell, not legacy viewport fallbacks;
- Map / Bag / Book / Settings + Shimmer + location presentation;
- static HUD overlay independent of world camera follow;
- landscape phone behaves as a smaller landscape tablet;
- portrait phone uses the approved below-gameplay dock/control composition;
- Bag has no `Visit the Shop` shortcut;
- Map is draggable, North stays fixed, moving geography hard-clips beneath the parchment frame;
- Wonderbook uses page-edge index tabs;
- close controls show only a cross while retaining generous invisible touch targets.

## Human feedback record

Canonical original evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

Current status ledger: `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md`.

The ledger separates implemented/revalidation items, known open defects, deferred daughter-led ideas and positive features that must be preserved.

## Known open defect

**Moonflower Cottage/window/back-wall collision remains unresolved.** This is a real gameplay/world-geometry defect and was deliberately excluded from WP18I/J. WP18K must not delete the record or accidentally mask it.

## Next human gate

`R6.5-WP18H - Full Human Tablet Replay and Return to WP17` remains deferred until WP18K completes and known open blockers are accounted for.

R7 remains blocked.

## WP18K guardrails

- behaviour-preserving architecture cleanup only;
- audit before deletion;
- identify canonical vs obsolete code with dependency evidence;
- remove dead/retired paths rather than hiding them;
- consolidate temporary remediation managers into proper owners where safe;
- simplify bootstrapping and responsive authority;
- do not change saves, progression, inventory semantics, map topology, quest logic, race/movement rules or content;
- do not visually redesign the user-approved UI;
- preserve four-display-class responsive acceptance;
- do not weaken tests or the 520 KiB budget to make cleanup pass.

## Production

No new production deployment is authorised by this status update. Repo integration and Work-mode preparation do not waive the existing production-approval rule.

## Chat disposition

`keep`
