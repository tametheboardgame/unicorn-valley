# MG-WP1 Existing-Game Migration Closeout Audit

Date: 2026-10-03

Package: `MG-WP1 - Existing Game Migration to One Launch Contract`

Mini-game platform impact: **changed - all current catalogue families**

## Result

All seven current mini-game families now have their normal world entry routed through the MG platform launch/session contract.

The audit scanned the runtime owners under activities, scenes, racing, interaction, world and story for:

- direct mini-game scene registration;
- retired feature registration helpers;
- direct world launches of catalogue gameplay scenes;
- hard-coded return paths that would bypass `MiniGameSession`.

## Family status

### Rainbow Disc

World entry:

- Rainbow Meadow Match and Practice use `MiniGameLauncher`.
- The core interaction bridge uses the same launcher path.
- The platform is loaded lazily from the Meadow to avoid expanding the first-playable graph.

Gameplay lifecycle:

- `RainbowDiscActivityScene` reads `MiniGameSession`.
- Match/Practice are represented as catalogue variants.
- exit uses `returnFromMiniGame`.

Retired:

- `RainbowDiscActivityRegistration.ts`.

Intentional compatibility:

- the activity scene retains its old `returnScene` fallback only for direct legacy/test starts that do not provide a session.

### Pond Leap

World entry:

- `MeadowDepthWorldManager` uses `MiniGameLauncher`.
- reflection presentation data remains game-specific `sceneData`.

Gameplay lifecycle:

- `PondLeapActivityScene` reads `MiniGameSession`.
- exit uses `returnFromMiniGame`.

Retired:

- `PondLeapActivityRegistration.ts`.

Intentional compatibility:

- direct legacy/test starts may still supply `returnScene`.

### Sunbeam Chess

World entry:

- `VillageLifeWorldManager` uses `MiniGameLauncher`.
- the manager no longer imports or registers `ChessPlazaActivityScene`.

Gameplay lifecycle:

- `ChessPlazaActivityScene` reads `MiniGameSession`.
- exit uses `returnFromMiniGame`.

Intentional compatibility:

- direct legacy/test starts retain the existing return fallback.

### Wobbly Cake

World entry:

- `VillageInteriorScene` uses `MiniGameLauncher`.
- direct dynamic import and `game.scene.add` ownership were removed.
- world `quest` / `repeatable` mode remains game-specific scene data and world context.

Gameplay lifecycle:

- `MapleBakingActivityScene` reads `MiniGameSession`.
- exit uses `returnFromMiniGame`.

Preserved world behaviour:

- first-cake quest progression;
- repeat-bake Shimmer charge;
- incomplete-bake refund;
- cake result/progress recording;
- Shimmer payout.

Sandbox suppression of those writes belongs to MG-WP2 and was not introduced here.

### Coral Beachcombing

World entry:

- `RepeatableActivityEntryWorldManager` uses `MiniGameLauncher`.
- direct activity import/registration was removed.
- the existing beach unlock/quest gate remains unchanged.

Gameplay lifecycle:

- `CoralBeachcombingActivityScene` reads `MiniGameSession`.
- exit uses `returnFromMiniGame`.

Preserved world behaviour:

- trail selection;
- notebook progress/result recording;
- existing availability rules.

Sandbox suppression belongs to MG-WP2.

### Firefly Lantern

World entry:

- `FireflyLanternWorldManager` uses `MiniGameLauncher`.
- world return is represented as `WhisperingWoodsScene / start`, preserving the existing start-away-from-Woods lifecycle.
- the shared launcher now owns caller `pause` versus `stop` from the return mode.

Gameplay lifecycle:

- `FireflyLanternScene` reads `MiniGameSession`.
- Retry and Choose Game preserve the current session across `scene.restart`.
- Back/Escape use the shared return contract.
- player-facing return copy is session-aware.

Preserved world behaviour:

- current mode/difficulty selection;
- attempt recording;
- milestones/unlocks;
- best scores.

