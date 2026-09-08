# Unicorn Valley remediation proposal

Date: 8 September 2026

Status: APPROVED by David on 8 September 2026. All six product/sequence decisions below are accepted. David also explicitly authorised pushing the documentation branch and opening its draft PR. Work remains subject to package dependencies and visual/human gates; no merge or production deployment is authorised by this approval.

Audit: `docs/audits/2026-09-08-WHOLE-GAME-AUDIT.md`.

## Proposed outcome

A child can open a beautiful illustrated title screen, comfortably make or redesign a unicorn, explore with her preferred controls, recognise one obvious contextual action, talk to any applicable resident without rushing to read, and enjoy uploaded music and sound effects. The accepted Bag/Map/Book/HUD identity stays recognisable. Existing progress remains safe.

## Approved decisions

1. Approve the sequence below, keeping R7 blocked until the final replay/readiness decision.
2. Use one contextual action button as the visible instruction for interactions. Remove world-level keyboard/tap instruction labels. Keep character/place names and meaningful clues. Retain keyboard shortcuts and sensible direct tapping as alternative inputs to the same command, with their instructions confined to Help.
3. Use compact, manually dismissed short-conversation cards and a larger variant for choices/quest dialogue. Reserve auto-disappearing toasts for nonessential outcomes.
4. Rebuild the creator around progressive categories across all display classes, retaining the current appearance options and save format.
5. Add a generated storybook home-screen background, with live text/buttons above it and later visual approval of the actual artwork/layout.
6. Adopt the two-folder MP3 workflow described below. Audio assignment is explicit and reviewable; unassigned files do not unexpectedly start playing.

These are product/sequence approvals. Approving them is not approval to deploy, and does not pre-approve future artwork or the daughter's final replay.

## Roadmap reconciliation

- R0-R6 and R6.5-WP1-16 remain historically complete. Do not reopen all of them.
- WP18A-G and accepted WP18I/J remain historical delivered packages. New defects attach to the audit IDs, with links back to those packages; their acceptance is not erased.
- WP18K is retained as behaviour-preserving consolidation. Narrow its implementation to the foundation required below, with explicit ownership output. Do not silently absorb product redesign, persistence or collision changes.
- Add WP19A-H as bounded remediation packages, followed by WP19I integration qualification. IDs are new and must not be confused with R6-WP6.18 or R6.5-WP18.
- WP18H remains the real daughter tablet replay, moved after WP19I. WP17 remains the explicit readiness decision. Do not replace either with an automated run.
- Optional R6.6 Android packaging and R7 expansion remain deferred.
- Original daughter ideas and positives survive unchanged in the feedback ledger.

## Execution order and dependencies

1. WP19A: persistence failure safety, a small isolated defect package before broad refactoring.
2. WP18K: ownership foundation and proven legacy retirement.
3. WP19B: cottage boundaries, tap-navigation parity and consistent Map/Continue location.
4. WP19C: creator rebuild.
5. WP19D: unified interactions and reliable NPC engagement.
6. WP19E: conversation and feedback presentation.
7. WP19F: remaining UI/copy consistency plus generated title artwork.
8. WP19G: MP3 catalogue and audio playback foundation.
9. WP19H: event/region audio integration and upload guide.
10. WP19I: complete technical qualification and feedback reconciliation.
11. WP18H: physical tablet daughter replay.
12. WP17: David explicitly accepts readiness or requests bounded further remediation.

WP19A can be implemented independently of visual decisions after this plan is approved. WP19B and creator concept preparation need not wait for each other's human review. WP19G can proceed independently while title artwork awaits visual acceptance, once WP18K establishes the lifecycle owner. This is dependency permission, not permission to run conflicting branches or automatically delegate work.

Any newly reproduced freeze or progression/save-loss blocker takes priority over cosmetic work. Record its evidence and bounded owner; do not hide it under a general polish task.

## Shared acceptance contract

