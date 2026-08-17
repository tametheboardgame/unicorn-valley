# Quest Engine V1

## Purpose

R2-WP2.3 adds a reusable, save-backed quest state machine. Story packages describe quests as content data; they do not need bespoke scene-state code for each objective.

## Lifecycle

Every registered quest can be:

- not started;
- active on one stable generated step ID;
- completed with a completion timestamp.

Quest progress lives in the existing versioned save model and therefore survives scene changes, title returns and browser reloads.

## Step types

Condition steps wait for gameplay events:

- talk to a character;
- collect a required item quantity;
- unlock a discovery.

Automatic effect steps run immediately when reached:

- award an item quantity;
- set a persistent world flag.

Reward item references, collection item references, characters, discoveries and flag formats are checked by content validation.

## Event-driven progression

The quest engine subscribes to the typed game event bus. Inventory additions now emit `ITEM_COLLECTED`, discovery unlocks emit `DISCOVERY_UNLOCKED`, and the quest engine exposes a character-talk notification path that emits `CHARACTER_TALKED`.

The browser game creates one quest-engine singleton during boot so later world content can start quests and feed ordinary gameplay events into them.

## Current objective

`getCurrentObjective()` resolves the active quest and step into a short child-facing instruction such as `Talk to Pip` or `Find 2 Berry Buns`. Automatic reward/effect steps are processed immediately rather than being exposed as objectives.

## Test quest

`A Sunny Little Errand` is deliberately tiny engine-validation content. Automated tests start it, progress its first step, recreate the save and event services to simulate a reload, finish its collection step, and verify that:

- the active objective survives reload;
- the reward item is awarded exactly once;
- the persistent world flag is set;
- the quest receives a completion timestamp;
- restarting a completed quest cannot duplicate the reward.
