# Unicorn Valley audio

Drop authored MP3 files into these folders and commit them. The catalogue discovers MP3 files recursively, so filenames can be descriptive and folders can contain multiple tracks.

## Music folders

- `public/audio/music/title/`
- `public/audio/music/unicorn-creator/`
- `public/audio/music/moonflower-glade/`
- `public/audio/music/moonflower-cottage/`
- `public/audio/music/moonflower-patch/`
- `public/audio/music/sunbeam-village/`
- `public/audio/music/rainbow-meadow/`
- `public/audio/music/rainbow-run/`
- `public/audio/music/crystal-brook/`
- `public/audio/music/crystal-grotto/`
- `public/audio/music/whispering-woods/`
- `public/audio/music/hollow-tree-nook/`
- `public/audio/music/firefly-grove/`
- `public/audio/music/starlight-beach/`
- `public/audio/music/windmill-lookout/`
- `public/audio/music/races/` for shared race material.

The folders are intentionally more granular than the runtime context map. WP19H can decide that several areas share a theme or playlist without reorganising the authored files.

## SFX folders

- `public/audio/sfx/ui/`
- `public/audio/sfx/interactions/`
- `public/audio/sfx/footsteps-movement/`
- `public/audio/sfx/discoveries/`
- `public/audio/sfx/quests/`
- `public/audio/sfx/magic/`
- `public/audio/sfx/environment/`
- `public/audio/sfx/npcs/`
- `public/audio/sfx/shops/`
- `public/audio/sfx/races/`
- `public/audio/sfx/minigames/`

The existing `public/audio/sfx/ui-soft-chime.mp3` remains at the SFX root for backwards compatibility with its current catalogue ID and binding. New authored SFX should use the category folders above.

## Catalogue

`npm run audio:catalogue` discovers MP3 files recursively and regenerates `src/generated/audioCatalogue.ts`.
`npm run dev` and `npm run build` regenerate the catalogue automatically. `npm run validate` checks that the committed catalogue is current.

Discovery does not automatically attach a file to gameplay. Music themes/playlists and SFX cues are assigned explicitly in `src/content/audioBindings.ts`, so adding a new file cannot unexpectedly change a scene.

Music files discovered in `public/audio/music/` are available to the Settings music picker. Selecting `Scene theme` returns control to contextual theme/playlists.

## WP19H playback behaviour

WP19H must expose two clear music behaviours in Settings:

1. **Area / Scene theme** - music follows the current area or gameplay context using the explicit bindings. Moving between contexts must use a smooth crossfade rather than a hard or jarring track cut. If the currently playing track remains valid for the destination context, it should be allowed to continue instead of being restarted unnecessarily.
2. **Global playlist** - discovered music can play as a normal playlist irrespective of the current area. Area changes must not interrupt or replace the selected playlist track merely because the scene/context changed.

WP19H should tune transition timing, fade curves, track continuity, looping/shuffle behaviour and perceived loudness using real authored tracks. Context changes and normal playlist track changes should both avoid abrupt starts/stops unless a specific gameplay cue deliberately requires one.
