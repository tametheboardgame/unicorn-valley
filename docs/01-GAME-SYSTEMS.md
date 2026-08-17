# Unicorn Valley - Core Game Systems

## Purpose

This document defines the major gameplay systems and how they fit together. It is intentionally implementation-aware, but does not prescribe code structure. Technical implementation is covered separately.

## Core loop

At the highest level the game loop is:

**Explore -> Notice -> Interact -> Help/Play/Discover -> Receive something meaningful -> Change the world or player expression -> Explore again**

The game should avoid a conventional grind loop where the player repeats an activity mainly to make a number increase.

## Player movement and exploration

The main world uses a three-quarter/top-down storybook perspective.

Movement should feel simple and forgiving:

- WASD and arrow keys on keyboard.
- Click/tap movement can be added if it proves natural during testing.
- Touchscreen uses a large virtual movement control or direct touch movement after prototyping both.
- Collision should be generous rather than pixel-perfect.
- The player should not get trapped behind scenery.
- Paths should visually guide the player without forcing a single route.

Interactive things should clearly communicate themselves through subtle motion, sparkle, bounce, outline or a context icon.

## Unicorn creator

The player's unicorn is the central persistent identity.

Initial customisation categories:

- name;
- body colour;
- eye colour;
- mane style;
- mane colour;
- tail style;
- tail colour;
- horn style;
- face/body markings;
- one accessory slot.

Later categories:

- multiple accessory slots;
- wing styles;
- magical effects;
- hoof effects;
- seasonal outfits;
- friendship or event-specific cosmetics.

### Creator requirements

- Every option is cosmetic.
- Nothing is gender-locked.
- The player can revisit the creator later.
- The player can save favourite looks later.
- Colour swatches must be large and visually distinct.
- Randomise should exist because it is fun, not because setup is difficult.
- A "looks good" default should exist so the player can start immediately.

## Inventory

Inventory should be visual and category-driven, not spreadsheet-like.

Categories:

- treasures;
- flowers/plants;
- food/treats;
- quest objects;
- decorations;
- clothing/accessories;
- special discoveries.

The game should avoid tight inventory limits. A seven-year-old should not have to decide which flower to throw away because a bag is full.

Quest-critical objects cannot be discarded.

## Collections and the Wonderbook

The player receives a persistent illustrated **Wonderbook** early in the game.

The Wonderbook provides a child-friendly representation of long-term progress without functioning like a task list.

Possible pages:

- Places I Found;
- Friends;
- Treasures;
- Flowers;
- Creatures;
- Race Ribbons;
- Special Memories;
- Secret Things;
- My Cottage;
- My Unicorn Looks.

New entries should appear with a satisfying sticker/page animation.

Unknown entries should often appear as silhouettes or question marks, giving the player reasons to explore.

The Wonderbook also gives us a clean system for tracking discoveries without requiring conventional levels.

## Friendship system

NPC relationships should progress through remembered interactions rather than visible numerical reputation bars.

Internally each character can have friendship state, but the player-facing presentation should use meaningful descriptions or visual indicators such as:

- New Friend;
- Friend;
- Good Friend;
- Best Friend.

Friendship increases through:

- completing character stories;
- talking at meaningful moments;
- giving appropriate discovered objects where supported;
- taking part in shared activities;
- attending events.

Friendship should unlock:

- new conversations;
- personal quests;
- home visits;
- unique decorations/accessories;
- changes to an NPC's home or surroundings;
- race invitations;
- small story scenes.

The system should not encourage repetitive gift-spamming.

## Dialogue

Dialogue must be brief and visually supported.

Default dialogue rules:

- One or two short sentences per dialogue card.
- Large readable text.
- Character portrait or expressive sprite.
- Continue button always in the same place.
- Voice-like reaction sounds rather than full voice acting initially.
- Important nouns may be paired with icons.

Choices should be used for expression, not hidden morality tests.

Examples:

- "Let's race!"
- "Can we look for flowers instead?"
- "Maybe later."

NPCs should react differently, but no normal choice should make the player permanently lose a friend.

## Quest system

Quests are lightweight story activities, not a list of chores.

Quest types include:

- find a lost object;
- collect a small set of items;
- visit a place;
- talk to another character;
- solve a simple visual clue;
- participate in a race;
- choose decorations for an event;
- deliver a surprise;
- follow tracks or sparkles;
- help prepare a picnic/festival;
- discover what is making a strange sound;
- return later to see the result of something planted, repaired or discovered.

### Quest rules

- No more than a few active prominently presented tasks.
- No timed failure for core quests.
- Progress saves automatically.
- Important quest objects remain available until needed.
- Quest instructions can always be reopened.
- The current action should be represented by an icon and short sentence.

### Quest persistence

Completion should set world flags that can change:

- scenery;
- NPC locations;
- dialogue;
- available interactions;
- home decorations;
- event participants;
- Wonderbook entries.

This persistence is one of the game's signature systems.

## Suggested activities

Instead of a traditional daily checklist, the UI may offer two or three optional **Ideas for Today**.

Examples:

- Nova is racing at Rainbow Run.
- Willow's garden has started glowing.
- Pebble found something strange near the bridge.

These suggestions:

- are never mandatory;
- do not create punishment if ignored;
- should rotate based on world state;
- can include unfinished story threads;
- can be dismissed.

## Collecting

Collecting should reward looking carefully at the world.

