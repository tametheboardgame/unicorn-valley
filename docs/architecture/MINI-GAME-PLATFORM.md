# Mini-Game Platform Architecture

Status: **proposed architecture under the accepted MG programme direction**

Programme: **MG - Mini-Game Development**

Canonical roadmap: `MINIGAMES-ROADMAP.md`

## 1. Architectural objective

Unicorn Valley must support mini-games as reusable game modules rather than scene-specific features.

A mini-game must be authorable once and usable from:

- a physical place or story context in the main world; and
- the **Just Games** catalogue on the home screen.

Neither entry surface owns the game.

The world owns physical placement, narrative context and normal progression integration. Just Games owns discovery/browsing of games outside the adventure. The mini-game platform owns catalogue identity, loading, launch context, lifecycle/return and context-safe outcome handling.

## 2. Core invariants

1. **One game, one implementation.** Never create a second gameplay scene or copied ruleset for Just Games.
2. **One stable ID.** Every mini-game family has a stable `MiniGameId`.
3. **SceneManifest remains the scene authority.** The mini-game catalogue is not a second scene registry.
4. **Caller-independent gameplay.** A mini-game must not assume it was launched by a particular world scene or by the title screen.
5. **Context-aware outcomes.** World sessions may use normal progression/rewards. Just Games sessions are sandboxed by default.
6. **Return is data, not hard-coded navigation.** The launcher supplies the return contract.
7. **World placement is optional metadata, not gameplay ownership.** A Just-Games-first game may be `world-unplaced` and later gain a physical world entry without changing its game loop.
8. **Catalogue exposure is automatic-by-contract.** A new world mini-game is not complete until it is represented in Just Games.
9. **Touch is first-class.** Every catalogue game must remain usable on the supported landscape tablet/mobile surfaces.
10. **No roadmap exemption by naming.** A bounded repeatable playable activity is subject to this contract even if a package calls it an “activity”, “challenge” or “sport”.

## 3. Ownership map

### `src/game/scenes/SceneManifest.ts`

Remains authoritative for:

- Phaser scene key;
- scene category;
- loading boundary;
- registration owner;
- lazy scene constructor loading.

The MiniGame platform must not create a separate constructor registry.

All mini-game gameplay scenes must appear in the manifest using the appropriate existing scene category, normally `activity` or `race`.

Optional mini-games should normally be on-demand unless there is a measured reason to keep them eager/startup.

### `src/game/minigames/MiniGameCatalogue.ts`

Proposed canonical owner for:

- stable mini-game family IDs;
- player-facing title and short catalogue description;
- catalogue ordering/grouping;
- scene key reference;
- supported player-selectable variants;
- Just Games visibility;
- world placement state (`placed` or `unplaced`);
- sandbox policy declaration;
- optional capability metadata used by tests/launcher.

It must contain metadata and capability declarations only. It must not import or construct scene classes.

### `src/game/minigames/MiniGameLauncher.ts`

Proposed canonical owner for:

- validating a launch request;
- ensuring the manifest-backed scene is available through the canonical scene loading path;
- creating a normalised session context;
- pausing/suspending the caller where appropriate;
- launching/bringing the game scene to the correct depth;
- coordinating normal return to the caller;
- handling failed lazy loads cleanly and retryably.

World scenes and Just Games should call this owner rather than performing direct `import()`, `game.scene.add()`, `scene.launch()` sequences independently.

### `src/game/minigames/MiniGameSession.ts`

Proposed types/value object for immutable launch context.

Conceptual shape:

```ts
type MiniGameLaunchSource = 'world' | 'just-games';

interface MiniGameReturnTarget {
  sceneKey: SceneKey;
  mode: 'resume' | 'start';
  payload?: unknown;
}

interface MiniGameSession {
  gameId: MiniGameId;
  source: MiniGameLaunchSource;
  variantId?: string;
  returnTarget: MiniGameReturnTarget;
  sideEffectPolicy: 'world' | 'sandbox';
  worldContext?: {
    locationId?: string;
    interactionId?: string;
    questContext?: string;
  };
}
```

Exact field names may be refined during MG-WP0 implementation, but the semantic boundary is fixed: gameplay reads one normalised session instead of ad hoc `returnScene` fields and caller-specific flags.

