# Mini-game authoring recipe

Status: canonical authoring path introduced by MG-WP4

Programme: MG - Mini-Game Development

Architecture owner: docs/architecture/MINI-GAME-PLATFORM.md

## Purpose

This is the shortest supported path for adding a new Unicorn Valley mini-game. Follow it for both world-first and Just-Games-first games.

The core rule is simple: author the gameplay once, register it once, launch it through the shared mini-game platform, and let launch context decide return and progression behaviour.

## 1. Classify the work before implementation

Every current/next work package must contain exactly one front-matter declaration:

- `mini_game_platform_impact: none`
- `mini_game_platform_impact: changed - <mini-game-id>`
- `mini_game_platform_impact: new - <mini-game-id> - world-first`
- `mini_game_platform_impact: new - <mini-game-id> - just-games-first`

Shared platform work uses `mini_game_platform_impact: changed - platform`.

The project-state validator rejects a current/next package when the declaration is absent or malformed. Do not begin a new bounded repeatable activity with `none`.

## 2. Create one stable game identity

Add one stable value to MINI_GAME_IDS in src/game/minigames/MiniGameCatalogue.ts.

Rules:

- IDs are durable compatibility identifiers, not display labels;
- use lower-case kebab-case;
- do not create a second ID for a Just Games copy of a world game;
- variants belong under one family ID unless they are genuinely separate game loops.

## 3. Register one gameplay scene through the canonical scene system

The gameplay scene must have one SceneKey and one SceneManifest entry.

For a new scene:

1. add the stable key to src/game/scenes/SceneKeys.ts;
2. add the corresponding SceneManifest entry with the appropriate loading boundary;
3. prefer on-demand loading for optional mini-games;
4. do not put scene constructors or lazy imports in the mini-game catalogue.

The catalogue describes identity and capability. SceneManifest remains the loading authority.

## 4. Add one catalogue definition

Add the game to MINI_GAME_CATALOGUE with:

- id;
- sceneKey;
- child-readable title and description;
- group and stable display order;
- variants, when the family has selectable modes;
- Just Games visibility and availability;
- world placement state;
- sandbox side-effect policy.

Every new game must be represented in the catalogue in its first implementation package.

A world-first game must be visible through Just Games in the same package. A Just-Games-first game may use world.placement = unplaced, but its gameplay must already be world-capable.

The catalogue integrity guard rejects duplicate IDs, invalid scene keys, missing Just Games exposure and malformed variant definitions.

## 5. Keep gameplay caller-independent

The gameplay implementation must not assume a particular caller.

Read the shared MiniGameSession from scene data and use it to determine:

- launch source;
- selected variant;
- return target;
- side-effect policy;
- optional world context.

Do not hard-code TitleScene, JustGamesScene or a particular world scene as the only valid caller.

World coordinates, NPCs, signs, quests and placement logic remain in the world integration layer, not in the mini-game definition.

## 6. Launch through MiniGameLauncher

World entry points and Just Games both call the shared launcher.

World launch requirements:

- source is world;
- return target identifies the world caller and whether it resumes or starts;
- worldContext may carry location/interaction/quest context when needed.

Just Games launch requirements:

- source is just-games;
- return target is the catalogue;
- the resulting session is sandboxed automatically.

Do not directly import/register a game scene from a world interaction when the shared launcher can own the lifecycle.

## 7. Return and retry through the session contract

Exit uses returnFromMiniGame with the active session.

Retry must preserve the same session source, return target and sandbox/world policy. A retry is not a new reason to reconstruct caller-specific navigation.

Player-facing Back/Exit wording may adapt to launch source, but navigation authority remains the session.

## 8. Put adventure writes behind the outcome boundary

Any mini-game action that can affect adventure progression must respect MiniGameOutcomeGateway.

Protected effect categories include:

- activity progress;
- quests;
- world flags;
- relationships;
- inventory;
- Shimmer;
- collections;
- unlocks.

World sessions may use the existing accepted progression behaviour. Just Games sessions are sandboxed by default and must not create or mutate adventure progression.

Do not scatter source === just-games checks around save/economy code as a substitute for the shared boundary.

## 9. Required verification for a new game

At minimum, the owning package must cover:

- catalogue integrity for the new definition and variants;
- SceneManifest ownership/loading for the gameplay scene;
- shared session creation and variant validation;
- one world launch/return path;
- one Just Games launch/return path;
- sandbox no-adventure-write behaviour;
- game-specific rules;
- relevant touch/keyboard behaviour.

Use repository verification ownership rather than inventing a package-local test policy.

MG-WP4 provides two reusable contracts:

- add one declarative row to `tests/play/mg-wp4-mini-game-launch-return-contract.spec.ts` so the Just Games caller proves the selected family/variant launches, creates no adventure save and returns cleanly to the catalogue;
- use `assertSandboxAdventureEffectsBlocked` from `src/game/minigames/MiniGameSandboxContract.testSupport.ts` for any game/session-specific sandbox regression test. Use `assertWorldAdventureEffectsAllowed` when the same fixture must prove accepted world-side writes remain available.

The mini-games verification owner selects the reusable browser contract automatically for changes under `src/game/minigames/**` and for `JustGamesScene`, so future packages should extend the shared contract rather than copy it.

## 10. World-first checklist

A world-first mini-game is not complete until all are true:

- the world interaction launches the shared game implementation;
- the stable ID and catalogue definition exist;
- the game appears in Just Games;
- Just Games launch is sandbox-safe;
- both callers return correctly;
- no duplicate Just Games gameplay implementation exists.

## 11. Just-Games-first checklist

A Just-Games-first mini-game is not complete until all are true:

- the stable ID, scene and catalogue definition exist;
- the game launches from Just Games through MiniGameLauncher;
- sandbox writes are blocked;
- the implementation has no title-screen-only state or hard-coded return target;
- world.placement is unplaced until a later world package adds physical presentation;
- later world placement only needs world interaction/presentation plus a call to the shared launcher.

## 12. Representative existing example

Sunbeam Chess is the initial authoring-contract fixture.

It has one catalogue identity, one ChessPlazaActivityScene gameplay implementation and one shared session/return path. World sessions return to Sunbeam Village with world side effects permitted by policy. Just Games sessions use the same gameplay implementation, return to the catalogue and receive sandbox policy.

The MG-WP4 deterministic fixture asserts those two contexts against the same canonical game definition.

## 13. Do not do these things

Do not:

- create GameNameWorldScene and GameNameJustGamesScene copies of the same rules;
- add a second mini-game scene registry;
- hard-code a return scene in reusable gameplay;
- let Just Games mutate the normal adventure save by default;
- hide a new world mini-game from the catalogue and defer integration to a later package;
- add physical world placement data to the catalogue;
- bypass repository verification ownership for a convenience-only test path.
