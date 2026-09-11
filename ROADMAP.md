# Operating Roadmap

## 2026-09-08 approved remediation plan

WP19B was human-approved and merged as `c2d98ae` on 9 September 2026; its merge-SHA-bound production smoke passed in Actions `34356744951`. WP19C was subsequently human-approved, merged through PR #163 and released to production. WP19D is complete, human-approved, merged and released; WP19E is active. David’s mild observation that some places appear to have two path layers is explicitly owned by the post-audio area-by-area final polish programme rather than a generic final graphics pass.

David approved the whole-game audit remediation plan on 2026-09-08. Read `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md` and `docs/2026-09-08-REMEDIATION-PROPOSAL.md` first. Approved next order: WP19A persistence safety → WP18K foundation → WP19B boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F consistent UI/generated title → WP19G/H audio → WP19H1-H13 area-by-area final polish → WP19I qualification → WP18H daughter replay → WP17 readiness. Independent preparation is described in the proposal.

The 2026-09-11 area-polish decision supersedes the earlier direct WP19H → WP19I transition. This approves the work programme, not completion of its implementation. Existing delivery history below is preserved. R7 and production release remain gated. This plan supersedes the previous direct WP18K→WP18H sequence.

This file is the concise project-level navigation layer. Detailed release and human-playtest evidence remains authoritative in `docs/`.

## Completed releases

- R0 - Foundation and Pre-production: complete.
- R1 - My Unicorn: First Playable: complete.
- R2 - Living Valley Vertical Slice: complete.
- R3 - Rainbow Run Racing: complete.
- R4 - Friendship, Secrets and Home Depth: complete.
- R5 - The Valley Gets Bigger: complete.
- R6 - Production Presentation and Accessibility: complete.

## R6.5 - Valley Completeness and Breadth

Status: **active remediation; R7 blocked**.

Canonical human evidence: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`

Current feedback ledger: `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md`

Reference human device: Samsung Galaxy Tab S8, Android/Chrome, landscape.

### Completed sequence

R6.5-WP1 through R6.5-WP16 are complete and integrated.

R6.5-WP17 - Full Human Playthrough and R7 Readiness Gate remains **open**. The 2026-09-05 daughter playthrough did not release R7.

R6.5-WP18A through WP18G are complete and integrated through PRs #147-#153.

### R6.5-WP18I - Concept-Grade HUD, Button and Text-Box Remediation

State: **complete / human-approved 2026-09-08**.

Path: `docs/work-packages/R6.5-WP18I-CONCEPT-GRADE-UI-REMEDIATION.md`

Delivered the canonical concept-grade exploration UI. The retired legacy landscape shell is no longer an acceptable fallback. Map / Bag / Book / Settings, Shimmer, location, movement, Gallop, contextual action and hint presentation use the approved cream/lavender/purple/gold visual family.

### R6.5-WP18J - Bag, Map and Wonderbook Themed Polish

State: **complete / human-approved 2026-09-08**.

Path: `docs/work-packages/R6.5-WP18J-BAG-MAP-BOOK-THEMED-POLISH.md`

Final accepted game-code head: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`.

Final accepted preview: `https://8292d7b9.unicorn-valley.pages.dev`.

Final presentation includes:

- stable top HUD rendered independently from the world-follow camera;
- one canonical concept shell for desktop/laptop, tablet landscape and phone landscape;
- approved portrait-phone dock/control composition below gameplay;
- magical satchel Bag with cleaner spacing and no Shop teleport shortcut;
- draggable parchment Map with fixed North marker and hard camera-viewport clipping beneath the inner frame;
- enchanted Wonderbook with page-edge index tabs;
- glyph-only close controls with large invisible touch targets.

Responsive presentation changes are incomplete unless all four display classes are considered together: desktop/laptop, tablet landscape, phone landscape and phone portrait.

### R6.5-WP18K - Architecture Consolidation and Legacy Retirement

State: **complete / human-approved 2026-09-09 / merged through PR #161**.

Path: `docs/work-packages/R6.5-WP18K-ARCHITECTURE-CONSOLIDATION-LEGACY-RETIREMENT.md`

Objective: perform a repo-wide, behaviour-preserving architecture audit and remove obsolete presentation systems, duplicate managers, compatibility shims, dead code/assets/tests and temporary remediation layers that accumulated during R0-R6.5. Consolidate the approved UI into clear canonical owners rather than continuing to layer fixes.

