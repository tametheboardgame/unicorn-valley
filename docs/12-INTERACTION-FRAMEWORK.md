# Interaction Framework

## Purpose

R1-WP1.3 establishes one interaction language for NPCs, objects, discoveries and doors before dialogue and quest systems begin using it.

## Contract

An `InteractionTarget` contains:

- a stable ID;
- a child-facing label and action label;
- a world position;
- an interaction radius;
- optional priority/enabled state;
- a typed result.

The first result types are deliberately small:

- `message` for inspecting an object;
- `scene-transition` for a doorway or activity hand-off.

Later packages can extend the result union rather than bypassing the interaction system.

## Target selection

`selectInteractionTarget` is a pure function. It:

1. ignores disabled targets;
2. ignores targets outside their own interaction radius;
3. selects the nearest remaining target;
4. uses explicit priority for an exact distance tie;
5. finally uses stable ID ordering for deterministic behaviour.

Unit tests cover out-of-range, nearest-target, priority, disabled-target and deterministic-tie behaviour.

## Input path

World interaction uses the existing named `INTERACT` action.

Keyboard bindings and pointer/touch interaction both feed `InputController`. The visible interaction prompt is itself tappable and drives `PointerTouchInputAdapter`, so the gameplay action does not care which device caused it.

## Moonflower Glade examples

The first authored targets are data in `MoonflowerGladeInteractions.ts`:

- Moonflower Cottage door, which exercises a scene-transition stub;
- Hollow Tree, which exercises inspect/message feedback;
- Discovery Display, which provides a second inspectable target.

The definitions reference stable map landmark approach positions rather than arbitrary render-object coordinates.

## Doorway stub

`DoorwayStubScene` deliberately does not implement the cottage interior early. It proves that a doorway result can carry a target scene and payload, and that the player can return using keyboard or pointer/touch input.

The real cottage interior remains R2 scope.

## Follow-on use

R1-WP1.4 should use this framework to start NPC dialogue from an interaction target. Dialogue itself owns modal input locking and choice progression rather than adding those responsibilities to the generic interaction selector.