### `src/game/minigames/MiniGameOutcomeGateway.ts`

Proposed canonical owner for context-sensitive durable effects.

A game reports outcomes through this boundary when the outcome could affect persistent adventure state.

In a `world` session, the gateway may delegate to existing domain services for:

- rewards;
- inventory;
- Shimmer;
- activity progress;
- race results;
- quest/story effects;
- world flags;
- collections.

In a `sandbox` session, the gateway must reject/suppress adventure progression side effects by default.

The platform should not replace existing economy, quest, save or race domain services. It decides whether a mini-game session is allowed to call them.

## 4. Catalogue contract

Conceptual definition:

```ts
interface MiniGameDefinition {
  id: MiniGameId;
  sceneKey: SceneKey;
  title: string;
  description: string;
  group: 'sport' | 'puzzle' | 'making' | 'exploration' | 'race' | 'other';
  order: number;
  variants: readonly MiniGameVariantDefinition[];
  justGames: {
    visible: boolean;
    availability: 'always' | 'explicit-unlock';
  };
  world: {
    placement: 'placed' | 'unplaced';
  };
  sandbox: {
    sideEffects: 'none' | 'isolated-records';
  };
}
```

The definition is intentionally not allowed to contain world coordinates, NPC references, quest scripts or scene constructors.

Those concerns remain with their existing owners.

## 5. Game family versus variant

The catalogue represents a player-recognisable game family.

Examples:

- **Rainbow Disc** is one family with `match` and `practice` variants.
- **Rainbow Run Racing** is one family with multiple courses and a course selector.
- **Firefly Lantern** is one family with its supported modes/difficulties.
- **Wobbly Cake** is one family even though world entry may distinguish quest/repeatable contexts.

Do not create separate home-screen cards merely because one runtime supports several modes.

A tutorial/story wrapper may remain outside the catalogue when it exists to teach or narratively introduce the same underlying game. Nova's tutorial race is the current example.

## 6. Launch contract

All launches resolve through the generic launcher.

### World launch

The world provides:

- mini-game ID;
- optional variant;
- return target/current scene;
- optional world context useful to existing progression logic.

The launcher creates a `world` session.

Expected lifecycle:

1. player activates a world interaction;
2. world scene calls `MiniGameLauncher.launch(...)`;
3. launcher resolves the catalogue definition and manifest scene;
4. caller is paused/suspended as required;
5. gameplay runs;
6. game reports result/outcome;
7. game requests exit;
8. launcher resumes/starts the declared return target;
9. caller returns to its safe interaction/spawn state.

### Just Games launch

Just Games provides:

- mini-game ID;
- optional variant;
- return target = `JustGamesScene`.

The launcher creates a `just-games` session with sandbox side effects.

Expected lifecycle:

1. player selects a game card;
2. Just Games calls the same launcher;
3. gameplay runs in the same canonical scene;
4. game reports sandbox-safe result;
5. exit returns to Just Games;
6. adventure progression is unchanged.

## 7. Just Games architecture

### Home entry

`TitleScene` gains one menu action: **Just Games**.

The title scene should not know the list of games.

It starts/opens the on-demand `JustGamesScene`.

### `JustGamesScene`

Responsibilities:

- query visible definitions from `MiniGameCatalogue`;
- present child-readable cards;
- show simple variant/course selection where appropriate;
- launch through `MiniGameLauncher`;
- restore selection/focus when a game returns;
- provide Back to the title/home screen.

It must not:

- import individual game scenes;
- contain game rules;
- duplicate descriptions held by the catalogue;
- grant rewards;
- mutate quest/world state.

## 8. World integration architecture

A world package owns the physical/narrative wrapper:

- NPC;
- prop;
- field/court/table;
- interaction point;
- quest condition;
- world dialogue;
- signage;
- unlock requirement where the main adventure needs one.

Its activation callback should be thin:

```ts
launchMiniGame(scene, {
  gameId: 'rainbow-disc',
  variantId: 'match',
  source: 'world',
  worldContext: { interactionId: 'interaction:rainbow-disc' },
});
```

The game scene itself must not know the physical coordinate or world presentation that launched it.

