# Project Status

Last updated: 2026-09-19

## Current work

`R6.5-WP19H2.10 - Unlock & Reward Framework` is implemented on draft PR #175 / branch
`agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.10 are now human-approved. David explicitly approved H2.10 on 19 September 2026 after
confirming the locked Room Style options were working and the Sea Glass diagnostic unlock became
available and persisted correctly.

## H2.10 implementation

H2.10 provides:

- save schema v7 with canonical `home.unlockedStyleIds` entitlement persistence;
- a curated starter home-style set plus visible locked progression options;
- migration grandfathering for any known style already selected by an existing schema-v6 save;
- `CottageStyleEntitlementService` as the reusable grant/check owner for quest, reward, shop, system
  and diagnostic callers;
- `HOME_STYLE_UNLOCKED` as the reusable unlock event;
- entitlement enforcement in `CottageStyleService` so locked options cannot be newly persisted;
- locked-state presentation in the Room Style flow without embedding quest/shop rules in the UI;
- a diagnostics-only H2.10 simulation hook using the same production grant service;
- unit/browser coverage for starter-vs-unlockable state, persistent grants and locked-to-unlocked
  application.

## Current gate

The H2.10 human gate is complete and approved.

Exact-head CI qualification is still allowed to finish independently; any remaining failures should be
treated as technical qualification work and must not erase the recorded human approval unless they
expose an H2.10 product regression.

## Next work

1. Finish exact-head H2.10 technical qualification and repair only genuine regressions.
2. Do not start H2.11 until David explicitly requests it.
3. When requested, begin `R6.5-WP19H2.11 - Responsive Polish, Consolidation & Hardening`.

## Merge gate

PR #175 remains draft and unmerged. Production is unchanged. The complete H2 package must still reach
H2.11 and pass David's final whole-cottage playtest before merge.
