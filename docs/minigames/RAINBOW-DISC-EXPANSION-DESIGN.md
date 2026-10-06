# Rainbow Disc Expansion Design

Programme: **MG-WP6 — Rainbow Disc expansion**

Status: **approved roadmap direction / implementation design**

Canonical game ID: `rainbow-disc`

Canonical gameplay scene: `RainbowDiscActivityScene`

World home: **Rainbow Meadow**

## Product objective

Turn Rainbow Disc from a short three-pass activity and five-throw practice range into a replayable child-friendly sport game with several meaningful ways to play.

The expansion must preserve the strengths of the accepted Rainbow Meadow implementation:

- one canonical gameplay scene shared by world and Just Games;
- the physical Rainbow Disc pitch and practice range remain the world entry points;
- readable unicorn scale/alignment and horn-centred catching;
- horizontal practice targets;
- touch, pointer and keyboard as first-class inputs;
- rounded, bright activity presentation with no whole-screen shadow overlay.

The game should feel like a sport rather than a disguised menu or a sequence of automatic animations.

## Current implementation audit

The existing activity provides a useful foundation:

- `match` and `practice` catalogue variants;
- three receiver lanes;
- visible marked/open lanes while attacking;
- a simple defence phase after a turnover;
- drag-to-throw pointer input;
- lane/target selection plus Space/Enter for keyboard input;
- a moving timing meter;
- three practice targets with Easy/Medium/Hard timing profiles;
- a five-throw practice score;
- replay/result presentation;
- correct world/Just Games launch and return behaviour.

The main limitations are:

1. **Match is not yet a full match.** Three successful catches immediately finish the activity. There is no player/opposition scoreline, match target or meaningful result other than completing one chain.
2. **Defence is closer to a hidden lane guess than a readable sport action.** The player needs a visible cue to read rather than pure prediction.
3. **Pointer and keyboard use different skill models.** Pointer success is primarily based on release position near the receiver/target; keyboard success is based on the timing meter. The same throw should be judged by the same underlying rules regardless of input method.
4. **Practice is only one five-throw target exercise.** There is no passing drill, streak/challenge structure or progressive replay loop.
5. **Difficulty/assistance is implicit rather than player-readable.** Practice targets change tolerances, but there is no coherent younger-player assistance model across modes.
6. **Replay depth is limited.** Open-lane order and match structure are highly deterministic.

## Core sport model

Rainbow Disc should use one understandable skill loop:

1. **Read** the field or target.
2. **Aim** at the receiver/target you intend to use.
3. **Release** the disc at a good moment.
4. **Catch / hit / intercept** based on the visible situation and throw quality.
5. **React** to success, turnover or score and continue quickly.

### Unified throw rule

Pointer/touch and keyboard must resolve through the same throw-quality model.

- pointer/touch drag direction selects the intended lane/target and previews the trajectory;
- keyboard/stylus-accessible controls select the same intended lane/target explicitly;
- the moving timing meter is the shared release-quality input;
- the selected lane/target determines *where* the player is trying to throw;
- timing determines *how well* the throw reaches that choice;
- assistance changes tolerances/sweep speed/readability, not the result after the fact;
- a throw must never be declared successful merely because the game wants the child to win.

Exact pointer release pixels should not form a separate hidden difficulty system that keyboard users do not experience.

## Assistance profiles

Initial player-readable profiles:

### Gentle

For younger/new players.

- slow timing sweep;
- broad good-release window;
- strong selected-lane/target highlight;
- clear defence telegraph;
- generous pointer lane-selection cone.

### Standard

Default sport feel.

- medium timing sweep/window;
- normal lane/target cues;
- readable but less explicit defence telegraph.

### Challenge

For repeat play.

- faster timing sweep;
- narrower good-release window;
- lighter defence telegraph;
- no cheating, hidden stat boosts or arbitrary catch failures.

Difficulty always changes readable input tolerance and opposition cues, never legality or hidden information.

## Match mode

The existing `match` entry becomes a real short match.

### Match structure

Initial target: **first to 2 goals**.

A possession can end with:

- the player's team scoring;
- the opposition scoring;
- a turnover that changes attack/defence but does not end the whole activity.

Player attack still uses the readable three-lane field and short passing chain, but successful completion of the chain scores one goal rather than immediately ending the game.

### Attack

- defenders mark lanes;
- at least one useful option remains readable;
- lane patterns vary between possessions rather than repeating one fixed sequence;
- throw quality uses the shared aim/release model;
- an accurate throw to a marked receiver can still be intercepted;
- a poor release can create a loose-disc turnover.