Sandbox suppression belongs to MG-WP2.

Intentional compatibility:

- a direct legacy/test start with no session still returns to Whispering Woods exactly as before.

### Rainbow Run Racing

Catalogue family:

- Sunrise Sprint;
- Petal Parade;
- Crystal Cascade;
- Mooncap Trail;
- Shoreline Surge.

World entry:

- Sunrise Sprint from `RainbowRunEntryScene` uses `launchRainbowRunRace`.
- Petal Parade, Mooncap Trail and Shoreline Surge use the same adapter from `R65RaceExpansionWorldManager`.
- the Rainbow Cup callback uses the same adapter and can launch all five regular courses, including Crystal Cascade.
- the dedicated Crystal Cascade gateway in `R5RegionGatewayManager` now uses the same adapter.

Adapter behaviour:

- preserves `selectRaceCourse`;
- preserves `RaceReturnContext` as a temporary compatibility source for existing presentation/labels;
- creates the canonical `MiniGameSession`;
- returns through an explicit `start` target matching the existing world lifecycle.

Gameplay lifecycle:

- `RaceScene` reads `MiniGameSession`.
- a catalogue course variant selects the active course when the scene starts.
- Race Again preserves the session.
- exit labels resolve from the session first.
- exit uses `returnFromMiniGame`.
- Crystal Cascade returns directly to Crystal Brook.
- existing race result/progression writes remain unchanged for world play.

Story exclusion:

- `NovaTutorialRaceScene` remains story-owned and is not a separate catalogue game.

Intentional compatibility:

- `RaceReturnContext` remains in place for old direct/test starts and existing race presentation code during MG-WP1.
- direct legacy/test `RaceScene` starts still fall back through the prior return registry.
- removal or narrowing of these adapters may be considered after MG-WP3/Just Games proves no remaining consumer needs them.

## Direct-registration audit

No catalogue world entry now owns gameplay registration with a direct `game.scene.add`.

The only relevant `game.scene.add` found by the audit is the canonical runtime registration inside `SceneManifest.ensureSceneRegistered`.

Non-mini-game registration still exists for unrelated features such as the Notice Board and Starlight Beach registration helper; those are outside MG-WP1 scope.

## Direct-launch audit

No normal world entry for a catalogue mini-game directly starts/launches:

- `RainbowDiscActivityScene`;
- `PondLeapActivityScene`;
- `ChessPlazaActivityScene`;
- `MapleBakingActivityScene`;
- `CoralBeachcombingActivityScene`;
- `FireflyLanternScene`;
- regular-course `RaceScene`.

Remaining references are intentional:

- gameplay scene constructors/keys in `SceneManifest`;
- startup registration for Firefly/Race;
- scene-internal legacy return fallback;
- Boot/debug route mappings;
- diagnostic/playtest/recovery managers that observe a race or return from one rather than launch normal world gameplay;
- Nova's separate story tutorial.

## Loading finding

During MG-WP1A, a static MG import from Rainbow Meadow caused a measurable bundle split regression: an extra JavaScript chunk appeared.

The Meadow path was changed to lazy-load `MiniGameLauncher`, restoring the intended optional-game loading boundary.

Final validation must continue to compare the current branch performance report with the MG-WP0/main baseline; any new initial-graph or chunk-count regression attributable to MG-WP1 must be fixed before approval.

## Compatibility adapters intentionally left for MG-WP2/MG-WP3

The migration deliberately does **not** delete all old data shapes yet.

Retained compatibility includes:

- optional `returnScene` data on simple activity scenes;
- Firefly's no-session Woods fallback;
- `RaceReturnContext` for legacy/test callers and presentation compatibility;
- normal world progress/reward writes.

These do not own normal world launch anymore.

MG-WP2 will add context-sensitive sandbox side-effect isolation. MG-WP3 will provide the visible Just Games caller and will prove the shared session/return contract from the second entry surface.