WP18K must preserve current gameplay, saves, progression, map topology, inventory semantics, race/movement rules and the exact approved UI behaviour. It must not use cleanup as an excuse for a visual redesign.

The hard 520 KiB application-entry performance budget remains unchanged.

### R6.5-WP19B - World Boundaries and Tap-Navigation Parity

State: **complete / human-approved / merged before WP19C**.

Path: `docs/work-packages/R6.5-WP19B-WORLD-BOUNDARIES-NAVIGATION.md`

Objective: close the Cottage wall/floor defect, add collider-aware tap movement to every supported explorable scene, and reconcile new-game scene/Map/checkpoint/Continue identity without changing save IDs or movement/race rules.

### R6.5-WP19C - Progressive Unicorn Creator

State: **complete / human-approved / merged through PR #163 / production released**.

Path: `docs/work-packages/R6.5-WP19C-PROGRESSIVE-CREATOR.md`

The approved creator uses the progressive concept layout, supported real appearance renderer and corrected action surfaces. WP19D is based on this merged baseline.

### R6.5-WP19D - Unified Interactions and NPC Engagement

State: **complete / human-approved / merged through PR #164 / production released**.

Path: `docs/work-packages/R6.5-WP19D-UNIFIED-INTERACTIONS-NPCS.md`

The interaction foundation is accepted: contextual actions work, roaming NPCs stop and face the player, distance gating behaves correctly, desktop touch movement controls are hidden, visible unicorn NPC collision is present, lower-screen feedback placement was corrected, Starlight Beach keeps the exploration HUD, and equivalent NPC entry now uses the shared interaction owner.

Do **not** add a temporary ordinary-conversation return-position/checkpoint system. Conversation-only scene transitions are being retired by WP19E, which removes that failure mode instead of patching it.

### R6.5-WP19E - Conversation and Feedback System

State: **active implementation; Amber visual/child-reading gate remains pending**.

Path: `docs/work-packages/R6.5-WP19E-CONVERSATION-FEEDBACK.md`

Accepted direction clarified 2026-09-11: ordinary NPC and quest conversations remain in the active world scene. The player and speaker stay visible; movement/background interaction is locked; the NPC remains stopped/facing the player; short dialogue, multi-line dialogue, quest hand-ins and choices all use one lower-screen conversation family. Existing conversation-only cutscene/scene transitions are retired rather than supplemented with return-position bookkeeping. Dedicated scenes remain valid for genuine modes such as races, minigames, creator flows and required interiors/shops.

### R6.5-WP19F - Final UI Consistency and Generated Home Screen

State: **approved future package after WP19E**.

Objective: complete remaining UI/copy consistency work while preserving the approved HUD, Bag, Map and Wonderbook structures, and add the approved generated storybook title/home artwork with live controls above it. Actual artwork remains subject to human visual approval.

### R6.5-WP19G - MP3 Catalogue and Playback Foundation

State: **approved future package after WP19F**.

Objective: establish the explicit MP3 catalogue, playback, settings and lifecycle foundation so committed music/audio files can be mapped without scene-specific code changes.

### R6.5-WP19H - Audio Integration and Authoring Guide

State: **approved future package after WP19G**.

Objective: wire music and sound effects to the intended regions/events, provide the upload/assignment guide, and complete subjective soundtrack/mix review. Completion of WP19H unlocks the area-by-area final polish programme below.

### R6.5-WP19H1-H13 - Area-by-Area Final Polish Programme

State: **approved 2026-09-11; starts only after WP19H audio integration**.

Purpose: give every playable area an explicit final human-led quality pass before integrated qualification and the daughter replay. This replaces the vague idea of one generic final graphics pass. The goal is not only bug fixing: each package may tighten graphics, increase scenery density, correct layering/depth, improve atmosphere, resolve local navigation/collision/interaction problems and make mild visual redesigns where the area would materially benefit.

Every area package follows the same mandatory five-stage contract:

1. **Human review first.** David reviews the area on laptop, tablet and phone before implementation begins, and records everything that should be improved. The agent must not pre-empt this stage with a visual redesign.
2. **Area audit.** Reconcile David’s feedback with a focused technical/visual inspection covering scenery and composition, art consistency, paths and layering, collision/navigation, interactions/NPCs, responsive presentation, performance and any area-specific defects.
3. **Remediation.** Implement the agreed tightening. Mild visual redesign is explicitly permitted when justified by the review, while preserving accepted gameplay/progression unless the package explicitly owns a correction.
4. **Cross-device validation.** Recheck the finished area on laptop, tablet and phone, backed by targeted automated regression and representative responsive evidence.
5. **Human acceptance.** David reviews the finished area and explicitly accepts it before that area package closes.

