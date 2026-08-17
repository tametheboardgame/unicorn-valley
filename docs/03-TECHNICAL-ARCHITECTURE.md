# Unicorn Valley - Technical Architecture

## Architecture goals

The technical design must optimise for:

1. A browser game that loads and runs reliably on ordinary desktop/laptop hardware and modern tablets.
2. Fast iteration by a single developer/agent.
3. Data-driven content so new quests, characters, cosmetics and areas do not require rewriting core systems.
4. Versioned persistent saves that survive game updates.
5. A clean separation between game systems, content data and visual assets.
6. Static deployment through Cloudflare Pages in the early releases.
7. The ability to add optional online services later without making them mandatory.

## Chosen stack

### Game framework

**Phaser**

Reasoning:

- built specifically for HTML5 games;
- handles scenes, input, animation, audio, cameras, sprites, tilemaps and WebGL/Canvas rendering;
- has first-class TypeScript definitions;
- supports a conventional browser build without requiring a heavyweight application framework.

### Language

**TypeScript**

Reasoning:

- strong contracts for save data, content definitions and game-system APIs;
- safer refactoring as the project grows;
- catches many content/schema errors before runtime.

### Build tool

**Vite**

Reasoning:

- simple development server;
- fast development workflow;
- straightforward static production build;
- clean fit with Phaser's official project templates and Cloudflare Pages.

### Hosting

**Cloudflare Pages**

Initial deployment model:

- GitHub repository connected to Cloudflare Pages;
- `main` is the production branch;
- feature branches/PRs can receive preview deployments;
- build command: `npm run build`;
- output directory: `dist`.

### Persistence

Initial releases:

- browser `localStorage` for primary save data;
- versioned JSON save object;
- optional downloadable/exportable backup can be added later.

Potential later release:

- Cloudflare Worker + D1/KV/R2 or equivalent only if cross-device saves become worthwhile.

No backend is required for the initial game.

## Application structure

Proposed high-level source tree:

```text
src/
  main.ts
  game/
    config/
    scenes/
    systems/
    entities/
    components/
    ui/
    input/
    save/
    audio/
    world/
    races/
  content/
    characters/
    dialogue/
    quests/
    items/
    cosmetics/
    decorations/
    discoveries/
    races/
    world/
  data/
    schemas/
    defaults/
  shared/
    types/
    utils/
assets/
  images/
  sprites/
  tiles/
  ui/
  audio/
  music/
  fonts/
  maps/
public/
tests/
docs/
```

Exact folder names can evolve, but the separation between engine code, authored content and assets should remain.

## Phaser scene structure

Proposed scenes:

### BootScene

Responsibilities:

- minimum boot configuration;
- initialise save service;
- determine whether player profile exists;
- configure global input/settings services.

### PreloadScene

Responsibilities:

- load shared assets;
- show branded child-friendly loading screen;
- report progress visually;
- fail gracefully if an asset cannot load.

### TitleScene

Responsibilities:

- Continue;
- New Game;
- Settings;
- later backup/restore options.

### UnicornCreatorScene

Responsibilities:

- initial character creation;
- later appearance editing mode.

### WorldScene

Responsibilities:

- overworld map/zone rendering;
- player movement;
- NPC placement;
- collisions;
- interactables;
- world-state visual variants;
- transitions to interiors/activities.

The implementation may use one configurable WorldScene for multiple zones rather than one class per area.

### InteriorScene

Optional generic scene for cottage, shops and character interiors if separating interiors makes maps easier to manage.

### RaceScene

Dedicated activity scene with its own physics/input/state flow.

### MiniGameScene variants

Only introduce specialised scenes as mini-games are actually implemented.

### UIScene

Persistent overlay if Phaser scene composition proves cleaner than embedding UI in each gameplay scene.

Responsibilities may include:

- interaction prompt;
- inventory button;
- Wonderbook button;
- current suggestion/objective;
- pause/settings controls.

## Scene transition rules

Transitions should:

1. save important state before leaving;
2. show a short fade or storybook page transition;
3. never leave the player in a partially loaded interactive scene;
4. preserve the player's previous safe return location where appropriate.

## Game state model

Do not use a single unstructured global object accessed from everywhere.

Use explicit services/stores with typed state.

Suggested major state groups:

### PlayerProfile

- player/unicorn name;
- appearance configuration;
- current safe location;
- unlocked abilities;
- settings references if appropriate.

### InventoryState

- item quantities;
- owned cosmetics;
- owned decorations;
- special items.

### RelationshipState

- character relationship progression;
- character-specific flags;
- memorable interaction flags.

### QuestState

- quest status;
- current step;
- optional step data;
- completion history.

### WorldState

- persistent world flags;
- discovered zones;
- changed scenery;
- event state;
- unique discoveries.

### HomeState

