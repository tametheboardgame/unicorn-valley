# Unicorn Valley runtime architecture

Status: H0B canonical runtime boundary contract

This document turns the WP19H0 H0A inventory into an explicit architecture contract. It describes where runtime code belongs, which lifetime owns it, and which dependency directions are allowed. It is behaviour-preserving: save IDs, scene keys, progression, navigation, interaction, UI and audio contracts remain unchanged.

## Principles

- Prefer explicit composition and narrow owners over import side effects or a central god object.
- Stable save IDs, scene keys and public content IDs are compatibility boundaries, not refactor targets.
- Domain/state code must not reach upward into scene or presentation implementation.
- Application services may coordinate domain/state and Phaser scene lifecycle, but should not own scene-local visual composition.
- Scene composition owns world-specific orchestration and delegates reusable cross-cutting behaviour to application services or presentation primitives.
- Presentation/UI owns rendering, control semantics and visual state, not persistent game rules.
- Typed game events are preferred for cross-subsystem domain facts. Phaser events remain appropriate for Phaser/game/scene lifecycle.
- Transitional compatibility managers remain temporary and must carry retirement evidence rather than becoming permanent architecture by inertia.

## Practical layers

### 1. Platform/bootstrap

Current owners: `src/main.ts`, `src/game/config/`, browser capability/bootstrap code.

Responsibilities:

- create the Phaser game;
- install app-wide services and capability-conditional integrations;
- establish production diagnostics boundaries;
- register or delegate scene loading policy.

May depend on every lower layer because it is the composition root. Lower layers must not depend on `src/main.ts`.

### 2. Domain/state

Current owners include persistence under `src/game/save/`, quest/economy/relationship/inventory rules and content-backed models.

Responsibilities:

- serialisable state and migrations;
- pure or stateful game rules;
- compatibility-safe IDs and mappings;
- repositories and storage abstractions.

Domain/state may depend on data/content types and typed domain events. It must not depend directly on scene implementations or UI/presentation implementation. Existing save-location mapping to world location IDs is a compatibility seam and is permitted until a later bounded migration proves a cleaner ID owner.

### 3. Application services

Canonical folder for new explicit cross-cutting orchestration: `src/game/application/`.

Responsibilities:

- coordinate multiple domain/state owners;
- coordinate scene lifecycle/registration where the concern is cross-scene rather than scene composition;
- translate typed domain events into application actions;
- own app-wide or feature-wide lifecycle when ownership is not visual.

Application services may depend on domain/state and scene registration/lifecycle APIs. They should expose narrow interfaces and must not become a catch-all service locator.

H0B proof migration: `ContinueRestoreManager` moves from `src/game/save/` to `src/game/application/` because it reads persistence, updates title-scene Continue state and ensures a lazy destination scene is registered. Its implementation and stable IDs remain unchanged.

### 4. Scene composition

Current owners: `src/game/scenes/`, `src/game/activities/` and scene-specific composition helpers.

Responsibilities:

- world/scene-specific object creation;
- local collision and interaction wiring;
- spawn/return payload handling;
- attachment of reusable HUD/input/conversation/application services;
- deterministic teardown of scene-scoped subscriptions.

Scene composition may depend on application services, domain/state and presentation/UI. It should not create new app-wide singletons as a side effect of being imported.

### 5. Presentation/UI

Current owners: `src/game/ui/`, visual presentation owners and DOM/CSS controls.

Responsibilities:

- canonical visual primitives and design tokens;
- dialogue/message/control presentation;
- DOM overlay semantics, focus and pointer/touch behaviour;
- responsive layout and safe-area behaviour.

Presentation may consume domain/application read state but must not persist game progression directly. H0C will tighten this boundary once the canonical design system and DOM bridge exist.

### 6. Content/assets/generated data

Current owners: `src/content/`, static maps/data and generated catalogues.

Responsibilities:

