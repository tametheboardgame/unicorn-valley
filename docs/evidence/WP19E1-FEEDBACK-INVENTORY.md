# R6.5-WP19E1 Feedback Producer Inventory

Date: 11 September 2026

This inventory records the ordinary world-feedback owners examined for WP19E1 and the semantic treatment applied to each. The package changes presentation only; quest, save, reward, discovery and interaction semantics remain owned by their existing services.

## Shared presentation owners

- `WorldFeedbackPresenter`
  - guidance: lower, fixed, non-modal mint/aqua card;
  - local reaction: warm peach world-space callout anchored to the interaction source and clamped to the camera-safe viewport;
  - repeated guidance/reactions replace the previous presentation rather than stacking;
  - feedback waits while an interaction modal/conversation owns the lower safe area;
  - reduced-motion disables the entry/exit motion rather than removing the message.
- `LegacyWorldFeedbackMigrationManager`
  - transitional inventory/migration adapter for known legacy fixed top-screen feedback signatures;
  - derives the active semantic interaction target from the shared `SceneInteractionRegistry`;
  - suppresses obsolete discovery/collection duplicates where the dedicated reward/discovery system already communicates the event;
  - explicitly excludes status/error surfaces such as locked race feedback.

## Migrated ordinary feedback producers

### Shared interaction coordinator

- Producer: `WorldInteractionCoordinator`, legacy object name `wp19d-interaction-feedback`.
- Classification: next-step/entry/talk messages become guidance; ordinary inspect/interact observations become local reactions when a source target is available.
- Result: no ordinary coordinator message remains in the fixed top-HUD zone.

### Moonflower Glade core scene

- Producer: `MoonflowerGladeScene.feedbackText`, legacy background `#fff9edee`.
- Classification:
  - first-discovery notification is an obsolete duplicate of the dedicated discovery/reward presentation and is suppressed;
  - any ordinary target-owned observation is eligible for local reaction placement.
- Static HUD guide copy is not a transient feedback producer and is outside this migration.

### Sunbeam Village core scene

- Producer: `SunbeamVillageScene.feedbackText`, legacy background `#fff9e8ee`.
- Classification:
  - fountain/landmark observations are local reactions anchored to the active object;
  - NPC conversations remain owned by the WP19E conversation system, not this presenter.

### Rainbow Meadow core scene

- Producer: `RainbowMeadowScene.feedbackText`, legacy background `#fff9e8ee`.
- Classification:
  - Ribbon Board and equivalent inspect responses are local reactions;
  - region/discovery notifications are obsolete duplicates of the dedicated discovery/reward presentation and are suppressed.

### Crystal Brook core scene

- Producer: `CrystalBrookScene.feedbackText`, legacy background `#f5fff2ee`.
- Classification:
  - first-visit region discovery, secret-place discovery and `Found ...!` collect messages are obsolete duplicates of dedicated discovery/item reward feedback and are suppressed;
  - ordinary interaction feedback continues through the depth/story owners below.

### Whispering Woods core scene

- Producer: `WhisperingWoodsScene.feedbackText`, legacy background `#efffeeea`.
- Classification: first-visit and discovery notifications are obsolete duplicates of dedicated discovery/reward feedback and are suppressed.

### Crystal Brook depth interactions

- Producer: `CrystalBrookDepthWorldManager`, legacy background `#f3fff8f2`.
- Guidance examples: closed Prism Grotto, Echo/next-step direction.
- Local reaction examples: shallow splash, singing crystals, pebble stack, reflection pool, waterfall mist, stepping chime and equivalent world observations.
- Reference WP19E1 guidance case: closed Prism Grotto message.

### Rainbow Meadow depth interactions

- Producer: `MeadowDepthWorldManager`, legacy background `#fff9eaf2`.
- Guidance examples: locked Windmill Lookout and equivalent next-step direction.
- Local reaction examples: windmill bell, pond, picnic hill, flower/petal interactions, butterflies, record/cup-board observations.

