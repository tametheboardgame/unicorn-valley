# Wonderbook Shell

## Purpose

R1-WP1.7 introduces the Wonderbook as the player's long-term discovery record. The first version is deliberately small: it proves that saved discoveries can be presented as a child-friendly collection without adding a second persistence system.

## Opening the book

Moonflower Glade's Discovery Display now opens the Wonderbook. The interaction uses the existing shared interaction framework, so keyboard and pointer/touch activation follow the same path.

The book can be closed with the large on-screen button, the normal Back action, or the Wonderbook action. Closing returns the player to Moonflower Glade.

## Discovery presentation

The Wonderbook reads registered discovery definitions and compares them with `save.collections.discoveryIds`.

- discovered entries show their real name and description;
- undiscovered entries remain visible as `???` so the player can see there are secrets left to find;
- discovered pages receive a simple golden sparkle/sticker treatment;
- the model is read-only and does not mutate content or save state.

The first Moonflower Sparkle therefore appears automatically once it has been collected and saved by the existing `DiscoveryService`.

## Validation

`WonderbookModel.test.ts` proves that discovered/undiscovered state is derived correctly and that content definitions remain unchanged.

The scene is registered in the normal Phaser scene list and is reached through the Glade interaction rather than a developer-only diagnostic route.
