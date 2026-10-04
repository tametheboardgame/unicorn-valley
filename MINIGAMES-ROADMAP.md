---
id: MG
title: Mini-Game Development Programme
status: approved
autonomy: amber
depends_on: []
parallel_safe: true
human_gate: architecture
---

# Unicorn Valley Mini-Game Development Roadmap

Programme ID: **MG**

Status: **approved direction / independent programme**

## Current stage

**MG-WP0 through MG-WP3 are complete and merged. MG-WP4 - Future mini-game authoring kit and guardrails is the active platform package.**

The shared catalogue/session/launcher/outcome foundation, existing-game migration, sandbox isolation and Just Games catalogue are now present on main. MG-WP4 remains the final readiness gate before Crystalarium or Crystal Checkers can begin at H6.9/H6.10.

This roadmap is intentionally independent of the main release roadmap. It is not an R6.5, WP19 or area-polish sub-stream. Mini-game platform work and mini-game improvement work may proceed in parallel with world, Story House and other content programmes when dependencies genuinely permit.

The canonical mini-game architecture is `docs/architecture/MINI-GAME-PLATFORM.md`. The repo-wide authoring rules in `AGENTS.md`, `ACCEPTANCE.md` and `docs/architecture/ENGINEERING-STANDARDS.md` apply to every roadmap and work package, regardless of which programme originated the game.

## Purpose

Create one durable mini-game platform that supports both of these authoring directions without rework:

1. a mini-game is first created inside the main world and automatically becomes available through **Just Games**; or
2. a mini-game is first created through **Just Games** and can later be placed into the main world without rewriting its gameplay implementation.

The same canonical game implementation must serve both entry points.

**Just Games** is therefore not a parallel copy of the games. It is a catalogue and launcher over the same mini-game implementations used by the world.

## What counts as a mini-game

A feature belongs to this programme when it is a bounded playable activity with its own short gameplay loop, clear start/finish/retry behaviour and a repeatable or practice-oriented interaction model.

Typical examples include:

- sports and skill games;
- races and race families;
- timing/aiming games;
- puzzles or board games;
- making/baking activities with an active play loop;
- collection/search activities with a discrete run;
- other optional repeatable activities.

A story conversation, shop, exploration interaction, ordinary quest step, creator flow or passive environmental interaction is not automatically a mini-game.

When classification is genuinely ambiguous, the active work package must make the choice explicit. Do not avoid the platform contract merely by giving a mini-game another name.

## Non-negotiable cross-roadmap rule

Every current/next work package must declare `mini_game_platform_impact` in front matter. Any roadmap or package that creates or materially changes a mini-game must use the appropriate `changed`/`new` value rather than `none`.

For a new mini-game, completion requires:

- one stable mini-game ID;
- one canonical gameplay implementation;
- one catalogue definition;
- one manifest-backed scene/load path;
- support for the shared launch/session contract;
- a Just Games entry;
- a world-compatible launch path, even if the game has not yet been physically placed in the world;
- context-safe return behaviour;
- context-safe persistence/reward behaviour;
- automated validation of catalogue integrity and launch/return behaviour;
- touch/keyboard behaviour appropriate to the game.

A world-first mini-game must not wait for a later “Just Games integration” package.

A Just-Games-first mini-game may remain **world-unplaced**, but it must already be world-ready: it cannot assume the title screen is its caller, cannot hard-code its return destination, and cannot depend on Just Games-only state.

## Current portfolio to migrate

The initial catalogue contains these game families:

