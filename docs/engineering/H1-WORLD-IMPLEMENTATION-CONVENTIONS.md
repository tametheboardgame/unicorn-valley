# H1 world implementation conventions

These conventions capture the reusable engineering patterns established by the completed Moonflower Glade H1.1-H1.11 work. They are intended for later R6.5 region/content work, not as a reason to rewrite unrelated stable systems immediately.

## 1. One owner for one visible thing

A production world feature should have one canonical runtime owner.

Examples from Moonflower Glade:

- base terrain/landmarks: `MoonflowerGladeScene`;
- polished route geometry: `ExplorationPathPolishManager`;
- stream surface, reed beds and ambient fish: `MoonflowerStreamLife`;
- approved physical signs and growing plots: `MoonflowerGladeFinalPresentation`;
- Pip production art: `CoreNpcProductionPresentationManager`;
- explicit world interactions: `SceneInteractionRegistry` + `WorldInteractionCoordinator`;
- dialogue: `WorldConversationPresenter` / `DialogueCard`;
- non-dialogue world guidance/reaction: `WorldFeedbackPresenter`;
- reward/quest/transient exclusivity: shared transient-feedback ownership.

Do not create a prototype object and then rely on a later manager to find, hide or destroy it. Remove the obsolete source object instead.

## 2. Semantic data before presentation hunting

Gameplay references should be based on stable semantic ids/data rather than locating anonymous visual objects by coordinates, colour or child count.

Prefer:

- map entries with stable ids;
- named production containers/sprites;
- interaction registry owner ids;
- explicit world/save flags;
- stable garden/fishing/collectable hook ids.

Avoid:

- `scene.children.list` scans looking for an object near an approximate coordinate;
- identifying gameplay objects by emoji/text glyph;
- matching by arbitrary display dimensions or child counts when an owner can name the object instead.

A scene-child scan can still be justified for a genuinely generic presentation system, but not as the normal way to connect one known feature to another.

## 3. Physical collectables use the shared pickup language

A physical world collectable should normally:

1. register through `SceneInteractionRegistry`;
2. use `actionKind: 'pick-up'`;
3. show the shared `Pick up` action;
4. require explicit activation rather than walk-over collection;
5. revalidate current eligibility/state in the activation callback;
6. award/change state idempotently;
7. remove its interaction and visible object immediately when collected;
8. use semantic save/discovery/inventory state so reload cannot duplicate it.

Pure clues/scenery can use `Inspect`; NPCs use `Talk`; entrances use `Enter` or the relevant shared semantic action.

## 4. Interactions belong to the shared coordinator

Production exploration scenes should not maintain a second local interaction prompt/activation stack once migrated.

Use:

- `SceneInteractionRegistry` for semantic targets;
- `WorldInteractionCoordinator` for selection/activation;
- the shared interaction prompt/affordance presentation;
- explicit `actionKind` rather than deriving user-facing wording ad hoc.

Compatibility bridges may exist while older regions are migrated, but they must be bounded and clearly identified. A migrated scene should not retain its legacy activator merely so the bridge can monkey-patch it.

## 5. Dialogue and feedback have explicit ownership

Use the shared dialogue presenter for conversations. Do not layer ordinary notifications over active dialogue.

Transient priority is conceptually:

1. dialogue/modal ownership;
2. quest-complete/high-priority completion presentation;
3. explicit guidance;
4. ordinary reward/discovery/reaction feedback.

Related messages should be suppressed rather than duplicated. Independent lower-priority messages may queue if they still add useful information.

State transitions that cause completion feedback should happen at the intended semantic moment. In particular, do not mutate quest progression merely while selecting which dialogue to display.

## 6. Presentation lifecycle must be bounded

A presentation owner should either:

- create its objects once for the scene instance and tear them down on scene shutdown/destroy; or
- maintain a small explicit runtime state and update only what genuinely changes.

Avoid perpetual full-scene scans whose purpose is to keep an obsolete object hidden.

For game-level managers using `POST_STEP`/`POST_UPDATE`:

- unsubscribe on game destruction;
- use a throttle for state that does not require frame-rate updates;
- separate smooth frame-driven motion (followers/animation) from low-frequency state reconciliation where practical;
- do not rerasterise unchanged text/icons every frame;
- name canonical objects so subsequent lookups are direct.

## 7. Preserve smooth simulation; stabilise presentation only

Do not fix visual shimmer by integer-snapping NPC/fish/player simulation coordinates.

It is appropriate to round final presentation-only screen/camera-derived coordinates for UI markers/feedback where sub-pixel placement causes shimmer. Authored moving world entities should keep smooth interpolation/tweens.

## 8. Physical props have semantic collision

If a sign/prop is meant to be a physical world object:

- give it an intentional visual owner;
- define collision from semantic map geometry, not by inspecting the rendered object later;
- keep collision compact enough not to block required approaches/routes;
- cover route reachability with map/traversal tests where the object sits near a critical path.

## 9. Future systems attach to stable hooks

Do not implement a whole future mechanic merely to prepare for it. Provide the semantic hook.

Examples:

- growing plots have stable `garden:*` ids and interaction points ready for future planting/harvesting;
- the Glade stream exposes a stable fishing hook and ambient-fish ids without implementing fishing gameplay.

Future systems should attach to these ids/data rather than finding a visual rectangle/fish by coordinates.

## 10. Tests protect final contracts, not intermediate patches

When an approved design replaces earlier behaviour:

- update/delete stale tests that encode the retired behaviour;
- add tests around the new semantic contract;
- do not reintroduce legacy production code solely to keep an old test passing.

Useful contracts include:

- map/traversal reachability and collision;
- interaction action kind and idempotence;
- progression sequencing;
- production-art safe bounds;
- registry ownership;
- stable semantic ids/hook data;
- lifecycle/architecture boundaries where they can be verified cheaply.

## Review smell checklist

Before adding a workaround, investigate the source if code does any of the following:

- loops through all `scene.children` looking for one known feature;
- hides/destroys an older equivalent immediately after scene creation;
- uses a delayed callback only to remove something another owner creates late;
- polls every frame/100 ms for presentation which should be one-time;
- identifies an object by approximate x/y, glyph, fill colour or child count;
- contains a checkpoint-specific `H1.x` runtime name after the behaviour has become canonical;
- keeps two interaction/dialogue/feedback systems alive in the same migrated scene.

Those are investigation triggers, not automatic proof of a bug, but H1 showed that they are common sources of duplicate presentation, performance regressions and hard-to-find visual artefacts.

## Completion record

These conventions were finalised as part of the completed H1.11 consolidation pass. They are the default starting point for R6.5-WP19H2 and later area-specific polish work unless a future package explicitly supersedes them.