# R2-WP2.9 - Vertical Slice Audio/UI Pass

## Purpose

R2-WP2.9 adds enough presentation coherence to judge whether the R2 vertical slice feels pleasant and responsive to play, rather than judging only whether its systems function.

This remains a prototype-quality presentation pass. It deliberately avoids committing the project to final music, sound libraries or production artwork before the daughter playtest has established which parts of the game deserve the greatest polish investment.

## UI skin

The first-pass interface now uses a shared storybook visual language across the main vertical-slice surfaces:

- warm cream cards rather than flat utility panels;
- lavender and gold accents;
- soft offset shadows;
- large, high-contrast text;
- rounded-feeling panel composition;
- gentle hover feedback on pointer-capable devices;
- star, gift and sparkle motifs where they communicate reward or discovery.

The shared treatment is applied to:

- title screen controls;
- interaction prompt and bag button;
- optional activity suggestions;
- dialogue cards and choices;
- inventory item cards;
- sound settings;
- reward notifications.

The intent is coherence and readability, not final illustration.

## Temporary audio system

Temporary R2 audio is generated in the browser with the Web Audio API rather than checked-in placeholder music files.

This provides:

- a calm Moonflower Glade musical identity;
- a brighter, more playful Sunbeam Village identity;
- a softer Moonflower Cottage identity;
- quiet procedural ambience beneath the music;
- dialogue chirps;
- UI feedback;
- collect sounds;
- discovery stings;
- quest-completion stings.

The generated material is intentionally simple and replaceable. Production music and sound design can later replace it without changing gameplay state or content definitions.

## Browser audio behaviour

Modern browsers normally require a user gesture before audio playback can start. The vertical-slice audio service therefore:

- remains safe and silent before the first pointer or keyboard gesture;
- unlocks or resumes the audio context after player input;
- begins the appropriate location profile once playback is allowed;
- stops and changes the active profile with scene changes;
- does not block gameplay when audio is unavailable.

## Sound settings

A persistent Sound button is available from the title screen and the shared exploration HUD.

The player can independently control:

- all sound;
- music;
- ambience;
- sound effects.

Preferences are stored in a small dedicated browser settings record. They are deliberately separate from progression save data, so starting a new unicorn does not unexpectedly reset the player's preferred sound configuration.

Malformed or unavailable browser storage falls back to safe defaults rather than preventing the game from starting.

## Visual reward feedback

Major progression events now receive an additional visual response through the shared game event bus.

Current feedback includes:

- item collected: gift notification and collect sound;
- discovery unlocked: Wonderbook notification, sparkles and discovery sting;
- quest completed: positive world-memory notification and completion sting.

The notification is supplementary. Existing gameplay state, text and world changes remain the source of truth.

## Muted-game requirement

No action introduced in this package requires sound.

When all sound is disabled:

- dialogue remains fully text based;
- discoveries continue to flash and show written feedback;
- item and quest rewards receive visible notifications;
- interaction prompts remain visible;
- the Sound control clearly communicates the muted state.

This keeps the vertical slice understandable for muted play and supports the project's accessibility requirement that critical information is not sound-only.

## Validation focus

Automated coverage verifies:

- default audio preferences;
- independent music, ambience and effects persistence;
- safe recovery from malformed stored preferences;
- volume normalisation;
- distinct Glade and Village scene profiles;
- utility scenes remain free of unintended location ambience.

The full repository validation pipeline remains the merge gate: formatting, lint, TypeScript, tests, production build and static smoke.

## Deliberately deferred

The following remain later production work rather than WP2.9 scope:

- composed final soundtrack recordings;
- final region ambience recordings;
- bespoke NPC vocal personalities;
- final production UI illustration;
- complete menu transition animation;
- detailed hoofstep and surface audio;
- final mixing and mastering;
- comprehensive accessibility controls beyond the R2 vertical-slice needs.

Those should be informed by the R2 daughter playtest and later R6 production-presentation work rather than assumed in advance.
