# Unicorn Valley audio

Drop authored MP3 files into these folders and commit them:

- `public/audio/music/` for music. Region subfolders are allowed.
- `public/audio/sfx/` for short sound effects.

`npm run audio:catalogue` discovers MP3 files recursively and regenerates `src/generated/audioCatalogue.ts`.
`npm run dev` and `npm run build` regenerate the catalogue automatically. `npm run validate` checks that the committed catalogue is current.

Discovery does not automatically attach a file to gameplay. Music themes/playlists and SFX cues are assigned explicitly in `src/content/audioBindings.ts`, so adding a new file cannot unexpectedly change a scene.

Music files discovered in `public/audio/music/` are available to the Settings music picker. Selecting `Scene theme` returns control to the contextual theme/playlists.
