# Unicorn Creator V1

## Purpose

R1-WP1.5 establishes the player's unicorn as a persistent identity before the first story introduction.

## Cosmetic contract

The creator exposes every R1 category promised by the game design:

- name;
- body colour;
- eye colour;
- mane style and colour;
- tail style and colour;
- horn style;
- marking;
- one accessory slot;
- randomise;
- a polished default.

Every choice is cosmetic and none is gender-locked.

## Placeholder choices

The exact colours and shapes in R1 are implementation placeholders. Stable appearance values are stored as semantic IDs such as `lavender`, `fluffy` and `flower`, not as raw Phaser colours or sprite names. Production art can therefore remap the same saved choices later.

`UnicornAppearance.ts` owns the option lists, defaults, parsing, save serialisation and name normalisation. Unknown or missing stored values fall back safely to the default look.

## Persistence

The existing version-one save schema already provides `profile.name` and `profile.appearance`, so the creator does not require a schema migration.

The scene loads through `SaveService`, updates only the profile identity fields and persists through the save service. It never calls browser storage directly.

`browserSaveService.ts` provides the lazy browser-specific save-service instance used by scenes.

## Name entry

The name field is a real HTML input layered over the responsive Phaser canvas. It is capped at 16 characters, trims repeated whitespace and falls back to `Starlight` if submitted blank.

## Routing

The title scene now checks the save service:

- no named unicorn: the primary button opens the creator;
- named unicorn: the primary button continues to Moonflower Glade;
- named unicorn: a secondary `Change my unicorn` action reopens the creator.

`?scene=creator` opens the creator directly for diagnostics.

R1-WP1.8 will harden this early new/continue routing and add explicit reset/new-game behaviour.

## Rendering

`UnicornAppearanceRenderer.ts` draws the prototype look from the same semantic appearance state used by the save. This establishes the layered rendering contract without prematurely committing production art.

The creator preview is the acceptance proof for visually distinct looks. R1-WP1.6 and later world-player work can use the same appearance renderer to generate the in-world placeholder texture.
