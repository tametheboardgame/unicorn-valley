# Operating Roadmap

This file is the concise project-level navigation layer. Detailed release content remains authoritative in the existing design documents under `docs/`.

## Completed releases

- R0 - Foundation and Pre-production: complete.
- R1 - My Unicorn: First Playable: complete.
- R2 - Living Valley Vertical Slice: complete.
- R3 - Rainbow Run Racing: complete.
- R4 - Friendship, Secrets and Home Depth: complete.
- R5 - The Valley Gets Bigger: complete.
- R6 - Production Presentation and Accessibility: complete.

## R6.5 - Valley Completeness and Breadth

Status: Human playtest completed; R7 readiness gate **not released**; tablet-first remediation is now at the final human replay gate.

Canonical release contract: `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`

Authoritative remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`

Approved tablet direction: `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`

### Completed pre-playtest sequence

R6.5-WP1 through R6.5-WP16 are complete and integrated.

### R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate

State: **open / remediation replay required**.

The 2026-09-05 daughter playthrough showed that the underlying game is engaging but identified release-blocking landscape-tablet controls, freezes, functional defects, Bag/Creator usability issues and world/character consistency problems. WP17 therefore does not release R7 until the WP18 remediation sequence and another full tablet replay are complete.

## R6.5-WP18 - Landscape Tablet and Playtest Remediation

Product direction: **landscape-tablet-first** while retaining the Phaser/TypeScript/Vite browser codebase and secondary desktop keyboard/mouse support.

Reference human-test device: Samsung Galaxy Tab S8, current supported Android, Chrome, landscape.

Do not rewrite the game natively for Android as part of WP18.

### Completed packages

- R6.5-WP18A - Landscape Tablet UX Concept and Approval: complete, human visual gate released 2026-09-05, PR #147.
- R6.5-WP18B - Freeze Diagnostics, Root Cause and Stability: complete, PR #148.
- R6.5-WP18C - Landscape Tablet Controls and Interaction Shell: complete, PR #149.
- R6.5-WP18D - Playthrough Functional Bug and Regression Remediation: complete, PR #150.
- R6.5-WP18E - Bag, Map, Creator and Modal Tablet UX: complete and merged through PR #151 at `1ea5268c09d8e669057eec3c391dd2a020247cc5`.
- R6.5-WP18F - World Consistency, Visual Quality and Experience Improvements: complete, visually approved 2026-09-06 and merged through PR #152 at `a9d6125330fcc5f3f87be15af2ad31eabcb610bb`.
- R6.5-WP18G - Tablet Device Hardening and Cross-Input Regression: complete and merged through PR #153 at `d4de16122757122dfeb12dc74898057e35c6538a`.

WP18F delivered Nova authoritative presence across race/picnic/cottage states, production-character representation cleanup, player and NPC mane/neck coverage improvements, Shell Cove identity and unicorn sandcastle detail, Crystal Brook/Prism Grotto readability, stronger Sunbeam Village shop identities, restrained Whispering Woods atmosphere and one lightweight Hollow Tree Nook mushroom interaction.

WP18G delivered canvas gesture hardening, orientation-safe exploration touch controls, representative 16:9/16:10/4:3/smaller/larger landscape coverage, Bag/Map/Creator containment checks, race control visibility checks and secondary desktop-input regressions. Validated implementation head `4f71e843e024b7974405e00f469ea0e359a2180b` passed project contract, formatting/lint/type-check, 426 unit tests, production build/static smoke, the unchanged 520 KiB application-entry performance budget, Chromium/Firefox/WebKit compatibility and the full serial Chromium playtest at 164 passed / 3 skipped. Existing WP18B freeze regressions remain green.

Human gate for WP18G: none.

The user also requested another broader visual tightening/polish pass later; retain that as non-blocking follow-up work rather than reopening WP18F.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

State: **current / waiting for human replay**.

Run another substantially unguided playthrough on the reference Galaxy Tab S8 in landscape. WP18H records evidence and then returns to WP17 for the user's explicit R7-readiness decision.

Automated browser/device evidence cannot replace the remaining real Android/Chrome questions around physical comfort, long-press behaviour, OS/browser gesture interference and child comprehension. Those are deliberately owned by WP18H.

### Dependency chain

`WP17 evidence -> WP18A approved -> WP18B complete -> WP18C complete -> WP18D complete -> WP18E complete -> WP18F approved/merged -> WP18G complete/merged -> WP18H human replay -> WP17 explicit readiness decision -> R7`

## R6.6 - Optional Android Packaging

Status: future candidate only after WP18 is stable and WP17 explicitly accepts the remediated build. Packaging must reuse the existing game code and is not a native rewrite.

## R7 - Daughter-led Expansion

Status: Blocked.

R7-WP7.1 may not begin until WP18H completes and R6.5-WP17 explicitly confirms through human play that the valley is ready for preference-led expansion.

## Future releases

Potential later work includes flight/Cloudtop Peaks, deeper gardening/cooking, companion expansion, further regions, festival systems, Unicorn Palace, richer multi-step social events, and the user-requested additional visual tightening/polish pass after the current remediation sequence. These remain backlog until later play evidence justifies their ordering.

## Operating rules

- Build dependencies before content that uses them.
- Prefer reusable systems over repeated bespoke implementations.
- Production art follows proven mechanics unless concept work is explicitly required.
- WP18 tablet shell/control work follows the approved WP18A visual/layout authority.
- Landscape tablet is the primary interface authority; desktop remains supported secondarily.
- Point-and-click/tap movement is first-class.
- Human-observed defects override stale automated claims.
- Positive human feedback is a preservation requirement.
- New features should strengthen a design pillar and add a meaningful player action rather than complexity alone.
- The hard application-entry performance budget remains 520 KiB and must not be weakened or increased.
- The 2026-09-07 WP18G production deployment was explicitly authorised by the user; future production deployments still require explicit user approval.
