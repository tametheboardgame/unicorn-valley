# MG-WP0 Current Mini-Game Launch Audit

Date: 2026-10-03

Package: `MG-WP0 - Mini-Game Platform Foundation`

Mini-game platform impact: **platform foundation**

## Purpose

Record the pre-migration launch, registration, return and persistence ownership of every current mini-game family before MG-WP1 changes world callers or gameplay scenes.

This audit is descriptive. Existing world behaviour remains the accepted baseline until a later MG package explicitly migrates it.

## Current family inventory

### Rainbow Disc

Canonical gameplay scene:

- `src/game/activities/RainbowDiscActivityScene.ts`

Current registration/launch path:

- scene is already represented in `SceneManifest` as on-demand;
- `RainbowDiscActivityRegistration.ts` independently lazy-imports and registers the same scene;
- Rainbow Meadow calls that feature-specific helper for Match and Practice.

Current return model:

- scene receives `returnScene`;
- exit stops the activity and resumes/starts that scene.

Current durable side effects:

- no normal economy/progression loop.

MG migration:

- retire the duplicate registration helper after the generic launcher owns manifest-backed loading;
- map Match/Practice to catalogue variants;
- consume `MiniGameSession` for return.

### Sunbeam Chess

Canonical gameplay scene:

- `src/game/activities/ChessPlazaActivityScene.ts`

Current registration/launch path:

- historically registered outside the canonical manifest route by its world integration;
- MG-WP0 now adds the stable scene key to `SceneManifest` as on-demand so later migration has one loading authority.

Current return model:

- scene receives `returnScene`;
- exit stops the activity and resumes/starts that scene.

Current durable side effects:

- none required for ordinary chess play.

MG migration:

- move world launch to `MiniGameLauncher`;
- consume `MiniGameSession`;
- preserve the Sunbeam chess plaza as the physical world wrapper.

### Pond Leap

Canonical gameplay scene:

- `src/game/activities/PondLeapActivityScene.ts`

Current registration/launch path:

- `PondLeapActivityRegistration.ts` owns a separate lazy import/registration path;
- MG-WP0 now adds the stable scene key to `SceneManifest` as on-demand.

Current return model:

- scene receives `returnScene`;
- exit stops and resumes/starts the caller.

Current contextual input:

- `discoveredReflection` affects presentation.

Current durable side effects:

- no ordinary economy/progression write inside the activity scene.

MG migration:

- route `discoveredReflection` as game-specific launch data alongside the shared session;
- retire the separate registration helper;
- preserve the Meadow world interaction.

### Wobbly Cake

Canonical gameplay scene:

- `src/game/activities/MapleBakingActivityScene.ts`

Current registration/launch path:

- scene is already present in `SceneManifest`;
- `R6VillageInteriorScene` nevertheless directly lazy-imports, registers and launches it.

Current return model:

- receives `returnScene`;
- supports world modes `quest` and `repeatable`.

Current durable side effects:

- accepted Maple/Marigold quest integration;
- repeat baking can spend Shimmer;
- accepted reward/progression behaviour must remain unchanged for world sessions.

MG migration:

- remove caller-owned scene registration;
- model quest/repeatable world context separately from the player-facing Just Games catalogue;
- add a sandbox practice path before Just Games exposure so no Shimmer or world progress is changed.

### Firefly Lantern

Canonical gameplay scene:

- `src/game/scenes/FireflyLanternScene.ts`

Current registration/launch path:

- startup scene;
- world/story integration launches it directly.

Current return model:

- return is Woods-specific inside the scene rather than caller/session driven.

Current durable side effects:

- activity attempts/milestones are recorded through Firefly progress services;
- modes may unlock through world activity progress.

MG migration:

- preserve current world progress;
- move return ownership to `MiniGameSession`;
- suppress milestone/unlock persistence for sandbox sessions;
- catalogue Normal, Multicolour and Endless as one family with variants.

### Coral Beachcombing

Canonical gameplay scene:

- `src/game/activities/CoralBeachcombingActivityScene.ts`

Current registration/launch path:

- on-demand manifest scene;
- world integration remains beach/activity specific.

Current return model:

- receives `returnScene`;
- returns to Starlight Beach by default.

Current durable side effects:

- repeatable activity/collection result integration exists outside the generic MG boundary.

MG migration:

- launch through the shared launcher;
- preserve world collection/reward behaviour;
- suppress adventure collection/reward writes in sandbox.

### Rainbow Run Racing

Canonical gameplay runtime:

- `src/game/scenes/RaceScene.ts`;
- `NovaTutorialRaceScene.ts` remains a story/tutorial wrapper using the racing domain.

Current registration/launch path:

- race scenes are startup registered;
- world/race hub systems use specialist race launch and return context.

Current return model:

- `RaceReturnContext` owns race-specific return semantics.

Current durable side effects:

- race results, ribbons/rewards and Rainbow Cup progress are established world systems.

MG migration:

- treat the five regular courses as variants of one **Rainbow Run Racing** catalogue family;
- keep Nova's tutorial out of the Just Games catalogue;
- adapt the specialist return context behind the shared session contract rather than duplicating race runtime;
- prevent race/Cup/world reward writes in sandbox.

## Cross-cutting findings

The current portfolio has four different architectural patterns:

1. manifest-backed on-demand scene plus duplicate feature registration;
2. feature-only registration outside the manifest;
3. manifest-backed scene plus caller-owned direct dynamic registration;
4. startup scene with bespoke return/progression conventions.

MG-WP0 establishes the common target without changing accepted gameplay:

- one catalogue;
- `SceneManifest` as the only constructor/load authority;
- one normalised session;
- one generic launcher/return boundary;
- one explicit world-versus-sandbox side-effect gate.

MG-WP1 then migrates existing callers/scenes. MG-WP2 completes game-specific sandbox isolation. Only after those are safe does MG-WP3 expose the full Just Games launcher UI.
