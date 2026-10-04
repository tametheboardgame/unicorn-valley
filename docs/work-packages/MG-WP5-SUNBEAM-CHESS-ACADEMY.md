---
id: MG-WP5
title: Sunbeam Chess Academy
status: in_progress
autonomy: amber
depends_on: [MG-WP4]
parallel_safe: true
human_gate: playtest
mini_game_platform_impact: changed - sunbeam-chess
---

# MG-WP5 - Sunbeam Chess Academy

## Current checkpoint

**MG-WP5A - Discovery and design contract** is complete. **MG-WP5B - Academy shell and teaching foundation** is implemented and awaiting branch validation / visual review.

Detailed design contract: `docs/minigames/SUNBEAM-CHESS-ACADEMY-DESIGN.md`.

## Objective

Transform the existing Sunbeam Chess activity into a friendly, playful and genuinely useful chess-learning experience for a young child while preserving fully legal chess underneath it.

This is a product redesign of the existing game, not a new chess implementation and not merely an AI difficulty tweak.

## Product principles

- teach through interaction, questions, highlights, puzzles and experimentation rather than lectures;
- mistakes are learning events, not failures;
- winning is not the only success state;
- keep language short and concrete;
- never make the child feel trapped by coaching;
- the teacher can suggest another look but the player retains agency;
- use the real legal-rules engine throughout;
- make the easiest opponent intentionally approachable without making its moves nonsensical;
- preserve one canonical Chess Academy implementation for world and Just Games entry.

## Unicorn teacher

Introduce a warm Unicorn Valley chess-teacher character/presentation.

The character should:

- welcome the player and explain one idea at a time;
- ask guiding questions such as “What can their bishop see?” rather than simply giving the move;
- point to relevant squares/pieces visually;
- congratulate noticing, defending and planning as well as check/checkmate;
- treat losses and blunders as normal;
- avoid interrupting every move.

Name, visual design and exact world fiction remain a human/product decision during implementation.

## Modes

### Lessons

Short interactive lessons and piece-specific micro-games.

Initial progression:

1. board orientation;
2. rook movement;
3. bishop movement;
4. queen movement;
5. king movement and attacked squares;
6. knight movement;
7. pawn movement/captures/promotion;
8. capturing and keeping pieces safe;
9. check;
10. escaping check;
11. checkmate and stalemate;
12. simple mate patterns;
13. piece value and hanging pieces;
14. simple forks/pins;
15. opening principles;
16. basic endgame ideas;
17. castling and en-passant once the fundamentals are comfortable.

The final lesson order may be refined from playtesting. Do not overload the player with every special rule at the beginning.

### Puzzle Garden

Constrained board positions with one clear learning objective.

Examples:

- find a safe capture;
- defend the attacked piece;
- make check;
- escape check;
- find mate in one;
- choose between a hanging piece and a safe piece;
- simple fork;
- simple pin;
- promote a pawn.

Provide immediate, visual explanation after an attempt.

### Coach Match

A full legal game with optional contextual coaching.

Behaviour:

- highlight legal moves only when useful/configured;
- detect obvious beginner-level blunders;
- sometimes ask “Are you sure?” and point at the threat;
- always provide **Play it anyway** as a real choice;
- allow an optional undo in learning mode;
- offer hints as increasingly explicit layers rather than immediately revealing a move;
- do not interrupt reasonable moves just because an engine prefers something else.

### Friendly Match

Ordinary chess with minimal coaching.

Provide several child-readable opponent strengths. Difficulty should change search/decision quality deliberately rather than simply cheating or selecting random illegal/absurd play.

### Challenge positions

Optional later mode for mastered topics if it adds value beyond Puzzle Garden.

## Hint model

Prefer layered hints:

1. **Notice** - identify the relevant area/threat;
2. **Question** - ask what the player can see;
3. **Nudge** - highlight candidate pieces/squares;
4. **Show me** - reveal a strong move when explicitly requested.

Hints should teach *why*, not merely provide notation.

## Progress and persistence

Learning progress may persist only through an isolated mini-game learning-record namespace.

It must not:

- advance adventure quests;
- change relationships;
- grant/consume inventory or Shimmer;
- unlock world progression;
- affect collections.

