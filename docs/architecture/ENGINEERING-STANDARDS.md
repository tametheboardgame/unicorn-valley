# Unicorn Valley engineering standards

These standards describe the architecture that exists after R6.5-WP19H0. They are the default path for new work. A bespoke path is acceptable only when the work package explains why the canonical path cannot satisfy the requirement and adds the necessary validation.

## 1. Layering and ownership

- `src/content/**` owns authored/configuration data and bindings.
- `src/game/**` owns runtime behaviour grouped by subsystem.
- `src/game/scenes/**` composes subsystem behaviour into Phaser scenes; scenes should not become replacement service containers.
- `src/game/ui/**` owns reusable presentation, shared UI primitives and canvas/DOM coordination.
- `src/game/application/**` owns app-wide orchestration that genuinely spans scenes.
- `src/main.ts` is the composition root. Do not add feature logic there. New bootstrap registration must be justified against the loading policy and performance report.
- Cross-subsystem imports should use an existing public/coordinator contract where one exists. Do not bypass ownership merely to reach internal state.

Mechanical boundary rules are enforced by `scripts/architecture/checkArchitectureBoundaries.mjs` and `npm run architecture:validate`.

## 2. Scene construction recipe

Every new or materially reworked scene must be represented by the canonical scene system:

1. Define its contract through `SceneCompositionContract.ts` / `defineSceneContract`.
2. Register it in `SceneManifest.ts` with the correct `loadBoundary`: `startup`, `runtime-eager` or `on-demand`.
3. Use `SceneLifecycleScope` / `bindSceneLifecycle` for subscriptions and other disposers that must end on scene shutdown/destroy.
4. Keep the stable Phaser scene key unchanged unless an approved migration owns changing it.
5. Declare the scene's audio, persistence, return/spawn, shell, interaction, responsive and teardown expectations in the contract rather than hiding those assumptions in ad hoc code.
6. Add the unit/browser test tags required by the manifest contract.

Do not directly add another competing scene registry. On-demand registration helpers may wrap manifest-backed lazy imports, but rejected imports must remain retryable.

## 3. Navigation, return position and persistence

- Treat scene keys, save IDs and progression IDs as compatibility contracts.
- Use the scene contract's `persistence` and `spawnReturn` fields to choose the mechanism. Existing choices are `save-location`, `return-payload`, `scene-owned` and `none`.
- A modal/interior transition that should return the player to the interaction point must preserve that return payload rather than respawning at the region entrance.
- Continue/reload behaviour is an authoritative browser contract. Changes affecting save restoration, scene keys, return payloads or app-wide navigation escalate to full verification.
- Do not change save shape or stable identifiers as a refactor convenience.

## 4. UI design system

Canonical design values live in `src/game/ui/UiDesignSystem.ts` as `UI_DESIGN_TOKENS`. Reusable canvas construction belongs in `src/game/ui/UiPrimitives.ts`; concept-grade shared composition belongs in `ConceptUi.ts` and the established exploration shell components.

Rules:

- Reuse tokens for colour, typography, radius, border, shadow, spacing, depth, logical viewport and minimum touch targets.
- Do not copy literal concept colours/spacing into a new component when an equivalent token exists.
- Add a token only when it represents a reusable design decision, not a one-off coordinate.
- Preserve the 48 px minimum touch target unless a specifically approved exception is documented and tested.
- Treat responsive behaviour as part of the component contract, not a later CSS patch.

A bespoke UI implementation must explain why the canonical primitive cannot represent the interaction and must still consume shared tokens where applicable.

## 5. Canvas and DOM overlays

`CanvasDomOverlayBridge.ts` is the canonical bridge for native DOM controls positioned over the Phaser canvas.

- Resolve placement in the 1280 x 720 logical canvas coordinate space.
- Let the bridge scale positions/sizes and enforce minimum CSS control dimensions.
- Use `visibilityBounds` / `visibilityMode` for clipping/containment rather than duplicating viewport arithmetic.
- Register through the bridge and retain its disposer. Scene-owned registrations must be released through scene lifecycle ownership.
- DOM controls must not leak pointer events into game movement beneath them.
- Prefer canvas-native controls unless native DOM semantics materially improve accessibility/input behaviour.

## 6. Interaction, dialogue and world feedback

- World interaction arbitration belongs in `src/game/interaction/**`, particularly `WorldInteractionCoordinator` and the existing core interaction bridge.
- Dialogue behaviour belongs in `src/game/dialogue/**`; do not implement a parallel conversation system inside an individual scene.
- Reusable player-facing feedback should use the canonical presenter path in `src/game/ui/WorldFeedbackPresenter.ts` and established feedback helpers.
- Event names are contracts. Reuse an existing event when it has the correct ownership/semantics. If a new event is necessary, define its producer, consumer and lifecycle ownership together.
- Interaction range, facing and input method differences must remain consistent across pointer, keyboard and touch.

## 7. Audio

