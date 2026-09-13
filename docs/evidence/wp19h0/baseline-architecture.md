# WP19H0 H0A baseline architecture

## Provenance and limits

This is evidence for **H0A only**. It describes production source checkpoint
`97167f6b78913c16012f636b5733d04e3e7bff41`, whose parent is verified main
`ba60ede9ba8697f6015bfb3d79e98152a972403d`. H0A changes evidence, reporting
tooling and durable state only; it does not change production registration,
loading, UI, saves, budgets, tests or CI behaviour.

The exhaustive file-level companion is
`architecture-test-inventory.json`: 35 scene implementations/shared scene bases,
88 manager/service/coordinator/presenter owners and 192 test files. Counts describe
files/implementations, not unique runtime keys (both village-interior implementations
declare `VillageInteriorScene`).

Commands used for the inventory included:

```sh
find src/game -type f \( -name '*Manager.ts' -o -name '*Service.ts' -o -name '*Coordinator.ts' -o -name '*Presenter.ts' \) | sort
rg "super\(\{ key:|super\(['\"]" src/game/scenes src/game/activities src/game/ui/ExplorationHudOverlayScene.ts
rg -n "scene\.(start|launch|switch|run|add|stop|sleep|wake|pause|resume)\(" src/game src/main.ts
find src tests -type f \( -name '*.test.ts' -o -name '*.spec.ts' \) | sort
```

## Composition root and lifetime ownership

`src/main.ts` is the browser composition root. It imports global CSS, patches
core interaction prototypes, constructs `Phaser.Game(gameConfig)`, conditionally
loads diagnostics, creates 12 synchronous game-wide owners, schedules three modal
scenes and five micro/interior scenes for registration, then schedules 24 further
presentation/content/population/world managers. Two coarse-pointer managers are
loaded only when their media/capability query matches.

The practical lifetime groups are:

- **Phaser game lifetime:** `CoreSceneInteractionBridge`,
  `WorldInteractionCoordinator`, `LegacyWorldFeedbackMigrationManager`,
  `ClickToMoveManager`, `ContinueRestoreManager`,
  `LandscapeCreatorProgressiveManager`, `TitlePortraitControlsManager`,
  `ExplorationGeometryPresentationManager`, `ExplorationPathPolishManager`,
  `WorldLayerAlignmentManager`, `R5FinalTighteningManager` and
  `VillageInteriorContractManager`. Their getters are called directly after game
  creation and their modules are part of the static entry graph.
- **Game-lifetime, asynchronously installed immediately:** exploration shell,
  modal/portrait/desktop presentation; economy/repeatable activity; village,
  glade, cottage, meadow, brook and woods content depth; population/collision;
  quest packs and follow-ups; beach/race/mane/experience presentation; gateway,
  final-cleanup and graphics managers. Dynamic chunks do not imply optional runtime
  ownership: these imports execute during bootstrap without awaiting a player action.
- **Capability-conditional game lifetime:** creator portrait and race mobile
  controls. Diagnostics is query-conditional (`?diagnostics=1`) and test tooling,
  not production ownership.
- **Scene/feature-owned:** the remaining services/managers in the machine inventory
  are constructed by scenes, other managers or browser singleton modules. Examples
  are `SaveService`/`browserSaveService`, `AudioWorldManager`, discovery/story
  services, `RacePlayerControlManager` and `WorldFeedbackPresenter`.

Most world managers subscribe to Phaser scene lifecycle events and keep per-scene
state, but the manager instance itself lives for the game. This mixed app-wide
observer/scene-scoped-state pattern is a principal H0B/H0J seam; H0A does not alter it.

## Scene catalogue and registration

### Static registration

`gameConfig.scene` registers, in order: Boot, Preload, Title, three test/dev scenes
(Resize, Movement and Dialogue), Moonflower Glade, Cottage Interior/Decorate,
Moonflower Patch, Sunbeam Village, Rainbow Meadow, Crystal Brook, Whispering Woods,
Firefly Lantern, Rainbow Run Entry, Nova Tutorial Race, Race, Pip Egg Hatch,
Doorway Stub and Unicorn Creator. Because all are static imports, Title and the
normal new-game first playable are in the initial dependency graph.

### Runtime registration

- `src/main.ts` immediately imports/registers Inventory, Wonderbook and Shop, plus
  the alternative `R6VillageInteriorScene`, Hollow Tree Nook, Windmill Lookout,
  Crystal Grotto and Firefly Grove.
- Settings is registered on demand by `AudioSettingsPanel` and portrait presentation.
- Starlight Beach is registered by `StarlightBeachSceneRegistration` through its
  gateway/continue owners.
