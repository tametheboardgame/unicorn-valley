---
id: MG-WP1
title: Existing Game Migration to One Launch Contract
status: in_progress
autonomy: amber
depends_on: [MG-WP0]
parallel_safe: false
human_gate: architecture-and-regression
---

# MG-WP1 - Existing Game Migration to One Launch Contract

## Purpose

Migrate every existing mini-game family onto the shared MG platform created by MG-WP0 without redesigning gameplay, rewards, visuals or world placement.

Mini-game platform impact: **changed - all current catalogue families**

MG-WP1 owns launch/return architecture only. Game-specific sandbox side-effect isolation remains MG-WP2.

## Scope

Current catalogue families:

- Rainbow Disc;
- Sunbeam Chess;
- Pond Leap;
- Wobbly Cake;
- Firefly Lantern;
- Coral Beachcombing;
- Rainbow Run Racing.

The package must converge all current entry paths onto:

- `MiniGameCatalogue`;
- `SceneManifest`;
- `MiniGameLauncher`;
- `MiniGameSession`.

## Migration rules

- Preserve one canonical gameplay implementation per game family.
- Preserve existing world interactions, labels, coordinates, quest conditions and accepted gameplay.
- Remove duplicate scene-registration helpers once no callers need them.
- Use `MiniGameSession` as the primary return contract.
- Temporary legacy scene-data fallback is allowed only where it protects existing automated/browser contracts during migration; new callers must use the MG session.
- Do not add the visible Just Games screen in MG-WP1.
- Do not suppress world rewards/progression in MG-WP1; MG-WP2 owns the complete sandbox side-effect audit and isolation.
- Keep Nova's tutorial race story-owned; migrate reusable race runtime/return mechanics without making the tutorial a separate catalogue game.

## Checkpoints

### MG-WP1A - Simple activity launch migration

Families:

- Rainbow Disc;
- Pond Leap;
- Sunbeam Chess.

Deliverables:

- world callers use `launchMiniGame`;
- activity scenes read `MiniGameSession`;
- exit uses the shared return contract;
- duplicate Rainbow Disc and Pond Leap registration helpers are retired;
- Chess no longer imports/registers its scene class from the world manager.

Acceptance:

- existing world entry remains unchanged to the player;
- Match/Practice remain distinct Rainbow Disc variants;
- Pond Leap still receives reflection presentation data;
- Chess still returns to Sunbeam Village;
- no duplicate scene registration path remains for these three games.

### MG-WP1B - Wobbly Cake migration

Deliverables:

- remove Village Interior direct dynamic import/scene registration;
- launch through `MiniGameLauncher`;
- preserve quest and repeatable world modes as world context/game-specific scene data;
- use the shared return contract;
- do not change Shimmer/reward behaviour yet.

### MG-WP1C - Coral Beachcombing migration

Deliverables:

- remove repeatable-activity manager direct import/registration;
- launch through the shared platform;
- preserve Starlight Beach availability gating and accepted world reward/collection behaviour;
- use the shared return contract.

### MG-WP1D - Firefly Lantern migration

Deliverables:

- move caller/return ownership to `MiniGameSession`;
- preserve current world entry, mode selection and progression behaviour;
- remove Woods-only return assumptions from the gameplay scene;
- keep current startup/on-demand loading decision unless MG evidence justifies changing it separately.

### MG-WP1E - Rainbow Run Racing migration

Deliverables:

- adapt existing race launch/return context behind the shared MG session;
- preserve the five regular course definitions and all world/Rainbow Cup behaviour;
- preserve Nova tutorial story flow;
- do not duplicate `RaceScene`;
- make regular course variants addressable through the catalogue contract.

### MG-WP1F - Migration closeout

Deliverables:

- audit for stale direct `game.scene.add` / dynamic import launch paths for catalogue games;
- ensure all catalogue families can be launched through the shared contract;
- update tests and verification ownership where necessary;
- document any intentional compatibility adapters remaining for MG-WP2;
- reconcile status and roadmap state.

## Validation

During each checkpoint:

- `npm run format:check`;
- `npm run lint`;
- `npm run typecheck`;
- `npm run architecture:validate`;
- selected MG/activity/race unit contracts;
- relevant targeted browser contracts;
- build/static smoke where selected by CI.

Because scene/navigation contracts are involved, final package qualification follows the repo verification planner and may escalate.

The known baseline first-playable performance overage inherited from main must not be misreported as an MG-WP1 regression unless this branch materially worsens it.

## Human gate

MG-WP1 is Amber.

Do not merge until:

- all seven current game families use the shared launch/session contract or an explicitly documented temporary adapter;
- no accepted world behaviour has intentionally changed;
- MG-caused CI failures are resolved;
- David approves the migration package.

## Current checkpoint

Implementation is complete through **MG-WP1F** and final validation is in progress.

Completed migration:

- MG-WP1A - Rainbow Disc, Pond Leap and Sunbeam Chess;
- MG-WP1B - Wobbly Cake;
- MG-WP1C - Coral Beachcombing;
- MG-WP1D - Firefly Lantern;
- MG-WP1E - all five regular Rainbow Run courses, including the Crystal Cascade gateway and Rainbow Cup launch path;
- MG-WP1F - branch-level stale registration/launch audit.

Closeout evidence: `docs/audits/2026-10-03-MG-WP1-MIGRATION-CLOSEOUT-AUDIT.md`.

The package remains `in_progress` until exact-head technical validation is acceptable and the human gate is approved.