- owned furniture;
- placed furniture by slot;
- later garden state.

### ActivityState

- race results;
- best performances;
- ribbons/badges;
- mini-game records where useful.

### CollectionState

- Wonderbook discoveries;
- discovered items/creatures/places;
- special memories.

## Save format

The save must always include a schema version.

Example conceptual shape:

```ts
interface SaveGame {
  schemaVersion: number;
  createdAt: string;
  lastSavedAt: string;
  profile: PlayerProfile;
  inventory: InventoryState;
  relationships: RelationshipState;
  quests: QuestState;
  world: WorldState;
  home: HomeState;
  activities: ActivityState;
  collections: CollectionState;
}
```

## Save migrations

Every structural save change after the first public test must provide a migration.

Example:

- v1 -> v2 adds `home` with defaults;
- v2 -> v3 moves race records from profile into activities.

Rules:

- never assume missing fields mean a broken save;
- migrate forward sequentially;
- keep migration functions deterministic;
- write tests using representative older saves;
- retain a safe fallback copy before overwriting migrated data where practical.

## Autosave triggers

Save after:

- character creation;
- quest step/completion;
- meaningful item acquisition;
- cosmetic purchase;
- appearance change;
- furniture placement;
- friendship change;
- race completion;
- important world-state change;
- scene transition when state changed.

Do not write to localStorage every frame or every movement tick.

Use a debounced save queue for frequent low-risk changes if needed.

## Content architecture

Gameplay content should be data-driven wherever practical.

### Character definition

A character definition should contain stable data such as:

- ID;
- display name;
- portrait/sprite references;
- visual theme;
- default location;
- interaction/dialogue selectors;
- friendship configuration.

### Quest definition

A quest should be defined as a sequence or graph of typed steps rather than hard-coded scene logic.

Candidate step types:

- TALK_TO_CHARACTER;
- COLLECT_ITEM;
- VISIT_ZONE;
- INTERACT_WITH_OBJECT;
- COMPLETE_RACE;
- CHOOSE_OPTION;
- SET_WORLD_FLAG;
- GIVE_REWARD;
- SHOW_SCENE;

The quest engine interprets these definitions and emits events. Special one-off scripted behaviour is allowed, but should not be the default.

### Dialogue definition

Dialogue entries should support conditions based on:

- friendship tier;
- quest state;
- world flags;
- inventory possession;
- first/return interaction;
- event state.

Dialogue selection should be deterministic enough to test.

### Item definitions

Every item should have a stable string ID and metadata including:

- display name;
- icon;
- category;
- stackability;
- description;
- quest-critical flag;
- optional Wonderbook relationship.

Never use display text as a persistent identifier.

## Event architecture

Core systems should communicate through a typed event bus or narrow service APIs rather than importing scene classes into one another.

Example events:

- ITEM_COLLECTED;
- QUEST_STEP_CHANGED;
- QUEST_COMPLETED;
- RELATIONSHIP_CHANGED;
- WORLD_FLAG_CHANGED;
- RACE_FINISHED;
- DISCOVERY_UNLOCKED;
- SAVE_COMPLETED.

This allows UI, audio and effects to react without embedding those behaviours in quest logic.

## World rendering

Recommended approach: hybrid tilemap + illustrated set pieces.

- Tile/grid data handles ground, navigation and collision efficiently.
- Large illustrated props/overlays create the storybook appearance.
- Foreground layers allow the player to pass visually behind trees and structures.
- Collision shapes should be simpler than visual shapes.

Phaser tilemap support can be used with Tiled-compatible JSON if that pipeline proves efficient.

## World-state variants

Persistent changes should not require duplicate whole maps.

Use object IDs and conditional variants.

Example:

```text
willow-garden-empty    visible when !willowMoonflowersPlanted
willow-garden-flowers  visible when willowMoonflowersPlanted
```

This pattern should apply to:

- repaired objects;
- planted flowers;
- unlocked routes;
- event decorations;
- discovered secrets.

## Interaction system

Interactable objects implement a small common contract:

- stable ID;
- interaction radius;
- interaction type;
- optional condition;
- prompt icon;
- handler/action ID.

The player interacts with the closest valid object within range.

This prevents every flower, NPC and doorway from implementing bespoke input detection.

## Input abstraction

Game systems should consume actions, not raw key codes.

Actions include:

- MOVE_X;
- MOVE_Y;
- INTERACT;
- BACK;
- OPEN_WONDERBOOK;
- OPEN_INVENTORY;
- RACE_JUMP;
- RACE_MOVE_UP/DOWN where applicable.

Keyboard, mouse and touch controllers map to the same actions.

This is critical for adding touchscreen support without rewriting gameplay.

## UI architecture

Use Phaser UI for canvas-integrated interfaces initially unless DOM UI gives a clear accessibility or layout advantage.