- Four display classes: desktop/laptop, landscape tablet, landscape phone, portrait phone. Include 1280×720, 1280×800, 1024×768, 844×390, 667×375, 390×844 and 360×800 as practical browser viewport cases; physical Tab S8 uses its actual CSS viewport, browser chrome and device scale, recorded at replay.
- Check landscape/portrait rotation in the same session, resize with a modal open, soft-keyboard opening and return from another app.
- Primary touch targets at least 48 CSS pixels where practicable; measure rendered hit areas, not only the 1280×720 logical canvas coordinates. Where small phone space needs a different composition, reflow instead of shrinking all text.
- Aim for at least 18 CSS-pixel essential dialogue/instruction text on the reference tablet; use shorter copy/scrolling before reducing font size. Final comfort remains a human gate.
- One visible primary action per interaction context, clear selected/disabled/pressed states, no overlap between actionable regions, no invisible stale hit targets.
- Preserve saves, appearance IDs, inventory meanings, quests, rewards, automatic region gateways and RUN/JUMP mechanics unless a package explicitly owns the change.
- Keep the 520 KiB application-entry budget. Track image/audio transfer and decoded memory separately so large media cannot hide behind a passing JavaScript budget.
- Code packages run `npm run validate`, relevant browser specs, compatibility and required full-suite gates. Report actual command results and commit IDs. Full-suite failure or skipped critical coverage is not technical completion.
- Restore the known stale browser assertions to the accepted UI contract as bounded validation maintenance before requiring the full suite to gate new code. Preserve their useful layout/input behaviours with current selectors; never restore retired controls or count the failing baseline as green. Investigate the Nook total-budget timeout separately from a reproduced freeze.
- Each package starts on `agent/…`, opens a draft PR and records implementation evidence separately from human acceptance. No automatic production deployment.

## WP19A: persistence and truthful success feedback

Autonomy after plan approval: Green for the defined defect fix. Dependencies: none beyond current accepted baseline. Findings: A09/A10.

Scope:

- Catch storage access/read failures at a deliberate boundary and expose a typed recoverable outcome.
- Preserve valid existing data when storage is unavailable. Do not treat unreadable as empty or corrupt as permission to reset.
- Make purchase/collection/reward success depend on a committed save result. Inspect Bakery, Shop, Inventory, Shimmer, quest effects and home decoration callers.
- Emit success events exactly once after successful persistence; failed writes must not advance dependent quests or show a successful purchase.
- Retain authoritative checkpoint recovery and future-version protection. No save-schema redesign.
- Show concise retry/recovery feedback without leaking technical storage details into the child's normal flow.

Validation:

- Regressions for denied localStorage access/read, full quota, failed checkpoint write, valid checkpoint with failed primary write, corrupted primary with backup, future schema and failed new-game reset.
- Reproduce the three-Shimmer/Berry-Bun case: failure produces no purchased result, no inventory loss, no false balance, no quest event; retry after recovery succeeds once.
- Existing persistence and economy suites plus new event-order assertions; new/continue/redesign smoke.

Done when no caller reports committed success for a rejected write, normal saving remains compatible, and recovery never silently overwrites unreadable progress. Backout: revert package code; no migration required.

## WP18K: explicit ownership foundation

Autonomy: preserve its existing behaviour-preserving contract and visual regression gate. Findings: A01/A03/A08/A13/A14/A15.

Required map before deletion:

- Boot/scene loader owns readiness, registration and loading failure.
- Scene/modal lifecycle owns opening, pausing, input blocking, closing and cleanup.
- Existing HUD overlay remains owner of fixed navigation/counters/location.
- Creator will own its draft/category/layout, not world-wide coordinate repair.
- Interaction coordinator will own candidate selection and input dispatch.
- Conversation presenter will own speech/choices and engagement lifetime.
- Audio service will own playback and scene/context transitions.
- Domain services retain inventory, quests, presence and save authority.

Implementation boundaries:

