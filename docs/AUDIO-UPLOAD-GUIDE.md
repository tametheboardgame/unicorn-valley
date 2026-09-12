# Unicorn Valley audio upload guide

This guide is for adding finished audio without needing to understand the game code.

## Where files go

There are two audio folders:

- `public/audio/music/` for background music and area themes.
- `public/audio/sfx/` for short sound effects.

Subfolders are allowed. For example:

- `public/audio/music/moonflower/moonflower-glade-day.mp3`
- `public/audio/music/race/rainbow-run-theme.mp3`
- `public/audio/sfx/world/crystal-note.mp3`
- `public/audio/sfx/ui/book-open.mp3`

At present, authored audio must be MP3. Other formats are not catalogued and will not be used by the game.

## File naming

Use short, descriptive, lower-case names separated with hyphens.

Good examples:

- `moonflower-glade-theme.mp3`
- `starlight-beach-night.mp3`
- `door-cottage-creak.mp3`
- `crystal-note-soft.mp3`
- `quest-complete-sparkle.mp3`

Avoid names such as `final-final-2.mp3`, artist names, dates or filenames that only make sense outside the game.

The file path becomes a stable catalogue ID. For example:

- `public/audio/music/moonflower/moonflower-glade-theme.mp3` becomes `music:moonflower/moonflower-glade-theme`.
- `public/audio/sfx/world/crystal-note-soft.mp3` becomes `sfx:world/crystal-note-soft`.

## Useful lengths

These are practical targets, not hard limits:

- Area/theme music: roughly 2 to 6 minutes before looping or moving to another playlist track.
- Short UI sounds: roughly 0.05 to 0.8 seconds.
- Interaction sounds: roughly 0.1 to 2 seconds.
- Celebration/reward sounds: roughly 0.5 to 4 seconds.

MP3 looping can have audible encoder padding. A file should be listened to in the game before it is described as seamless or suitable for a continuous loop.

## How to add music without editing code

1. Upload the MP3 into `public/audio/music/` or an appropriate subfolder.
2. Say which part of Unicorn Valley it belongs to, for example “use this as the Starlight Beach theme” or “add this to the Whispering Woods playlist”.
3. The catalogue and assignment file can then be updated for you.
4. Test the area in-game and check transitions, volume and looping before accepting the track.

The available music contexts are:

- Title and unicorn creator.
- Moonflower Glade and cottage.
- Sunbeam Village and village interiors.
- Rainbow Meadow and Windmill Lookout.
- Crystal Brook and Crystal Grotto.
- Whispering Woods, Hollow Tree Nook and Firefly content.
- Starlight Beach.
- Rainbow Run and race content.

Bag, Map, Wonderbook and Settings do not select a new area theme. They retain the music context that was already playing.

## How to add a sound effect without editing code

1. Upload the MP3 into `public/audio/sfx/` or an appropriate subfolder.
2. Describe the intended moment as specifically as possible.
3. If it belongs to a particular world object, include the object or interaction name, for example “play this when the player successfully inspects the crystal cluster”.
4. The sound is then assigned to a semantic cue or stable interaction ID and tested once at the successful action point.

Supported semantic cue types are:

- UI select.
- UI back/close.
- Talk acknowledgement.
- Item collection.
- Discovery unlock.
- Quest completion.
- Friendship change.
- Door/enter action.
- Decoration placement/removal.
- Race countdown.
- Race go.
- Race jump.
- Race boost.
- Race impact.
- Race finish.

Object-specific sounds use the stable interaction ID rather than display text or coordinates. That means changing a label or moving the object does not break its audio assignment.

## Replacing an existing file

To replace a sound while keeping its assignment:

1. Upload the replacement MP3 using exactly the same folder and filename.
2. The catalogue hash must be regenerated so browsers receive the new version instead of a cached copy.
3. Re-test the assigned scene/event for level, timing and audible start/end artefacts.

Changing the filename creates a new catalogue ID, so its previous assignments must also be updated.

## Music and effects controls

Settings provides independent controls for:

- Master volume.
- Music volume and enable/disable.
- Ambience volume and enable/disable.
- Sound-effects volume and enable/disable.
- Full mute.
- A specific uploaded music track, or the contextual Scene theme.

Full mute always takes priority over the individual channels.

## Mix targets

The existing playback engine deliberately leaves music below one-shot effects so interaction feedback stays audible without being harsh. Treat the current settings as the starting mix, not a mastering specification.

When new files are added, review them in-game at default volume and at lower device volume. Check:

- speech/talk cues are quiet and brief;
- repeated collection/UI sounds are not tiring;
- reward sounds remain distinct from normal interaction sounds;
- area music does not jump dramatically in perceived loudness between tracks;
- MP3 loop points do not click, add silence or expose obvious encoder padding;
- mute and channel sliders still silence the expected audio immediately.

Music ducking is not enabled by default. Add it only if a listening test shows that a dialogue or important sound is being masked.

## Current authored-audio checklist

As of WP19H implementation:

- Title/creator music: **assigned and ready for listening test**.
- Moonflower Glade/cottage music: **two tracks assigned and ready for listening test**.
- Sunbeam Village/interiors music: **three tracks assigned and ready for listening test**.
- Rainbow Meadow music: **assigned and ready for listening test**.
- Crystal Brook/Grotto music: **two tracks assigned and ready for listening test**.
- Whispering Woods/Firefly music: **two tracks assigned and ready for listening test**.
- Rainbow Run music: **assigned and ready for listening test**.
- Starlight Beach music: **missing final asset**, procedural fallback remains active.
- UI select: **assigned to the soft-chime integration fixture**.
- UI back/close: **authored asset assigned**, final listening test pending.
- Discovery: **authored asset assigned**, final listening test pending.
- Talk acknowledgement: **missing final asset**, procedural fallback remains active.
- Collection: **missing final asset**, procedural fallback remains active.
- Quest completion: **missing final asset**, procedural fallback remains active.
- Friendship: **missing final asset**, procedural fallback remains active.
- Door/enter: **missing final asset**, procedural fallback remains active.
- Decoration: **missing final asset**, procedural fallback remains active.
- Race countdown/go/jump/boost/impact/finish: **missing final assets**, procedural fallbacks remain active.

The absence of final MP3s does not disable the game. Each unassigned semantic cue keeps its explicit procedural fallback until an authored file is supplied and accepted.
