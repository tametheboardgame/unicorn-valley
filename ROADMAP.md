# Operating Roadmap

## 2026-09-08 approved remediation plan

WP19B was human-approved and merged as `c2d98ae` on 9 September 2026; its merge-SHA-bound production smoke passed in Actions `34356744951`. WP19C was subsequently human-approved, merged through PR #163 and released to production. WP19D is complete, human-approved, merged and released; WP19E is active. David’s mild observation that some places appear to have two path layers remains deferred unchanged to the final graphics-specific pass.

David approved the whole-game audit remediation plan on 2026-09-08. Read `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md` and `docs/2026-09-08-REMEDIATION-PROPOSAL.md` first. Approved next order: WP19A persistence safety → WP18K foundation → WP19B boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F consistent UI/generated title → WP19G/H audio → WP19I qualification → WP18H daughter replay → WP17 readiness. Independent preparation is described in the proposal.

This approves the work programme, not completion of its implementation. Existing delivery history below is preserved. R7 and production release remain gated. This plan supersedes the previous direct WP18K→WP18H sequence.

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

The interaction foundation is accepted as the direction: contextual actions work, roaming NPCs stop and face the player, and distance gating behaves correctly. The current candidate is not accepted for merge until this bounded remediation is complete and re-reviewed.

Required WP19D remediation:

- hide touch movement/Gallop controls on desktop/laptop while preserving contextual Talk/Interact/Enter/Start actions;
- give visible unicorn NPCs appropriate physical/soft collision so player and residents cannot pass through one another;
- move conversation presentation into the protected lower-screen speech area;
- while speech is active, hide the contextual target/name/hint surface so only the conversation owns that lower area, then restore it only after the closing input has been consumed/released;
- move or reduce Wonderbook discovery feedback so it cannot collide with the top HUD or active speech UI;
- restore the persistent exploration top HUD in Starlight Beach;
- normalise equivalent NPC conversation entry through the shared interaction owner;
- preserve the already-successful interaction coordinator, NPC engagement and distance behaviour.

Do **not** add a temporary ordinary-conversation return-position/checkpoint system. Conversation-only scene transitions are being retired by WP19E, which removes that failure mode instead of patching it.

### R6.5-WP19E - Conversation and Feedback System

State: **active implementation; Amber visual/child-reading gate remains pending**.

Path: `docs/work-packages/R6.5-WP19E-CONVERSATION-FEEDBACK.md`

Accepted direction clarified 2026-09-11: ordinary NPC and quest conversations remain in the active world scene. The player and speaker stay visible; movement/background interaction is locked; the NPC remains stopped/facing the player; short dialogue, multi-line dialogue, quest hand-ins and choices all use one lower-screen conversation family. Existing conversation-only cutscene/scene transitions are retired rather than supplemented with return-position bookkeeping. Dedicated scenes remain valid for genuine modes such as races, minigames, creator flows and required interiors/shops.

### Known open defect outside WP18K

Any remaining world-geometry or interaction defects discovered by human testing must be closed or explicitly accepted before the final R7-readiness decision. Human-observed behaviour overrides stale automated qualification.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

State: **deferred until WP19A-I remediation is complete and known open blockers are accounted for**.

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

Run another substantially unguided daughter playthrough on the Galaxy Tab S8 after remediation. Use the human feedback ledger as the replay checklist. WP18H captures evidence and returns to WP17 for the user's explicit R7-readiness decision.

### Dependency chain

`WP17 evidence -> WP18A-G complete -> WP18I/J approved -> WP19A accepted -> WP18K complete -> WP19B complete -> WP19C complete -> WP19D remediation/acceptance -> WP19E-H -> WP19I qualification -> WP18H human replay -> WP17 explicit readiness decision -> R7`

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
