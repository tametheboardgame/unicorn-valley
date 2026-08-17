# Willow's Moonflowers

## Purpose

R2-WP2.5 is the first complete short story in the Living Valley slice. It proves that dialogue, inventory, quest progression, friendship and persistent world change can work together without scene-specific quest state.

## Story loop

The player meets Willow in Sunbeam Village. Willow asks for three Moonflowers from Moonflower Glade.

The player can then:

1. return to Moonflower Glade;
2. visit the Moonflower Field;
3. walk close to three glowing Moonflowers to collect them;
4. return to Willow;
5. finish the hand-in conversation;
6. receive a Moonflower Lantern;
7. become Willow's Friend;
8. see Willow's previously sparse garden permanently filled with glowing Moonflowers.

## Data-driven quest

`quest:willows-moonflowers` contains the complete story progression:

- talk to Willow;
- collect three quest-critical Moonflowers;
- talk to Willow again;
- consume the three flowers through the explicit quest-only inventory path;
- award a Moonflower Lantern decoration;
- award friendship with Willow;
- set the persistent `flag:willow-garden-planted` world flag.

The quest engine was extended with reusable `consume-item` and `award-friendship` automatic steps so future stories can use the same pattern.

## Dialogue behaviour

Willow uses separate registered dialogue content for introduction, reminder, hand-in and follow-up states. Leaving a required conversation early does not advance the quest.

After completion, friendship-aware dialogue selection gives Willow a warmer follow-up line once the player has reached the Friend tier. The line explicitly remembers that the player and Willow planted the Moonflowers together.

## Moonflower Patch

The existing Moonflower Field landmark now opens a small playable collection scene. During Willow's collection objective, the patch exposes only the remaining flowers required to reach three. Collection uses the shared inventory service, so each flower immediately persists and emits the event that drives quest progression.

Outside the collection objective, the patch remains visitable as a decorative location rather than becoming a dead interaction.

Returning to Moonflower Glade places the unicorn back beside the Moonflower Field instead of at the default home spawn.

## Persistent village change

Sunbeam Village reads the saved garden flag every time it is created.

Before completion, Willow's plot shows a small sparse garden. After completion and on later reloads, the same plot renders a row of glowing Moonflowers and a changed label. The visual state therefore comes from persisted world state rather than transient scene memory.

## Validation

Automated quest tests prove the full data flow:

- introduction talk advances to collection;
- collecting three flowers advances to the return objective;
- final talk consumes all three quest items;
- the Moonflower Lantern is awarded once;
- Willow gains friendship and reaches Friend;
- the planted-garden flag persists;
- a fresh quest/save/runtime instance remains completed and cannot duplicate the reward.
