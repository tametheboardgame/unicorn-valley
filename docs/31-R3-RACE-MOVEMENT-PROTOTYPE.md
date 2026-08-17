# R3-WP3.2 - Race Movement Prototype

## Outcome

Rainbow Run now has a dedicated playable practice race that proves the core side-scrolling control model before obstacles, racers and reward systems are added.

## Implemented

- a dedicated `RaceScene` entered from the physical Rainbow Run gate in Rainbow Meadow;
- automatic forward movement through a bounded placeholder course;
- responsive single-jump input;
- deterministic gravity, airborne motion and safe landing;
- keyboard jump with Space;
- a large touch/click `JUMP` control using the shared input abstraction;
- visible course progress and practice-run time;
- a clear finish line and finish state;
- `Race again` restart without leaving the scene;
- `Back to Meadow` and Escape exit paths;
- return positioning beside the Rainbow Run entrance;
- automated tests for forward motion, finish clamping, jumping, landing, double-jump prevention and oversized frame-delta recovery.

## Movement model

The race movement rules are kept in a small deterministic module rather than being embedded entirely in Phaser callbacks. This lets movement behaviour be tested independently of rendering and gives later race packages a stable base for obstacles, boosts and assistance settings.

The prototype deliberately caps unusually large frame deltas. A temporary browser stall therefore cannot teleport the player past large sections of the course or leave the jump simulation in an unrecoverable state.

## Prototype boundary

R3-WP3.2 proves movement only. It does not add:

- obstacles;
- boost zones;
- race collectables;
- NPC racers;
- podium positions;
- rewards or Shimmer;
- ribbons;
- personal best persistence;
- named cups;
- race assistance settings.

Those remain in R3-WP3.3 and later packages.

## Acceptance

- the player moves forward without holding a direction;
- Space and the on-screen control both invoke the same race jump action;
- jumping follows a clear launch, gravity and landing cycle;
- airborne jump presses do not create an unintended double jump;
- the placeholder course is finishable;
- finishing always offers an immediate replay or safe return to Rainbow Meadow;
- unusually long frames are bounded so the race remains recoverable.