- Enumerate each manager as retained domain owner, canonical presentation, transitional adapter or proven unused. List callers and lifetime; do not delete based on a name alone.
- Consolidate `main.ts`/BootScene setup and lazy-scene readiness without eagerly bundling everything.
- Preserve HUD camera isolation and Map clipping. Retire unused desktop shell and visual-only bridge candidates only after dependency proof.
- Replace repeated presentation reconciliation with component-owned redraw/dirty events where behaviour is already settled.
- Retain temporary adapters required by the not-yet-migrated creator/interactions, with removal assigned to WP19C/D/E rather than pretending they are already gone.
- Audit listener/tween/timer cleanup through enter/exit cycles. Keep regression tests for previous freezes.

Done when the ownership map is durable, deletions are justified, accepted visuals survive four-layout comparison and no threshold is weakened. Backout: revert consolidation commits independently of feature packages. Human gate: visual spot-check, not a fresh game-design approval.

## WP19B: world boundaries and tap-navigation parity

Autonomy: Green implementation, human collision visual check. Dependencies: WP18K lifecycle/map ownership. Findings: A06/A07/A16.

Scope:

- Reproduce Cottage/window/back-wall issue and capture the displayed art seam, sprite feet/body and world coordinates.
- Align physics blockers, tap-navigation map and occlusion with the intended floor boundary.
- Preserve approach positions for window, shelf, decoration slots and exit; validate diagonal movement and Gallop.
- Add the same tap-to-move capability to Crystal Grotto and Firefly Grove, using deliberate bounds/colliders rather than a generic empty map.
- Enumerate all explorable scenes and explicitly classify movement-supported versus intentionally static menu/interior screens.
- Recheck backward facing stability and stuck-target recovery without changing speed/race rules.
- Fix new-game active-location/Map/checkpoint disagreement; Map and Continue must identify the actual intended location while preserving old location-ID compatibility.

Validation: route every required approach with pad/keyboard/tap; wall rubbing and blocked taps; repeated enter/exit; occupied and empty decoration slots; save/continue spawn. Visually inspect the complete unicorn against the wall, not just collision-body coordinates.

Done when the user-reported wall area is inaccessible as floor, all required actions remain reachable and no explorable scene unexpectedly drops preferred tap movement. Backout: isolated geometry/navigation data and code revert, preserving saves.

## WP19C: progressive unicorn creator

Autonomy: Amber visual design. Dependencies: WP18K. Finding: A01.

Design:

- Landscape: large preview on the left; name and six clear categories on the right. Main, Colours, Mane & Tail, Horn, Markings, Accessories.
- Show only the selected category's options, with a visible selection and child-readable labels. Colours exposes body/eyes; Mane & Tail groups style and colour without stacking every option on one screen.
- Portrait: preview above a scrollable category area, with an accessible primary action. Name input stays visible when the keyboard opens; footer never covers options.
- Back, Randomise and Save/Start have consistent meaning. Keep reset/undo behaviour clear; randomise in edit mode should not unexpectedly rename the existing unicorn.
- Show the same appearance in preview and world. Fit the longest mane/tail/horn within the preview bounds. Preserve all current unlocked/owned cosmetics and IDs.

Implementation:

- Introduce a creator draft model and explicit control descriptors. The renderer reads draft state; controls update it through commands.
- Remove old-coordinate category capture, duplicate controls and rendered-scale selection inference when the new owner replaces them.
- Save once on explicit confirmation; Back/Cancel preserves original profile and adventure progress.
- Keep gameplay hotkeys disabled while typing, including E/S/Space/Enter as appropriate to name entry.

Validation: every option/category in new/edit mode; 16-character name, blank/whitespace normalisation, maximum preview extents, rapid changes, randomise/reset/cancel, keyboard focus, touch, rotation, soft keyboard and repeated scene entry. Compare saved appearance after continue.