A Just-Games-first mini-game can therefore exist with `world.placement = 'unplaced'`. A later world roadmap adds only the physical wrapper and invokes the same launcher.

## 9. Sandbox and persistence policy

### World sessions

World sessions preserve existing accepted behaviour.

A world mini-game may legitimately:

- advance a quest;
- spend or grant currency;
- grant items;
- record activity/race progression;
- unlock modes/content;
- set flags;
- update collections.

Those behaviours must continue through their existing domain services.

### Just Games sessions

Default policy: **sandbox**.

Allowed reads:

- appearance;
- settings/accessibility;
- static definitions;
- safe non-progression display data.

Disallowed durable writes unless explicitly isolated and approved:

- quest state;
- world flags;
- relationships;
- inventory;
- Shimmer/economy;
- collections/Wonderbook progression;
- one-time story rewards;
- normal world unlock flags.

For the initial platform, practice results should remain in-memory for the current Just Games visit.

A future isolated practice-record store is allowed only if:

- its namespace is separate from adventure progression data;
- no quest, reward or world unlock reads it;
- migrations/defaults are defined if stored inside the save;
- the package has explicit persistence tests.

### Game-specific consequences

- Wobbly Cake in Just Games must not charge the 1-Shimmer repeat cost and must not award cake/economy outcomes.
- Firefly Lantern may expose supported modes for practice without granting world milestones/unlocks.
- Racing may expose supported courses without changing Rainbow Cup/world progression.
- Beachcombing must not grant collection progression in sandbox.
- Chess/Pond Leap/Rainbow Disc should not acquire new persistence merely because they appear in Just Games.

## 10. Return and retry rules

Every game must expose the same semantic actions even if presentation differs:

- **Retry / Play Again**: restart the current game/variant without leaving the session context;
- **Exit / Back**: exit through the launcher/session return target;
- **Change Game / Modes** where supported: either return to the catalogue/selector or use an internal selector that does not corrupt the return context.

Text may be world-specific when launched from the world, for example “Back to Meadow”, but the action must be session-driven.

When launched from Just Games, labels should normally use “Back to Games” rather than pretending the player is returning to a world place.

## 11. Loading and registration rules

Current implementation is inconsistent:

- some activity scenes are manifest-backed and on-demand;
- some world callers still perform direct dynamic import and scene registration;
- Chess and Pond Leap currently use separate feature-registration approaches;
- Firefly Lantern and race scenes are startup/eager paths despite being bounded activities;
- several games own different return conventions.

MG-WP0/MG-WP2 must converge this.

Rules after migration:

1. `SceneManifest` is the only scene-constructor/load authority.
2. `MiniGameCatalogue` points at a manifest scene key.
3. `MiniGameLauncher` uses the manifest-backed loading path.
4. World scenes do not manually import/add mini-game scene classes.
5. Just Games does not manually import/add them either.
6. Rejected lazy imports remain retryable.
7. Optional mini-games should stay out of the startup graph unless measured evidence justifies otherwise.

## 12. Outcome reporting

Not every game needs a generic score model. Chess, racing, baking and beachcombing have different outcomes.

The shared boundary should therefore use a typed result envelope plus game-owned payload.

Conceptually:

```ts
interface MiniGameResult<TPayload = unknown> {
  gameId: MiniGameId;
  variantId?: string;
  completed: boolean;
  payload: TPayload;
}
```

Game-owned rules interpret the payload. The platform owns whether durable adventure effects are permitted in the current session.

Avoid forcing every game into one score/high-score abstraction.

## 13. Testing architecture

### Catalogue validation

Automated tests must verify:

- unique mini-game IDs;
- every catalogue scene key exists in `SceneManifest`;
- every Just Games-visible game has a usable display definition;
- variant IDs are unique within the family;
- no definition contains invalid world-only assumptions;
- every placed game has at least one declared/known world integration test;
- every future game is mapped to verification ownership.

### Parameterised browser contract

Where practical, one catalogue-driven browser suite should verify every game family can:

1. appear in Just Games;
2. launch;
3. render a stable gameplay-ready marker;
4. exit;
5. return to Just Games without dead input or a leaked overlay.

