# Sunbeam Chess Academy - MG-WP5A Design Contract

Status: approved implementation direction for MG-WP5 after repository audit.

## 1. Existing baseline

The current `sunbeam-chess` implementation is already structurally suitable for expansion:

- one stable mini-game ID: `sunbeam-chess`;
- one canonical gameplay scene: `ChessPlazaActivityScene`;
- the Sunbeam Village chess plaza launches through `MiniGameLauncher`;
- Just Games launches the same scene;
- return behaviour is session-driven;
- `chess.js` 1.4.0 is the legality/rules authority;
- the current game has no adventure progression side effects.

Current player experience:

- the player is always White;
- the opponent is always Black;
- selecting a piece highlights legal destinations;
- the current Hint action chooses one heuristic move and directly highlights its origin/destination;
- the same move-scoring family drives the village opponent;
- teaching text explains legal moves, check/checkmate and broad opening/middlegame/endgame ideas;
- the opponent uses a deterministic shallow heuristic favouring captures, promotion, check, centralisation and simple development;
- promotion currently defaults to queen;
- Restart resets the full match;
- there is no undo;
- there is no lesson/puzzle mode;
- there is no learner progress record;
- there is no actual teacher character beyond the generic `Chess Coach` panel.

The current automated chess rules coverage proves only a small baseline: legal response while in check, true checkmate, one legal teaching hint and check explanation.

## 2. Product goal

Sunbeam Chess Academy should be a child-first chess-learning game, not a weakened adult chess client.

The target experience is:

- inviting enough for a young beginner to start without knowing chess;
- deep enough to teach real legal chess;
- playful enough that lessons feel like games;
- supportive when the player makes a mistake;
- capable of ordinary complete matches once the player wants them;
- replayable from both Sunbeam Village and Just Games.

The game must never equate “engine-best” with “child made a bad move”.

## 3. Teaching principles

MG-WP5 adopts these teaching rules:

1. **Positive before corrective.** Notice useful thinking, not only wins.
2. **Incremental concepts.** One new idea at a time.
3. **Play before lecture.** Let the child interact with the position and discover the pattern.
4. **Visual before verbal.** Board highlights, arrows/pulses and piece/square emphasis carry the explanation wherever possible.
5. **Questions before answers.** Ask what the child can notice before revealing a move.
6. **Retry is normal.** Learning modes permit experimentation without punishment.
7. **Hints are layered.** Help becomes more explicit only when requested.
8. **The player keeps agency.** Coaching may warn but never permanently veto a legal move.
9. **Difficulty means understandable opposition.** Easier opponents make plausible legal mistakes rather than behaving randomly or cheating.
10. **Short sessions.** Lessons and puzzles should normally resolve in minutes, not require finishing a full game.

These principles align with established child-chess teaching practice: positive/fun environments, incremental basics, structured lessons, puzzles, interactive challenges and guided discovery rather than long explanation.

## 4. Canonical mode model

Chess remains one mini-game family and one rules implementation.

### Academy Home

Entering Sunbeam Chess without an explicit variant opens an Academy Home inside the canonical chess activity. This is the default world behaviour from the plaza.

Primary choices:

- **Lessons**
- **Puzzle Garden**
- **Coach Match**
- **Friendly Match**

Just Games may expose the same choices as catalogue variants for faster entry, but those variants must route into the same canonical Academy runtime.

### Lessons

Very short interactive teaching activities.

A lesson definition owns:

- stable lesson ID;
- title and child-readable objective;
- initial legal chess position/FEN or standard setup state;
- allowed/expected interaction shape;
- success condition;
- optional retry explanation;
- layered hints;
- completion message.

Lessons must use `chess.js` for legal positions/moves. Do not create a second approximate chess rules system for teaching.

### Puzzle Garden

Short constrained positions with a discoverable objective.

Initial puzzle families:

- safe capture;
- save/defend a threatened piece;
- give check;
- escape check;
- mate in one;
- promotion;
- simple fork;
- simple pin.

Puzzle Garden is for pattern recognition, not engine evaluation.

### Coach Match

A complete legal game with optional contextual teaching.

The coach may intervene for a bounded set of explainable beginner events:

- leaving a high-value piece immediately capturable when a simple safe alternative exists;
- missing an immediate response to check (normal legality already prevents illegal responses);
- moving a defended piece into an obvious one-move capture;
- missing an obvious free capture;
- failing to notice mate-in-one for or against the player;
- repeated early queen moves/development habits only as a gentle principle, never as a veto.

Coach Match must **not** warn merely because another legal move has a better engine evaluation.

When warning before a legal move:

- explain one visible concern;
- offer **Have another look**;
- offer **Play it anyway**;
- never trap the player in a correction loop.

Undo is permitted in Coach Match.

### Friendly Match

A complete legal match with minimal teaching interruptions.

Initial opponent ladder:

- **Dandelion** - very forgiving;
- **Clover** - beginner;
- **Sunbeam** - developing player.

Names are working labels, not final character names.

Opponent behaviour must always be legal. Difficulty should be created by bounded choice quality/error frequency, not illegal moves, hidden information or arbitrary board manipulation.

## 5. Layered hint contract

Hints progress per position/objective:

1. **Notice** - point to the relevant area or threat.
2. **Question** - ask a short chess question.
3. **Nudge** - highlight candidate pieces or squares.
4. **Show me** - reveal a strong/required move.

A hint request must not mutate the board.

The hint state resets when the position materially changes.

## 6. Curriculum direction

The curriculum should be progressive but not force every player through a locked linear course.

Recommended teaching order:

1. board orientation and sides;
2. rook;
3. bishop;
4. queen;
5. king;
6. knight;
7. pawn movement and captures;
8. promotion;
9. capturing and piece safety;
10. check;
11. escaping check;
12. checkmate;
13. stalemate;
14. simple mate patterns;
15. piece values as a rough decision aid;
16. hanging pieces;
17. forks;
18. pins;
19. opening principles: centre, development, king safety;
20. basic king-and-pawn/endgame ideas;
21. castling;
22. en-passant as a later special rule.

Castling may move earlier if playtesting shows it is confusing to encounter it in matches before its lesson.

The first playable implementation should ship a smaller coherent subset rather than attempting all 22 topics at once.

## 7. Teacher character contract

The teacher is a real Unicorn Valley presentation layer, not merely a heading over text.

Required behaviour:

- visible presence or portrait during learning modes;
- short speech bubbles/cards;
- board-linked visual cues;
- acknowledges useful ideas as well as completed objectives;
- does not comment on every move;
- does not use adult chess jargon without first teaching it;
- never mocks, scolds or frames experimentation as failure.

Exact name, appearance and world biography remain open until the visual implementation slice.

The teacher belongs to Chess Academy presentation. The Sunbeam Village world does not need a new roaming NPC unless a later human decision explicitly adds one.

## 8. Technical ownership

Keep these responsibilities separate:

- `ChessPlazaActivityScene`: presentation, input and mode routing;
- `chess.js`: move legality, position state and game-over rules;
- chess teaching model: lessons, puzzles, hint stages and explainable coach events;
- opponent model: child-friendly move selection by named difficulty;
- optional learning records: isolated non-adventure persistence.

Do not put curriculum data, opponent search and Phaser rendering into one monolithic scene.

A likely implementation split is:

- `SunbeamChessAcademy.ts` - mode/session/domain types;
- `SunbeamChessLessons.ts` - lesson/puzzle definitions;
- `SunbeamChessCoach.ts` - layered hints and explainable beginner-event analysis;
- `SunbeamChessOpponent.ts` - opponent difficulty policy;
- existing `SunbeamChessRules.ts` - shared chess description/rules-adjacent helpers, narrowed as responsibilities move out.

Exact filenames may change if implementation evidence suggests a cleaner boundary.

## 9. Persistence boundary

Adventure progression remains untouched.

If lesson/puzzle progress is persisted, use isolated mini-game learning records only.

Permitted learning data:

- completed lesson IDs;
- puzzle/topic completion/counts;
- selected friendly opponent difficulty;
- optional coaching preference.

Forbidden coupling:

- quests;
- relationship state;
- inventory;
- Shimmer;
- collections;
- world unlocks;
- story flags.

Until isolated learning records are implemented, all lessons/modes remain directly selectable rather than gating content behind save progress.

## 10. Input and accessibility

- touch remains first-class;
- pointer/mouse remains supported;
- keyboard support must remain functional;
- stylus behaves as pointer/touch without a separate mode;
- legal destinations and teacher cues must not rely on colour alone;
- coaching text stays short enough for the current target age;
- no chess clock in the initial Academy;
- no forced time pressure in Lessons or Coach Match.

## 11. Bounded implementation checkpoints

### MG-WP5A - Discovery and design contract

- audit current chess implementation;
- establish teaching principles;
- define modes, hints, curriculum and technical boundaries;
- no runtime gameplay change.

### MG-WP5B - Academy shell and teaching foundation

- Academy Home;
- mode/session model;
- teacher presentation foundation;
- reusable lesson/puzzle runner;
- first small set of piece-movement lessons;
- automated lesson-definition validation.

### MG-WP5C - Puzzle Garden and curriculum expansion

- puzzle runner/content;
- layered hints;
- expand lessons through check/checkmate and core piece safety;
- retry/explanation loop.

### MG-WP5D - Coach Match

- explainable beginner-event analysis;
- pre-move “another look / play it anyway” flow;
- undo;
- layered match hints;
- prove coaching does not veto legal play.

### MG-WP5E - Friendly Match and opponent ladder

- child-friendly opponent strengths;
- believable bounded mistake model;
- match setup;
- restart/rematch/result presentation;
- optional promotion choice if not already introduced earlier.

### MG-WP5F - Learning records, responsive polish and human playtest

- isolated learning-record persistence if still worthwhile;
- world/Just Games mode entry reconciliation;
- responsive/touch/keyboard polish;
- final automated qualification;
- human playtest gate.

Do not chain these checkpoints into one long implementation window.

## 12. WP5A acceptance

WP5A is complete when:

- the existing implementation has been audited;
- the Academy mode model is explicit;
- teaching principles and intervention boundaries are explicit;
- the curriculum has an agreed direction;
- runtime ownership boundaries are explicit;
- persistence is clearly isolated from adventure state;
- later slices can implement the Academy without inventing the product architecture mid-code.

WP5A does not require a gameplay preview because it intentionally changes no runtime presentation.