### Defence

Defence must become readable rather than a blind lane guess.

The opposition should telegraph its intended lane through a short, child-readable cue, for example:

- receiver movement;
- a brief route shimmer;
- body orientation;
- an assistance-dependent lane pulse.

The player chooses a lane to cover.

- correct read: interception / possession won back;
- wrong read: opposition advances;
- enough advances: opposition scores.

The cue may become shorter/subtler on Challenge, but it must never disappear into pure randomness.

### Result

A completed match shows:

- final score;
- win/loss wording that remains positive;
- direct rematch;
- change assistance/mode where appropriate;
- correct Back to Meadow / Back to Games action.

## Practice hub

The existing world **Practice throws** interaction and Just Games `practice` variant remain compatibility entry points, but open a small Rainbow Disc practice hub.

Initial drills:

### Target Range

Evolution of the existing five-throw range.

- Easy / Medium / Hard rings remain physically recognisable;
- score from a bounded throw set;
- shared throw-quality model;
- clear accuracy feedback;
- replay with a best-this-session result.

### Passing Drill

A short sequence of open-lane passing situations.

- identify the useful receiver;
- release accurately;
- build a streak;
- marked-lane layouts vary;
- progressive rounds introduce faster timing or less explicit cues.

### Rainbow Streak

A compact accuracy challenge.

- the game calls a target/lane;
- consecutive good throws build a streak;
- difficulty rises in small visible steps;
- a miss breaks the streak but does not make the session feel punitive;
- session ends after a bounded number of attempts.

The exact names may be refined during child-facing polish, but each mode must have a distinct play purpose.

## Mode architecture

Preserve existing catalogue compatibility:

- `match` remains the world pitch / Just Games Match entry;
- `practice` remains the world practice range / Just Games Practice entry.

Do not create copied gameplay scenes.

The practice entry can own the internal drill chooser. If later playtesting proves a drill deserves direct Just Games exposure, add a catalogue variant that still launches the same scene and same rules.

## Replay and progression

WP6 does **not** add adventure progression, currency, quests, unlock gates or collection rewards.

Default records are session-local:

- current match score;
- current drill score/streak;
- best score/streak for the current activity visit.

Durable personal records are out of scope unless separately justified and isolated from adventure state.

All content remains playable immediately.

## Input contract

### Pointer/touch

- drag from the disc to choose/preview a lane or target;
- selected destination must be visually obvious;
- release resolves the shared timing-quality rule;
- no precision requirement smaller than a comfortable finger target;
- accidental tiny drags should cancel rather than throw.

### Keyboard

Match/defence:

- Up/Down or W/S select lane;
- Space/Enter releases/commits.

Practice target selection:

- Left/Right or A/D selects target;
- Space/Enter releases.

Practice modes that use lanes may use the match Up/Down convention.

### Stylus

Stylus follows pointer/touch behaviour without a separate rules path.

## Presentation principles

- retain the existing rounded field shell and accepted Rainbow Disc visual language;
- player and opposition unicorns remain consistently scaled and centred to their rings;
- catches should visually meet the horn/catch point;
- selected lane, open lane, defender pressure and defence telegraph must be visually distinct;
- no full-screen dim/shadow layer behind activity UI;
- results use the existing rounded overlay language established elsewhere in the game;
- avoid dense written instructions: show, highlight and animate first.

## Automated qualification

WP6 must add deterministic game-owned tests for:

- throw-quality/assistance profiles;
- match scoring and first-to-two completion;
- possession/turnover rules;
- defence telegraph resolution;
- drill scoring/streak rules;
- mode restart/result behaviour.

Browser qualification must cover:

- Rainbow Meadow Match launch/return;
- Rainbow Meadow Practice launch/return;
- Just Games Match launch/return;
- Just Games Practice launch/return;
- pointer/touch-equivalent throw path;
- keyboard throw path;
- representative portrait/tablet containment;
- result/replay flow.

Existing H4.9 browser coverage remains useful regression coverage and should be migrated/reused rather than duplicated blindly.

## Human acceptance

A child-facing preview is mandatory before merge.

Judge:

- does throwing feel understandable and responsive on a tablet;
- can the player tell *why* a throw worked or failed;
- does Gentle genuinely help without playing automatically;
- does Standard feel fair;
- does defence provide a cue that can actually be read;
- does a match feel like a match rather than one passing sequence;
- are the drills meaningfully different;
- is retry friction low enough to encourage “one more go”;
- are instructions short enough for a seven-year-old to use without adult interpretation.
