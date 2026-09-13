# WP19H0 execution tracker

## Authority and delivery

David authorised H0A-H0K in strict order on one long-lived delivery branch. Codex completed bounded H0A only; ChatGPT is continuing directly in GitHub because Codex/Work usage capacity is exhausted.

- Verified starting main: `ba60ede9ba8697f6015bfb3d79e98152a972403d`.
- Delivery branch: `agent/r6.5-wp19h0-consolidation`.
- Umbrella draft PR: #172.
- Canonical contract: `docs/work-packages/R6.5-WP19H0-PERFORMANCE-ARCHITECTURE-CODEBASE-CONSOLIDATION.md`.

## Phase state

- H0A: complete and accepted.
- H0B: complete and accepted.
- H0C: complete and accepted.
- H0D: active.
- H0E: not started.
- H0F: not started.
- H0G: not started.
- H0H: not started.
- H0I: not started.
- H0J: not started.
- H0K: not started.

## H0A acceptance evidence

H0A established the reproducible architecture/test/bundle/CI baseline without production `src/` or workflow behaviour changes. It recorded 471,915 raw entry bytes, 666,008 total-JavaScript gzip bytes (650.398 KiB) and 81 JS chunks. The inherited 650 KiB total-JS ceiling remained the only CI failure; project-contract and immutable deployment smoke passed.

## H0B acceptance evidence

Canonical architecture contract: `docs/architecture/RUNTIME-ARCHITECTURE.md`.

Representative migration: `ContinueRestoreManager` moved from `src/game/save/` to `src/game/application/` because it coordinates persistence, TitleScene state and lazy destination-scene registration. Its implementation, singleton lifetime, scene keys, save IDs and status wording were preserved.

Executable boundary tooling:

- `scripts/architecture/architectureBoundaries.mjs`;
- `scripts/architecture/architectureBoundaries.test.mjs`;
- `scripts/architecture/checkArchitectureBoundaries.mjs`;
- `npm run architecture:validate` runs in CI.

Initial hard rule: persistence under `src/game/save/` may not import scene, UI/presentation or application-orchestration implementation.

H0B checkpoint `e0b588c49cea3fa7eec748a79892b6f8bbdc1ed1` qualification:

- format and lint pass, with 34 inherited lint warnings;
- four architecture self-tests pass, including synthetic save-to-scene and save-to-application prohibited edges;
- production scan passes across 380 `src/game` files;
- type-check passes;
- 120 Vitest files / 465 tests pass;
- production build passes;
- AI project contract passes;
- immutable deployed startup/save/reload/Continue smoke passes;
- total JS is 650.2 KiB gzip against the unchanged 650 KiB envelope, so CI remains red only at the inherited performance gate. H0B slightly improves the H0A 650.4 KiB baseline and does not raise the budget.

H0B therefore satisfies all acceptance criteria and is closed.

## H0C acceptance evidence

H0C established `UiDesignSystem.ts` as the canonical visual token source, converged existing canvas/CSS consumers onto it, added reusable canvas primitives and introduced `CanvasDomOverlayBridge` as the supported native-control overlay path. Settings audio range/select controls now use the bridge for coordinate conversion, scaling, minimum sizing, containment/visibility, z-order, pointer propagation and lifecycle rather than bespoke canvas-to-DOM maths.

The recurring concept panel/shadow path was migrated to the reusable primitive contract as the canvas-only proof. Accessibility names and native range/select semantics were retained.

Current-head H0C qualification on `0423dc7215506b7c0768f6c9ac73abe75a300b60`:

- format, lint, architecture checks, type-check, unit tests and production build pass before the inherited performance gate;
- 121 Vitest files / 469 tests pass;
- project-contract validation passes;
- immutable startup/save/reload/Continue smoke passes;
- targeted Settings/UI browser regression passes;
- cross-browser compatibility rerun passes with 48 passed / 15 intentional skips across Chromium, Firefox and WebKit desktop/tablet/mobile configurations;
- one prior WebKit-tablet attempt timed out before canvas visibility, then passed in 1.4 seconds on the clean rerun with no code change, so it is recorded for H0E as environmental/flaky evidence rather than hidden or waived;
- total JS remains above the unchanged inherited 650 KiB ceiling at approximately 651.8 KiB gzip. The budget was not raised.

H0C therefore satisfies its UI, DOM-bridge, responsive and accessibility acceptance criteria and is closed.

## H0D active scope

H0D is implementing the smallest composition-first proof:

- one canonical scene manifest covering current startup and live runtime/on-demand scene identities without changing loading policy;
- a typed scene-composition declaration for new scenes;
- a reusable scene lifecycle scope with idempotent teardown and owned listener cleanup;
- a reusable keyboard/pointer input runtime composed through that lifecycle scope;
- migration of low-risk `DoorwayStubScene` without changing visual, navigation or input behaviour;
- regression coverage for stable manifest keys/startup ordering plus re-entry/listener cleanup;
- a durable scene composition contract and new-scene recipe.

The live `VillageInteriorScene` manifest owner is `R6VillageInteriorScene.ts`. The older duplicate remains untouched until H0J retirement evidence.

## Preservation and gates

Preserve saves/IDs/progression/navigation/movement/races, approved UI, responsive/accessibility, conversation/interaction and WP19H audio behaviour. Do not raise performance budgets or delete tests merely to obtain green CI. Complete and inspect each H0 phase before advancing. H0K requires the complete specified suite, cross-browser coverage and immutable preview smoke. Stop after H0K technical qualification for David's explicit approval; no merge, production deployment or H1-H13 work is authorised before that gate.
