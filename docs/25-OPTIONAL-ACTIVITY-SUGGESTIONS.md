# R2-WP2.8 - Optional Activity Suggestions

## Purpose

Optional activity suggestions provide gentle direction without turning Unicorn Valley into a checklist or a set of compulsory chores.

The player can ignore every suggestion. Suggestions do not award or remove progress, do not create timers, and do not alter the save when rotated or dismissed.

## Player-facing behaviour

Exploration scenes now share a small `Maybe try…` card through the existing interaction HUD.

The card:

- shows at most one suggestion at a time;
- uses short, child-facing language;
- offers `Another idea` to rotate to another currently relevant suggestion;
- offers `Not now` to dismiss the current suggestion for the current scene session;
- disappears entirely when no relevant suggestions remain.

No suggestion is mandatory and there is no penalty for hiding or ignoring it.

## Suggestion conditions

Suggestions are derived from existing saved world state rather than from a separate task system.

### First Moonflower Sparkle

Shown while the first Moonflower Sparkle has not been discovered.

Once the discovery exists in the saved collection state, the suggestion is no longer eligible.

### Willow's Moonflowers

Shown while Willow's production quest is not started or active.

The message changes with the current quest step so it can gently point towards Willow, the Moonflower Patch, or returning the flowers.

Once the quest is completed, Willow's Moonflowers is never suggested again.

### Cottage decorating

Shown when the player owns a decoration but has not placed an owned decoration into a cottage slot.

Once an owned decoration is placed, the decorating suggestion is no longer eligible.

## Technical design

`ActivitySuggestionModel` owns the pure data/condition model. It reads only the existing `SaveGame` state and exposes the currently available suggestions.

`ActivitySuggestionSession` owns temporary presentation choices:

- rotation offset;
- dismissed suggestion IDs;
- the maximum visible suggestion count.

This state is intentionally session-only. It is not progression and therefore does not require a save-schema migration.

`ActivitySuggestionCard` is the Phaser presentation component. It is attached to the shared `InteractionPrompt`, so Moonflower Glade, Sunbeam Village and Moonflower Cottage receive the same behaviour without scene-specific copies.

The card periodically re-reads the save while the exploration HUD is active, allowing completed quests, discoveries and decorating changes to remove stale suggestions automatically.

## Validation contract

Automated tests cover:

- suggestions derived from a clean save;
- completed discoveries no longer being suggested;
- Willow step-aware text;
- completed Willow content being removed;
- cottage decorating being suggested only while an owned decoration remains unplaced;
- one-card maximum visibility;
- rotation and dismissal without mutating game progress.

Full repository validation remains the merge gate: formatting, linting, type-checking, unit tests, production build and static smoke test.

## Acceptance mapping

- Player can ignore suggestions with no penalty: rotation and dismissal do not mutate `SaveGame`.
- Completed content no longer suggests itself incorrectly: suggestion availability is recalculated from saved discovery, quest and home state.
