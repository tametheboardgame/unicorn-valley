# R3-WP3.4 - NPC Racers and Position Tracking

Status: **Complete**

## Outcome

Rainbow Run now contains an actual four-racer competition rather than a solo timed run. The player races against Nova and two early prototype competitors while the game continuously tracks position and records the order in which racers cross the finish.

## NPC racer controller

NPC racers use the same deterministic race movement and course rules as the player.

Each opponent has an authored profile containing:

- base running pace;
- small deterministic pace variance;
- jump timing;
- selected obstacles they are allowed to misjudge;
- presentation tint and track offset.

The opening field is:

- **Nova**, the established Rainbow Run racer and strongest all-round early opponent;
- **Clover**, a steadier but slightly slower prototype competitor;
- **Breeze**, a quick prototype competitor who makes more obstacle mistakes.

Clover and Breeze are race-only working characters at this stage. They do not yet carry friendship, dialogue or wider world-state content.

## Fair competition

Opponent speed does not inspect or respond to the player's position.

There is no hidden catch-up acceleration when the player is ahead and no forced slowdown when the player falls behind. Pace variation is a deterministic property of each opponent profile, while obstacle mistakes are explicitly authored.

This makes the early field beatable through a clean run without making first place automatic. Missing several jumps can allow multiple opponents to finish ahead of the player.

## Shared course behaviour

NPC racers:

- move through the same course length as the player;
- receive the same boost-zone speed effects;
- receive the same slowdown and stumble response when they hit an obstacle;
- jump using the existing race movement model;
- continue running until they finish rather than disappearing when the player crosses the line.

Their behaviour therefore remains compatible with later data-driven race courses instead of being hard-coded to screen coordinates.

## Position tracking and finish order

A shared standings model ranks all participants.

During the race:

- unfinished racers are ordered by real course progress;
- the HUD reports the player's live ordinal position out of four racers.

After racers cross the line:

- completed racers are ordered by recorded finish time;
- finished racers remain ahead of racers still on the course;
- the finish panel reports the player's finishing place;
- the panel updates from current order to final order as the remaining racers finish.

## Presentation

The practice race now renders three visible opponent unicorns with names and distinct temporary tints. These reuse the existing procedural unicorn rendering rather than introducing production race art early.

The race HUD now includes:

- live position;
- course progress;
- time;
- race sparkle count.

The finish overlay remains intentionally lightweight because persistent race results, rewards and records belong to R3-WP3.5.

## Automated coverage

Tests verify that:

- authored NPC pace variance is deterministic and independent of player position;
- every opponent reliably completes the practice course;
- a clean player run can win;
- a mistake-heavy no-jump run does not automatically win;
- live player position is correctly reported;
- completed racers are sorted by recorded finish time;
- ordinal position labels are formatted correctly.

## Scope boundary

R3-WP3.4 does not add:

- participation rewards;
- podium bonuses;
- ribbons or badges;
- persistent race records;
- personal-best tracking;
- Wonderbook race rewards;
- result-specific Nova dialogue;
- production opponent artwork.

Those remain in R3-WP3.5 and later content/presentation packages.

## Acceptance

- multiple NPC racers finish the course reliably;
- the player's live and finishing position is correctly reported;
- early opponents are beatable with a good run but victory is not automatic;
- opponent behaviour contains no player-relative rubber-band cheating.

## Next package

**R3-WP3.5 - Race Results and Rewards**
