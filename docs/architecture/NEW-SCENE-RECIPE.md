# New scene recipe

Use this checklist for every new Unicorn Valley scene. Do not copy an arbitrary existing scene as the starting architecture.

## 1. Declare the contract

Create a `defineSceneContract` declaration beside the scene and explicitly set:

- `key`: stable Phaser scene key;
- `category`: bootstrap, exploration, interior, modal, activity, race, onboarding, story, HUD, utility or diagnostic;
- `loadBoundary`: startup, runtime-eager or on-demand;
- `audioContext`: none, menu, world, activity or inherit;
- `persistence`: none, profile, save-location, settings or return-payload;
- `spawnReturn`: none, scene-owned, save-location or return-payload;
- `shell`: none, exploration, modal or activity;
- `interaction`: none, scene-owned or world-coordinator;
- `responsive`: canvas-fit, touch-adaptive or portrait-companion;
- `teardown`: scene-lifecycle-scope, scene-owned or app-owned;
- `testTags`: stable product/subsystem contracts that own the scene.

If the scene key or persistence identity already exists, treat it as a compatibility boundary rather than inventing a replacement.

## 2. Register it once

Add the scene to `SCENE_MANIFEST`.

- Startup scenes must preserve deliberate startup order and provide their constructor.
- Runtime scenes must provide a lazy constructor factory and state whether bootstrap or the feature owns registration.
- Do not add a second implementation for an existing stable scene key.
- Do not move a scene between startup/runtime/on-demand boundaries without performance evidence and the relevant H0 qualification.

## 3. Compose scene-scoped services

Create a `SceneLifecycleScope` at `create()` and bind it to the scene lifecycle. Prefer narrow helpers for recurring responsibilities, for example input, player/controller, HUD/shell, interaction coordinator, conversation/modal lock, audio context, persistence/checkpoint, discovery and responsive hooks.

If the scene can be re-entered, defensively close any prior scope before creating a replacement.

## 4. Own teardown

Every registration must have a clear owner. Dispose event listeners, input adapters, timers, scale hooks, overlays and temporary game objects on scene shutdown/destroy. Cleanup must be safe when called more than once.

## 5. Preserve navigation and persistence

Keep established return payloads, spawn/checkpoint behaviour, save IDs and scene keys unchanged unless a migration is explicitly designed and tested.

## 6. Add tests at the right level

At minimum:

- unit-test pure contract/lifecycle behaviour;
- add or update the owning browser/product test when observable navigation, responsive behaviour or interaction changes;
- include a re-entry/leak test when the scene registers listeners or input handlers;
- use semantic scene/action identities rather than implementation row indexes or fixed click coordinates where possible.

## Review checklist

A scene is ready when another engineer can answer all of these from the declaration and code: who loads it, who owns its resources, how it returns, what it persists, which shell/input model it uses, how it adapts to viewport/touch, how it tears down and which tests protect it.