Reusable UI components should include:

- large button;
- icon button;
- dialogue card;
- choice card;
- item card;
- reward panel;
- confirmation panel;
- colour swatch;
- tab strip;
- progress/ribbon display.

All interactive controls require clear hover/focus/pressed states even if the target player mainly uses touch.

## Audio architecture

Separate buses/categories:

- music;
- sound effects;
- ambience;
- UI.

Minimum user settings:

- master sound on/off;
- music volume;
- effects volume.

Audio should start only after a user interaction to comply with browser autoplay restrictions.

Music transitions should fade rather than restart abruptly where practical.

## Asset management

Use a central asset manifest and consistent keys.

Avoid scattering literal file paths through scenes.

Examples:

```text
character.nova.sprite
character.nova.portrait
world.moonflower_glade.tiles
ui.icon.interact
music.sunbeam_village
sfx.discovery
```

## Performance budget principles

The project should be conservative enough for ordinary hardware.

Guidelines:

- prefer compressed web-friendly image/audio formats where Phaser/browser support is reliable;
- atlas small sprites where useful;
- unload zone-specific assets if memory becomes a problem;
- avoid hundreds of continuously updating invisible objects;
- pause expensive scene work when menus obscure gameplay;
- use object pooling for repeated race particles/collectables only if profiling justifies it.

Do not prematurely optimise abstractions before measuring actual performance.

## Resolution and scaling

Initial design target:

- landscape orientation;
- logical design canvas around 16:9;
- Phaser Scale FIT with centred canvas or equivalent;
- responsive UI safe zones for narrower/wider screens.

The world should remain playable at common laptop resolutions and tablets in landscape.

Portrait phone layout is not a launch requirement.

## Testing strategy

### Unit tests

Use for:

- save migrations;
- quest step transitions;
- reward calculations;
- content validation;
- relationship progression;
- item/inventory operations.

### Content validation

Automated validation should verify:

- referenced item IDs exist;
- character IDs exist;
- quest next steps are valid;
- reward IDs exist;
- asset keys resolve where validation is possible;
- duplicate IDs are rejected;
- required dialogue nodes exist.

This is particularly valuable because content volume will eventually exceed engine-code volume.

### Browser smoke tests

Automate or manually verify:

- game boots;
- new game works;
- save reload works;
- basic world movement works;
- key scene transitions work.

### Child playtesting

No automated test substitutes for observing the target player.

Important observations:

- Where does she stop understanding what to do?
- Which things does she try to click/tap that are not interactive?
- Which text does she skip?
- Does she notice interaction prompts?
- What does she voluntarily repeat?
- What does she show someone else?
- Does she understand how to leave a menu?

## Build quality gates

A work package should not be considered complete when it merely "works on my machine".

Relevant gates:

- TypeScript build succeeds;
- linting succeeds once configured;
- automated tests succeed once configured;
- no critical console errors;
- save compatibility considered;
- keyboard and touch impact considered for gameplay changes;
- game remains deployable as static output.

## Dependency policy

- Prefer a small number of established dependencies.
- Do not add a framework simply to solve one small UI problem.
- Pin dependencies through the lockfile.
- Update deliberately rather than automatically accepting breaking major versions.
- At the initial implementation stage, use the current stable Phaser/Vite/TypeScript ecosystem rather than hard-coding the versions mentioned in older templates.

## Cloudflare deployment notes

Cloudflare Pages' Git integration supports automatic production deployments from the configured branch and preview deployments for other branches/PRs.

For the Vite build, plan around:

- production branch: `main`;
- build command: `npm run build`;
- output: `dist`.

No Cloudflare-specific runtime APIs should be required by the game core.

## Future backend boundary

If cloud saves are introduced later, the client should talk to a small persistence interface rather than replacing game-state logic.

Conceptually:

```ts
interface SaveRepository {
  load(): Promise<SaveGame | null>;
  save(data: SaveGame): Promise<void>;
}
```

Initial implementation: LocalSaveRepository.

Potential later implementation: CloudSaveRepository.

The rest of the game should not care where persistence lives.

## Architectural anti-patterns to avoid

- scene classes containing all business logic;
- quest logic written directly inside NPC click handlers;
- display names used as database/save IDs;
- a single global mutable object with arbitrary fields;
- one-off save fields added without schema migration;
- raw key checks spread throughout gameplay code;
- every new NPC requiring custom code;
- every world-state change requiring a duplicate map;
- UI hard-coded to one resolution;
- network connectivity required to play the basic game.

## Implementation rule

When deciding between a fast bespoke solution and a reusable system, use this test:

**Will we obviously need to author this kind of thing repeatedly?**

If yes, create the reusable data-driven system first.

NPC dialogue, quests, items, cosmetics, decorations, discoveries and world-state variants clearly meet that test.
