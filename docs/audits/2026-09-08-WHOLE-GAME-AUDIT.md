# Whole-game audit, 8 September 2026

Status: analysis complete for the inspected scope; remediation plan approved by David on 8 September 2026. This is not a claim that every quest permutation or device has been played successfully.

## Baseline and method

- Repository inspected: `d9b765c0293045251619783a4ced4b01068e993a`, main at the start of review.
- Approved gameplay code: `e4d64c0fa258bd91eb29579321e7da6b0968f71e`, integrated through PR #158 and `45c858e`.
- Browser inspected: `https://8292d7b9.unicorn-valley.pages.dev`, fresh review profile, desktop Chrome, displayed viewport 1363 × 936.
- No open PRs were returned at the initial check. WP18K was planned, not implemented.
- Read the operating contract, release/remediation specifications, original daughter evidence, feedback ledger, current work packages and UI authority.
- Inventoried 420 source files and 62 browser spec files. Traced boot/scene registration, presentation managers, creator, interaction dispatch, dialogue, population, presence, movement/collision, persistence, inventory/economy, quest events, audio and validation ownership. This was a system-level source audit, not a claim of exhaustive line-by-line verification of every file.
- Inspected current test-produced screenshots for Nook, Bag, Woods, Village and Brook, supplementing live-browser evidence.
- Interactively inspected title, fresh creator, naming/confirmation, tap movement, Pip targeting, two dialogue pages, Bag and Map. The approved build visibly retains both the improved shell and older presentation underneath.
- Ran `npm run validate`: 113 test files / 427 tests passed; format, lint, type-check, build, performance and static smoke passed. Total emitted JavaScript reported 2295.6 KiB raw / 643.1 KiB gzip; the separate hard application-entry budget passed unchanged.
- Ran two temporary fault-injection tests: both reproduced the persistence behaviours recorded as A09/A10. These assertions confirmed current defects; they were not added to the permanent suite as tests that require bugs to remain.
- Main CI run `34210921262` had successful Validate and Browser compatibility jobs at inspection, while Browser playtest was still in progress; a later check showed it ended cancelled. Do not translate that into full CI success.
- The local full browser suite could not launch its Chromium executable. It was stopped after repeated launch failures; a single-spec diagnostic confirmed the missing executable. These are environment failures, not evidence of 24 gameplay defects. Browser installation subsequently succeeded and the suite ran. Final results are recorded in the validation addendum below.
- Cloud-browser extension metadata errors were observed, with extension URLs; these were not attributed to the game.

## Main conclusion

The valley has substantial working content, an improved accepted HUD and useful automated coverage. Its largest remaining weakness is inconsistent ownership: original scenes, content managers and successive presentation passes independently create controls, labels, feedback and interaction listeners. Clean-up alone cannot fulfil the new request, because the creator, short conversations and MP3 playback require deliberate product changes. Conversely, redesigning them on top of the current patch layers risks repeating the same failures.

Retain the accepted shell and domain services. Complete a bounded ownership foundation, then implement explicit creator, interaction, dialogue and audio contracts. Keep world geometry and save failures in separately testable defect packages.

## Findings

### A01. Creator is crowded and has different layout authority by device

Priority: high. Evidence: browser-confirmed presentation; source-confirmed mechanism.

`UnicornCreatorScene.ts` creates the original all-options layout. On desktop, the preview spills beyond its panel, the mane-style left arrow intrudes into its label, and the horn/marking row is cramped. This is not the progressive creator promised in the approved direction.

`LandscapeCreatorProgressiveManager.ts` captures objects by approximate old Y coordinates and infers categories from X/Y positions. `LandscapeTabletPresentation.ts` restricts that manager to touch landscape. `CreatorPortraitControlsManager.ts` implements a separate DOM-facing route, including selection inference from rendered swatch scale. Another manager adds visual polish.

Fix: one appearance draft and one category model, with explicit named controls and responsive layouts. No categorisation from coordinates or selected-state inference from scale. Test every category, longest name, new/edit modes, keyboard focus, soft keyboard, rotation and re-entry. Preserve existing cosmetic IDs and save compatibility.

### A02. Old instruction labels remain visible despite the new action button

Priority: high. Evidence: browser-confirmed and source-confirmed.

Fresh Glade play visibly displayed `Sit: Cottage step · E / Enter / tap`. `WORLD_INTERACTION_PROMPT` is still used throughout depth, story, discovery and activity managers. Ambient residents also build their own `Talk to ... E / Enter / tap` text.