Human gate: approve actual creator screenshots/interactive preview before adoption. Done when no overlap/hidden option exists across the matrix and the user can understand the path without a paragraph of instructions. Backout: creator-only revert; draft changes do not alter save schema.

## WP19D: one interaction route and reliable NPC engagement

Autonomy: Amber behavioural contract; implementation follows the approved rule. Dependencies: WP18K and WP19B navigation. Findings: A02/A03/A05/A06.

Registry contract:

- Each provider registers stable ID, semantic action kind, display name, live position, enabled/visible state, reachability/approach and activation callback/result.
- Scene coordinator chooses one eligible candidate and supplies both the visible action and optional direct-tap route. No parsing rendered text to discover an action.
- Prefer an explicitly tapped eligible target; otherwise select the nearest eligible target with deterministic ties and a small retention margin to avoid flicker between neighbours. Do not make a distant high-priority target steal a nearby action.
- Resolve/revalidate the target at activation. Despawn, scene transition or newly locked conditions invalidate it cleanly.
- Input is consumed once. Opening/closing dialogue cannot activate a second object with the same key/tap. Modal state suppresses background movement and interaction.

Migration inventory:

- Core scene targets; all supporting residents; depth objects; discoveries/secrets; story anchors; shop/interior doors; race starts; repeatable activities; home interactions.
- Enumerate every provider with old route, new route, tests and prompt removed. Remove `WORLD_INTERACTION_PROMPT` production use only after coverage is complete.
- World labels may name a character/place or give an authored clue; they must not repeat Talk/press E/tap instructions. Help retains input reference. Generic idle control guidance should be brief onboarding/Help, not permanent clutter.
- Preserve automatic region crossing. Doors that currently require activation remain explicit Enter actions. Do not silently change all gateways.
- Preserve direct tapping as a convenience using the same command; it is not a second visible instruction system. Out-of-range tapping should move to a valid approach where supported, then require the meaningful interaction action unless an established safe interaction flow already does otherwise.

NPC checks:

- Each applicable visible resident has one live interaction target that follows its actual body.
- Engaged NPC stops, faces the player and stays until close; no timeout resume while reading.
- Verify every supporting resident ID and every core role, especially Maple, Echo, Fern and Nova's race/picnic/cottage presence. Add presence authority only for actual conflicting roles.
- Normal movement resumes after close and survives scene leave/return; no duplicate bodies or lingering invisible hit zones.

Validation: two nearby targets, crossing moving residents, tapping during movement, double taps/key repeat, target despawn, modal close, scene return, quest state changes, one activation/event per input. Test with ordinary controls, not solely direct diagnostic callback invocation.

Done when all applicable interactions can be reached through the contextual button and legacy instruction labels have been removed at source. Backout: revert provider migrations with coordinator changes as one bounded package; never deploy a half-migrated state that removes labels but loses actions.

## WP19E: conversation and feedback system

Autonomy: Amber visual/child-reading gate. Dependencies: WP19D. Findings: A04/A08/A15.

Presentation types:

- Short conversation: compact cream/lavender card above the control safe area, portrait or recognisable character icon, name, short line and clear cross/Done. Remains until dismissed; no 2.6-second reading limit.
- Multi-line/quest conversation: same visual family, expands for text and choices; Continue advances, final acknowledgement closes. Choices use large separate buttons and never collide with body text.
- Outcome toast: nonessential collection/purchase/discovery acknowledgement, brief and queued/coalesced when several occur. Important progression detail remains in Book/quest state.
- Error/confirmation: explicit acknowledgement or choice; never disguised as a disappearing outcome toast.

Behaviour:

- Conversation lifetime controls the NPC pause and interaction lock. A short card does not require a full-screen dimmer merely because it contains speech.
- Allow manual close/back; suppress accidental click-through. Multi-step choice/effect execution stays in the existing dialogue/domain model.
- Use static readable text by default; any reveal animation must honour reduced motion and allow immediate reveal. Do not auto-advance speech.
- Keep the active speaker and relevant world visible where practical. Reflow portrait and long text instead of shrinking to fit.
- Preserve quest-gated lines, friendship variants, choice effects and re-talk after completion. No new real-time/AI-generated dialogue service.

