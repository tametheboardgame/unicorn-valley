---
id: MG-WP0
title: Mini-Game Platform Foundation
status: proposed
autonomy: amber
depends_on: []
parallel_safe: true
human_gate: architecture
---

# MG-WP0 - Mini-Game Platform Foundation

## Purpose

Implement the shared mini-game platform described by `docs/architecture/MINI-GAME-PLATFORM.md` without redesigning the existing games.

This is the first bounded package in the independent `MG` programme. It is not part of R6.5/WP19 numbering and may proceed independently of world-area work when branch/dependency conflicts are controlled.

Mini-game platform impact: **platform foundation**

## Scope

Create the canonical subsystem needed for world-first and Just-Games-first mini-games to share one implementation.

Required implementation owners:

- `src/game/minigames/MiniGameCatalogue.ts`;
- `src/game/minigames/MiniGameSession.ts`;
- `src/game/minigames/MiniGameLauncher.ts`;
- `src/game/minigames/MiniGameOutcomeGateway.ts` or equivalent names preserving the same ownership;
- `SceneManifest` integration;
- catalogue/platform validation tests;
- verification ownership mapping.

The exact file decomposition may be refined if implementation evidence shows a simpler ownership boundary, but it must not create a competing scene registry or duplicate game implementations.

## Required current-state audit

Before migration, confirm and record the current launch/return owner for:

- Rainbow Disc;
- Sunbeam Chess;
- Pond Leap;
- Wobbly Cake;
- Firefly Lantern;
- Coral Beachcombing;
- Rainbow Run Racing.

Known architecture drift to resolve includes:

- mixed manifest versus feature-owned registration;
- direct world-scene dynamic imports/scene additions;
- bespoke `returnScene` payloads;
- Firefly Lantern's Woods-specific return;
- racing's specialist return context.

## Deliverables

### Catalogue

Create one typed catalogue of mini-game families and variants.

Initial families:

- Rainbow Run Racing;
- Rainbow Disc;
- Sunbeam Chess;
- Wobbly Cake;
- Firefly Lantern;
- Pond Leap;
- Coral Beachcombing.

The catalogue references manifest scene keys but never scene constructors.

### Session contract

Create a normalised immutable launch/session contract supporting at least:

- `source: 'world' | 'just-games'`;
- game ID;
- optional variant;
- return target;
- `world` versus `sandbox` side-effect policy;
- optional world context without physical-coordinate ownership.

### Generic launcher

Create one launcher responsible for manifest-backed availability, launch lifecycle and return orchestration.

Do not yet redesign game-specific UI.

### Outcome policy boundary

Create the boundary that allows normal world effects but suppresses adventure-state mutation in sandbox sessions.

It may initially be introduced alongside adapters for legacy games rather than requiring every domain outcome to be rewritten at once.

### Validation

Add objective tests for:

- unique catalogue IDs;
- valid manifest scene keys;
- valid variant IDs;
- visible catalogue metadata completeness;
- sandbox policy defaults;
- launcher/session return semantics where testable without Phaser;
- any manifest helper added for generic on-demand scene availability.

Update verification ownership for the new runtime subsystem.

## Non-goals

- no home-screen Just Games UI yet;
- no gameplay redesign;
- no new mini-game;
- no visual polish of existing activities;
- no reward/economy rebalance;
- no save-schema change solely for Just Games records;
- no production deployment.

## Invariants

- one canonical game implementation per family;
- SceneManifest remains the scene/load authority;
- accepted world progression remains unchanged;
- Just Games defaults to sandbox;
- stable existing scene keys are preserved unless a separately approved migration is unavoidable;
- touch/mobile and existing accessibility behaviour remain supported;
- main remains releasable.

## Technical validation

During development:

- formatting/lint/type/architecture checks;
- mini-game platform unit contracts;
- manifest/architecture tests;
- verification-policy tests;
- targeted lifecycle/browser tests if runtime launcher behaviour is introduced in the same slice.

Because `SceneManifest` and navigation/lifecycle can be escalation paths, final implementation may require broader CI according to the existing verification planner.

Before merge, run the authoritative full qualification required by the repo-wide fast-development CI contract on the exact human-approved head.

## Human gate

Architecture is Amber.

Stop for David's review after:

- the catalogue/session/launcher/outcome ownership exists;
- current games are represented or migration adapters are defined;
- tests demonstrate the two-context contract;
- no existing gameplay has been intentionally redesigned.

MG-WP1 does not begin until this architecture gate is approved and MG-WP0 is merged.

## Completion evidence

Record:

- final catalogue shape;
- final session shape;
- scene loading/registration path;
- sandbox policy;
- migration status of each existing game;
- validation/CI results;
- any intentional legacy adapters left for MG-WP2;
- exact next action.
