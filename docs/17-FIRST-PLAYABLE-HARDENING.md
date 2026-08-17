# R1 First Playable Hardening

## Purpose

R1-WP1.8 turns the assembled R1 systems into one resilient child-facing first-playable flow rather than a collection of successful work-package demos.

The release flow is:

1. open Unicorn Valley;
2. create and name a unicorn on a new save;
3. enter Moonflower Glade;
4. move freely and meet Pip;
5. find the Moonflower Sparkle;
6. return to Pip and see the changed conversation;
7. open the Wonderbook and see the discovery recorded;
8. close the browser;
9. reopen and Continue with the same unicorn and discovery state.

## New game and Continue

The title scene distinguishes between a save with a named unicorn and a new/empty save:

- new player: `Create Your Unicorn`;
- returning player: `Continue`;
- returning player: `Change my unicorn` remains available without deleting progress.

A returning player also gets `Start over`. It is deliberately a two-tap destructive action. The first tap explains what will happen and arms the action temporarily; only a second tap replaces the save with a clean new game and returns to the creator.

## Autosave checkpoints

R1 does not rely on a timer-based background save loop.

State is saved at meaningful checkpoints:

- creator completion saves identity and appearance;
- entering Moonflower Glade records the current location;
- collecting the first discovery saves the discovery immediately.

These points are enough for the first playable and reduce unnecessary storage writes.

## Reload proof

`FirstPlayablePersistence.test.ts` runs the core persistence chain against an in-memory repository, then constructs a fresh `SaveService` and verifies:

- unicorn name survives;
- full semantic appearance survives;
- Moonflower Glade location survives;
- Moonflower Sparkle discovery survives;
- first-discovery world flag survives.

The test also proves that the two-tap title action can replace an old save with a genuinely clean new-game state.

## Collision sweep

The existing Moonflower Glade traversal test continues to verify all map landmarks and reserved exits are reachable.

R1 hardening adds a placement sweep for the two first-playable dynamic targets, Pip and the Moonflower Sparkle, checking that each is inside playable bounds and clear of blocking collision with player clearance applied.

## Touch movement experiment

`TouchMovementPad` is a deliberately small R1 experiment rather than the final touch-control design.

On browsers reporting touch capability, Moonflower Glade shows four large translucent direction buttons. They feed `MOVE_X` and `MOVE_Y` through the existing `PointerTouchInputAdapter`, so touch movement and keyboard movement continue to use the same `InputController` contract.

The Wonderbook and interaction controls already use the same pointer/touch adapter.

R1 sign-off should include at least one phone or tablet attempt. R6 remains the planned full touch-refinement release.

## Child-facing text pass

Normal title/Glade text avoids development terminology and long control instructions. Diagnostic scenes remain available behind query-string routes for implementation testing, but are not part of the normal child-facing path.

## Release sign-off boundary

Automated validation can prove persistence, build correctness and many state transitions, but it cannot prove that the first playable feels understandable to the target child.

After WP1.8 is deployed, R1 should pause for a short hands-on playtest before R2 begins. Confusion, inability to progress, awkward touch controls or anything that requires repeated adult explanation should be fixed before expanding the valley.