Validation: single/long/multi-line speech, longest names, all choice counts in current content, rapid close/reopen, scene shutdown, NPC movement before/after, touch/keyboard, reduced motion, event exactly once and save/continue. Compare first Pip dialogue with a roaming resident and a quest hand-in.

Done when brief speech feels like the same game's conversations, can be read at the child's pace and cannot steal/double-trigger gameplay input. Human gate: actual compact and expanded examples. Backout: presenter/engagement revert preserving content and save semantics.

## WP19F: final UI consistency and generated home screen

Autonomy: Amber visual approval. Dependencies: WP19C/E; title composition can be prepared earlier. Findings: A11/A14/A15 and residual A01/A04/A08.

UI pass:

- Retain approved Bag/Map/Book/HUD structure, Map north/clipping, cross-only close targets and no Bag Shop shortcut.
- Apply canonical button/text-field/choice/empty/error/disabled states to Settings, shops, decoration, race entry/results, confirmations, title and creator.
- Resolve A17: the existing tablet Bag minimum-size check reports 36.288 CSS pixels against 40 at 1024×768. Inspect and correct actual category/close hit bounds within the accepted design; preserve minimum-size assertions.
- Use current canonical place/currency names. Preserve historical daughter wording in raw feedback while mapping it to the actual game name for tests.
- Rewrite unclear quest directions using named regions and visible landmarks. Optional Book help can say where a character currently is; avoid compulsory trails that remove exploration.
- Check semantic font roles, contrast, focus and readable hit targets in final rendered size. Inspect crowded states, not only empty bags.

Title artwork package within this work:

- Generate a beautiful warm storybook valley scene, consistent with existing unicorn character identity: inviting cottage, winding path, flowers, magical woodland and gentle rainbow/light. No unrelated expensive-3D redesign of the playable world.
- Compose landscape space for the menu and title, and produce an intentional portrait crop/variant so the subject is not cut off or hidden.
- Keep all text/logo/menu controls live above the image. Continue is primary when a valid save exists; New Game has the existing protection for overwriting progress; Settings and redesign/recovery paths stay available as appropriate.
- Prepare actual layout previews on all four classes. Visual approval applies to artwork plus live controls, not an isolated attractive background.
- Store one canonical original and normal binary production derivatives with dimensions/checksums and provenance. Use direct binary transfer; do not assemble many pasted Base64 fragments. Verify decode, dimensions and deployed loading. If direct transfer is unavailable, use one validated whole-file transfer path and checkpoint before proceeding.
- Optimise delivered dimensions/format, preload only the appropriate title derivative, retain a readable loading/failure fallback, and measure image decode/first-interaction impact.

Validation: fresh and returning title, image slow/failure path, correct crop, button contrast, new-game cancellation, creator return, populated Bag, settings scroll, shop sold/locked state, decoration selection, race results and modal stacking.

Done when actual screenshots show one coherent UI family and approved generated artwork; no hidden hit targets from retired controls remain. Backout: retain prior title asset/control implementation until acceptance; changes are presentation-only.

## WP19G: MP3 catalogue and playback foundation

Autonomy: Green implementation after approval; audio listening remains human validation. Dependencies: WP18K lifecycle ownership. Finding: A12.

User-facing folders:

- `public/audio/music/`: upload music MP3s. Optional region subfolders can organise a larger library.
- `public/audio/sfx/`: upload effects MP3s, including short interaction cues or ambience loops where assigned.
- `src/content/audioBindings.ts` (or an equivalently typed content manifest): agent-maintained mapping from stable track/cue IDs to files and game contexts.
- Generated build catalogue: discovered paths, version/hash and metadata used for validation/cache busting. A browser cannot rely on listing a static folder at runtime; scan at build time.