`DesktopConceptCleanupManager.ts` scans immediate scene children, whereas many prompts are children of containers. Some old strings start with input instructions rather than an action verb, which also falls outside its action-first regular expression. Hiding more text after rendering would leave the underlying generation and ownership problem intact.

Fix: migrate interaction producers, then remove instructional labels at source. Keep useful names, signs, quest clues and outcome messages. The user's new rule supersedes old instructions requiring perpetual keyboard hints. A contextual Talk/Enter/Inspect/Start/Use button must exist before the old prompt is removed.

### A03. There is no single interaction candidate list or input consumer

Priority: high. Evidence: source-confirmed architecture; full runtime collision cases require regression reproduction.

`MoonflowerGladeScene.update` selects from its fixed targets plus Pip. `GladeDepthWorldManager` and `AmbientPopulationWorldManager` separately compute proximity and consume `WorldInteractionInput`. Ambient residents do not register into that scene's `InteractionPrompt` target list. Similar patterns recur across region managers.

Every `WorldInteractionInput` instance can observe the same global keypress serial. A press is not globally claimed by one interaction owner. Thus overlapping eligible managers can independently activate; the current design does not establish a single-winner invariant. This is a code risk, not a claim that every overlap double-activates in ordinary play.

Fix: a scene-owned registry/coordinator with stable target IDs, live position/enabled providers and one dispatch point. Button and optional direct tap invoke the same command. Claim an input once; suppress stale input after modal close; clear targets on scene exit. Preserve automatic walking gateways where they are already intentional.

### A04. Short NPC speech is a timed notification, not a conversation

Priority: high. Evidence: source-confirmed.

`AmbientPopulationWorldManager.showFeedback` puts an 18px message at the top of the game and destroys it after 2600ms. Activating a resident pauses its tween for a timed interval, independent of whether the player has finished reading. Small object interactions share this feedback method. Current WP18F test screenshots also show multiple discovery/region notifications stacked across the Woods HUD, while the Village combines an Enter button with an extra bottom “Tap Enter” banner. The notification system needs priority/queue placement as well as consistent card styling.

`DialogueCard.ts` instead provides a large dimmed lower-screen panel. Browser inspection of Pip confirms a large mostly empty card for a short line and a rectangular Continue control, visibly different from the approved Bag/HUD.

Fix: one conversation presenter with a compact manually dismissed speech card for a short exchange and an expanded layout for choices/quest dialogue. Keep short outcome toasts separate. An engaged NPC remains stopped until the conversation closes, then resumes its routine. No reading deadline and no generic toast carrying essential instructions.

### A05. Population consistency work is narrower than its name suggests

Priority: high verification / medium extension. Evidence: source-confirmed scope.

`CoreNpcPresenceService.ts` explicitly resolves Nova only. Its test correctly expects no authority for Willow. The original duplicate-Nova fix should be preserved, but cannot be used as proof that all residents or recurring friends have one authoritative presence.

Ambient residents have their own location resolution, waypoint tweens, timeout recovery and talk variants. `CrystalBrookEchoBridgeManager.ts` contains a separate visual-only Echo implementation, but the source search found no caller of its exported getter. It is a deletion candidate, not proof of an active duplicate Echo.

Fix: inventory every resident and each core character role, location owner, movement owner and interaction provider. Reuse existing presence rules, extending only where characters actually have competing roles. Verify Maple/Echo/Fern, Nova race/picnic/cottage, scene return and save/continue. Do not build a new full-life simulation merely to make existing characters reliable.

### A06. Tap movement coverage omits two explorable micro-locations

Priority: high for this player's preferred input. Evidence: source-confirmed omission; runtime replay required.

`ClickToMoveManager.ts` supports Glade, Village, Meadow, Brook, Woods, Beach, Cottage, Patch, Nook and Lookout. `CrystalGrottoScene` and `FireflyGroveScene` contain controllable players and contextual targets but are absent from its supported scene/map lists. Their inspected input paths provide directional controls, without the same tap-navigation owner.

Fix: explicit navigation capability per explorable scene, including Grotto/Grove. Keep static shop/menu scenes distinct. Verify obstacle clearance and intended action approach points rather than just adding names to a list.

### A07. Cottage collision is still a real open defect

Priority: high. Evidence: unresolved human report; source/test gap confirmed, not re-reproduced inside the cottage in this review.

`CottageInteriorMap.ts` defines blockers independently from presentation. The tests verify named outer walls, reachability and the lower exit area. They do not prove that the visible upper wall/window begins at the same boundary as the walkable floor or that the complete unicorn silhouette stays convincingly out of it.