- Maple Baking and Coral Beachcombing are registered by
  `RepeatableActivityEntryWorldManager` when entered.
- `ExplorationHudOverlayScene` self-registers through its overlay installer.

The full classification is machine-readable. In summary: 3 bootstrap/title, 7
main exploration areas (plus Moonflower Patch), 7 interior/micro-location
implementations, 5 modal/HUD surfaces, 6 races/minigames/activities, 2
creator/onboarding scenes and 3 explicit test/dev scenes. The
`InteractiveMicroLocationScene` base is shared composition, not a registered scene.

### Title-to-first-playable path

1. `BootScene` installs browser save/settings/audio prerequisites and starts
   `PreloadScene`.
2. `PreloadScene` loads required assets and starts `TitleScene` by default.
3. New Game starts `UnicornCreatorScene`; creator completion persists the chosen
   profile and starts `MoonflowerGladeScene`.
4. Continue uses `ContinueLocation.resolveContinueDestination`; title starts the
   resolved scene. Starlight Beach is the only destination explicitly marked lazy.
5. Exploration modal controls launch/pause Inventory, Wonderbook or Settings and
   resume/stop on close. Shops and repeatable activities use the same return-scene
   payload pattern.

### Transition edge groups

- **Bootstrap:** Boot -> Preload -> Title.
- **Onboarding:** Title -> Creator -> Moonflower Glade; creator edit/cancel -> Title.
- **Core world:** Glade <-> Cottage; Glade <-> Village; Village <-> Meadow; Meadow
  -> Brook; world traversal/gateway managers connect Brook, Woods and Beach.
- **Optional interiors:** Glade <-> Hollow Tree; Meadow <-> Windmill; Brook <->
  Crystal Grotto; Woods <-> Firefly Grove; Village <-> Village Interior.
- **Activities/modes:** Meadow -> Rainbow Run Entry -> tutorial or Race -> Meadow;
  Woods -> Firefly Lantern -> Woods; Village Interior launches Maple Baking;
  Beach launches Coral Beachcombing.
- **Story mode:** `PipEggWorldManager` starts Pip Egg Hatch, which returns to the
  Cottage.
- **Modals:** exploration -> Inventory/Wonderbook/Settings, village interior ->
  Shop; the parent is paused and then resumed where still active.
- **Test-only:** Resize, Movement and Dialogue test scenes return to Title;
  diagnostics may directly stop/start an allow-listed scene.

Dynamic target edges are backed by interaction definitions and gateway managers,
so the `rg` transition command above is the authoritative caller-level evidence;
the groups here intentionally do not pretend every dynamic edge is a string literal.

## Persistence and save-sensitive identities

`SaveService` is the transaction/migration owner; `SaveRepository` owns storage and
`browserSaveService` composes the browser singleton. The current schema is version 2.
Primary storage is `unicorn-valley.save`, with repository-owned backup/checkpoint
keys. `createDefaultSave`, `saveMigrations` and the schema interfaces own defaults,
migration and the persisted profile, inventory, relationships, quests, world, home,
activities and collections records.

`ContinueLocation` is the save-location-to-scene boundary. Save-sensitive scene
keys are `CottageInteriorScene`, `MoonflowerGladeScene`, `SunbeamVillageScene`,
`RainbowMeadowScene`, `CrystalBrookScene`, `WhisperingWoodsScene` and
`StarlightBeachScene`. Save-sensitive location IDs are
`moonflower-cottage`, `location:moonflower-glade`, each map module's exported region
ID and `location:starlight-beach`. Unknown IDs deliberately fall back to Moonflower
Glade. Return payloads (`returnScene`, positions/arrival state) are navigation state,
not persisted scene renames; they remain compatibility-sensitive.

## Cross-cutting subsystem ownership

