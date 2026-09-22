# Operating Roadmap

## 2026-09-08 approved remediation plan

WP19B was human-approved and merged as `c2d98ae` on 9 September 2026; its merge-SHA-bound production smoke passed in Actions `34356744951`. WP19C was subsequently human-approved, merged through PR #163 and released to production. WP19D is complete, human-approved, merged and released; later WP19 remediation has progressed through the completed audio programme. David’s mild observation that some places appear to have two path layers is explicitly owned by the post-H0 area-by-area final polish programme rather than a generic final graphics pass.

David approved the whole-game audit remediation plan on 2026-09-08. Read `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md` and `docs/2026-09-08-REMEDIATION-PROPOSAL.md` first. Approved order, as amended through 14 September 2026: WP19A persistence safety → WP18K foundation → WP19B boundaries/navigation → WP19C creator → WP19D interactions/NPCs → WP19E conversations → WP19F consistent UI/generated title → WP19G/H audio → **WP19H0 architecture/UI/test/performance consolidation** → **WP19H0.5 home-screen final polish** → **WP19H1+ open-ended area-by-area final polish** → WP19I qualification → WP18H daughter replay → WP17 readiness. Independent preparation is described in the proposal.

The 2026-09-11 area-polish decision superseded the earlier direct WP19H → WP19I transition. On 2026-09-12, WP19H exposed that the fixed 650 KiB whole-game gzip safety envelope was becoming an artificial product-size ceiling because it sums lazy/on-demand chunks as well as startup code. David therefore approved WP19H0 as a mandatory engineering gate between audio and area polish. On 2026-09-13 David expanded H0 into a full behaviour-preserving architecture/codebase, reusable UI, scene-standardisation, test/CI and performance consolidation programme. H0 and the subsequent H0.5 home-screen polish are now complete and accepted. On 2026-09-14 David clarified that H1 onward is an open-ended, human-led area review programme: H numbers are assigned only when the next area is chosen, rather than being pre-mapped to a fixed H1-H13 inventory. Existing delivery history below is preserved. R7 remains gated.

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

The hard 520 KiB application-entry performance budget remains unchanged pending the later H0 measured performance-policy redesign.

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

Path: `docs/work-packages/R6.5-WP19E-CONVERSATION-FEEDBACK.md`

Accepted direction clarified 2026-09-11: ordinary NPC and quest conversations remain in the active world scene. The player and speaker stay visible; movement/background interaction is locked; the NPC remains stopped/facing the player; short dialogue, multi-line dialogue, quest hand-ins and choices all use one lower-screen conversation family. Existing conversation-only cutscene/scene transitions are retired rather than supplemented with return-position bookkeeping. Dedicated scenes remain valid for genuine modes such as races, minigames, creator flows and required interiors/shops.

### R6.5-WP19F - Final UI Consistency and Generated Home Screen

Path: `docs/work-packages/R6.5-WP19F-UI-CONSISTENCY-GENERATED-TITLE.md`

Objective: complete remaining UI/copy consistency work while preserving the approved HUD, Bag, Map and Wonderbook structures, and add the approved generated storybook title/home artwork with live controls above it. Actual artwork remains subject to human visual approval.

### R6.5-WP19G - MP3 Catalogue and Playback Foundation

Path: `docs/work-packages/R6.5-WP19G-MP3-AUDIO-FOUNDATION.md`

Objective: establish the explicit MP3 catalogue, playback, settings and lifecycle foundation so committed music/audio files can be mapped without scene-specific code changes.

### R6.5-WP19H - Audio Integration and Authoring Guide

State: **complete / human-approved 2026-09-13 / merged through PR #169 / production released**.

Path: `docs/work-packages/R6.5-WP19H-AUDIO-INTEGRATION-GUIDE.md`

Merge SHA: `b38820675e37e3e98d00fd163c185a3f3cc4ecd1`.

Objective delivered: contextual/selected music and sound effects, audio settings, title music, upload/assignment documentation and accepted soundtrack/mix behaviour. `docs/AUDIO-UPLOAD-GUIDE.md` is the durable no-code authoring workflow for future music/SFX additions.

