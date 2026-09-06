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

Status: Human playtest completed; R7 readiness gate **not released**; tablet-first remediation in progress.

Canonical release contract: `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`

Authoritative remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`

Approved tablet direction: `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`

### Completed pre-playtest sequence

R6.5-WP1 through R6.5-WP16 are complete and integrated.

### R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate

State: **open / remediation required**.

The 2026-09-05 daughter playthrough showed that the underlying game is engaging but identified release-blocking landscape-tablet controls, freezes, functional defects, Bag/Creator usability issues and world/character consistency problems. WP17 therefore does not release R7 until the WP18 remediation sequence and another full tablet replay are complete.

## R6.5-WP18 - Landscape Tablet and Playtest Remediation

Product direction: **landscape-tablet-first** while retaining the Phaser/TypeScript/Vite browser codebase and secondary desktop keyboard/mouse support.

Reference human-test device: Samsung Galaxy Tab S8, current supported Android, Chrome, landscape.

Do not rewrite the game natively for Android as part of WP18.

### Completed packages

- R6.5-WP18A - Landscape Tablet UX Concept and Approval: complete, human visual gate released 2026-09-05, PR #147.
- R6.5-WP18B - Freeze Diagnostics, Root Cause and Stability: complete, PR #148.
- R6.5-WP18C - Landscape Tablet Controls and Interaction Shell: complete, PR #149.
- R6.5-WP18D - Playthrough Functional Bug and Regression Remediation: complete and merged through PR #150.
- R6.5-WP18E - Bag, Map, Creator and Modal Tablet UX: **complete and delivery-ready through PR #151**, with exact-head contract, core validation, browser compatibility and full Chromium playtest green on implementation head `5c848ea33d62944c80a153608f9e9ecf4f9b106d`.

WP18E delivered scalable Bag categories and scrolling, bounded useful Food consumption, distinct Map access and surface, the approved progressive-category Unicorn Creator, and modal tablet-contract reconciliation. Human gate: none.

### R6.5-WP18F - World Consistency, Visual Quality and Experience Improvements

Path: `docs/work-packages/R6.5-WP18F-WORLD-CONSISTENCY-VISUAL-EXPERIENCE.md`

State: **next after WP18E merge**.

Introduce authoritative presence/activity state for recurring core friends, using Nova as the initial proof so mutually exclusive appearances cannot coexist. Clean up symbol/placeholder character representations, improve unicorn neck/mane presentation, Shell Cove identity, Crystal Brook/crystal readability and shop place quality. Preserve positive areas such as Rainbow Meadow, Whispering Woods and Tree Nook. Bounded daughter-led additions such as interactive mushrooms or unicorn sandcastles may be included where coherent and low-risk.

Human gate: **visual spot-checks**.

### R6.5-WP18G - Tablet Device Hardening and Cross-Input Regression

Path: `docs/work-packages/R6.5-WP18G-TABLET-DEVICE-HARDENING-CROSS-INPUT-REGRESSION.md`

State: planned after WP18F.

Validate representative 16:9, 16:10 and 4:3 landscape-tablet layouts plus secondary desktop support, browser gesture interference, multi-touch, safe areas, overflow, race visibility, long-session stability, browser compatibility and the unchanged 520 KiB budget.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

State: planned final human gate.

Run another substantially unguided playthrough on the reference Galaxy Tab S8 in landscape. WP18H records evidence and then returns to WP17 for the user's explicit R7-readiness decision.

### Dependency chain

`WP17 evidence -> WP18A approved -> WP18B complete -> WP18C complete -> WP18D complete -> WP18E complete -> WP18F -> WP18G -> WP18H -> WP17 explicit readiness decision -> R7`

## R6.6 - Optional Android Packaging

Status: future candidate only after WP18 is stable and WP17 explicitly accepts the remediated build. Packaging must reuse the existing game code and is not a native rewrite.

## R7 - Daughter-led Expansion

Status: Blocked.

R7-WP7.1 may not begin until WP18H completes and R6.5-WP17 explicitly confirms through human play that the valley is ready for preference-led expansion.

## Future releases

Potential later work includes flight/Cloudtop Peaks, deeper gardening/cooking, companion expansion, further regions, festival systems, Unicorn Palace and richer multi-step social events. These remain backlog until later play evidence justifies them.

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
- Production deployment requires explicit user approval.
