# Unicorn Valley - Game Vision

## Status

Pre-production design baseline.

This document defines what Unicorn Valley is intended to feel like. Where later implementation choices conflict with this vision, this document takes priority unless the design decision is explicitly changed.

## One-sentence pitch

**Unicorn Valley is a cosy browser-based life-adventure for a young child where she creates her own unicorn, explores a magical valley, makes friends, collects treasures, decorates her home, enters races and sees the world remember the things she has done.**

## Player fantasy

The game should consistently make the player feel:

- This is **my unicorn**.
- This is **my home**.
- I can decide what I want to do today.
- There is always something interesting just around the corner.
- The unicorns here know me and remember me.
- Things I do leave visible changes in the world.
- I can discover things without being frightened of doing something wrong.
- Winning is exciting, but playing is worthwhile even when I do not win.

The primary fantasy is not "be the best unicorn". It is **"live a magical unicorn life in a world that feels like mine"**.

## Target player

Primary target:

- Age: approximately 7.
- Platform: browser on desktop, laptop or tablet.
- Input: mouse, touchscreen and keyboard where useful.
- Reading level: assume the player can read short simple sentences, but never make reading ability a barrier to understanding what to do.
- Session length: should work equally well for a five-minute visit or a longer play session.

Secondary target:

- A parent should be comfortable leaving the player with the game.
- The interface should be understandable enough that adult assistance is not routinely required.

## Core design pillars

### 1. Choice without pressure

The player should almost always have several attractive things she *could* do and very few things she *must* do.

The game must not use:

- energy systems;
- lives that run out;
- real-money purchases;
- daily login streak punishment;
- timed chores that expire because the player did not log in;
- irreversible mistakes in normal play;
- harsh fail screens.

A task may be described as happening "today" for flavour, but missing it must not punish the player. Important events can wait for her or return later.

### 2. Expression is gameplay

Choosing colours, clothes, accessories and decorations is not peripheral. It is one of the main game systems.

The player should be able to express herself through:

- unicorn appearance;
- mane and tail styles;
- colours and markings;
- horn and later wing styles;
- accessories;
- room and cottage decoration;
- collections on display;
- favourite companions or pets later in development.

There should be no mechanically "best" outfit.

### 3. Constant small wonder

The world should regularly create small moments of discovery:

- a sparkle behind a tree;
- a hidden path;
- a strange egg;
- a flower that only blooms beside the river;
- an NPC doing something unexpected;
- a secret decoration unlocked by an unusual action;
- a rare weather or evening event;
- a previously closed place becoming accessible.

The desired response is repeatedly: **"Ooh, what is that?"**

Large quests are less important than a dense supply of small surprises.

### 4. Friendship and memory

NPCs should not feel like vending machines for quests.

When the player helps or spends time with a character, later dialogue and world details should reflect it. Examples:

- a flower the player found appears in an NPC's garden;
- a repaired sign remains repaired;
- a gift is displayed in an NPC's home;
- a friend refers to an earlier adventure;
- a character appears at the player's cottage after becoming close friends;
- an event has slightly different dialogue because of previous choices.

The system does not need complex simulation. It needs convincing persistence.

### 5. Playful mastery without exclusion

Activities such as races should have enough depth that the player can get better at them, but losing must not stop progression.

A race should reward:

- taking part;
- collecting optional items;
- personal bests;
- trying different routes;
- eventually winning.

First place can grant prestige, badges or cosmetic rewards, but basic progress should never require perfect performance.

### 6. Parent trust

The game should be safe by architecture, not by moderation.

Initial releases will have:

- no accounts;
- no advertising;
- no purchases;
- no online chat;
- no user-to-user messaging;
- no public profiles;
- no location collection;
- no behavioural advertising or analytics SDKs;
- local saves only.

Optional online save functionality may be considered later, but only if it adds clear value and can be implemented without undermining the above principles.

## Core emotional loop

The player experience should repeatedly move through:

1. **See something interesting.**
2. **Choose to investigate it.**
3. **Do a simple enjoyable activity.**
4. **Receive a visible or expressive reward.**
5. **See the world or a relationship change.**
6. **Notice another interesting possibility.**

This is more important than conventional levelling.

## Session structure

A typical session should not begin with a wall of objectives.

The player starts at or near her cottage and can immediately move.

Optional prompts may offer a small number of ideas such as:

- "Nova is practising at Rainbow Run."
- "Something is sparkling near Crystal Brook."
- "Willow has new flowers in her garden."

These are suggestions, not obligations.

A sample session might be:

1. Leave the cottage wearing a new purple bow.
2. Find an NPC looking for a missing hair clip.
3. Discover the clip near a river while collecting shells.
4. Return it and receive a decorative item.
5. Enter a race and finish second.
6. Earn a participation reward and improve a personal best.
7. Buy or unlock a star-shaped lamp.
8. Find a mysterious egg behind a tree on the journey home.
9. Put the lamp in the cottage and leave the egg somewhere safe.
10. Return in a later session to discover that the egg has hatched.

Nothing in that sequence depends on a long tutorial or difficult reading.

## Overall structure

Unicorn Valley is best understood as a collection of interconnected systems inside one persistent world:

- exploration;
- character customisation;
- friendship;
- lightweight quests;
- collecting;
- decorating;
- racing;
- mini-games;
- world events;
- discovery and secrets;
- later pets/companions;
- later gardening, cooking and crafting-style activities.

Not every system needs to exist in the first playable release. The architecture must allow them to be added without rewriting the game.

## Progression philosophy

Progress should primarily unlock **more possibility**, not larger numbers.

Good progression rewards:

- a new area;
- a new character;
- a new hair style;
- a new race route;
- a cottage room;
- a new decoration category;
- a new interaction;
- wings;
- a companion;
- a festival;
- a secret path;
- a new activity.

Avoid stat-heavy progression such as +5 speed, +3 magic and complex equipment optimisation.

## Failure philosophy

The game can contain challenge, but ordinary failure should be gentle.

Examples:

- Lose a race: receive a smaller reward, a friendly reaction and the option to retry.
- Miss a jump: lose a little momentum, not the entire race.
- Choose the wrong object in a search activity: playful feedback, then continue.
- Leave a quest halfway through: it remains available later.

There is no conventional game-over state in normal life-sim play.

## Narrative tone

The world should be:

- sincere rather than ironic;
- funny without constantly making jokes;
- colourful without becoming visually unreadable;
- magical without relying on danger;
- emotionally warm without becoming preachy;
- occasionally mysterious without becoming frightening.

Conflict should usually be small-scale and relatable: lost objects, misunderstandings, nervousness before a race, a ruined picnic, a blocked path, an unusual magical event.

The valley does not need a villain to be interesting.

## Originality rule

The game may occupy the same broad fantasy space as properties such as My Little Pony, but it must not copy their characters, terminology, plots, locations, visual designs or lore.

Unicorn Valley should build its own identity around:

- the player's personal unicorn;
- a persistent illustrated valley;
- environmental storytelling;
- small mysteries;
- expressive customisation;
- visible consequences from friendships and discoveries.

## Success criteria

The project is succeeding when the target player:

- asks to play again without being prompted;
- remembers NPCs by name;
- cares about how her unicorn looks;
- shows someone a room or outfit she created;
- chooses different activities in different sessions;
- becomes curious about unopened areas or unexplained objects;
- talks about events in the game as things that happened to *her unicorn*;
- is able to navigate most of the game independently.

A technically impressive feature that does not improve one of those outcomes is probably lower priority than it first appears.
