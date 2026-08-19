# R3-WP3.9H - Final Daughter Racing Playtest and R3 Closeout

Status: **In progress**

## Playtest findings

The production build is now deploying correctly and the visual/traversal recovery work is visible in normal play.

The current target-player pass found three remaining racing-flow issues:

- Sunrise Sprint reaches its result panel, but the visible `Race again` / `Back to Meadow` controls can become unresponsive, leaving the game effectively stuck at the finish;
- it is not sufficiently obvious in Rainbow Meadow that Sunrise Sprint starts from the same Rainbow Run start as Nova's First Run;
- the Rainbow Run start still behaves like a legacy interaction and expects an interaction-key press instead of reacting naturally when the player walks into the start area.

## Recovery work

- add dedicated top-layer interactive finish zones so the Sunrise Sprint result controls remain clickable independently of the animated result-panel container;
- retain keyboard fallbacks for replay/return;
- add a clear world-space sign identifying the shared Rainbow Run start for Nova's First Run and Sunrise Sprint;
- replace the visible legacy `Enter Rainbow Run` interaction prompt with an automatic walk-in confirmation;
- show phase-aware confirmation copy:
  - `Start Nova's First Run?` when the tutorial is ready;
  - `Start Sunrise Sprint?` once the full race is unlocked;
  - preserve Nova story routing before the first race and while its result conversation is pending;
- provide large Yes / Not now choices plus keyboard equivalents;
- pause Meadow physics while the confirmation is open so the player cannot drift through it;
- add unit and Chromium regressions for prompt routing, automatic race-start confirmation and finish-panel control responsiveness.

## Closeout rule

R3-WP3.9H remains open until these evidence-led fixes are green in automated validation and the resulting production build passes the final target-player check without a racing dead end.