Each world-placed game also needs a representative world-entry contract.

### Sandbox regression

For games with durable world outcomes:

1. snapshot relevant save state;
2. launch from Just Games;
3. complete/retry/exit;
4. reload save;
5. verify forbidden progression fields are unchanged.

### Game-specific tests

The platform tests do not replace game-specific rules tests.

Examples:

- chess legality/check;
- race movement/results;
- Wobbly Cake sequencing;
- Firefly scoring;
- Rainbow Disc passing;
- Pond Leap timing;
- beachcombing outcomes.

## 14. Verification ownership

MG-WP0 must map the new subsystem in `scripts/verification/verificationOwnership.mjs`.

Expected ownership:

- catalogue/types/outcome-policy changes -> mini-game platform unit group plus targeted Just Games browser contract;
- launcher/lifecycle changes -> all mini-game launch/return targeted contracts and escalation when scene/navigation architecture requires it;
- one game implementation -> that game's unit/browser group plus shared launch/return smoke;
- `SceneManifest` changes remain subject to the existing architecture escalation policy.

Do not weaken existing full-qualification rules for final human-approved substantive heads.

## 15. Authoring recipe for future mini-games

A new mini-game package should execute in this order:

1. declare `Mini-game platform impact: new - <id> - world-first|just-games-first`;
2. define the stable game ID and catalogue metadata;
3. implement/reuse the gameplay scene;
4. register the scene in `SceneManifest`;
5. consume `MiniGameSession` rather than caller-specific return fields;
6. route persistent effects through the context-aware outcome boundary;
7. expose the game automatically through Just Games;
8. if world-first, add the physical world interaction that calls `MiniGameLauncher`;
9. if Just-Games-first, mark world placement `unplaced` and prove the scene has no Just Games-only assumptions;
10. add catalogue, launch/return, sandbox and game-specific tests;
11. add verification ownership if the game introduces a new subsystem;
12. run human visual/playtest acceptance before treating a child-facing game as finished.

## 16. Migration map for current games

### Rainbow Disc

Keep one `RainbowDiscActivityScene`.

Migrate Match/Practice to catalogue variants and replace bespoke registration helper ownership with the generic launcher/manifest path.

### Sunbeam Chess

Add/confirm manifest ownership, consume a mini-game session and return through the platform.

The Sunbeam chess plaza remains the world wrapper.

### Pond Leap

Move its separate registration helper into the platform/manifest path while preserving Meadow entry.

### Wobbly Cake

Replace direct import/add logic in the village interior with the launcher.

Preserve quest/repeatable world semantics. Add sandbox practice semantics.

### Firefly Lantern

Replace hard-coded “return to Woods” assumptions with session return while preserving Woods entry.

Expose supported modes via the catalogue without granting world unlock state in sandbox.

### Coral Beachcombing

Preserve beach world entry and collection/reward rules in world context. Suppress those durable effects in sandbox.

### Rainbow Run Racing

Treat racing as one catalogue family.

Do not duplicate the race engine. Adapt the existing race return-context mechanism behind the mini-game launcher/session contract, preserving Nova/story entry and normal world progression.

## 17. Anti-patterns prohibited by this architecture

- a `JustGamesChessScene` that copies Chess;
- a second list of mini-games hard-coded inside `JustGamesScene`;
- direct scene constructor imports in the catalogue;
- world scenes manually registering gameplay scenes after migration;
- a mini-game hard-coding `SunbeamVillageScene`, `RainbowMeadowScene` or `WhisperingWoodsScene` as its only possible return;
- charging currency in Just Games because the world version does;
- granting world rewards from Just Games;
- hiding a game from the catalogue because a world package forgot to register it;
- building a Just-Games-first game around title-screen-specific state;
- creating a generic score model that distorts game-specific rules;
- using the platform migration as an excuse to redesign accepted game behaviour.

## 18. Definition of platform success

The platform is successful when a fresh developer can create a new mini-game once, register it once, test it from Just Games immediately and later place it into the world by adding only a physical/narrative wrapper.

Conversely, a world roadmap should be able to create a mini-game and obtain Just Games access as a normal consequence of following the same authoring contract, not as a later clean-up task.
