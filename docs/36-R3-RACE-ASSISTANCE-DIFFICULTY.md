# R3-WP3.7 - Race Assistance and Difficulty

Status: **Complete**

## Outcome

Rainbow Run now has an optional persistent **Race help** setting that makes jump timing more forgiving without removing the normal race rhythm or changing any rewards.

The first Nova run and the repeatable Sunrise Sprint also use explicit early and standard difficulty profiles, so introductory racing can be tuned separately from later courses rather than relying on one global set of numbers.

## Race help setting

Both playable race scenes expose the same fixed on-screen control:

- **Race help: Standard** keeps the normal race tuning;
- **Race help: Extra help** gives more room around obstacle timing and a gentle speed lift;
- tapping the control switches modes immediately;
- the preference persists in browser storage and is reused by later races.

The setting copy deliberately avoids labels such as easy, bad, beginner or failure.

When Extra help is selected the player is told:

> A little more room for jumps and a gentle speed boost. Ribbons and rewards stay the same.

## Difficulty profiles

Two reusable player difficulty profiles now exist.

### Early

Used by **Nova's First Run**.

It starts with:

- a small obstacle-clearance allowance;
- a slightly narrower effective obstacle collision span;
- normal base running speed.

This is separate from the already simpler tutorial course layout, so future introductory races can reuse the same tuning profile.

### Standard

Used by **Sunrise Sprint**.

It keeps the authored obstacle clearance, obstacle width and normal base pace unchanged unless the player chooses Extra help.

## Extra help tuning

Extra help layers on top of either profile rather than replacing it.

It provides:

- a 5% player-only forward-speed lift;
- an additional 18-pixel obstacle-clearance allowance;
- an 18% reduction in the effective obstacle collision width.

NPC racers continue to use their existing independent pace and obstacle behaviour. There is no player-position rubber-banding.

## Reward independence

Race assistance is deliberately outside the reward system.

The existing result pipeline still receives only the race ID, finish time, finishing place and participant count. It does not receive the assistance mode or difficulty profile.

Therefore:

- participation Sparkles remain available in every finishing position;
- the Finisher Ribbon remains available for completing the race;
- podium bonuses and the Podium Rosette remain available when earned;
- personal-best records continue to work normally;
- Extra help does not create a reduced-reward path.

## Automated coverage

Tests cover:

- standard mode being the default;
- persistence of Extra help;
- malformed preference recovery;
- non-shaming assistance copy and explicit reward parity wording;
- the early profile being more forgiving than the standard profile;
- Extra help adding gentle speed and obstacle forgiveness;
- a marginal jump that hits an obstacle under standard tuning clearing it under Extra help;
- the existing positive last-place reward coverage remaining unchanged.

## Acceptance

- Race help is available during both Nova's First Run and Sunrise Sprint;
- the setting persists between races;
- early and standard difficulty profiles are explicit and reusable;
- assistance materially widens the successful jump window and adds gentle speed support;
- NPC competition is not rubber-banded to the player;
- all existing core rewards remain available regardless of assistance setting.

## Next package

**R3-WP3.8 - Racing Presentation Pass**