Collectable classes can include:

- flowers;
- shells;
- crystals;
- ribbons;
- feathers;
- magical seeds;
- tiny figurines or charms;
- hidden stars;
- creature observations.

Common items should be easy to find. Rare items should come from unusual places or conditions rather than extremely low random drop chances.

The player should often be able to display discoveries at home.

## Currency and shops

The game should use at most one conventional soft currency in the early releases.

Working name: **Shimmer**.

Shimmer is earned through ordinary play:

- races;
- mini-games;
- discoveries;
- helping characters;
- optional collection milestones.

It can be spent on:

- accessories;
- furniture;
- decorations;
- non-essential cosmetic variations.

Core story progress is not purchased.

The economy should be generous. The objective is to create choices, not artificial scarcity.

## Cottage and decorating

The player's cottage is both a safe home base and a long-term expression system.

Initial decorating system:

- one main room;
- fixed placement zones rather than completely free-form placement;
- wall decoration slots;
- floor decoration slots;
- table/shelf slots;
- bed style;
- rug;
- lamp;
- window dressing;
- display shelf for treasures.

Fixed zones reduce frustration and collision problems while still allowing meaningful customisation.

Later expansion:

- extra room;
- garden;
- trophy/ribbon display;
- pet corner;
- seasonal decorations;
- more flexible placement.

NPC friends should occasionally notice or comment on visible decorations.

## Racing

Racing is the first substantial activity system outside exploration.

### Race format

The initial race implementation should use a colourful side-scrolling/pseudo-2.5D course with:

- player and NPC racers;
- automatic forward movement;
- jump input;
- simple lane or vertical positioning if required by the prototype;
- obstacles;
- boost zones;
- optional collectible stars/rings;
- alternate high/low paths on later tracks;
- visible finish positions.

This format is deliberately simpler than a free-roaming racing game and allows the main life-sim world to remain the focus.

### Race philosophy

Finishing is always worthwhile.

Rewards may include:

- participation Shimmer;
- extra reward for podium positions;
- personal-best ribbon;
- hidden collectible reward;
- special cosmetic for eventually winning a named cup.

Missing an obstacle should slow the player rather than stop the run.

### Difficulty

Difficulty can scale through course complexity, not aggressive AI cheating.

Early courses:

- broad jumps;
- few obstacles;
- obvious boosts.

Later courses:

- route choices;
- moving obstacles;
- timing challenges;
- shortcuts requiring confident jumping.

There should eventually be an assistance option that increases jump forgiveness and/or racer speed.

## Mini-games

Mini-games should be short, replayable and mechanically distinct.

Candidate activities:

- flower gathering;
- shell spotting;
- constellation matching;
- baking decoration;
- magical bubble popping;
- helping fireflies find lanterns;
- memory matching;
- simple rhythm hoof-tapping;
- cloud hopping;
- treasure sorting.

Only one or two mini-games should be built before the main world systems are proven.

## Gardening

Gardening is an expansion system, not required for the first vertical slice.

The desired version is deliberately lightweight:

- plant magical seeds;
- return after ordinary play progression rather than real-world waiting pressure;
- flowers become decoration, gifts or Wonderbook discoveries;
- some plants create visual changes or attract creatures.

No crops should wither because the player did not log in.

## Cooking/baking

A later activity system can allow the player to combine discovered ingredients or choose visual toppings.

The focus should be expressive and playful, not recipe memorisation.

Food can be used for:

- picnics;
- friendship scenes;
- events;
- home displays;
- visual rewards.

## Pets and companions

A later major feature.

Companions can begin as discoveries such as eggs or lost magical creatures.

The desired emotional arc is:

1. discover;
2. wonder what it is;
3. care for or investigate it;
4. return later;
5. reveal/hatch/befriend;
6. companion appears in the world and at home.

Companions should not require real-time feeding or create guilt if the player is absent.

## Day, weather and events

Day/night and weather should initially be atmospheric rather than simulation-heavy.

Possible states:

- morning;
- afternoon;
- sunset;
- night;
- sunshine;
- rain;
- sparkling magical weather.

They can affect:

- background art;
- music;
- ambient particles;
- available discoveries;
- NPC dialogue;
- special events.

The system should not be tightly bound to the player's real-world clock in early versions. This prevents a child from being locked out of content because she only plays at one time of day.

## Badges and ribbons

Badges are celebratory, not completionist pressure.

Examples:

- First Race;
- Found a Secret Path;
- Flower Friend;
- Decorated My Cottage;
- Met Everyone in Sunbeam Village;
- Rainbow Cup Winner;
- Ten Things in the Wonderbook.

The game should celebrate milestones with animation and sound but avoid endless pop-ups.

## Save and resume behaviour

The game saves automatically after meaningful state changes.

When the player returns:

- she should generally resume in a sensible safe location;
- her appearance and world changes should be intact;
- unfinished quests should remain understandable;
- the game can highlight one or two things that have changed since the last session.

The player should not need to understand manual save slots in the initial version.

## Explicitly out of scope for early releases

- combat;
- multiplayer;
- chat;
- public leaderboards;
- competitive PvP;
- real-money economy;
- loot boxes;
- survival meters;
- hunger/thirst;
- breeding mechanics;
- complex stats;
- procedurally generated world maps;
- AI-generated live dialogue sent to external services.

These exclusions keep development focused on the parts most likely to create attachment and imagination.
