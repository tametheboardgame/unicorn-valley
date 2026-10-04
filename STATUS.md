# Project Status

Last updated: 2026-10-04

## Current work

The independent **MG - Mini-Game Development Programme** is in its existing-game refinement phase.

Current bounded package: **MG-WP5 - Sunbeam Chess Academy**

Current checkpoint: **MG-WP5A - Discovery and design contract**

Branch: `agent/mg-wp5-sunbeam-chess-academy`

MG-WP0 through MG-WP4 are complete and merged. The shared mini-game platform is the accepted baseline.

## MG-WP5A findings

The existing Sunbeam Chess implementation is a sound legal-chess foundation:

- one canonical `sunbeam-chess` ID and one `ChessPlazaActivityScene`;
- world and Just Games already share `MiniGameLauncher` / `MiniGameSession`;
- `chess.js` owns real chess legality;
- current board selection highlights legal destinations;
- current hint and village opponent both use the same shallow deterministic move heuristic;
- the current activity is one full match only;
- there are no lessons, puzzles, coaching modes, undo or isolated learner records;
- the current “Chess Coach” is a text panel rather than a teacher character.

## MG-WP5A design direction

The committed Chess Academy contract defines:

- Academy Home with **Lessons**, **Puzzle Garden**, **Coach Match** and **Friendly Match**;
- a real Unicorn Valley teacher presentation layer;
- layered hints: Notice -> Question -> Nudge -> Show me;
- guided discovery and short interactive lessons rather than text-heavy instruction;
- Coach Match that can warn about explainable beginner mistakes but always allows **Play it anyway**;
- several child-friendly legal opponent strengths;
- strict separation between chess legality, teaching analysis, opponent policy and Phaser presentation;
- optional isolated learning records that can never mutate adventure progression;
- bounded delivery through MG-WP5B-F.

No runtime gameplay code changes in WP5A.

## Validation state

WP5A is documentation/design only. Repository contract/static validation is required for this branch checkpoint. No human gameplay preview is required until WP5B introduces visible runtime changes.

## Next work

Complete WP5A branch validation and package bookkeeping, then begin **MG-WP5B - Academy shell and teaching foundation** as a separate bounded checkpoint.

## Operating reminders

- preserve one canonical chess implementation for world and Just Games;
- keep `chess.js` as the legality authority;
- do not use engine-best as the definition of a child mistake;
- do not block a legal move permanently in Coach Match;
- adventure progression remains outside Chess Academy learning records;
- if GitHub access fails, reconnect immediately;
- do not sit in repeated CI/deployment polling loops.