Fix: inspect the rendered floor/wall seam, collision body/foot anchor, occlusion and navigation clearance together. Define one intended walking boundary; update physics and tap pathfinding consistently. Cover keyboard, pad, tap, diagonal approach, Gallop, decoration slots, shelf/window interaction and exit. Do not simply move a wall collider so far down that objects become inaccessible.

### A08. Many presentation owners repeatedly inspect and modify other owners' objects

Priority: high foundation. Evidence: source-confirmed.

There are 60 files containing `POST_STEP` references (93 occurrences, including registration and removal). That count is not a measured performance defect. It shows the breadth of reconciliation to inspect.

`main.ts` and `BootScene.ts` initialise different groups of managers. Modal styling scans named rectangles and redraws graphics every 120ms. Creator categories use old coordinates. Cleanup hides existing shapes with near-zero alpha. Responsive and map-clip managers apply later adjustments. Some managers are legitimate domain owners and must not be indiscriminately deleted.

Fix: WP18K ownership/dependency map first. Retain world-domain services, accepted HUD overlay and map clipping. Move stable component presentation into explicit lifecycle methods; use dirty updates for state changes; remove proven dead imports/assets/managers. Measure scene transitions, listeners, object counts and frame times before/after. Do not replace this with an unbounded engine rewrite.

### A09. A storage read failure can escape the save boundary

Priority: high resilience. Evidence: reproduced by fault injection.

`SaveRepository.ts` reads storage directly. `SaveService.load` and `hasUnsupportedSaveVersion` perform primary reads outside the decoding catch. `createBrowserSaveRepository` also accesses `globalThis.localStorage` without the guarded access used by audio settings.

Reproduction: construct a repository whose `read()` throws a storage-denied error; `SaveService.load()` throws it. The diagnostic passed by confirming that current behaviour.

Fix: distinguish unavailable storage, corrupted content, a newer schema and a valid empty save. Do not silently start a replacement game when an existing save cannot be read. Provide a recoverable message/retry and preserve backup/checkpoint precedence. Test denied getter/read, quota, corrupt primary, valid backup, old schema and future schema.

### A10. Purchase/collection success can be reported when persistence fails

Priority: high. Evidence: reproduced for Bakery; related callers found in source.

`SaveService.save()` returns the proposed save even when `saveWithResult()` returns `storage-failed`. It throws only for a newer-version block. `BakeryService.purchase` and `ShopService.purchase` then return `purchased`. `InventoryService.addItem` emits `ITEM_COLLECTED` after the same status-obscuring call, allowing quest listeners to respond to a collection that may not have persisted.

Reproduction: seed three Shimmer, then make checkpoint writes fail. Buying a Berry Bun returns `purchased`; reloading still shows zero buns. The diagnostic confirmed both facts.

Fix: make success dependent on the committed result; publish domain success events only after successful persistence. Include purchase, earn/spend, collect/eat, quest rewards and decoration. Preserve the existing rule that a successfully written authoritative checkpoint can count as saved even if a secondary primary write fails. Avoid a blanket requirement that every backup write must succeed.

### A11. Title artwork is procedural placeholder-style scenery

Priority: requested presentation improvement. Evidence: browser/source confirmed.

`TitleScene.createValleyArtwork` draws circles, clouds, hills, a rainbow and cottage with Phaser graphics. The title and menu panels occupy much of the image. This does not satisfy the request for a beautiful generated home-screen image.

Fix: generated storybook landscape, composition designed around real controls and a portrait crop. Keep title/button text as live UI, not painted into the image. Retain Continue/New Game/Settings and existing redesign/recovery behaviour. Generate and seek visual acceptance within the designated art package; this audit is the planning gate, not final artwork delivery.

### A12. MP3 music and event-bound audio are not implemented

Priority: requested system. Evidence: source confirmed.

`VerticalSliceAudio.ts` implements note timers, oscillators and generated ambience. It already has useful music/ambience/effects settings and SFX call sites. It has no MP3 catalogue, uploaded-track playlist or event-to-file mapping. Long music needs a different loading strategy from short effects.

Fix: one persistent audio owner behind the existing call-site interface, an asset catalogue and explicit event bindings. Preserve existing settings through normalisation. Stream music, cache bounded decoded effects, handle unavailable tracks and suspended audio, and keep gameplay independent of audio success. Details are in WP19G/H of the proposal.

### A13. Deferred loading lacks one readiness/error contract

Priority: medium, escalate if a freeze is reproduced. Evidence: source risk.

