# Scene composition contract

Status: H0D canonical scene composition contract

The scene layer owns world- or surface-specific composition. Reusable lifecycle, input, navigation and presentation concerns should be composed through narrow helpers rather than copied between scenes or pushed into one growing base class.

## Required scene declaration

Every new scene must declare, either in code through `defineSceneContract` or in its accompanying implementation record:

- stable scene key and category;
- load boundary (`startup`, `runtime-eager` or `on-demand`);
- audio context;
- persistence/save identity;
- spawn and return semantics;
- shell/HUD mode;
- interaction/conversation ownership;
- responsive mode;
- teardown ownership;
- owning test tags/contracts.

Scene keys, save-facing location IDs and return payload keys are compatibility boundaries. Do not rename them as part of scene cleanup.

## Composition rules

- Prefer small helpers with one lifecycle owner over inheritance for cross-cutting behaviour.
- `InteractiveMicroLocationScene` remains valid evidence of reusable composition, but it is not the required parent for new scenes.
- App-wide services are installed by bootstrap/application owners. Scene-scoped resources are created by the scene and disposed when that scene shuts down or is destroyed.
- Input adapters/listeners, timers, scale listeners, event-bus subscriptions and native overlays must have an explicit disposer.
- A scene that can be re-entered must not accumulate listeners or retain stale input state from the previous activation.
- Navigation code must preserve established return-scene payloads, spawn positions and save-location mappings.
- Exploration shell/HUD, interaction coordinator and modal/conversation lock integration should be attached explicitly when required, not inferred through unrelated imports.

## Lifecycle scope

`SceneLifecycleScope` is the canonical small helper for scene-owned teardown. It:

- owns disposer callbacks;
- can own event-listener removal;
- closes idempotently;
- binds to both Phaser `shutdown` and `destroy` lifecycle events;
- removes lifecycle hooks when closed;
- permits defensive close-before-recreate for scenes that are re-entered.

`SceneInputRuntime` is the first composition proof. It owns the existing keyboard and pointer/touch adapters through a lifecycle scope and can bind an interactive Phaser target to a stable input action without leaving handlers behind.

## Manifest and loading

`SceneManifest.ts` is the canonical, side-effect-free identity/loading inventory for live scenes. Startup order and runtime-eager/on-demand loading policy can therefore be tested without booting Phaser. `StartupSceneRegistry.ts` is the browser composition adapter that maps startup manifest keys to constructors; this keeps constructor imports out of the metadata contract while preserving the existing startup graph. H0H may later change loading policy only with measured evidence.

The stable `VillageInteriorScene` key intentionally points to `R6VillageInteriorScene.ts`, the live implementation. The older duplicate remains a retirement candidate for H0J and is not deleted by H0D.

## H0D proof migration

`DoorwayStubScene` is the bounded proof scene. Its visual layout, copy, stable key, default return scene and INTERACT/BACK behaviour remain unchanged. Only input/lifecycle ownership moves from local ad-hoc setup to the composition helpers.
