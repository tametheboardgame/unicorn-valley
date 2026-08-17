# Dialogue Framework

## Purpose

R1-WP1.4 adds child-friendly modal conversation without prematurely implementing Pip's production arrival sequence.

## Data model

Dialogue is content, not scene code. `ContentBundle` now includes typed `DialogueDefinition` entries with namespaced dialogue and node IDs.

Supported node types are:

- `line`: one speaker, short text and an optional next node;
- `choice`: one speaker, a short prompt and one or more labelled choices.

Choices can currently emit typed `set-flag` effects. Later relationship, quest and world-state effects can extend this contract.

## Validation

Content validation now checks:

- dialogue ID namespaces and duplicates;
- dialogue-node ID namespaces and duplicates;
- start-node references;
- line/choice next-node references;
- speaker character references;
- empty choice nodes;
- duplicate choice IDs;
- flag ID namespace.

A broken authored dialogue therefore fails CI rather than failing halfway through a conversation at runtime.

## Session model

`DialogueSession` is Phaser-independent. It owns only conversation progression:

- current node;
- line advance;
- choice selection;
- emitted choice effects;
- early close/back behaviour;
- completion.

This keeps later quest/NPC systems able to test conversation logic without rendering a scene.

## Dialogue card

`DialogueCard` is the Phaser presentation layer. It provides:

- large readable text;
- speaker name;
- placeholder portrait area;
- Continue button;
- tappable choice buttons;
- full-screen dimming behind the card.

The Continue button feeds the existing `INTERACT` action through `PointerTouchInputAdapter`. Choice buttons invoke their selected authored branch directly.

## Modal input locking

`DialogueTestScene` proves the modal contract. When a dialogue session is active, movement is not merely hidden: player velocity is explicitly set to zero and normal movement resolution is skipped until the conversation closes or completes.

Keyboard `Back` closes dialogue. Keyboard `INTERACT` advances lines and selects the first choice for diagnostic accessibility; pointer/touch can select any visible choice.

## Choice flag proof

The checked-in sample dialogue offers two choices and emits either:

- `flag:dialogue-test-explorer`; or
- `flag:dialogue-test-homebody`.

The diagnostic stores the selected flag in Phaser's game registry and displays the result. Persistent story flags remain the responsibility of the save-integrated story packages.

## Diagnostic route

Use `?scene=dialogue-test` to open the standalone dialogue diagnostic.

The normal Moonflower Glade flow remains free of the sample conversation. R1-WP1.6 will introduce Pip's real placeholder NPC and production intro content using this framework.
