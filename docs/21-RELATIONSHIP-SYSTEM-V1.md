# Relationship System V1

## Purpose

R2-WP2.4 makes friendship persistent and useful to story content without turning it into a visible numeric grind bar.

## Relationship state

The existing save model stores relationship progress by stable character ID. A relationship contains hidden friendship points plus small character-specific memory flags.

The service distinguishes between a character the player has not met and a character who has been met but has not yet gained friendship progress.

## Friendship tiers

Player-facing content uses named tiers rather than raw points:

- Just Met;
- Friend;
- Good Friend;
- Best Friend.

The numeric thresholds remain an internal balancing detail. Progression is monotonic through the normal API and is capped safely rather than allowing accidental runaway values.

## Safe progression API

`RelationshipService` validates character IDs, requires positive whole-number friendship increases, caps the internal total, supports idempotent relationship flags and persists every change through the versioned save service.

Meaningful friendship changes emit `RELATIONSHIP_CHANGED` with both the hidden total and resolved tier for other systems.

## Dialogue conditions

Dialogue variants can declare minimum friendship-tier conditions. `selectDialogueVariant()` checks variants in priority order and returns the first valid registered dialogue.

This allows a character to use a warmer or more familiar conversation once friendship grows while preserving a simple fallback line for a newly met player.

## Wonderbook hook

`buildWonderbookCharacterEntries()` exposes character name, role, whether the character has been met, and the named friendship tier. It deliberately does not expose friendship points.

This provides the data hook for later Wonderbook character pages without coupling the relationship service to the current discovery-page presentation.

## Validation

Automated tests prove that:

- met state and friendship survive a fresh save-service instance;
- tier thresholds and comparisons are stable;
- changes emit tier-aware events;
- progress is capped and invalid increases are rejected;
- relationship flags are idempotent;
- dialogue selection changes at a friendship threshold;
- Wonderbook character entries expose named friendship state but no numeric grind value.