### Whispering Woods depth interactions

- Producer: `WoodsDepthWorldManager`, legacy background `#f2fff0f2`.
- Guidance examples: closed Firefly Grove and equivalent next-step direction.
- Local reaction examples: mooncaps, fireflies, leaf pile, tiny tracks, hollow log, mushroom ring and equivalent observations.

### Moonflower Glade depth interactions

- Producer: `GladeDepthWorldManager`, legacy background `#fff9eaf2`.
- Guidance: story/quest next-step messages where the text directs the player elsewhere.
- Local reactions: bridge/pebble, stream, garden, cottage step, fireflies and equivalent object responses.

### Cottage depth interactions

- Producer: `CottageDepthWorldManager`, legacy background `#fff7eaf0`.
- Classification: furnishing/touch-point responses are local environmental reactions anchored to the bed, sofa, fireplace, window or companion corner.

### Sunbeam Village life interactions

- Producer: `VillageLifeWorldManager`, legacy background `#fff8eaf2`.
- Classification: ordinary prop/fountain/object responses are local reactions; explicit quest-next-step wording remains guidance; discovery duplicates remain owned by the discovery/reward system.

### Existing Valley quest pack

- Producer: `ExistingValleyQuestPackWorldManager`, legacy background `#fff8ecf2`.
- Classification: quest-direction/next-step messages are guidance; immediate object reactions and observations are local reactions.

### Cross-region follow-up

- Producer: `CrossRegionFollowUpWorldManager`, legacy background `#fff9edf2`.
- Classification: cross-region quest direction is guidance; immediate inspect/world responses remain local reactions.

### Starlight Beach content

- Producer: `StarlightBeachContentWorldManager`, object name `r6-5-beach-content-feedback`, background `#fff9eaf2`.
- Classification: quest direction/talk/start progression is guidance where applicable; shell, wind and environmental observations are local reactions; discovery events retain their dedicated discovery/reward meaning.

## Discovery-specific duplicate producers

- `WhisperingWoodsSecretWorldManager`, legacy discovery background `#efffeef2`.
- `CrystalBrookStoryWorldManager`, object name `crystal-brook-story-feedback`, legacy discovery background `#f4fff1f2`.
- Core-scene messages beginning `New discovery!`, `New place discovered!`, `Secret place discovered!` or `Found ...!`.

Treatment: the obsolete top banner is suppressed. The dedicated `RewardFeedback`/Wonderbook discovery semantics remain unchanged and are not re-styled as ambient feedback.

## Explicitly separate status/error feedback

- Producer: `R65RaceExpansionWorldManager`, object name `r6.5-wp12-race-feedback`.
- Classification: explicit locked/status feedback.
- Treatment: excluded from the ambient guidance/reaction migration. WP19E1 must not turn a failure/status message into an environmental reaction. Any future placement change for this surface must preserve its explicit status/error meaning.

## Separate systems retained unchanged

- `WorldConversationPresenter` / `DialogueCard`: NPC and quest dialogue.
- `RewardFeedback`: item, discovery, quest-complete and Shimmer reward feedback.
- Wonderbook discovery/unlock semantics.
- `InteractionPrompt`: Talk / Interact / Enter / Start and associated target hint.
- Static scene HUD labels/instructions that are not transient feedback.

## Validation references

Automated WP19E1 coverage exercises:

- Crystal Brook closed Prism Grotto guidance in the lower safe zone while the contextual action remains available;
- Shallow Brook reaction anchored in world space and constrained to viewport-safe bounds;
- rapid repeated reactions replacing rather than stacking;
- desktop, landscape tablet, landscape phone and portrait phone guidance/action layouts with successful-run screenshots.

The final human gate remains visual and must compare guidance, local reaction and Wonderbook discovery as three clearly distinct meanings before merge.