Workflow:

1. David adds MP3s to one of the two folders and commits them.
2. David names their intended use, for example “these three for Woods; this chime for the crystal”.
3. The agent validates files, inspects duration/size and updates explicit bindings/playlists in a normal PR.
4. Tests catch missing/renamed files, duplicate IDs and invalid mappings; unassigned files are reported without being automatically attached to random events.
5. A deployment includes the new catalogue/files. No runtime GitHub access or credentials are needed by the game.

Service design:

- One persistent audio owner; scene/modal changes send context intents rather than creating independent players.
- Stream long music through media elements routed to gain controls. Decode/cache short SFX with bounded memory/polyphony and reuse buffers. Do not decode the entire music library into memory on startup.
- Music contexts: title/creator, Glade/cottage, Village/interiors, Meadow, Brook/Grotto, Woods/Nook/Grove, Beach, races. Exact shared versus unique playlists depends on uploaded tracks.
- Shuffle without immediate repeats when multiple tracks exist; one-track and empty-playlist cases must work. Use deliberate fades between contexts and playlist tracks; bound simultaneous music voices to outgoing/incoming during a crossfade.
- Opening Bag/Map/Book/Settings does not restart the region track. Rapid scene changes cancel stale loads/fades. Returning from a race resolves the current world context.
- Preserve master mute and music/ambience/SFX switches. Add per-channel volume only with backwards-compatible preference normalisation; existing muted settings remain muted.
- Unlock audio from a real interaction; handle rejected play/resume promises. Suspend/pause on hidden/background state and resume only in line with user settings and browser permission.
- Missing/unsupported/corrupt audio must not block scene loading or freeze gameplay. Default silence is acceptable; never stack procedural and MP3 music accidentally.
- Retain the existing `playSfx`/NPC-reaction interface through an adapter while replacing the backend, then retire duplicate timer loops once covered.