WP19H is closed.

### R6.5-WP19H0 - Architecture, UI, Test and Performance Consolidation

State: **complete / human-approved / merged and production released before H0.5**.

Path: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`

Purpose: turn the accepted game into a durable engineering platform before final area polish. H0 remains behaviour-preserving, but now explicitly owns architecture boundaries, reusable UI/design-system consolidation, scene scaffolding, test-contract audit, tiered/selective CI, change-to-test ownership, measured loading/performance architecture, engineering guardrails and migration/deletion of proven-obsolete legacy paths.

The detailed execution order was:

- **H0A - Baseline, architecture inventory and measurements.** Map scenes/managers/services/state/UI/tests/loading and record reproducible before-state evidence. Analysis/evidence only.
- **H0B - Architecture boundaries, dependency rules and lifecycle ownership.** Establish explicit platform/domain/service/scene/presentation/test boundaries and mechanical high-value dependency guards.
- **H0C - Unicorn Valley UI design system and canvas/DOM bridge.** Converge recurring buttons/panels/dialogue/messages/notices/scroll/settings controls onto canonical tokens/primitives and one supported DOM-overlay contract.
- **H0D - Scene standardisation, manifest and scaffolding.** Define composition-first scene services plus a new-scene recipe covering stable ID, loading, audio, HUD, interactions, persistence, spawn/return, responsive behaviour and teardown.
- **H0E - Test-suite audit and contract redesign.** Classify tests by product contract, remove/rewrite stale implementation-detail assertions with evidence and establish semantic selectors/fixtures and critical safety-floor coverage.
- **H0F - Tiered verification model.** Introduce fast static/affected/targeted tiers for development and retain complete Chromium/cross-browser/deployed qualification for cross-cutting/final package work.
- **H0G - Change-to-test ownership and CI selection.** Add a fail-safe merge-base classifier and version-controlled source→test ownership map; unknown/shared/core changes escalate rather than silently skipping coverage.
- **H0H - Performance architecture and loading policy.** Attribute bundles, deliberately lazy-load optional regions/features where beneficial, isolate diagnostics/legacy cost and replace the fixed whole-game ceiling with measured entry/first-playable/lazy-chunk guards plus total-JS trend evidence.
- **H0I - Engineering standards and automated guardrails.** Make canonical UI/scene/event/persistence/audio/test/validation rules discoverable and enforceable for future Work/Codex sessions.
- **H0J - Migration and deletion programme.** Move the existing game onto the standards in bounded slices and retire proven-obsolete migration/cleanup/duplicate paths rather than leaving parallel old/new systems.
- **H0K - Full qualification, before/after report and human gate.** Run the authoritative complete suite, immutable deployed smoke and engineering evidence review; stop for David before merge/production/H1.

H0 did **not** simply raise 650 KiB to a larger arbitrary total. The accepted performance contract distinguishes startup/entry/first-playable and pathological lazy-chunk regressions from total emitted JavaScript trend evidence.

The test/CI target remains **fast feedback during development, full confidence at integration**. A small local CSS/layout fix should run the static/owned targeted checks rather than automatically consuming the same browser matrix as a whole WP, but full package/main/release qualification retains the complete safety net. Unknown risk escalates.

### R6.5-WP19H0.5 - Home Screen Final Polish

State: **complete / human-approved 2026-09-14 / merged through PR #173 / production released**.

Purpose delivered: replace the title lock-up with the approved generated Unicorn Valley logo/tagline artwork, polish the responsive title action panel, make first-run and returning-player layouts intrinsic, route Home Settings through the canonical reusable SettingsScene, and remove the remaining title-specific legacy settings path. Exact-head static, unit, build/performance, full Chromium and Chromium/Firefox/WebKit compatibility qualification passed before merge.

H0.5 cleared the final technical and visual gate for H1.

### R6.5-WP19H1+ - Open-Ended Area-by-Area Final Polish Programme

State: **active; H1 = Moonflower Glade complete, H2 = Moonflower Cottage complete, H3 = Sunbeam Village H3.1-H3.6 approved and H3.7 implemented for visual review on 22 September 2026**.

The earlier fixed `H1-H13` area inventory is superseded by this section. There is **no predetermined upper H number**. The programme continues for as many independently useful area, subarea or interior passes as David chooses before integrated qualification. Interiors may receive their own H number when they warrant an independent review rather than being forced into a parent-area package.

Purpose: use each selected area as the human review lens for a comprehensive final quality pass. The area boundary is **not** a technical boundary. If feedback from one area exposes a shared/global weakness — for example speech-box layout, interaction presentation, reusable UI, NPC behaviour, collision, navigation, feedback placement, audio behaviour or another cross-scene system — fix the canonical shared system properly so the improvement applies wherever relevant across the game. Do not create area-specific hacks for problems that are actually global.

Every H-number area package follows the same mandatory **four-stage contract**:

1. **Feedback / human analysis.** David plays/reviews the selected area and supplies everything he wants improved, thinks is broken, wants tightened, wants added or believes could be better. Feedback may cover bugs, graphics, atmosphere, scenery density, layering/depth, navigation, collision, NPCs, conversations, interactions, content, progression, responsive behaviour, audio, activities, interiors, additions or broader ideas. During this stage, record feedback faithfully and do not begin implementation unless David explicitly asks to move on.
2. **Assistant analysis.** Once David indicates the feedback pass is ready for analysis, inspect the relevant code/systems and break the feedback down. Identify causes, dependencies, conflicts, opportunities, preservation requirements and which items should be implemented globally/reusably rather than locally. Comment on or refine the requested changes where useful, and surface any closely related issue that materially affects the same area/system.
3. **Plan.** Produce a complete ordered remediation/expansion plan covering how to action every agreed item, sensible implementation order, shared-system work, area-specific work, dependencies, regression risks, test/validation needs, cross-device considerations and acceptance criteria. The plan is reviewed before implementation.
4. **Action.** Implement the approved plan. Use canonical/reusable systems for global changes, targeted area work for local changes, run the appropriate automated and cross-device validation, provide a preview where applicable, iterate on David’s review feedback, and close the H package only after David explicitly accepts it.

Operating rules for H1+:

- **H numbers are assigned sequentially only when David chooses the next review area.** Do not pre-assign future H numbers to locations.
- **R6.5-WP19H1 - Moonflower Glade is complete and human-approved.**
- **R6.5-WP19H2 - Moonflower Cottage & Home Customisation is complete, fully qualified and deployed to production.**
- **Current package: R6.5-WP19H3 - Sunbeam Village Final Polish.** David supplied feedback block 1 on 21 September 2026 and approved the H3.1-H3.8 first-pass plan. H3.1-H3.6 are now human-approved; H3.7 Southern Residential Expansion is implemented and awaiting visual review. H3.8 remains blocked on H3.7 acceptance. H3 remains deliberately open-ended: H3.9 and later numbers are reserved for additional feedback blocks before any final hardening/consolidation slice is numbered.
- Future H numbers remain deliberately unassigned until David selects each next review area.
- There is **no H13 cap**. Continue H numbering until David decides the playable world, meaningful subareas and relevant interiors have received the required final passes.
- An area is a review lens, not an excuse to duplicate shared code. Any broadly applicable improvement discovered during an H package should be made at the correct shared owner and then validated against affected areas.
- Positive existing visuals, behaviours and progression are preservation requirements unless David explicitly asks to change them.
- Known graphical observations such as apparently duplicated path layers are owned by the H package for the area in which they are observed, but root causes should still be fixed globally if shared.
- Each package should consider desktop/laptop, tablet landscape, phone landscape and phone portrait where the affected system/area supports those presentations.
- Do not move from one of the four stages to the next merely because time has passed or an agent believes the answer is obvious. David’s feedback defines Stage 1; analysis and planning precede implementation unless he explicitly directs otherwise.

### R6.5-WP19H1 - Moonflower Glade Final Polish

State: **Stages 1-3 complete / scope and plan approved 2026-09-14 / Stage 4 action not started**.

Path: `docs/work-packages/R6.5-WP19H1-MOONFLOWER-GLADE.md`

H1 will turn Moonflower Glade into a finished, expandable home region while using the area to correct only the genuinely shared systems exposed by the review. The committed scope includes:

- rerouting the main path past Moonflower Cottage and establishing a locked western hedge/gate as a future expansion hook;
- substantially redesigning the cottage exterior and front garden while extending the existing home architecture with a future-compatible exterior configuration foundation;
- preserving the vegetable/growing plot as a future gameplay location without implementing farming yet;
- removing the outdoor Wonderbook/display stump, relocating its physical presence inside the cottage and turning the vacated space into a calm Home Meadow;
- strengthening tree/hedge boundaries, matching visible hard boundaries with believable collision and adding restrained ground/vegetation texture;
- polishing the stream with less regular water detail and lightweight ambient fish while deferring actual fishing mechanics;
- giving Pip a proper production identity and making Pip's Mysterious Trail progression/feedback unambiguous;
- replacing literal floating object icons with one reusable subtle blue world-interaction pinprick, distinct from click/tap destination markers and story effects;
- rebuilding the Moonflower Field approach as a dense multicoloured flower threshold with correct foreground/under-character depth and preserving its separate scene transition;
- integrating Sunbeam Village signage into a physical gateway and applying bounded Hollow Tree texture/environment polish;
- diagnosing and fixing Juniper's clipped tail at the correct NPC art/presentation owner;
- polishing the shared dialogue-card family to the approved rounded R6.5 design language with corrected portrait/button/shadow layout;
- repairing global click/tap approach-to-interact behaviour so NPC/interactable clicks navigate to valid stand-off range rather than repeatedly colliding and shuddering;
- validating local Glade work plus representative cross-scene regressions for every shared system changed.

Explicitly deferred from H1 are the western-gate unlock quest/new region, full farming, fishing gameplay, full exterior cottage customisation UI/catalogue, seasonal Glade systems and broad cross-region Pip companion scripting. H1 may establish clean hooks for these but must not expand into them without separate approval.

#### H1 incremental delivery and review cadence

H1 remains one work package, but Stage 4 is deliberately split into small human-reviewable checkpoints. The default loop is **implement one bounded slice → run the cheap relevant checks → deploy a preview → David reviews the URL → correct/approve that slice → move to the next checkpoint**. Do not wait until the entire H1 package is implemented before visual review.

Checkpoint order:

1. **H1.1 - Glade layout and paths:** reroute the main road past the cottage and westwards, add the cottage branch path, western hedge/gate, correct Moonflower Field branch termination and sign placement. Preview and approve the geometry before major decoration work.
2. **H1.2 - Cottage exterior:** substantial cottage visual redesign, proper front garden/flowerbeds, foreground layering and future-compatible exterior-home configuration foundation. Preview and approve the cottage independently.
3. **H1.3 - Home Meadow and Wonderbook:** remove the outdoor display stump/Wonderbook, establish the physical Wonderbook inside the cottage and build the calm meadow/open-garden replacement. Preview and approve.
4. **H1.4 - Boundaries and environmental density:** strengthen tree/hedge boundaries and collision, add ground/grass/environment variation and bounded Hollow Tree polish. Preview and traversal-check.
5. **H1.5 - Moonflower Field:** dense mixed-colour flower threshold, foreground/background depth, entry glow and preserved Moonflower Patch transition. Preview and approve.
6. **H1.6 - Stream:** irregular water/ripple treatment, ambient fish/surfacing and restrained stream polish without implementing fishing. Preview and approve.
7. **H1.7 - Pip:** give Pip a defined production identity/body/species presentation and repair/clarify the Mysterious Trail state flow. Preview and approve Pip separately because the character is visually/story-important.
8. **H1.8 - Shared interaction presentation:** introduce the reusable blue magical interaction pinprick, retire literal floating object icons in the Glade and polish physical gateway/sign presentation. Validate representative non-Glade use where the shared system changes.
9. **H1.9 - Dialogue and NPC polish:** polish the shared dialogue-card family and fix Juniper's tail clipping at the correct owner. Run broader targeted regression because these changes can affect multiple scenes.
10. **H1.10 - Click/tap approach repair:** fix shared approach-to-interact navigation so NPC/interactable clicks stop cleanly in valid interaction range rather than shuddering against collision. Exercise several NPCs/Pip/interactables across representative areas and run the broader targeted navigation regression suite.

**CI/validation policy during H1:** ordinary visual checkpoints should use only the cheap static/build/owned checks necessary to make the preview trustworthy. Do not run the complete Chromium/Firefox/WebKit/full-game matrix after every small path, flower, cottage or scenery iteration. Broader targeted tests are appropriate when a checkpoint changes a genuinely shared system, especially H1.8-H1.10. Run the authoritative full static/unit/build/performance, Chromium, Firefox/WebKit, responsive and deployed-smoke qualification once the substantial H1 implementation is assembled and again only if later changes materially invalidate that evidence.

Human preview approval is a design gate, not formal H1 completion. Individual checkpoint approval allows the next checkpoint to build on the accepted result; H1 closes only after integrated qualification and David's final Moonflower Glade review.

### R6.5-WP19H2 - Moonflower Cottage & Home Customisation

State: **complete / human-approved / fully qualified / merged and production released 2026-09-20**.

Path: `docs/work-packages/R6.5-WP19H2-MOONFLOWER-COTTAGE-HOME-CUSTOMISATION.md`

H2 rebuilt Moonflower Cottage as a finished home and customisation space, including production room layout/furniture, collision/layering, sleeping, Decorate mode, persistent room/furniture styling, decoration placement, home-style entitlements, semantic story/visitor capacity, responsive controls and final consolidation/hardening. H2.0-H2.11 are closed.

### R6.5-WP19H3 - Sunbeam Village Final Polish

State: **feedback block 1 analysed / H3.1-H3.8 first-pass plan approved 2026-09-21 / implementation not started / further H3 numbers explicitly expected**.

Path: `docs/work-packages/R6.5-WP19H3-SUNBEAM-VILLAGE.md`

Sunbeam Village is the third selected review area in the open-ended H1+ programme. Feedback block 1 identified that the village is not simply under-polished: its current visual clutter comes from several generations of independently composed presentation overlapping in one space. The base scene owns the large rectangular village-square surface, broad road geometry, shop shells, bunting, labels and prototype markers; later systems add production NPCs, environment decoration, roaming residents and village-life props on top. The approved first pass therefore rebuilds the village composition while preserving its gameplay, quests, shop access, resident systems and region transitions.

The concrete first-pass findings include the 1,220 × 690 semi-transparent rectangular square layer, the old main road running through the fountain, the surviving generic `shopkeeper-marker`, floating/text-box environmental labels and several independently positioned props/resident routes competing around the northern shop row.

#### H3 feedback block 1 delivery sequence

1. **H3.1 - Legacy residue and composition ownership cleanup:** remove the rectangular square treatment, obsolete path residue and surviving `shopkeeper-marker`; identify other superseded prototype presentation; reduce duplicated Sunbeam-specific scenery ownership so later work builds on one deliberate composition rather than another overlay.
2. **H3.2 - Village master layout rebuild:** redesign the full village spatial composition around clear districts for the western Glade approach, northern/high-street shops, central fountain/plaza, south-west Willow/garden area, southern/eastern residential village and eastern Meadow approach. Rebalance the top-heavy density and preserve readable circulation/tap-navigation space.
3. **H3.3 - Proper plaza and path network:** replace the geometric brown square with an organic storybook plaza treatment; give the fountain a clear focal paved area; route the west-east path around rather than through the fountain; add deliberate branches to shops, Willow and residential areas while keeping movement/navigation readable.
4. **H3.4 - Shop exterior rebuild:** retain Sunbeam Bakery, Twinkle & Thread and Story House but replace the dominant repeated rectangle-plus-triangle template with distinct storybook silhouettes, façades, rooflines, windows, signs, trim, doors and landscaping. Preserve their existing interiors/economy/entry behaviour; interior review is outside this H3 first pass.
5. **H3.5 - Integrated signs and wayfinding:** retire floating shop/garden/gateway labels and cues such as `DOOR OPEN • COME IN` in favour of environmental signs, hanging boards, carved posts, plaques and visually legible gateways. Preserve the canonical global location HUD.
6. **H3.6 - Willow's garden district:** move Willow and her garden towards the south-west/left edge of the commercial centre, connect them with a curved spur path, expand the garden into a believable bounded place and preserve the planted/unplanted Moonflower story state.
7. **H3.7 - Southern residential expansion:** add a restrained set of additional homes/village buildings around the southern edges so Sunbeam reads as a real village rather than three shops beside a fountain. Buildings may offer lightweight inspect/knock flavour but do not imply a new set of interiors. Maintain generous green/path space between structures.
8. **H3.8 - Props, bunting, residents and village-life recomposition:** deliberately reposition the notice board, map sign/chime, sundial, bench, fountain interaction, shop-window display, bunting, flower detail and roaming resident routes into designed micro-areas. Keep the village lively, but protect uncluttered circulation around the fountain and shop entrances.

**Numbering contract:** H3.1-H3.8 are only **feedback block 1**. They are not the complete H3 package and must not be followed automatically by a final hardening/qualification slice. David will review the first-pass result and provide feedback block 2; that work continues at **H3.9, H3.10, H3.11 and onward for as many slices as required**. The final consolidation, responsive regression, hardening, documentation and integrated H3 qualification slice receives the next available H3 number **only after David says Sunbeam Village itself is complete**.

The shop interiors remain explicitly outside this exterior/world-composition pass. They may receive a later independent H-number review if David selects them, consistent with the open-ended H1+ programme.

### R6.5-WP19I - Integrated Qualification

State: **approved, but blocked until David has completed and accepted the full open-ended H1+ area-polish programme**.

WP19I remains the whole-game technical qualification package. It must run only after the audio work, H0/H0.5 architecture and title gates, and every H-number area final-pass package David chooses have been accepted, so qualification measures the actual intended R6.5 release candidate rather than a pre-polish build.

### Known open defect outside WP18K

Any remaining world-geometry or interaction defects discovered by human testing must be closed or explicitly accepted before the final R7-readiness decision. Human-observed behaviour overrides stale automated qualification.

### R6.5-WP18H - Full Human Tablet Replay and Return to WP17

State: **deferred until WP19H, WP19H0/H0.5, the full open-ended area-by-area final polish programme, WP19I qualification and known open blockers are accounted for**.

Path: `docs/work-packages/R6.5-WP18H-FULL-HUMAN-TABLET-REPLAY-RETURN-WP17.md`

Run another substantially unguided daughter playthrough on the Galaxy Tab S8 after remediation. Use the human feedback ledger as the replay checklist. WP18H captures evidence and returns to WP17 for the user's explicit R7-readiness decision.

### Dependency chain

`WP17 evidence -> WP18A-G complete -> WP18I/J approved -> WP19A accepted -> WP18K complete -> WP19B complete -> WP19C complete -> WP19D complete -> WP19E -> WP19F -> WP19G -> WP19H complete -> WP19H0 A-K complete -> WP19H0.5 complete -> WP19H1+ sequential user-selected area final passes -> WP19I qualification -> WP18H human replay -> WP17 explicit readiness decision -> R7`

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
- The measured startup/first-playable/lazy-chunk performance contract supersedes the old fixed whole-game 650 KiB gzip ceiling; total emitted JavaScript remains tracked rather than ignored.
- Selective CI accelerates development feedback only; final WP/main/release qualification remains complete and authoritative.
- Production deployment still requires explicit user approval.