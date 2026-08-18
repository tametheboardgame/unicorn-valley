# R3-WP3.9 - Racing Playtest and Balance Pass

Status: In progress. Awaiting the target-player racing playtest before balance changes are made.

## Purpose

Validate that Rainbow Run is understandable, finishable and enjoyable for the seven-year-old target player, then tune only the problems that are actually observed.

## Baseline before playtest

The current build already provides:

- Nova's one-on-one First Run tutorial;
- the four-racer Sunrise Sprint;
- Space and large touch/click jump input;
- slowdown/stumble rather than race failure on obstacle hits;
- an early tutorial difficulty profile;
- an optional persistent Extra help setting with wider obstacle clearance and gentle player-only speed support;
- participation rewards even when the player does not place on the podium;
- a first Finisher Ribbon regardless of tutorial position;
- personal bests and replay from the result screen;
- a 3, 2, 1, GO countdown and clear race presentation cues.

No speculative balance changes are being made before the playtest. The package is specifically intended to use observed child behaviour as the evidence for tuning.

## Playtest protocol

Use the production build and let the player discover the racing flow naturally.

1. Start from normal exploration and reach Rainbow Meadow.
2. Let Nova introduce the first race without explaining the controls unless the player becomes genuinely stuck.
3. Complete Nova's First Run.
4. Continue until Sunrise Sprint unlocks and complete it at least once.
5. If the player chooses to replay voluntarily, allow it. Do not ask for repeated races solely to collect data.
6. If the player struggles repeatedly, allow her to notice or use Extra help naturally; note whether its wording and effect are understandable.

## Observation targets

Record behaviour rather than asking leading questions.

- Does she understand that the unicorn runs automatically?
- Does she understand when and how to jump?
- Is Space/tap responsive enough, including on touch if used?
- Which obstacle, if any, causes repeated misses?
- Does she recover emotionally and mechanically from a stumble, or does it feel like failure?
- Can she finish Nova's First Run without adult intervention?
- Can she finish Sunrise Sprint consistently?
- Does the race feel too short, about right, or drag?
- Does she understand her finishing place?
- Does she notice and care about Sparkles, ribbons, the personal best or podium rewards?
- Does losing still feel positive enough to continue?
- Does she choose Replay without being prompted?
- Does she look for or use Extra help after difficulty?
- Are there any visual, audio or control distractions that make an obstacle hard to read?

## Evidence to capture

For each race that matters, note only what is easy to observe:

- race: Nova's First Run / Sunrise Sprint;
- input: keyboard / mouse / touch;
- approximate number of obstacle hits;
- finish place;
- Extra help on/off;
- whether adult help was required;
- whether Replay was chosen voluntarily;
- any spontaneous comment or visible frustration/delight.

Exact timings are not required unless something clearly feels too long or too fast.

## Balance decision rules

- Repeated missed jumps: widen the relevant timing/clearance window before reducing race speed globally.
- Control confusion: improve the control cue or input handling before changing course difficulty.
- One problematic obstacle: tune that obstacle before changing the whole difficulty profile.
- Repeated frustration after a hit: reduce slowdown/stumble severity or duration rather than removing obstacles.
- Races feel too long: shorten course length or reduce dead space, preserving readable obstacle spacing.
- Races feel too short: add useful race space/content rather than merely lowering player speed.
- Rewards are ignored: improve clarity/presentation before increasing reward quantities.
- Losing discourages replay: improve result framing/reward feedback before making opponents artificially lose.
- Extra help is still too hard: strengthen assistance without reducing rewards or adding shame language.
- Easy first-time wins are acceptable for the tutorial; Sunrise Sprint should be beatable but not guaranteed.

## Completion criteria

This package can be completed when the observed playtest supports both acceptance conditions:

- the target player can finish a race consistently;
- voluntary replay is possible and is not required for progression.

Any observed repeated frustration point must either be fixed in this package or explicitly recorded as a later follow-up item.
