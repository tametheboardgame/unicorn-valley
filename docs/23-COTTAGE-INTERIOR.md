# Moonflower Cottage Interior

## Purpose

R2-WP2.6 turns Moonflower Cottage from a doorway stub into the player's first real home interior.

The package establishes the physical home and the stable state contract that R2-WP2.7 can use for decorating without mixing the placement editor into this work package.

## Playable interior

The cottage is a normal movement scene with:

- the saved unicorn appearance;
- keyboard and touch movement through the shared input abstraction;
- collision around fixed furniture;
- a reliable door back to Moonflower Glade;
- a dedicated save location so Continue can resume inside the cottage.

The room uses warm prototype presentation with a bed, fireplace, tea table, sofa, windows and moonflower details. These are fixed starter furnishings and are not part of the editable decorating inventory.

## Decoration zones

`CottageInteriorMap` defines four stable decoration slots:

- `cottage-slot:window-nook`;
- `cottage-slot:centre-rug`;
- `cottage-slot:cosy-corner`;
- `cottage-slot:bedside`.

The scene does not yet provide placement controls. That belongs to R2-WP2.7.

It does, however, rebuild any valid saved `home.furnitureBySlot` assignments every time the room is created. This proves that later decoration edits can survive scene changes and reloads without a new save schema.

Invalid item IDs and non-decoration items are ignored safely rather than breaking the room.

## Treasure shelf

The cottage includes a dedicated treasure shelf.

If the player has completed Willow's Moonflowers and owns the Moonflower Lantern, the lantern appears automatically on the shelf unless it has already been assigned to a decoration slot.

This gives the first story reward an immediate visible place in the player's home before the full decorating controls arrive.

## Scene transitions

Entering through the Moonflower Cottage door in Moonflower Glade now opens `CottageInteriorScene`.

Leaving the cottage:

1. returns to Moonflower Glade;
2. places the unicorn beside the cottage approach;
3. records the Glade location checkpoint.

While inside, the cottage location checkpoint is saved, so closing and reopening the game resumes inside the home.

## Validation

Automated coverage verifies that:

- the player spawn is valid;
- the exit, treasure shelf and every decoration slot are reachable;
- decoration slot IDs are unique and stable;
- saved decoration assignments rebuild correctly;
- invalid assignments are ignored safely;
- the Moonflower Lantern appears on the treasure shelf when owned and stops duplicating there once placed in a home slot.
