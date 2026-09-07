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

Status: Human playtest completed; R7 readiness gate **not released**; concept-grade UI remediation and a final themed Bag/Map/Wonderbook polish pass now precede the final human tablet replay.

Canonical release contract: `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md`

Authoritative remediation evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`

Approved tablet direction: `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`

Latest UI visual authority: the user-supplied 2026-09-07 high-fidelity Rainbow Meadow HUD concept, with its button layout, grouping, hierarchy and visual quality treated as the target for WP18I. The concept's Unicorn Valley logo and left-side mini-map are explicitly not required.

For WP18J, the user-approved thematic direction is equally explicit: Bag should feel like a magical satchel/saddlebag, Map like a magical quest/adventure map, and Wonderbook like a friendly enchanted spellbook/storybook, while retaining the shared WP18I quality language.

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

WP18G delivered canvas gesture hardening, orientation-safe exploration touch controls, representative 16:9/16:10/4:3/smaller/larger landscape coverage, Bag/Map/Creator containment checks, race control visibility checks and secondary desktop-input regressions. Validated implementation head `4f71e843e024b7974405e00f469ea0e359a2180b` passed project contract, formatting/lint/type-check, 426 unit tests, production build/static smoke, the unchanged 520 KiB application-entry performance budget, Chromium/Firefox/WebKit compatibility and the full serial Chromium playtest at 164 passed / 3 skipped. Existing WP18B freeze regressions remain green.

### New production evidence after WP18G

The 2026-09-07 production inspection confirmed the new touch control mechanics are present, but the HUD/button/text-box presentation is still materially below the approved concept quality. The live interface remains too fragmented and box-heavy, with separate top controls, weak status/location hierarchy, an overly dominant lower backing panel, inconsistent buttons/text boxes and no sufficiently strong concept-style contextual action composition.

That evidence paused WP18H and inserted bounded UI-only remediation before the next human replay.

The same production inspection also reconfirmed a cottage/window collision defect. That defect remains separately logged and **must not be mixed into WP18I or WP18J**, whose scope is UI only.

### R6.5-WP18I - Concept-Grade HUD, Button and Text-Box Remediation

Path: `docs/work-packages/R6.5-WP18I-CONCEPT-GRADE-UI-REMEDIATION.md`

State: **current / approved for implementation**.

Objective: replace the still-fragmented HUD/button/text-box presentation with one cohesive, polished child-facing UI system that follows the 2026-09-07 high-fidelity concept as closely as practical without changing gameplay or world logic.

Core target composition:

- one joined top navigation group for Map, Bag, Book and Settings;
- top-right authoritative currency/progress counters and a polished location pill;
- compact polished lower-left movement pad without a large opaque lower-screen slab;
- one large lower-right contextual primary action that appears only when relevant and uses clear verbs such as Talk, Enter, Interact or Start;
- separate polished Gallop action beside it;
- one bottom-centre contextual hint pill;
- optional compact quest/info card where useful;
- shared high-quality button, card, pill, modal and text-box styling across the wider UI;
- race/activity controls reconciled into the same visual family without changing RUN/JUMP mechanics.

The concept's logo and left-side mini-map are omitted by design.

Hard boundary: UI layout/styling/presentation only. No collision, world art, quest, movement, race logic, economy, save, NPC placement or content changes.

Human gate: **visual spot-check required**. The acceptance question is whether the interface now genuinely resembles the concept's hierarchy and polish rather than merely fitting on the screen.

### R6.5-WP18J - Bag, Map and Wonderbook Themed Polish Pass

Path: `docs/work-packages/R6.5-WP18J-BAG-MAP-BOOK-THEMED-POLISH.md`

State: **approved / queued immediately after WP18I visual approval**.

Objective: finish the three major player-facing modal surfaces that still show alignment, spacing, border-density and identity issues after the common WP18I styling pass.

Hard scope: **Bag, Map and Wonderbook only**.

Themed targets:

- **Bag:** magical satchel/saddlebag identity using restrained pocket, stitch, tag and compartment cues;
- **Map:** magical quest/adventure map identity using parchment, compass/cartographic and journey-map cues while keeping existing route/location logic unchanged;
- **Wonderbook:** friendly enchanted spellbook/storybook identity using a coherent open-book spread, chapter/ribbon tabs, page navigation and subtle magical flourishes.

Shared quality targets:

- repair alignment and spacing defects from the user screenshots;
- reduce nested-border clutter and duplicate shadows;
- establish clean header/content/footer zones;
- improve negative space and grid alignment;
- preserve readability and touch targets;
- keep all existing inventory, map, discovery and Wonderbook behaviour unchanged;
- retain the hard 520 KiB application-entry budget.

Human gate: **visual spot-check required**. Each screen must read as a deliberately authored themed object, not a generic modal with decoration pasted on top.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

State: **deferred until WP18J is complete and visually accepted**.

Run another substantially unguided playthrough on the reference Galaxy Tab S8 in landscape only after WP18I and WP18J are visually approved. WP18H records evidence and then returns to WP17 for the user's explicit R7-readiness decision.

Automated browser/device evidence cannot replace the remaining real Android/Chrome questions around physical comfort, long-press behaviour, OS/browser gesture interference and child comprehension. Those remain owned by WP18H.

### Dependency chain

`WP17 evidence -> WP18A approved -> WP18B complete -> WP18C complete -> WP18D complete -> WP18E complete -> WP18F approved/merged -> WP18G complete/merged -> WP18I concept-grade UI remediation + visual approval -> WP18J Bag/Map/Wonderbook themed polish + visual approval -> WP18H human replay -> WP17 explicit readiness decision -> R7`

## R6.6 - Optional Android Packaging

Status: future candidate only after WP18 is stable and WP17 explicitly accepts the remediated build. Packaging must reuse the existing game code and is not a native rewrite.

## R7 - Daughter-led Expansion

Status: Blocked.

R7-WP7.1 may not begin until WP18I and WP18J are complete and visually accepted, WP18H completes, and R6.5-WP17 explicitly confirms through human play that the valley is ready for preference-led expansion.

## Future releases

Potential later work includes flight/Cloudtop Peaks, deeper gardening/cooking, companion expansion, further regions, festival systems, Unicorn Palace, richer multi-step social events, and the user-requested broader world visual tightening/polish pass. These remain backlog until later play evidence justifies their ordering.

## Operating rules

- Build dependencies before content that uses them.
- Prefer reusable systems over repeated bespoke implementations.
- Production art follows proven mechanics unless concept work is explicitly required.
- WP18 tablet shell/control work follows the approved WP18A structural direction.
- WP18I visual layout and styling follows the 2026-09-07 high-fidelity Rainbow Meadow concept as the primary UI quality authority, excluding its logo and mini-map.
- WP18J is limited to Bag, Map and Wonderbook and applies the user-approved satchel / quest-map / enchanted-book thematic identities without changing underlying behaviour.
- Landscape tablet is the primary interface authority; desktop remains supported secondarily.
- Point-and-click/tap movement is first-class.
- Human-observed defects override stale automated claims.
- Positive human feedback is a preservation requirement.
- New features should strengthen a design pillar and add a meaningful player action rather than complexity alone.
- The hard application-entry performance budget remains 520 KiB and must not be weakened or increased.
- The 2026-09-07 WP18G production deployment was explicitly authorised by the user; future production deployments still require explicit user approval.
