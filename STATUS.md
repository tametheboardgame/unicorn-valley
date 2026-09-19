# Project Status

Last updated: 2026-09-19

## Current work

`R6.5-WP19H2.10 - Unlock & Reward Framework` is active on draft PR #175 / branch
`agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.9 are human-approved. David explicitly approved H2.9 on 19 September 2026 after
checking the deployed smaller detailed egg, collision, story-home behaviour and reserved expansion
architecture.

## H2.10 implementation

The current H2.10 candidate introduces:

- save schema v7 with canonical `home.unlockedStyleIds` entitlement persistence;
- a curated starter home-style set plus visible locked progression options;
- migration grandfathering for any known style already selected by an existing schema-v6 save;
- `CottageStyleEntitlementService` as the reusable grant/check owner for quest, reward, shop, system
  and diagnostic callers;
- `HOME_STYLE_UNLOCKED` as the reusable unlock event;
- entitlement enforcement in `CottageStyleService` so locked options cannot be newly persisted;
- locked-state presentation in `CottageStyleScene` without embedding quest/shop rules in the UI;
- a diagnostics-only H2.10 simulation hook using the same production grant service;
- unit/browser coverage for starter-vs-unlockable state, persistent grants and locked-to-unlocked
  application.

## Current gate

H2.10 is implemented on the isolated staging branch and is being advanced to the continuing H2 PR
branch for exact-head static, unit, build/performance, Chromium and cross-browser qualification.

The required human gate is to verify that a locked style is clear, simulate the Sea Glass unlock,
apply it and confirm persistence across reload/Continue.

## Next work

1. Complete exact-head H2.10 CI and deployed-preview qualification.
2. Fix only H2.10-owned regressions if exposed by qualification.
3. David performs the H2.10 locked → unlocked → apply → reload human gate.
4. Do not start H2.11 until H2.10 is explicitly approved.

## Merge gate

PR #175 remains draft and unmerged. Production is unchanged. The complete H2 package must still reach
H2.11 and pass David's final whole-cottage playtest before merge.
