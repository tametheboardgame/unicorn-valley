# Operating Roadmap

This file is the concise project-level navigation layer. Detailed release content remains authoritative in the existing design documents under `docs/`.

## Completed releases

- R0 - Foundation and Pre-production: complete.
- R1 - My Unicorn: First Playable: complete.
- R2 - Living Valley Vertical Slice: complete.
- R3 - Rainbow Run Racing: complete.
- R4 - Friendship, Secrets and Home Depth: complete.
- R5 - The Valley Gets Bigger: complete.
- R6 - Production Presentation and Accessibility: complete, including the final human remediation gate.

## R6.5 - Valley Completeness and Breadth

Status: Human playtest completed; R7 readiness gate **not released**; tablet-first remediation required

Canonical release contract: `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`

Mandatory companion material where relevant:

- `docs/07W-R6.5-CONTENT-BLUEPRINT.md`
- `docs/07X-R6.5-AUTONOMOUS-UNICORN-LIFE.md`
- `docs/07Y-R6.5-WP1-AUDIT-DENSITY-CONTRACT.md`
- `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md` - authoritative remediation plan produced from the 2026-09-05 daughter playthrough.
- `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md` - approved landscape-tablet layout and interaction authority for WP18C/WP18E.

### Completed pre-playtest package sequence

- R6.5-WP1 - Valley Content Audit and Density Contract: complete.
- R6.5-WP2 - Ambient Population and World Interaction Toolkit: complete.
- R6.5-WP3 - Economy and Reward Loop Completion: complete.
- R6.5-WP4 - Sunbeam Village Life, Shops and Interiors: complete.
- R6.5-WP5 - Moonflower Glade and Cottage Depth: complete.
- R6.5-WP6 - Rainbow Meadow and Rainbow Run Depth: complete.
- R6.5-WP7 - Crystal Brook Depth: complete.
- R6.5-WP8 - Whispering Woods Depth: complete.
- R6.5-WP9 - Starlight Beach Core: complete.
- R6.5-WP10 - Starlight Beach Content: complete.
- R6.5-WP11 - Existing Valley Quest Pack A: complete.
- R6.5-WP12 - Race Expansion and Rainbow Cup: complete; merged as `610216ae13b96772d3a7b7e95696c695ddcd1870`.
- R6.5-WP13 - Quest Pack B: Cross-Region and Follow-up Stories: complete; merged as `3db374dd48445386819d1da97d4367619f7b9cef`.
- R6.5-WP14 - Repeatable Activity Expansion: complete; merged as `5d246ae012ef351e9dd356befc3a9608222041e6`.
- R6.5-WP15 - Wonderbook, Collections and Long-Term Goals: complete; merged as `bdc86e05472d0f061e3b748cc42706cc6541f523`.
- R6.5-WP16 - Valley Tidy-up, Balance and Content Polish: complete through PR #145; merged to `main` as `a424ec9f50be2d83b2a7c246e5735d9e24274480` after final exact-head technical validation.

### R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate

State: **open / remediation required**.

The 2026-09-05 substantially unguided daughter playthrough produced strong positive evidence that the underlying game is engaging, but also found release-blocking problems:

- landscape-tablet controls and shell layout are the largest usability barrier;
- racing is effectively blocked on the reference Galaxy Tab S8 because controls obscure the track and Chrome long-press behaviour interrupts RUN;
- multiple hard freezes occurred, including a repeatable Sunlit Beach Bag freeze;
- several functional interaction/progression/state defects remain;
- shell readability/overflow, inventory scalability and creator layout need a coherent tablet-first pass;
- world/character consistency and selected visual areas need targeted improvement.

Therefore WP17 does **not** release R7. Per its gate contract, bounded remediation work is inserted under R6.5 and the project returns to WP17 only after another complete human tablet replay.

Authoritative detail: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

## R6.5-WP18 - Landscape Tablet and Playtest Remediation

Product direction: **landscape-tablet-first interface and controls** while retaining the existing Phaser/TypeScript/Vite browser codebase and secondary desktop keyboard/mouse support.

Reference human-test device: Samsung Galaxy Tab S8, current supported Android, Chrome, landscape.

Do not rewrite the game natively for Android as part of WP18. A later Android package of the existing web game may be evaluated only after the tablet-first build is stable and accepted.

### Priority order

1. human-approved tablet UI/control concepts;
2. freezing/root-cause stability work;
3. shared tablet controls and interaction shell;
4. concrete functional defects/regressions;
5. Bag/Map/Creator/modal UX;
6. world consistency, visual quality and selected experience improvements;
7. cross-device tablet hardening;
8. full human tablet replay;
9. return to WP17 for explicit R7-readiness decision.

### R6.5-WP18A - Landscape Tablet UX Concept and Approval

Path: `docs/work-packages/R6.5-WP18A-LANDSCAPE-TABLET-UX-CONCEPT-APPROVAL.md`

State: **complete; human visual gate released 2026-09-05**.

The user approved the supplied landscape-tablet concepts as implementation authority for layout, hierarchy, thumb placement, readability and interaction design. Their expensive 3D rendering is illustrative only.

Durable authority: `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`.

Implementation stop rule: if WP18C/WP18E would materially drift from the approved layouts, stop and request user input rather than silently substituting another design.

### R6.5-WP18B - Freeze Diagnostics, Root Cause and Stability

Path: `docs/work-packages/R6.5-WP18B-FREEZE-DIAGNOSTICS-STABILITY.md`

State: **next / unblocked**.

Instrument runtime/scene/input lifecycle, reproduce and fix the known Tree Nook, Twinkle and Thread, and repeatable Sunlit Beach Bag freezes, then add stress/regression coverage for scene transitions, modals, shops, races and sustained play.