- Authored MP3/SFX mapping belongs in `src/content/audioBindings.ts` and the generated catalogue, not hard-coded scene file paths.
- Runtime audio behaviour belongs in `src/game/audio/**`.
- Scene music context should be declared through the scene contract and resolved through the existing audio binding/context system.
- Settings are persisted through `AudioSettings`; playback/context transitions go through the established audio manager/`VerticalSliceAudio` path.
- New audio must preserve mute/music/SFX/ambience settings, browser unlock behaviour and transition/crossfade semantics.
- Adding files under the audio content folders must keep `npm run audio:catalogue:check` clean.

## 8. Accessibility, touch and focus

- Touch/mobile is a first-class acceptance surface.
- Controls must meet the shared minimum target sizing and remain reachable within safe UI bounds.
- Native DOM controls must preserve semantic focus/keyboard behaviour and must not create a second visual state disconnected from the canvas state.
- Avoid device detection based solely on viewport width when pointer capability is the behaviour being selected.
- Any settings, controls, navigation or overlay change must exercise the relevant accessibility/touch browser group.

## 9. Testing and selectors

The verification policy is code, not a judgement call made independently on every PR.

- Unit tests live next to the source when practical and assert behavioural contracts, not historical coordinates/implementation order.
- Browser tests live under `tests/play/**` and should use semantic/stable selectors or diagnostics contracts rather than fragile screen coordinates.
- `scripts/verification/verificationOwnership.mjs` maps source ownership to unit/browser groups.
- Unmapped runtime/test files fail safe to full verification.
- A current change to app bootstrap, architecture, scenes/manifest, persistence, CI/build/test infrastructure or another explicit escalation path may run full qualification immediately. Pull-request synchronisation uses the new delta where possible so an older escalation file does not make every subsequent minor edit repeat the full matrix.
- Never weaken a test solely because a refactor made its implementation-specific assertion inconvenient; replace brittle assertions with the user-visible or architectural contract they were intended to protect.

## 10. Validation workflow

For a small, mapped fix during active development:

- run formatter/lint/static architecture checks;
- run the ownership-selected unit/browser contracts;
- build/static-smoke only where runtime output changes;
- do not add the full Chromium/cross-browser matrix merely because an earlier commit in the same PR touched a wider subsystem.

For a feature touching one or more owned subsystems:

- run the selected unit groups and targeted browser groups;
- use representative shared-system regression coverage for the subsystem changed;
- run the performance policy when loading/bundle-sensitive files change;
- allow a **current high-risk delta** or unmapped runtime path to escalate when necessary.

For a human-approved substantive slice before merge to `main`:

- manually dispatch Tier 0-4 authoritative qualification against the exact approved head, including the full Chromium shards and Chromium/Firefox/WebKit compatibility matrix;
- for release qualification, also run the immutable-deployment startup/save/reload/Continue smoke on the exact candidate SHA;
- do not merge until that final exact-head gate is green.

`TESTING.md` contains the operator-facing command matrix.

## 11. Performance and loading

`scripts/performance/performancePolicy.mjs` is the canonical loading budget policy.

- Preserve the entry, initial/title/first-playable graph, largest-lazy-chunk and chunk-count guardrails.
- Total emitted JavaScript is a breadth trend metric, not a proxy for startup cost.
- Browser diagnostics must remain outside the initial graph.
- Material identical JavaScript chunks are a hard regression.
- Optional feature breadth should be on-demand when the scene manifest says it is on-demand; do not split tiny modules merely to make a headline bundle number smaller.
- `vite:preloadError` recovery and no-cache HTML are part of the stale-deployment contract. Keep hashed assets immutable.

## 12. Deprecation and removal

Compatibility code is temporary architecture, not permanent permission to add more compatibility code.

Before removal:

1. identify all producers/consumers and the canonical replacement;
2. migrate one bounded slice;
3. add/adjust tests around the replacement contract;
4. prove no required runtime/save/navigation path still depends on the compatibility owner;
5. delete implementation, tests/helpers and bootstrap registration together where safe;
6. run the verification selected for the affected ownership plus any required full escalation;
7. update the WP19H0 retirement ledger.

If an item cannot safely be removed, record the reason, remaining owner/dependency and deletion trigger. Do not conceal unfinished retirement behind an unused duplicate implementation.

## 13. Fresh-agent discovery path

For a new scene/dialogue/menu task, inspect in this order:

1. `SceneCompositionContract.ts` and `SceneManifest.ts` for scene ownership/loading.
2. `SceneLifecycleScope.ts` for lifecycle cleanup.
3. `UiDesignSystem.ts`, `UiPrimitives.ts`, `ConceptUi.ts` and `CanvasDomOverlayBridge.ts` for presentation.
4. `src/game/interaction/**`, `src/game/dialogue/**` and `WorldFeedbackPresenter.ts` for interaction/feedback.
5. `src/content/audioBindings.ts` and `src/game/audio/**` for audio context.
6. `verificationOwnership.mjs` and `TESTING.md` before deciding validation scope.
7. `performancePolicy.mjs` when changing bootstrap, scene loading or dependency boundaries.

If the requested implementation appears to require bypassing these paths, treat that as an architecture decision rather than an ordinary shortcut.
