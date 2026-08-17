# Unicorn Valley - Child UX, Accessibility and Safety

## Purpose

The target player is a young child. UX decisions therefore need to be designed around independence, clarity, forgiving interaction and parent trust rather than assuming adult game literacy.

## Primary UX principle

**The player should be able to understand what can be done by looking at the screen, not by reading instructions about the screen.**

Text supports interaction. It should not carry the full burden of explaining it.

## Reading level

Rules for player-facing text:

- Prefer short sentences.
- Avoid paragraphs during active play.
- Use common vocabulary unless a magical word is deliberately being introduced.
- Pair important objects/actions with icons.
- Keep button labels short.
- Keep character dialogue to one or two sentences per card where practical.
- Never require the player to remember several sentences of instructions before acting.

Where a task has several stages, reveal one stage at a time.

## Navigation

Every full-screen menu should have:

- an obvious way back;
- a consistent home/close control position;
- no hidden gesture required to exit;
- large target areas.

The game should avoid deep menu hierarchies.

Ideal maximum depth for frequently used features:

- Main game -> Wonderbook -> page.
- Main game -> Wardrobe -> category.
- Main game -> Cottage decorate -> category.

## Interaction language

Use a consistent interaction icon and control.

Examples:

- speech bubble = talk;
- hand/sparkle = inspect/use;
- door = enter;
- wardrobe = change appearance;
- book = Wonderbook;
- ribbon = race.

Do not use five different visual treatments for "press this to interact".

## Click/touch targets

Controls should be deliberately oversized.

Targets must not depend on precise cursor placement. Small icons should sit inside larger invisible hit areas.

Touch controls should be spaced so that accidental adjacent taps are uncommon.

## Feedback

Every meaningful input should create immediate feedback through one or more of:

- movement;
- sound;
- scale/bounce;
- particle sparkle;
- colour/outline change;
- short animation;
- dialogue/reaction.

A child should rarely be left wondering whether a click worked.

## Error prevention

Prefer preventing mistakes to explaining errors.

Examples:

- disable unavailable buttons rather than allowing them and showing an error;
- do not allow quest-critical objects to be deleted;
- prevent furniture from being placed in invalid slots;
- autosave important changes;
- confirm only genuinely destructive actions.

## Confirmation prompts

Avoid excessive "Are you sure?" prompts because they teach the player to click through them without reading.

Use confirmation only for actions such as:

- starting a completely new game when a save exists;
- deleting/resetting a save;
- replacing a saved backup.

Changing clothes, rearranging furniture and replaying races should be reversible without confirmation.

## No-punishment interaction

Normal experimentation should be safe.

The player must be able to:

- try dialogue choices;
- wear strange combinations;
- move decorations repeatedly;
- retry activities;
- leave a quest and return;
- explore in the "wrong" direction.

The game should not punish curiosity.

## Objective presentation

Avoid a large quest journal full of obligations.

During play, present at most one current objective prominently and a small number of optional activity suggestions.

Example:

- Current: "Find 3 Moonflowers for Willow" + flower icon + 2/3.
- Optional: "Nova is at Rainbow Run".

The Wonderbook can preserve completed memories and discoveries without looking like homework.

## Tutorial philosophy

Teach through doing.

Bad tutorial:

- several modal text boxes explaining controls before the player moves.

Preferred tutorial:

1. Pip walks a few steps.
2. Movement control appears subtly.
3. Player moves.
4. A sparkle appears nearby.
5. Interaction prompt appears only when close enough.
6. Player collects the object.
7. Pip reacts.

The tutorial should disappear as soon as demonstrated competency is obvious.

## Assistance and accessibility settings

Initial settings should include:

- music volume;
- sound-effects volume;
- mute/master sound;
- text speed or instant text;
- reduced motion where animations could be uncomfortable;
- high-visibility interaction indicators if practical;
- race assistance once racing exists.

Potential later settings:

- dyslexia-friendly font option if testing indicates benefit;
- larger dialogue text;
- simplified touch controls;
- colour differentiation aids.

## Colour use

Colour is important to the visual identity but must not be the only carrier of information.

Examples:

- rarity/state uses icon + colour;
- selected item uses border/checkmark + colour;
- race position uses number + colour;
- quest state uses symbol/text + colour.

## Audio cues

Audio should reinforce, not replace, visual information.

Useful cues:

- collectable discovered;
- quest progressed;
- race start countdown;
- hidden secret nearby;
- menu selection;
- reward earned.

The game must remain understandable when muted.

## Race accessibility

Racing should support:

- forgiving jump windows;
- clear obstacle silhouettes;
- predictable controls;
- no instant fail from one mistake;
- optional assistance that improves jump forgiveness and/or base speed;
- participation rewards regardless of finishing position.

Assistance mode should not shame the player or label rewards as less legitimate.

## Saving UX

Saving should be automatic and mostly invisible.

A small reassuring save icon can briefly appear after major changes.

The player should not need to understand:

- save slots;
- filenames;
- cloud accounts;
- manual save menus.

A parent-facing backup/export option can exist in settings later.

## Parent trust and privacy

Early releases intentionally avoid features that create safeguarding or privacy complexity.

Do not include:

- advertising;
- in-app purchases;
- external chat;
- public usernames;
- public leaderboards;
- friend requests;
- social-media posting;
- geolocation;
- camera/microphone access;
- unnecessary tracking SDKs.

The game should work without creating an account.

## External links

The child-facing game should contain no ordinary external links.

If project/credits links are ever exposed, put them behind a parent/settings area and avoid visually encouraging a child to leave the game.

## Naming

Allowing a locally stored unicorn name is low risk because the value does not leave the device in the initial architecture.

The UI should not ask for real name, age, school, location or other personal information.

## Online functionality rule

Any future proposal to add online functionality must answer:

1. What child-facing benefit does this provide?
2. Can the same benefit be delivered locally?
3. What data must leave the device?
4. Can identifiers be avoided?
5. Does the feature create moderation/safeguarding requirements?
6. Is the feature worth that complexity?

Default answer is to remain local unless the benefit is substantial.

## Frustration monitoring during playtests

Observe, do not immediately instruct.

Record places where the player:

- repeatedly clicks non-interactive scenery;
- cannot identify the next action;
- gets stuck on collision;
- closes the wrong menu;
- skips dialogue and then becomes confused;
- fails an activity several times;
- cannot find an exit;
- does not notice a reward;
- assumes an object should be interactive when it is not.

The correct response is usually to improve the game, not teach the player a workaround.

## Delight monitoring during playtests

Also record what creates spontaneous engagement:

- repeated customisation;
- favourite NPCs;
- activities replayed voluntarily;
- objects the player talks about;
- secrets she tries to investigate;
- decorations she shows another person;
- moments that trigger laughter or surprise;
- characters/locations she names from memory.

These observations should drive the expansion roadmap more strongly than adult assumptions about what children ought to enjoy.

## Definition of child-friendly completion

A feature is not complete merely because its mechanics work.

For a child-facing feature to be complete:

- the purpose is visually understandable;
- controls are discoverable;
- exits/back controls are obvious;
- mistakes are recoverable;
- text is short enough;
- feedback is immediate;
- touch targets are adequate;
- the game can resume safely after closing/reloading;
- no adult explanation is expected for routine use.
