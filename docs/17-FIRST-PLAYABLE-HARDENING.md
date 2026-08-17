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
7. open the Wonderbook from the Discovery Display and see the discovery recorded;
8. close the browser;
9. reopen and Continue with the same unicorn and discovery state.

## New game and Continue

The title scene distinguishes between a save with a named unicorn and a new or empty save:

- new player: `Create Your Unicorn`;
- returning player: `Continue`;
- returning player: `Change my unicorn` remains available without deleting progress.

A returning player also gets `Start over`. It is deliberately a two-tap destructive action. The first tap explains what will happen and arms the action temporarily; only a second tap replaces the save with a clean new game and returns to the creator.

## Autosave checkpoints

R1 does not rely on a timer-based background save loop. Creator completion and discovery collection already save durable state immediately. The location checkpoint helper provides the foundation for explicit location saves as the world expands in R2.

## Reload proof

`FirstPlayablePersistence.test.ts` runs the core persistence chain against an in-memory repository, then constructs a fresh `SaveService` and verifies the saved unicorn identity, appearance, location, first discovery and first-discovery world flag.

The test also proves that replacing an old save with a clean new-game state removes previous progress.

## Collision sweep

The Moonflower Glade traversal test verifies that map landmarks and reserved exits are reachable. R1 hardening also includes a placement sweep for Pip and the Moonflower Sparkle, checking that each is inside playable bounds and clear of blocking collision with player clearance applied.

## Touch movement experiment

`TouchMovementPad` is a deliberately small R1 experiment rather than the final touch-control design. It feeds `MOVE_X` and `MOVE_Y` through the existing `PointerTouchInputAdapter`, so touch and keyboard movement use the same `InputController` contract.

The movement diagnostic scene exposes the touch pad on touch-capable browsers. Full child-facing touch refinement remains planned for R6.

## Child-facing text pass

Normal title and Glade text avoids development terminology and long control instructions. Diagnostic scenes remain implementation tools and are not part of the normal child-facing path.

## Recovery note

The original WP1.7 and WP1.8 automation scaffolding was merged before its one-use wiring workflows executed. The recovery branch replaces that misleading state with the actual Wonderbook integration, title hardening, tests and documentation, and removes the stale helper workflows.