Technical basis: browser autoplay can be blocked, so playback must handle rejection and interaction-based unlock. Media elements provide streaming, while short effects can be buffered. See [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) and [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

Validation: zero/one/many tracks; duplicate/missing paths; rename/remove; cached old filename; autoplay rejection; background/foreground; mute before unlock; channel changes; corrupt MP3; rapid A→B→A scene changes; modal cycles; bounded sources/cache after long play. Validate a small real MP3 fixture before claiming the system works; final bespoke music need not block engine completion.

Done when a newly committed test MP3 can be catalogued, explicitly mapped and played on the reference browsers without editing scene code. Backout: backend adapter switch/revert, retaining preference compatibility.

## WP19H: audio integration and authoring guide

Autonomy: Green bounded wiring; David approves subjective soundtrack/mix. Dependencies: WP19G and WP19D/E event semantics.

Scope:

- Wire existing SFX intents: UI select/back, Talk acknowledgement, collection, discovery, quest completion, friendship, doors, decoration, race countdown/go/jump/boost/impact/finish.
- Bind optional object sounds by stable interaction ID, for example a crystal note, mushroom cue or door creak. Trigger on successful action, not every frame near an object.
- Rate-limit repetitive effects and avoid double sounds from overlapping scene/event listeners. Keep speech cues quiet; duck music only where listening tests justify it.
- Separate ambience loops from one-shot effects, with clean start/stop ownership. Do not infer loop behaviour from the filename alone.
- Establish a gain/mix pass across uploaded files and inspect audible seams; do not promise gapless MP3 loops without testing the actual files.
- Write `docs/AUDIO-UPLOAD-GUIDE.md` with the two folders, naming examples, assignment examples, supported formats, useful track lengths, how to replace a file and how to report desired event bindings.
- Maintain a clear “missing final asset / fallback / assigned and tested” checklist. If no user music is supplied, complete and test infrastructure with a small fixture, leaving final selection explicit rather than claiming bespoke scoring complete.

Done when music persists across modals, changes correctly by context, effects fire once at the intended moment, mute always works and uploaded-file instructions require no code knowledge. Backout: mapping-only revert where possible; no game progress is affected.

## WP19I: integrated qualification

Autonomy: Green test/remediation within approved scope. Dependencies: WP19A-H and WP18K complete/accepted as applicable.

Required journeys:

- Fresh title → creator → Glade → Pip → first discovery → Book; return to title and Continue.
- Existing developed save → redesign/cancel/save → appearance in world with unchanged quests, money, items and decoration.
- All main regions and explorable interiors, normal entry/return, tap movement and each resident's applicable Talk route.
- Maple quest chain and bakery purchase feedback; Echo/Fern dialogue; Nova race/picnic/cottage presence transitions.
- Populated Bag in Beach, pocket scrolling, eat/use, quest-item protection, decoration place/remove and persisted quantities.
- Nook and Twinkle & Thread freeze regressions; repeated Bag/Map/Book/Settings open/close; Map panning/clipping and stable HUD during movement.
- Every race family, RUN/JUMP simultaneously, pointer cancel/blur/pause, results/retry/exit and rewards once.
- Short and quest dialogue, input suppression, NPC hold/resume, unlock/re-talk and scene exit during a conversation.
- Cottage boundary and all approach points, Grotto/Grove tap navigation, reverse-facing stability.
- Audio unlock, every channel, transitions, loops, missing file, background/return and sustained play.
- Save read/write failures, old/current/future saves, and retry without duplicate progression.

Evidence:

- Full core validation, complete serial Chromium suite and Chromium/Firefox/WebKit compatibility on the same candidate commit; list every skip and its relevance.
- Screenshot/geometry evidence for all four classes in representative crowded states; identify human visual acceptance separately.
- One sustained session comparable to the original hour-long playtest, observing resource/listener/object growth and responsiveness. Define starting save/route and compare early/late samples; do not infer a leak from one frame spike.
- No release-blocking defects remain. Any lower-priority exception has a named issue, impact, owner and explicit acceptance before readiness.
- Reconcile every feedback item to implemented/revalidate, verified, open or deferred, without rewriting original evidence.

Done when the candidate is technically qualified and the replay checklist is ready. This is not permission to mark WP18H or WP17 passed.

## WP18H and WP17: real acceptance

WP18H runs on the Samsung Galaxy Tab S8, landscape Chrome, substantially unguided. David records whether she can create/redesign, move and Gallop comfortably, find Maple, talk to moving residents, understand one-line speech, buy/use/decorate, race, recover from a menu and continue playing without freezes. Check phone portrait/landscape separately where relevant.

Preserve the positive signals: Fireflies, earning/spending, discovery, questing/unlocks, liked regions and choosing tap movement. Ask what she naturally chose to do rather than steering her towards a newly polished feature.

WP17 then receives David's explicit readiness decision. A technically green candidate with unresolved child comprehension remains in R6.5 remediation. Palace, deep gardening/cooking, new food powers and other R7 expansion do not start until that decision.

## Delivery and resumption

Current task is the audit/proposal package `R6.5-WP19-PLAN`, not a claim that WP19A-H have begun. After approval, record that decision, change the corresponding proposed package statuses to approved and set WP19A as next. Bounded WP19A-I files are already present under `docs/work-packages/`. Retain WP18K's existing contract with the narrowed foundation boundary described here. Each future package file must carry these dependencies, invariants, validation, backout and human gates.

Start command after approval: `Start R6.5-WP19A`.

If approval changes part of the proposal, update only that decision and dependent scope. Keep the audit findings and original feedback intact. Do not merge this proposal or deploy the game merely because the analysis is finished.

Publication authorisation: after the initial automatic review blocked publication, David explicitly approved the plan and the requested documentation push/draft PR on 8 September 2026. That publication restriction is resolved. Delivery details are recorded in STATUS.md.