`main.ts` uses many independent fire-and-forget dynamic imports, including scene registration. Their shown call sites do not have a shared failure handler or readiness gate. A missing chunk can leave an entry available before its destination exists, depending on the caller.

Fix: audit every lazy scene entry; establish loading/ready/failed state and a retryable message. Deduplicate pending loads and never leave movement/input permanently locked after failure. Preserve code splitting and the 520 KiB entry budget. Reproduce with an intentionally unavailable chunk before claiming a specific crash fixed.

### A14. Status documents overstate or disagree about current state

Priority: medium workflow correctness. Evidence: source confirmed.

At review start `PROJECT.md` still described WP15 as active, while STATUS and ROADMAP correctly described WP18K next. `PROJECT_STATE.json` marked CI passing despite the full main playtest still running, and its latest commit field held the older approved gameplay SHA without that distinction. WP18K front matter was proposed while the status described execution ready.

Fix: separate accepted gameplay baseline, current proposal state, local technical evidence, exact-commit CI and human acceptance. The current proposal must not be recorded as an already approved implementation programme.

### A15. Tests often prove components exist, not that a child can use the complete flow

Priority: high validation improvement. Evidence: test/source review and browser counterexamples.

The core suite passed while the creator still crowded controls and nested prompts remained visible. Cottage map tests do not cover the visible wall seam. Several old browser specs target historical named objects. The broad-suite retry reproduced three failing assertions: two missing `activity-suggestion-card` checks in `r3-wp3.9f-layout.spec.ts` and the retired `exploration-controls-button` in `r3-wp3.9i-tidy-up.spec.ts`. Source inspection found no current scene creation of these controls. Update the behavioural regressions to the accepted UI contract; do not restore retired controls merely to satisfy these assertions. The broad browser suite is valuable, but presence checks and diagnostic scene positioning cannot replace ordinary-input end-to-end journeys or a physical tablet replay.

Fix: stable behavioural selectors/capabilities, overlap and readable-text geometry checks, complete target coverage, normal-input playthroughs, fault injection and save/continue checks. Preserve valuable old regressions; retire only assertions for genuinely retired UI. Track skip reasons. Never loosen budget/time thresholds merely to hide a current failure.

### A16. New-game Map position disagrees with the active location

Priority: high navigation clarity. Evidence: browser-confirmed; source-consistent explanation.

After creating a fresh unicorn, walking to Pip in Moonflower Glade, finishing the conversation and opening Map, the map marked Moonflower Cottage as YOU ARE HERE. The preceding HUD correctly said Moonflower Glade.

`InventoryScene` resolves the map node from `save.profile.currentLocationId`. `DEFAULT_START_LOCATION_ID` is `moonflower-cottage`; the inspected Glade scene does not itself write a location checkpoint on create. `ContinueLocation.ts` also resolves that legacy ID to the cottage interior. This supports a stale/default location explanation; verify the complete continue/arrival manager lifecycle before changing migration behaviour.

Fix: one authoritative active-location/checkpoint contract for new-game arrival, travel, Map and Continue. Add the ordinary-input new-game→Pip→Map reproduction, return-to-title/Continue, region crossings and interior returns. Preserve backwards-compatible interpretation of old saved IDs. WP19B owns this bounded location defect; it is not a map topology redesign.

### A17. Tablet Bag control sizing fails the existing minimum check

Priority: high touch-usability verification. Evidence: current automated geometry failure.

`r6.5-wp18g-device-hardening.spec.ts` failed its Bag/Map/Creator matrix at the Bag pocket minimum-size assertion: 36.288 CSS pixels against the existing 40-pixel minimum. The trace had advanced to the second viewport, 1024 × 768, and the first Bag pocket check. This is a numerical layout failure, unlike the stale-coordinate Bag test. Compare visual and actual hit bounds before fixing; the diagnostics rectangle is not alone proof of the complete input hit area.

Fix: WP19F owns responsive Bag category/close target sizing within the accepted design. Measure actual input bounds and avoid shrinking target sizes with canvas scale. Retain the new plan's 48 CSS-pixel primary-target aim; do not lower the existing assertion to make this failure pass. Revalidate Map/Creator portions, which this failed test did not reach at the second viewport.

## Validation addendum

After Chromium installation, `npm run test:play -- --max-failures=3` completed with 23 passed, 3 failed and 155 not run. The three failures are the historical UI assertions described in A15. The additional runner error accompanies its explicit maximum-failures stop. This is a failed/incomplete browser qualification, not a green suite.