| Mini-game family | Existing implementation | Important variants |
| --- | --- | --- |
| Rainbow Run Racing | race runtime, five regular courses and Rainbow Cup progression | Sunrise Sprint, Petal Parade, Crystal Cascade, Mooncap Trail, Shoreline Surge; tutorial remains a story entry, not a separate catalogue game |
| Rainbow Disc | `RainbowDiscActivityScene` | Match, Practice |
| Sunbeam Chess | `ChessPlazaActivityScene` | standard chess activity |
| Wobbly Cake Baking | `MapleBakingActivityScene` | quest and repeatable world modes; Just Games uses a sandbox/practice session |
| Firefly Lantern | `FireflyLanternScene` | supported lantern modes and difficulty choices |
| Pond Leap | `PondLeapActivityScene` | standard timing run |
| Coral Beachcombing | `CoralBeachcombingActivityScene` | standard beachcombing run |

The migration must preserve accepted world behaviour. Moving a game under the platform is not authority to redesign its rules, rewards, visuals or quest integration.

## Planned portfolio additions from approved world roadmaps

The following world-first mini-games were approved as part of the R6.5-WP19H6 Crystal Brook roadmap on 3 October 2026. They are **planned**, not yet part of the migrated/current catalogue:

| Planned mini-game | Originating world package | Platform declaration | Direction |
| --- | --- | --- | --- |
| Crystalarium | R6.5-WP19H6.9 | `new - crystalarium - world-first` | Crystal merge game using Resonance Patterns to restore magical formations; no customer/energy-timer fiction |
| Crystal Checkers | R6.5-WP19H6.10 | `new - crystal-checkers - world-first` | Standard checkers/draughts on a physical crystal-rock board, shared between Crystal Brook and Just Games |

H6 contains an explicit readiness gate before either game is implemented. If MG-WP0-WP4 have not established the shared catalogue/launcher/session/sandbox/authoring contracts, H6 must pause at that gate rather than introducing bespoke Crystal Brook activity architecture.

## Platform sequence

The platform is deliberately built before the individual improvement passes. Implementation evidence from MG-WP0 confirmed that migration and sandbox isolation must precede the visible Just Games launcher, so the safe dependency order is **MG-WP0 -> MG-WP1 -> MG-WP2 -> MG-WP3 -> MG-WP4**.

### MG-WP0 - Mini-game platform foundation

Goal: establish the architecture, ownership and validation contract before changing visible gameplay.

Deliverables:

- canonical `MiniGameId`, definition and launch/session contracts;
- one `MiniGameCatalogue` that describes game families and their selectable variants;
- integration with the existing `SceneManifest` rather than a competing scene registry;
- generic `MiniGameLauncher` ownership for loading, caller pause/resume, return targets and session context;
- context-aware outcome/persistence boundary;
- catalogue validation;
- migration plan for current registration/return inconsistencies;
- verification ownership for the new subsystem.

Acceptance:

- a mini-game can be described without embedding world coordinates or title-screen assumptions;
- the architecture supports `world` and `just-games` launch contexts through the same game scene;
- the catalogue does not load scene constructors independently of `SceneManifest`;
- the sandbox policy prevents Just Games from mutating normal world progression by default.

Detailed package: `docs/work-packages/MG-WP0-MINI-GAME-PLATFORM-FOUNDATION.md`.

### MG-WP3 - Just Games home and catalogue experience

Goal: make the platform visible from the home screen.

Deliverables:

- add **Just Games** to the title/home menu;
- add an on-demand `JustGamesScene`;
- generate game cards from the catalogue rather than hard-coding a second list;
- child-readable game title, short description and simple visual identity;
- variant selection where required, such as Rainbow Disc Match/Practice or race/course selection;
- Back returns cleanly to the title/home menu;
- keyboard and touch navigation use the normal UI system.

Acceptance:

- every catalogue-visible current mini-game can be discovered without entering the main world;
- adding a future catalogue entry does not require editing a second hard-coded Just Games list;
- Just Games remains a launcher, not an owner of game logic.

### MG-WP1 - Existing game migration to one launch contract

Goal: remove the current mixture of direct dynamic registration, bespoke return logic and hard-coded caller assumptions.

Migration targets include:

- Chess and Pond Leap, which currently sit outside the canonical scene manifest path;
- Wobbly Cake, whose world scene currently performs direct lazy import/scene registration despite a manifest definition;
- Rainbow Disc registration/helper duplication;
- Firefly Lantern's Woods-specific return assumptions;
- racing's specialist return-context handling;
- any equivalent beach/activity launch path found during implementation audit.

Deliverables:

- every catalogue game launches through the shared launcher;
- every underlying gameplay scene uses a normalised mini-game session context;
- callers no longer need mini-game-specific scene registration code;
- world entry points preserve their current interaction labels, quest semantics and physical placement;
- Just Games uses the same launcher.

Acceptance:

- no migrated game has separate “world” and “Just Games” gameplay implementations;
- enter/exit/retry works from both launch contexts;
- world callers resume/return to the correct place;
- Just Games always returns to the catalogue.

### MG-WP2 - Sandbox, rewards and persistence isolation

Goal: make Just Games safe for repeated testing and child play without corrupting the adventure save.

The default Just Games session is a sandbox.

It may read:

- player appearance;
- accessibility/settings;
- static game definitions;
- safe display-only records where explicitly supported.

It must not, by default:

- advance quests;
- set world/story flags;
- change relationships;
- grant or consume inventory;
- grant or consume Shimmer;
- unlock world progression;
- alter collection/Wonderbook progression;
- trigger one-time story rewards.

Deliverables:

- one outcome gateway that applies results according to launch context;
- explicit world versus sandbox policy for each current game;
- Wobbly Cake practice that does not charge Shimmer;
- Firefly/Race/game progression changes suppressed or isolated in sandbox;
- explicit policy for personal/practice records.

Default record rule:

- Just Games records are ephemeral until a separate isolated record namespace exists;
- if durable practice records are later added, they must be provably non-progression data and must never unlock world content indirectly.

Acceptance:

- the same game can be played repeatedly from Just Games without changing adventure progression;
- world launches retain accepted reward/progression behaviour.

### MG-WP4 - Future mini-game authoring kit and guardrails

Goal: make the correct path the easiest path for every future roadmap.

Deliverables:

- documented authoring recipe;
- catalogue integrity tests for unique IDs, valid scene keys and valid variants;
- reusable launch/return browser contract;
- reusable sandbox side-effect regression contract;
- verification ownership rules for `src/game/minigames/**` and catalogue changes;
- a mechanically enforced work-package declaration requiring `mini_game_platform_impact` before a package can become current/next;
- no-production test fixture or deterministic harness proving a game can be authored once and launched from both contexts.

Acceptance:

- a fresh agent can add a new game by following one documented path;
- a future world roadmap cannot complete a new mini-game while silently omitting Just Games integration;
- a Just-Games-first game can later receive a world placement without changing its core gameplay code.

## Individual improvement sequence

After MG-WP0 through MG-WP4 establish the platform, each existing game receives its own bounded improvement package. These packages are deliberately independent of the world-area roadmap.

The order may change based on human testing, but the initial sequence is:

### MG-WP5 - Sunbeam Chess improvement pass

Review:

- board/readability;
- touch selection;
- legal-move feedback;
- AI/rules behaviour;
- restart/rematch;
- child-readable help;
- visual consistency with the current UI system.

World integration remains the Sunbeam chess plaza. Just Games launches the same chess scene.

### MG-WP6 - Rainbow Disc improvement pass

Review:

- Match and Practice;
- player/defender scale and alignment;
- aim/timing readability;
- touch drag/throw feel;
- practice-target selection;
- scoring/turnover flow;
- replay and result presentation.

World integration remains Rainbow Meadow.

### MG-WP7 - Pond Leap improvement pass

Review:

- timing readability;
- touch/keyboard parity;
- difficulty curve;
- frog/course presentation;
- miss/recovery pacing;
- replay value.

### MG-WP8 - Wobbly Cake improvement pass

Review the already accepted baking baseline without breaking Maple/picnic progression:

- measuring;
- stirring trace feel;
- layering/dragging;
- decorating;
- Wobble Score;
- repeat-bake pacing;
- sandbox mode versus world economy mode.

### MG-WP9 - Firefly Lantern improvement pass

Review:

- mode selection;
- difficulty selection;
- touch precision;
- visual clarity;
- scoring/result feedback;
- retry;
- progression-independent Just Games access.

### MG-WP10 - Coral Beachcombing improvement pass

Review:

- search/readability;
- touch targets;
- environmental feedback;
- scoring/collection feel;
- replay variation;
- result presentation.

### MG-WP11 - Rainbow Run Racing improvement pass

Racing is treated as one mini-game family rather than five unrelated catalogue games.

Review:

- course selector;
- five-course presentation;
- race controls;
- assistance;
- result flow;
- personal best presentation;
- Rainbow Cup relationship;
- practice/sandbox behaviour;
- return flow.

Nova's tutorial race remains story-owned and may use the same race runtime without becoming a separate Just Games card.

## Portfolio closeout

### MG-WP12 - Cross-game UX, accessibility and consistency

Goal: make the mini-game portfolio feel intentionally related without making every game visually identical.

Review:

- consistent Back/Retry/Play Again language;
- touch target size;
- keyboard focus/navigation;
- activity title/result hierarchy;
- pause/exit safety;
- reduced-motion/assistance support where relevant;
- audio context and settings;
- small-screen layout;
- no whole-screen shadow/dimming artefacts behind near-full-screen activity shells;
- predictable return to world or catalogue.

### MG-WP13 - Mini-game platform hardening and release gate

Goal: prove the platform can carry future games safely.

Deliverables:

- full catalogue validation;
- generated/parameterised launch-return coverage for every catalogue entry;
- world-versus-sandbox side-effect matrix;
- stale registration/helper retirement;
- performance/loading review so optional games stay appropriately lazy;
- final documentation reconciliation;
- human portfolio playtest.

Acceptance:

- every current game family launches from Just Games;
- every world-placed game still launches from its physical world entry;
- there is one canonical implementation per game;
- a future mini-game has one documented authoring path;
- no roadmap-specific exception is required simply to expose a game in both contexts.

## Rules for future roadmap authors

Every future roadmap and bounded work package must apply the following decision:

### If the work does not touch a mini-game

Declare:

`mini_game_platform_impact: none`

No further action is required.

### If the work changes an existing mini-game

Declare:

`mini_game_platform_impact: changed - <mini-game-id>`

The package must preserve both world and Just Games launch contracts and test both if behaviour or lifecycle changed.

### If the work creates a new mini-game in the world

Declare:

`mini_game_platform_impact: new - <mini-game-id> - world-first`

The same package must add the catalogue definition, Just Games exposure and shared launch/session support.

### If the work creates a new mini-game from Just Games

Declare:

`mini_game_platform_impact: new - <mini-game-id> - just-games-first`

The game may be world-unplaced, but must be authored against the same world-capable session/return contract. A later world package should only need to add physical presentation/interaction and call the shared launcher.

## Historical roadmap treatment

Completed historical roadmap entries remain where they are.

For example, Wobbly Cake and Rainbow Disc were legitimately created as part of Sunbeam Village and Rainbow Meadow work. Their history should not be rewritten.

From adoption of this programme onward:

- world roadmaps own **where and why** a mini-game exists in the world;
- the Mini-Game roadmap owns the **shared platform and game-specific improvement programme**;
- both use the same runtime implementation;
- future mini-game creation must satisfy the global platform contract at first implementation.

## Relationship to other programmes

- Main world/area work can continue independently where it does not alter a mini-game.
- Story House remains its own independent programme.
- Mini-game work must not be used to block unrelated world polish.
- A world package may place or narratively integrate a game while the Mini-Game programme later improves that game's mechanics.
- If both programmes need the same game code concurrently, normal Git/package dependency discipline applies; do not create duplicate implementations to avoid a branch conflict.
