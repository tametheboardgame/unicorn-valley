# R3-WP3.8 - Racing Presentation Pass

Status: **Complete**

## Outcome

Rainbow Run now communicates speed, anticipation and celebration without changing the underlying race physics, AI, difficulty or reward rules.

Both **Nova's First Run** and the repeatable **Sunrise Sprint** use the same presentation language so the introductory race no longer feels visually older than the unlocked activity.

## Race start

Both races now begin with a clear **3, 2, 1, GO!** sequence.

- player and NPC race simulation remains paused during 3, 2 and 1;
- the race is released on GO;
- jump input is still available through keyboard and touch controls;
- short procedural countdown cues reinforce the visual sequence;
- the countdown logic is isolated from race physics and covered by unit tests.

## Course presentation

A reusable race-presentation layer now provides:

- multi-depth hills and landscape layers;
- slower-scrolling distant scenery for visible parallax;
- cloud and sun layers;
- foreground trees, flags and track-side detail;
- track texture marks that reinforce forward motion;
- screen-space speed streaks while racing;
- stronger streak intensity during boost bursts.

The course remains procedural Phaser geometry rather than final production artwork, but it now reads as a deliberately staged race environment rather than a flat prototype strip.

## Racer motion

The existing procedural unicorn texture remains unchanged.

Presentation animation now adds:

- stronger stride bob and lean while grounded;
- squash/stretch through the running cycle;
- distinct airborne posture;
- stumble motion retained from the existing race feedback;
- a player ground shadow that changes when airborne;
- matching stronger placeholder motion for NPC racers.

These changes are visual only and do not alter collision or movement state.

## Obstacles, boosts and collectables

Race features now have clearer silhouettes and stronger contrast.

- obstacles use ground shadows, darker outer forms and brighter inner forms;
- jump prompts use a high-contrast marker above the obstacle;
- logs and flower hurdles are visually distinct;
- boost strips have stronger borders, chevrons and a visible glow edge;
- collectables have a clearer ring/glow treatment and stronger bob animation.

## Race audio

The existing procedural Web Audio system now includes a dedicated **race** profile.

It provides:

- a faster melodic pulse than exploration locations;
- a brighter race ambience layer;
- countdown cues;
- a distinct GO cue;
- a finish fanfare;
- existing persistent mute/music/ambience/effects preferences remain authoritative.

No external audio assets or licences were added.

## Finish and results sequence

Finishing now produces a short celebration before the result card takes over.

- confetti bursts across the screen;
- the camera flashes and gives a small impact shake;
- the finish fanfare plays when sound effects are enabled;
- the result card scales and fades into view;
- time, personal best, rewards and finish order reveal in stages;
- action buttons appear after the result information rather than competing with it immediately;
- Nova's tutorial result uses the same staged presentation while retaining its story-specific copy and return path.

## Behaviour deliberately unchanged

R3-WP3.8 does **not** rebalance racing.

The following remain owned by the earlier race packages:

- player forward speed and jump physics;
- obstacle hit windows;
- NPC pace and mistakes;
- Standard and Extra help tuning;
- finishing-place calculation;
- personal-best recording;
- participation and podium rewards;
- ribbon and rosette unlock rules.

Those systems move into playtest/balance review in R3-WP3.9.

## Automated coverage

Tests now additionally cover:

- the 3, 2, 1, GO countdown order;
- race release occurring only on GO;
- safe countdown behaviour for negative and very large elapsed values;
- both playable race scenes resolving to the dedicated race audio profile.

The repository CI remains responsible for formatting, lint, type-checking, unit tests, production build and static smoke validation.

## Acceptance

- race scenery uses multiple visible depth layers;
- speed streaks and boost bursts make forward motion more legible;
- placeholder racer animation has a stronger running rhythm;
- races have a visible and audible countdown;
- racing has its own music profile;
- finish moments visibly celebrate completion;
- obstacles and jump prompts read more clearly at speed;
- result information is revealed as a short sequence rather than one immediate wall of UI;
- both Nova's First Run and Sunrise Sprint receive the presentation pass;
- race mechanics, assistance and rewards remain unchanged.

## Next package

**R3-WP3.9 - Racing Playtest and Balance Pass**