Initial package inventory:

- **R6.5-WP19H1 - Moonflower Glade Final Area Pass**
- **R6.5-WP19H2 - Moonflower Cottage Final Area Pass**, including the explorable/decorating home presentation
- **R6.5-WP19H3 - Moonflower Patch Final Area Pass**
- **R6.5-WP19H4 - Sunbeam Village Final Area Pass**, including its explorable shops/interiors and immediate approaches
- **R6.5-WP19H5 - Rainbow Meadow Final Area Pass**
- **R6.5-WP19H6 - Rainbow Run Final Area Pass**, including entry, track environment and results/return presentation
- **R6.5-WP19H7 - Crystal Brook Final Area Pass**
- **R6.5-WP19H8 - Crystal Grotto Final Area Pass**
- **R6.5-WP19H9 - Whispering Woods Final Area Pass**; the intended review explicitly includes increasing tree density and strengthening the magical woodland identity if the cross-device review supports it
- **R6.5-WP19H10 - Hollow Tree Nook Final Area Pass**
- **R6.5-WP19H11 - Firefly Grove Final Area Pass**, including the local Firefly Lantern activity presentation where it belongs visually to the area
- **R6.5-WP19H12 - Starlight Beach Final Area Pass**, including its beach subareas/activities and any remaining HUD/scene-specific presentation issues
- **R6.5-WP19H13 - Windmill Lookout Final Area Pass**

Before WP19H1 begins, reconcile this list against the then-current playable scene/location inventory. Any independently explorable area missing from the list must receive its own additional numbered area package rather than being silently skipped. A small sublocation or interior may remain within its parent area package only when it is not meaningfully an independent exploration area; the audit must record that decision.

Known graphical observations such as apparently duplicated path layers are owned by the relevant area package. Positive existing visuals and behaviours remain preservation requirements rather than invitations to redesign everything.

### R6.5-WP19I - Integrated Qualification

State: **approved, but now blocked by WP19H1-H13 (and any additional area packages discovered by the inventory reconciliation)**.

WP19I remains the whole-game technical qualification package. It must run only after the audio work and every area final-pass package has been accepted, so qualification measures the actual intended R6.5 release candidate rather than a pre-polish build.

### Known open defect outside WP18K

Any remaining world-geometry or interaction defects discovered by human testing must be closed or explicitly accepted before the final R7-readiness decision. Human-observed behaviour overrides stale automated qualification.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

State: **deferred until WP19A-H, the full area-by-area final polish programme, WP19I qualification and known open blockers are accounted for**.

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

Run another substantially unguided daughter playthrough on the Galaxy Tab S8 after remediation. Use the human feedback ledger as the replay checklist. WP18H captures evidence and returns to WP17 for the user's explicit R7-readiness decision.

### Dependency chain

`WP17 evidence -> WP18A-G complete -> WP18I/J approved -> WP19A accepted -> WP18K complete -> WP19B complete -> WP19C complete -> WP19D complete -> WP19E -> WP19F -> WP19G -> WP19H audio -> WP19H1-H13 area final passes (+ any inventory-discovered additions) -> WP19I qualification -> WP18H human replay -> WP17 explicit readiness decision -> R7`

## R6.6 - Optional Android Packaging

Future candidate only after WP17 explicitly accepts the remediated browser build. Packaging must reuse the existing Phaser/TypeScript/Vite codebase and is not a native rewrite.

## R7 - Daughter-led Expansion

Status: **blocked**.

R7 may not start until WP18H has run, all known readiness blockers are accounted for, and WP17 receives an explicit user readiness decision.

Deferred daughter-led ideas and preservation requirements are listed in `docs/HUMAN-PLAYTEST-FEEDBACK-LEDGER.md` and must survive cleanup.

## Operating rules

- Human-observed defects override stale automated claims.
- Positive human feedback is a preservation requirement.
- Point-and-click/tap movement is first-class.
- The approved concept UI is canonical across desktop/laptop, tablet landscape, phone landscape and phone portrait.
- Do not resurrect retired legacy UI to satisfy stale tests. Update stale tests to current authoritative behaviour.
- Prefer clear ownership and reusable systems over repeated presentation managers or patches.
- Save compatibility is preserved unless a bounded migration is explicitly authorised and tested.
- The hard application-entry performance budget remains **520 KiB**.
- Production deployment still requires explicit user approval.