A separate `npm run test:play -- 'r6.5-' --max-failures=5` run selected 60 current-release tests: 34 passed, 5 failed and 21 did not run, including the serially skipped Twinkle & Thread case. It stopped at the configured five-failure limit after 15.5 minutes. The additional runner error accompanies that maximum-failures stop. Passing areas include Continue in three regions, quest/activity flows, portrait Wonderbook/activities, two Beach Bag regressions, tablet creator categories, regional visual assertions, orientation cycling, desktop click movement/name entry, and contextual Talk/Enter. No full suite or all-device pass is claimed.

The current-release Nook lifecycle test exhausted its 120-second total test budget at the last return to Glade. Trace inspection shows seven successful complete returns and eight successful Bag returns; the final exit click occurred less than one second before the test deadline. This is insufficient evidence of a renewed gameplay freeze. Investigate test overhead and bounded scene-transition timings without simply raising limits to force a pass. Its serial group skipped the following Twinkle & Thread test, which therefore remains unverified by this run.

The Bag food/scroll test in `r6.5-wp18e-bag-map-food.spec.ts` timed out waiting for `bag-scroll-down` after clicking the old hard-coded category position `(605, 132)`. Its screenshot remains in the Food pocket, while the accepted category row is lower. This supports a stale-coordinate test failure, not proof that decor scrolling or food consumption is broken. Repair the test to click the current named category target and complete the intended behavioural assertions.

The race-controls viewport matrix exhausted its 45-second total budget; the trace had progressed through multiple checks and a later RaceScene load. No specific geometry assertion or runtime exception establishes a race defect from this result. Profile the test and retain ordinary-input race verification.

The Bag/Settings concept test failed on missing `concept-modal-surface:inventory-modal-panel`. Current `InventoryScene` directly creates a graphics shell rather than the rectangle wrapper expected by `ModalConceptPresentationManager`. This same old test also expects a Bag Shop button that was explicitly removed by the accepted design. Update its assertions to the current Bag contract and then exercise Settings; do not restore retired surfaces.

The Nook failure screenshot independently shows the old centred room title behind the approved top HUD and an extra bottom “Tap Interact for Moonflower Glade” instruction. Add Nook to WP19F overlap evidence and WP19D prompt migration. Missing emoji glyph boxes in this headless image require font/browser comparison before attribution to the production game.

## What is already valuable and should stay

- Approved cream/lavender/purple/gold exploration shell, stable HUD camera, Bag categories, parchment Map clipping/panning and Wonderbook page tabs.
- Tap movement and the absence of race steering. Racing remains RUN/JUMP.
- Versioned saves, backup/checkpoint machinery, content registries, quest/event services and focused domain tests. Improve their boundaries rather than replace them wholesale.
- Existing resident routines, participation rewards, world discoveries and meaningful home changes.
- The daughter's liked Meadow/Woods/Nook, Fireflies and understandable earning/spending loop.

## Feedback disposition

Original evidence is preserved verbatim in `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`; the ledger remains the item-level replay checklist.

- Controls, race long-press, Gallop comfort, keyboard-oriented guidance and small text: retain prior fixes, then revalidate after the new UI/input ownership work.
- Nook, Twinkle & Thread and Beach Bag freezes: previous fixes stay implemented/revalidate. Require transition, modal and long-session replay; do not declare new root causes from presentation symptoms.
- Echo, Maple, duplicate Nova and placeholder representations: targeted NPC/interaction audit and replay, not blanket closure based on one character fix.
- Decoration/bag quantities, food use, repeated bakery purchases and reward clarity: preserve current semantics, add committed-result verification, then replay with a populated save.
- Cottage wall/window: open defect with a dedicated package.
- Pebble directions and region-name confusion: copy pass using current canonical names and visible landmarks; preserve independent exploration instead of adding compulsory guidance.
- Woods magic, cove/crystal readability, shops, Brook approach and mane/neck: retain implemented/revalidate status. Reopen a bounded art defect only if current screenshots/replay fail; no automatic second world-art rebuild.
- Sandcastles, interactive mushrooms beyond existing interactions, food powers, palace and party chains: future ideas, not hidden additions to this stabilisation programme.

## Limits and closure

This review identifies verified defects, source-confirmed gaps and hypotheses separately. It has not completed every quest, replayed every NPC permutation, measured a physical Tab S8, or approved the new visual design. The next plan explicitly includes those tests and human gates. No gameplay fixes, artwork replacement, new audio assets, merge or production deployment were performed by this audit.

Companion: `docs/2026-09-08-REMEDIATION-PROPOSAL.md`.
