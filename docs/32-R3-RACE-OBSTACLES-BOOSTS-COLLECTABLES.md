# R3-WP3.3 - Race Obstacles, Boosts and Collectables

Status: **Complete**

## Outcome

Rainbow Run is now mechanically interactive rather than a straight automatic dash. The practice course contains readable jump obstacles, speed boosts and optional race sparkles while remaining forgiving enough that a mistake never ends the run.

## Data-driven course

The practice course is defined in `RaceCourse.ts` rather than placing gameplay rules directly throughout `RaceScene`.

Course data currently defines:

- course length;
- obstacle type, position, width and required clearance height;
- boost-zone start/end positions and speed multipliers;
- optional collectable positions, heights and pickup radii.

Validation checks feature IDs, ranges and dimensions so later course authoring can fail early instead of producing silent runtime defects.

## Obstacles

The first course contains two rainbow logs and a flower hurdle.

- Obstacles can be cleared by jumping high enough.
- A collision causes a short stumble and temporary slowdown.
- The unicorn never stops completely and the race does not hard-fail.
- Each obstacle can only trigger its slowdown once during a forward run.
- Visual `JUMP!` markers make the mechanic readable before detailed production art exists.

This keeps mistakes meaningful without turning a young player's run into a restart loop.

## Boost zones

Two bright boost strips are placed on the practice course.

- Entering a boost zone increases forward speed while the unicorn remains inside it.
- Track arrows and a `BOOST` marker make the zone visually distinct.
- Entering the zone gives immediate on-screen and camera feedback.
- Boost behaviour is defined by course data rather than scene-specific conditionals.

## Optional race collectables

Eight race sparkles are distributed across the course at different heights.

- Some can be collected while running normally.
- Some sit above obstacles or require a jump.
- Collected sparkles disappear immediately and update the race HUD.
- Missing a sparkle has no penalty and never blocks the finish.
- Sparkles reset when the player chooses `Race again`.

These are deliberately run-local in WP3.3. Persistent rewards, ribbons and race records remain R3-WP3.5 scope.

## Finish trigger

The deterministic race runtime now uses the course definition's length as the finish condition. This means a later course can have a different length without rewriting the movement system.

The finish panel reports:

- practice time;
- race sparkles collected;
- replay and return-to-meadow actions.

## Automated coverage

Tests verify that:

- the authored Rainbow Run course passes data validation;
- grounded obstacle hits cause a temporary slowdown rather than failure;
- a sufficiently high jump clears an obstacle;
- boost zones increase forward speed;
- collectables are acquired when crossed at the correct height;
- optional collectables can be missed while the player still finishes;
- the finish event fires from the configured course length.

## Scope boundary

R3-WP3.3 does not add:

- NPC racers;
- position tracking;
- finish order;
- persistent personal bests;
- ribbons or reward items;
- race-result progression;
- assistance settings.

Those remain in R3-WP3.4 onward.

## Acceptance

- the course is authored largely from data;
- obstacle hits slow or stumble the player instead of hard-failing the race;
- boost zones are visually readable and change speed;
- race collectables are clearly visible and optional;
- the course remains finishable even when obstacles are hit or collectables are missed.

## Next package

**R3-WP3.4 - NPC Racers and Position Tracking**
