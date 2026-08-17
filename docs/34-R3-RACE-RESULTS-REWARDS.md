# R3-WP3.5 - Race Results and Rewards

Status: **Complete**

## Outcome

Rainbow Run now feeds back into the persistent life-sim rather than ending as an isolated activity. Every completed race records the player's result, awards a positive participation reward, tracks personal bests and can unlock race keepsakes that appear in the Wonderbook and can be used to decorate Moonflower Cottage.

## Persistent race record

The existing save contract at `activities.racesById` is now populated for the Practice Dash course.

Each race record stores:

- the fastest recorded finish time;
- the unique ribbon and rosette IDs already earned for that race.

No save-schema migration was required because the R0 persistence model already reserved this structure for later racing work.

## Participation and podium rewards

Finishing always produces a useful result regardless of position.

Every completed race awards:

- **2 Rainbow Sparkles** for participation.

A first, second or third-place finish additionally awards:

- **2 bonus Rainbow Sparkles**.

This means fourth place still gives the player progress and a reason to feel that completing the course mattered.

## Unique keepsakes

The first completed Rainbow Run awards:

- **Rainbow Run Finisher Ribbon**.

The first podium finish additionally awards:

- **Rainbow Run Podium Rosette**.

These unique awards are idempotent. Repeating the race continues to award the normal Sparkle currency but does not create duplicate ribbon or rosette ownership.

Both keepsakes are registered as normal decoration items. The existing cottage decoration system therefore recognises them without any race-specific cottage code.

## Personal-best tracking

The finish flow compares the new time with the saved record.

The results panel reports:

- the current race time;
- whether the run established a new personal best;
- the retained personal-best time when the new run was slower.

A slower replay can never overwrite a faster saved time.

## Wonderbook integration

Completing Rainbow Run unlocks the **Rainbow Run Ribbons** Wonderbook discovery.

The discovery is stored through the same persistent discovery collections used by the rest of the game, so it remains visible after leaving the race or reloading the browser.

## Results presentation

The finish panel now combines the existing finishing-place, time, course-sparkle and finish-order information with persistent progression feedback.

It shows:

- finishing place;
- race time;
- personal-best status;
- participation Sparkles earned;
- podium bonus when applicable;
- newly unlocked Finisher Ribbon or Podium Rosette;
- confirmation that those keepsakes can be used in the cottage;
- live/final finish order while the remaining NPC racers complete the course.

The player can then immediately race again or return to Rainbow Meadow.

## Automated coverage

Tests verify that:

- fourth place still receives the participation reward and first-finish ribbon;
- podium finishes receive the bonus reward and podium rosette;
- unique keepsakes are not duplicated across repeated races;
- repeat races continue to award normal participation rewards;
- slower times do not replace a personal best;
- faster times do replace a personal best;
- invalid result data is rejected;
- race records survive a real save/reload cycle;
- the saved Finisher Ribbon is visible through the existing cottage decoration service.

## Scope boundary

R3-WP3.5 does not add:

- Nova's introductory race story;
- result-specific Nova dialogue;
- a guided first-race tutorial;
- multiple difficulty settings;
- additional race courses;
- production race reward artwork or animation.

Those remain in R3-WP3.6 and later presentation/content packages.

## Acceptance

- finishing last still produces a positive persistent result;
- personal bests, ribbons and rewards survive save/reload;
- race rewards are available outside racing through the Wonderbook and cottage decoration systems;
- podium bonuses reward stronger finishes without making non-podium finishes feel like failure.

## Next package

**R3-WP3.6 - Nova's First Race Story**