- declarative content and stable content IDs;
- data consumed by domain/application/scene code;
- generated catalogues that do not become runtime ownership layers.

### 7. Tests/diagnostics

Current owners: unit/browser tests and `src/game/testing/`.

Responsibilities:

- verification and opt-in diagnostics;
- no accidental production ownership or unconditional startup dependency.

## Lifetime contract

Use the narrowest lifetime that satisfies the behaviour.

- App-wide: one owner for the Phaser game lifetime. Appropriate for save repository composition, typed application event infrastructure and truly cross-scene coordinators.
- Capability-conditional app-wide: installed only when the browser/device capability requires it, for example portrait creator or race touch controls.
- Scene-scoped: created/attached for one active scene and torn down on `SHUTDOWN`/`DESTROY` as appropriate.
- Modal-scoped: exists only while its modal/sheet is open; owns focus/input lock and releases them on close.
- Transient: command/request work with no retained lifecycle after completion.

An app-wide manager that stores per-scene state must subscribe and unsubscribe explicitly to scene lifecycle; per-frame global scanning is not the default ownership model. Existing scanning/cleanup managers are H0J retirement candidates and are not legitimised by this document.

## Event contract

`src/game/events/GameEventBus.ts` is the canonical typed bus for cross-subsystem game facts such as save completion, item collection, quest progression and interaction activation.

Rules:

- add a typed payload to `GameEventMap` for a new cross-subsystem domain/application event;
- do not introduce untyped global string events when the typed bus is suitable;
- Phaser Core/Scene events are allowed for Phaser lifecycle and engine-local coordination;
- event listeners must have an explicit lifetime and unsubscribe path unless the listener intentionally lives for the whole game;
- an event communicates a fact or request boundary, not hidden ownership of unrelated state.

## Composition root contract

`src/main.ts` is allowed to know concrete app-wide installers. It should progressively become declarative composition rather than a list of unrelated singleton getter side effects.

H0B begins this by placing application orchestration in `src/game/application/`. H0D will own the scene manifest/registration policy; H0H will own measured lazy-loading boundaries. Those later phases must not be pre-empted by speculative mass movement in H0B.

## Enforced dependency rules

H0B introduces `scripts/architecture/checkArchitectureBoundaries.mjs` and a self-test.

Initial hard rule:

- files under `src/game/save/` may not import `src/game/scenes/`, `src/game/ui/` or `src/game/application/`.

This is deliberately narrow and high-value. It prevents persistence/domain code from acquiring new upward dependencies while the remaining architecture is migrated incrementally. Existing world-location ID imports in `ContinueLocation.ts` are documented compatibility dependencies and are not broadened into permission for presentation/scene orchestration.

Rules are fail-safe additions: expand them only after current ownership has been migrated and proven, rather than adding a large allow-list that normalises existing debt.

## H0B representative migration

Before H0B, `ContinueRestoreManager` was stored under `src/game/save/` while importing `StarlightBeachSceneRegistration` and mutating active `TitleScene` Continue state. That made persistence appear to own cross-scene orchestration.

H0B moves the same implementation to `src/game/application/ContinueRestoreManager.ts` and updates the composition-root import. No class API, scene key, save ID, status wording, lazy registration behaviour or singleton lifetime changes in this checkpoint.

The architecture self-test injects a synthetic persistence-to-scene dependency and asserts that the guard rejects it. The real repository check then verifies that production persistence has no such edge.

## Deferred boundaries

The following are intentionally owned by later H0 phases:

- H0C: canonical UI tokens/primitives and canvas/DOM overlay bridge;
- H0D: scene manifest, scene composition/scaffolding and lifecycle recipe;
- H0E-G: test ownership and deterministic selective CI;
- H0H: measured loading/performance policy;
- H0J: removal of transitional cleanup/migration managers and remaining duplicate paths.

Do not treat deferral as approval of current debt. The H0A retirement ledger remains the evidence source for those migrations.