The same learning record may be available from world and Just Games because it represents chess learning, not adventure state.

If isolated persistence would complicate the first bounded implementation materially, lessons may initially remain available without locking and persistence can be a later named slice.

## Existing world integration

- Sunbeam Village chess plaza remains the physical world wrapper;
- the world interaction opens the same Chess Academy implementation used by Just Games;
- no duplicate “training” scene containing a second chess rules implementation;
- return destination remains session-driven.

## Technical direction

- preserve `chess.js` as the legal-position/rules authority unless implementation evidence requires otherwise;
- separate teaching analysis from legality;
- keep teacher/coaching logic deterministic enough to unit test;
- do not use a full-strength engine recommendation as the definition of “good move” for beginner coaching;
- identify beginner blunders with bounded, explainable heuristics where possible;
- keep optional AI/analysis work off the initial app graph when practical.

## Verification

Automated coverage should include:

- every lesson setup contains a legal/solvable position;
- legal move handling remains correct;
- Coach Match never blocks a legal move permanently;
- “Play it anyway” always works;
- hint levels progress deterministically;
- child-friendly opponent modes always make legal moves;
- world launch/return;
- Just Games launch/return;
- isolated learning progress cannot mutate adventure progression;
- touch/pointer/keyboard board interaction;
- representative portrait/tablet layout.

## Human playtest gate

Do not call MG-WP5 complete based only on automated chess correctness.

Human acceptance should answer:

- can a young beginner understand what the teacher is asking;
- are lessons short enough to remain fun;
- does Coach Match help without nagging;
- does the child feel able to experiment;
- is the easiest opponent beatable without appearing broken;
- are mistakes explained without patronising language;
- does the experience make the child want another lesson/game.

## Non-goals

- online multiplayer;
- competitive ratings/Elo;
- opening-book memorisation;
- tournament clock rules;
- adult-strength chess-engine optimisation;
- adventure rewards for chess learning;
- rebuilding Sunbeam Village itself.


## Bounded delivery checkpoints

- **MG-WP5A - Discovery and design contract - complete**: current implementation audit, teaching principles, mode model, curriculum direction and implementation boundaries.
- **MG-WP5B - Academy shell and teaching foundation - implemented**: Academy Home, teacher presentation foundation, reusable lesson runner and first piece lessons.
- **MG-WP5C - Puzzle Garden and curriculum expansion**: puzzles, layered hints, check/checkmate and piece-safety teaching.
- **MG-WP5D - Coach Match**: explainable coaching, another-look/play-anyway flow, undo and layered match hints.
- **MG-WP5E - Friendly Match and opponent ladder**: child-friendly opponent levels, rematch/result flow and match polish.
- **MG-WP5F - Learning records, responsive polish and human playtest**: isolated learning persistence if worthwhile, final world/Just Games reconciliation and acceptance.

Do not chain these slices into one autonomous implementation window.


## MG-WP5B implementation record

Implemented:

- Academy Home is now the default entry for `sunbeam-chess`;
- the Academy visibly presents Lessons, Puzzle Garden, Coach Match and Friendly Match;
- Puzzle Garden and Coach Match are deliberately marked unavailable until their own bounded slices;
- Friendly Match preserves the previous full legal-chess experience rather than removing existing functionality;
- a visible Sunbeam Chess Coach unicorn presentation is established without yet locking a final name/world biography;
- Lessons provides a reusable lesson runner over real `chess.js` positions;
- the first four lessons are Rook Rays, Bishop Trails, Knight Jumps and Pawn Steps;
- lesson goals are shown directly on the board and legal destinations remain visible;
- incorrect but legal lesson moves are acknowledged positively, then reset for another attempt;
- the four-stage hint philosophy is implemented for lessons: Notice -> Question -> Nudge -> Show me;
- starter lesson definitions are unit-validated as legal and solvable;
- browser coverage exercises Academy Home, unavailable future modes, a real completed rook lesson and preservation of Friendly Match.

Out of scope for WP5B:

- Puzzle Garden content;
- Coach Match intervention logic;
- Friendly Match difficulty ladder;
- learner persistence;
- final teacher identity/portrait polish.