### R6.5-WP18C - Landscape Tablet Controls and Interaction Shell

Path: `docs/work-packages/R6.5-WP18C-LANDSCAPE-TABLET-CONTROLS-INTERACTION-SHELL.md`

State: planned after WP18B; approved WP18A visual authority available.

Implement the shared landscape-tablet shell, comfortable touch controls, first-class tap-to-move, contextual primary action, consistent direct NPC tapping, device-appropriate help, compact Bag/Map/Wonderbook/Settings access, safe multi-touch/input release and race controls that do not trigger the known Chrome long-press blocker or cover upcoming obstacles.

### R6.5-WP18D - Playthrough Functional Bug and Regression Remediation

Path: `docs/work-packages/R6.5-WP18D-PLAYTHROUGH-FUNCTIONAL-BUG-REGRESSION-REMEDIATION.md`

State: planned after WP18C.

Resolve the remaining human-observed functional defects, including Echo interaction, cottage back-wall collision, cottage decoration state, Maple discoverability/root cause, purchase/reward feedback, point-and-click facing flicker and any remaining placeholder/icon-over-unicorn regressions. Human-visible failure modes must be reproduced and regression-tested where practical.

### R6.5-WP18E - Bag, Map, Creator and Modal Tablet UX

Path: `docs/work-packages/R6.5-WP18E-BAG-MAP-CREATOR-MODAL-TABLET-UX.md`

State: planned after WP18D; approved WP18A visual authority available.

Redesign growing inventory around clear scrolling categories/pockets, make Food meaningfully usable, provide explicit Map access, implement the approved progressive-category Unicorn Creator, and reconcile Wonderbook/shops/settings/dialogue/decoration/activity modals with the shared tablet readability, overflow and touch-target contract.

### R6.5-WP18F - World Consistency, Visual Quality and Experience Improvements

Path: `docs/work-packages/R6.5-WP18F-WORLD-CONSISTENCY-VISUAL-EXPERIENCE.md`

State: planned after WP18E.

Introduce authoritative presence/activity state for recurring core friends, using Nova as the initial proof so characters cannot occupy mutually exclusive places simultaneously. Clean up symbol/placeholder character representations, improve unicorn neck/mane presentation, Shell Cove identity, Crystal Brook/crystal readability and shop place-quality, while preserving positive areas such as Rainbow Meadow, Whispering Woods and Tree Nook. Bounded daughter-led additions such as interactive mushrooms or unicorn sandcastles may be included where coherent and low-risk.

Larger daughter-led ideas such as Unicorn Palace and multi-step social events remain evidence for R7/backlog unless deliberately promoted later.

### R6.5-WP18G - Tablet Device Hardening and Cross-Input Regression

Path: `docs/work-packages/R6.5-WP18G-TABLET-DEVICE-HARDENING-CROSS-INPUT-REGRESSION.md`

State: planned after WP18F.

Validate representative landscape 16:9, 16:10 and 4:3 tablet layouts plus secondary desktop support. Recheck browser gesture interference, multi-touch, safe areas, overflow, race visibility, long-session/freeze regressions, browser compatibility and the unchanged 520 KiB application-entry budget.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

State: planned final human gate.

Run another substantially unguided playthrough on the reference Galaxy Tab S8 in landscape. Revalidate controls, racing, previously frozen scenes, Bag/Map/Creator, interactions, progression, readability, character/world consistency and retained positive areas.

WP18H captures evidence but **does not release R7**. It returns the project to WP17 for the user's explicit readiness decision.

### Dependency chain

`WP17 evidence -> WP18A approved -> WP18B -> WP18C -> WP18D -> WP18E -> WP18F -> WP18G -> WP18H -> WP17 explicit readiness decision -> R7`

## R6.6 - Optional Android Packaging

Status: future candidate only.

After WP18 is stable and WP17 is explicitly accepted, the project may evaluate packaging the existing Phaser/Vite build as an Android application using Capacitor or an equivalent thin wrapper.

This is **packaging, not a native rewrite**. It must reuse the existing game code and may provide benefits such as app-style launch, controlled landscape/full-screen presentation, Android icon/splash and lifecycle integration while retaining the browser/Cloudflare build.

Do not begin R6.6 while WP18 or WP17 remains unresolved.

## R7 - Daughter-led Expansion

Status: Blocked

R7-WP7.1 may not begin until the remediated build has completed WP18H and R6.5-WP17 explicitly confirms through human play that the valley is ready for preference-led expansion.

## Future releases

Potential later work including flight/Cloudtop Peaks, deeper gardening, deeper cooking, companion expansion, further regions, festival systems, Unicorn Palace and richer multi-step social events remains backlog until later play evidence justifies it.

## Operating rules

- Build dependencies before content that uses them.
- Prefer reusable systems over repeated bespoke implementations.
- Production art follows proven mechanics unless concept work is explicitly required.
- **For WP18 tablet shell/control work, the WP18A approved visual/layout authority must be followed.**
- Landscape tablet is now the primary interface authority; desktop remains a supported secondary input/presentation.
- Point-and-click/tap movement is a first-class control scheme.
- Human-observed defects override stale automated claims that the same surface was already fixed.
- Positive human feedback is a preservation requirement.
- Any new feature should strengthen a design pillar and add a meaningful player action rather than complexity alone.
- Detailed implementation belongs in bounded files under `docs/work-packages/` and the relevant canonical domain specifications.
- The hard application-entry performance budget remains 520 KiB and must not be weakened or increased.
- Production deployment requires explicit user approval.