| Concern | Current primary owner(s) | Important coupling/lifetime observation |
| --- | --- | --- |
| Interaction | `WorldInteractionCoordinator`, `CoreSceneInteractionBridge`, `SceneInteractionRegistry`, `InteractionModalState` | Coordinator is canonical input/target path; bridge still captures/disables legacy scene activators. |
| Conversation | `WorldConversationPresenter`, `DialogueSession`, `DialogueCard`, dialogue effects | Entered through coordinator; modal state covers conversation lifetime; older scene/presenter feedback remains alongside it. |
| Audio | `AudioWorldManager`, `VerticalSliceAudio`, `AudioSettings`/`GameSettingsModel`, content audio bindings | App/scene context and persisted settings; Settings DOM inputs are positioned by a separate overlay manager. |
| Navigation | scene interaction results, `R5RegionGatewayManager`, `R65StarlightBeachGatewayManager`, `WorldTraversalPolishManager`, `ContinueRestoreManager`, `WorldArrivalState` | Scene keys, location checkpoints, arrival side/position and modal return payloads jointly define the contract. |
| HUD/shell | `ExplorationShell`, `ExplorationShellWorldManager`, `ExplorationHudOverlayScene`, `PortraitConceptPresentationManager` | Canvas landscape shell, overlay scene and portrait DOM shell overlap by display mode. Cleanup managers suppress scene-owned legacy copy. |
| Input | `InputController` adapters, scene controllers, `ClickToMoveManager`, `TouchMovementPad`, `WorldInteractionInput`, race/mobile managers | Keyboard/pointer/touch converge incompletely; coordinator consumes action input while legacy activators are patched. |
| Persistence | `SaveService`, `SaveRepository`, `browserSaveService`, `ContinueLocation`, checkpoint helpers | Versioned, write-ahead checkpointed browser storage. IDs above are frozen. |

## Recurring UI inventory

There are two canvas style sources (`uiTheme.ts` and `ConceptUi.ts`) plus global and
feature CSS. Repeated implementations are:

- **Buttons/actions:** Concept UI buttons; scene-local rectangles/text and invisible
  hit areas; Exploration Shell navigation/action controls; creator landscape cards;
  title controls; portrait HTML buttons; race HTML buttons; activity buttons.
- **Panels/cards:** Concept panels; `DialogueCard`; `ActivitySuggestionCard`;
  `ItemCard`; scene-local modal panels in Inventory, Wonderbook, Shop, Settings and
  creator; `PortraitModalCompanion` HTML articles.
- **Dialogue/messages/notices:** `WorldConversationPresenter` + `DialogueCard`;
  `WorldFeedbackPresenter`; `RewardFeedback`; discovery/activity notices; scene-local
  fixed text. `LegacyWorldFeedbackMigrationManager` still scans and translates known
  legacy top feedback.
- **Scroll views:** Inventory, Wonderbook and Settings each own canvas clipping,
  mask/scroll bounds and input handling; portrait companions use browser scrolling.
- **Settings controls:** canvas rows/backgrounds in `SettingsScene`, native range and
  select controls in `SettingsAudioControlsManager`, and distinct title/portrait
  settings actions.
- **Close/back:** repeated glyph text/rectangle/hit-area controls across modal scenes,
  activity scenes and creator, with separate DOM buttons in portrait/race views.

These are near-duplicate families, not proof that every instance is semantically
interchangeable. H0C must preserve touch targets, focus, modal locking and the
approved visual language rather than mechanically replacing them.

## DOM overlays and canvas synchronisation

| Overlay | Host and synchronisation |
| --- | --- |
| Creator name input/rename | `UnicornCreatorScene` appends native input/button and repeatedly converts logical coordinates using canvas/container `getBoundingClientRect`, `scaleX/scaleY`, visibility and scene lifecycle. |
| Portrait creator | `CreatorPortraitControlsManager` appends a full semantic section to `#game-shell`, mirrors scene/model state, and hides scene-native input; CSS/media queries own layout. |
| Portrait exploration | `PortraitConceptPresentationManager` appends metadata/navigation to `#game-shell`, mirrors active scene and launches modals; CSS owns portrait placement. |
| Interaction prompt/touch pad | `InteractionPrompt` and `TouchMovementPad` append semantic buttons to `#game-shell`; manager refresh and responsive CSS determine visibility/mode. |
| Race mobile controls | `RaceMobileControlsManager` positions its root from `canvas.getBoundingClientRect()` on refresh/resize and owns pointer/keyboard-safe buttons. |
| Settings audio | `SettingsAudioControlsManager` creates native range/select elements, calculates scale from canvas dimensions/offsets and target Phaser rectangles, and updates position/visibility against Settings scroll clipping. This is the key bespoke bridge regression case. |
| Title portrait | `TitlePortraitControlsManager` appends to `document.body`, mirrors title/settings actions and loads feature CSS; media queries own visibility/layout. |
| Portrait modal content | `PortraitModalCompanion` appends semantic articles/actions to `#game-shell` and mirrors the active canvas modal model. |

No single overlay host owns coordinate conversion, clipping, z-order, focus and
teardown for all of these paths.

## Import/loading and bundle baseline

