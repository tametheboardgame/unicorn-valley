# Decorating V1

## Purpose

R2-WP2.7 turns the fixed decoration zones in Moonflower Cottage into the first repeatable player-expression loop.

The design deliberately uses fixed valid slots rather than free placement. This keeps decorating understandable for a young player, makes touch and keyboard behaviour consistent, and prevents invalid furniture positions by construction.

## Player interaction

Four visible ✦ spots in Moonflower Cottage can be decorated:

- Window nook;
- Centre rug;
- Cosy corner;
- Bedside.

When the unicorn approaches a spot, the normal interaction prompt offers `Decorate` or `Change decoration`.

Interacting cycles through decorations the player actually owns and then an empty state. The room updates immediately without a scene reload.

This single interaction supports:

1. placing a decoration;
2. replacing it with another owned decoration;
3. removing it back to the collection;
4. moving an item between cottage slots.

## Ownership rules

`HomeDecorationService` links cottage placement directly to persistent inventory quantities.

Only registered items with category `decoration` can be placed. The player must own the item in inventory.

A placement does not consume the decoration. Removing it leaves ownership unchanged.

If the player owns only one copy of a decoration and places it in another slot, the existing placement is cleared automatically and the item moves. The same physical reward therefore cannot be duplicated around the room accidentally.

If multiple copies are owned, the number of simultaneous placements can never exceed the owned quantity.

## Persistence and safety

Placements continue to use the existing stable `home.furnitureBySlot` save structure established before this package.

No save-schema migration is required.

`CottageHomeView` also validates persisted state before rendering it. Unknown items, non-decoration items, unowned placements and placements exceeding owned quantity are ignored safely rather than displayed or allowed to break the room.

## Willow reward

Willow's Moonflowers already awards the Moonflower Lantern as a decoration item.

Before placement, the lantern appears on the cottage treasure shelf. Once placed in a decoration slot, it moves into the room. Removing it makes it available to the shelf/collection presentation again without consuming the reward.

This completes the first full story-to-expression loop:

1. help Willow;
2. earn the Moonflower Lantern;
3. bring the reward home;
4. choose where it belongs;
5. move or remove it later;
6. see that choice persist after reload.

## Validation

Automated unit coverage verifies:

- decoration ownership is derived from persistent inventory;
- food and other non-decoration items cannot be placed;
- unknown cottage slots are rejected;
- unowned decorations are rejected;
- placements persist by stable slot ID;
- a single owned item moves rather than duplicates;
- cycling supports placement, replacement and removal;
- cottage rendering never shows more copies than are owned.

A real Chrome browser validation additionally exercises the production interaction path with the Moonflower Lantern:

- place the lantern in the Window nook;
- move the same single copy to Bedside;
- confirm the old slot is cleared;
- reload the game and reconstruct the Bedside placement from saved state;
- remove the lantern again without reducing inventory ownership;
- complete the loop with no browser/runtime errors.
