# Pip Intro and First Discovery

## Purpose

R1-WP1.6 turns the existing systems into the first tiny story beat: enter Moonflower Glade as the unicorn you created, meet Pip, find something sparkling and return to a friend who notices what happened.

## First-minute UX

The introduction deliberately does not open with a forced tutorial dialogue. Pip is visible near the starting path and offers the normal interaction prompt, while the player remains free to move immediately.

Pip's first conversation is two short cards. It points out that something is sparkling nearby and explicitly removes pressure with "No rush!".

The Moonflower Sparkle is close to the starting side of the bridge and collects automatically when the player approaches it. No reading or separate interact button is required to understand the collection beat.

## Persistent discovery

`DiscoveryService` writes the first discovery to both existing save contracts:

- `collections.discoveryIds` for Wonderbook/collection presentation;
- `world.uniqueDiscoveryIds` for world-state checks.

It also sets `flag:first-sparkle-found` for explicit story-state checks. Repeated unlock calls are idempotent and do not duplicate IDs.

The unlock is persisted immediately through `SaveService`, so closing the browser directly after collection does not lose the discovery.

## Pip reaction

Pip's interaction is generated from current persistent discovery state:

- before collection: `dialogue:pip-welcome`;
- after collection: `dialogue:pip-first-discovery`.

The post-discovery conversation points naturally toward the Wonderbook without opening it early. R1-WP1.7 owns the actual book shell.

## Saved player appearance

Moonflower Glade now creates the in-world placeholder texture from the saved semantic appearance values produced by the creator. The world sprite is scaled to the established prototype collision/presentation size.

This proves creator -> save -> world visual continuity before production unicorn art exists.

## Interaction and dialogue reuse

Pip uses the generic `InteractionTarget` contract. WP1.6 extends its typed result union with a `dialogue` result containing a validated `DialogueId`.

Moonflower Glade uses the existing `DialogueSession` and `DialogueCard`. While dialogue is active, movement is explicitly set to zero and normal world movement/collection logic is skipped.