The entry imports Phaser, global CSS, `gameConfig` and 12 synchronous owners.
`gameConfig` statically imports all of the bootstrap/title/new-game scenes plus most
core regions and modes. Consequently the initial, title and normal new-game
first-playable **static dependency closures are identical** in the Vite manifest.
The entry then schedules most optional managers/scenes immediately; their chunks are
lazy in the static graph but generally requested during startup rather than at feature
entry. True conditional chunks are diagnostics, creator portrait and race mobile.
Settings and Starlight Beach are feature-demand registered, while several other
optional regions are imported at bootstrap for registration.

Reproduction (Node `v20.20.2`, npm `11.4.2`; locked Vite `8.2.0`, TypeScript `7.0.2`,
Playwright `1.55.0`, Linux x64):

```sh
npm ci
npm run build -- --manifest
BASELINE_SOURCE_COMMIT=97167f6b78913c16012f636b5733d04e3e7bff41 node scripts/architecture/reportWp19h0Bundle.mjs
npm run perf:budget
```

The committed raw report records 81 JavaScript chunks. Entry is 471,915 raw bytes
(460.9 KiB) / 126,296 gzip bytes. Initial/title/first-playable static closure is
1,976,435 raw / 523,453 gzip bytes (1,930.1 / 511.2 KiB). Total emitted JavaScript is
2,363,797 raw / 666,008 gzip bytes (2,308.4 / **650.398 KiB**). This reproduces the
inherited failure by 408 bytes (0.398 KiB) against the unchanged 665,600-byte/650 KiB
ceiling, while entry remains visibly below the unchanged 532,480-byte/520 KiB raw
metric. Per-file gzip uses Node `zlib.gzipSync`; sums therefore represent independent
HTTP objects, not concatenated gzip.

The largest emitted chunks by gzip are Phaser (355,968 bytes), entry (126,296),
registries (11,333), Woods depth content (8,306), Wonderbook (7,998), R6 village
interior (7,455) and Inventory (7,343). See `baseline-bundle.json` for every chunk,
manifest key and entry dynamic import.

Static bytes are **not startup timing**. A local build took approximately 3.44 seconds
after install, but that is compiler/build timing. No stable device/network
title-to-first-playable runtime trace existed at the checkpoint; H0A therefore does
not invent one. The immutable deployment smoke demonstrates functional startup/save/
reload/Continue, not a calibrated startup-performance measurement.

## Actions and test baseline

`ci-timing-baseline.json` preserves REST job/step timestamps and exact URLs. On this
branch checkpoint, CI run 34752197513 queued for 2 s and executed Validate for 26 s;
performance failed and all browser jobs were skipped. Contract run 34752197585 queued
3 s/executed 8 s. Immutable smoke 34752197603 queued 3 s/executed 61 s. Main run
34751746051 and audio-merge run 34750494708 fail at the same inherited performance
step, so this is not an H0A regression.

For before-state full-suite shape, successful run 34744288460 has Validate 28 s,
Chromium shards 1/2/3 at 521/944/978 s and compatibility at 485 s (about 16m49s
workflow wall time). Run 34718929375 independently records 27 s, 610/969/1003 s and
411 s. Queue time was only 2–3 s in those samples. These are different preceding
commits and are timing context, not qualification of checkpoint `97167f6`.

The inventory contains 120 unit files and 72 browser files (71 play + 1 deployment).
Largest unit groups are world and racing (16 each), save/story (11 each), input (9),
then discovery/economy/home/player/population (4 each). Browser filenames largely
encode delivery history rather than stable subsystem ownership.

The approximate contract classification marks save/Continue/navigation/core input
as critical product contracts, unit subsystem tests as feature contracts, visibly
layout-oriented browser files as visual/layout contracts and remaining WP browser
files as historical regressions. Six files have obvious coordinate/index sensitivity
in static inspection (listed in the machine inventory), including repeatable activity,
Wonderbook, portrait modal, Bag/Map, device hardening and a title child-list assertion.
This is a review queue, not authority to delete or rewrite tests in H0A.

No active `fixme` exists. Two deliberate `test.skip` guards are capability/viewport
conditions, not observed flakes. The long race/browser shard spread and explicit
software-renderer timeouts are environmental sensitivity; the two successful full
runs did not expose a failing flake. Failed current runs stop before browser execution,
so they provide no current-sha flake rate.

## Reproduction and hand-off

H0A acceptance is evidence readiness, not whole-package qualification. Re-run the
bundle command with the recorded source checkpoint, validate JSON/docs, and compare
the resulting byte fields. Work must inspect this evidence before dispatching H0B.
H0B–H0K remain unstarted and all human/production gates remain closed.
