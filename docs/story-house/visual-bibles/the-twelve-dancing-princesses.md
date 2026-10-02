# The Twelve Dancing Princesses — modern Story House visual bible

Work package: **R6.5-WP19SH1.4.2**

## Purpose

Create one coherent five-image modern illustration set for **The Twelve Dancing Princesses** and make
it independently selectable against both the Story House retelling and the Full Classic Text.

The existing Arthur Rackham files remain the **Classic Illustrations** option. The generated set
becomes **Modern Illustrations**.

This title is the first SH1 package where the two text editions materially differ in the identity of
the investigator: the Story House retelling follows a female traveller, while the Full Classic Text
follows an old soldier. The shared modern set therefore uses scenes that are valid in both editions
without visibly identifying the investigator. The twelve sisters, palace and underground world are
the continuity anchors.

## Visual direction

- warm hand-painted children's storybook illustration;
- soft gouache / watercolour texture with luminous metallic and jewel-like night colours;
- elegant fairy-tale palace, not glossy CGI or photorealism;
- midnight magic should feel mysterious and inviting rather than sinister;
- recurring-character consistency across the sisters is the primary quality bar;
- silver, gold and diamond woods should be visually distinct while still belonging to one world;
- underground ballroom lighting is warm amber and candlelit against deep blue-violet night;
- no baked-in typography, captions, logos, borders or UI.

## Character continuity

### Eldest princess

- young adult woman;
- dark brown hair in a low braided crown;
- deep burgundy dancing gown with restrained gold trim;
- poised posture, confident expression and natural leadership;
- same face, hair, gown silhouette and colour identity in every scene.

### Youngest princess

- late-teen / young adult woman;
- honey-blonde hair worn in a loose half-up style;
- pale blue dancing gown with silver trim;
- expressive face, more cautious and observant than her sisters;
- same face, hair, gown silhouette and colour identity in every scene.

### The other ten sisters

Keep the remaining sisters recognisably recurring through a fixed costume palette rather than
inventing new dresses from scene to scene.

Use one sister in each of these dominant colours:

1. emerald green;
2. plum purple;
3. warm amber;
4. deep teal;
5. rose pink;
6. ivory with gold;
7. violet;
8. sage green;
9. copper / russet;
10. midnight blue.

Hair colours may vary naturally across brown, black, auburn, dark blonde and light blonde, but each
sister must retain the same broad hair colour, style and gown colour between images.

The sisters should look related without appearing identical. Avoid duplicate faces.

### The king

- older man with silver-brown hair and a short neat beard;
- dark blue-green court robes with gold detailing;
- affectionate but slightly exasperated father rather than a severe ruler.

### Investigator handling

Do not establish a visible canonical investigator in the shared modern set.

- Story House text: female traveller.
- Full Classic Text: old soldier.
- The five shared images must therefore either omit the investigator entirely, place the viewpoint
  from their perspective, or keep them outside the frame.
- Do not show a clearly gendered traveller/soldier and then reuse that image against the other
  edition.

## Environment continuity

### Palace

- warm pale stone, carved dark wood, candle / lantern light;
- the princesses share a large upper room with twelve beds;
- eldest princess's bed is the concealed entrance;
- throne room later uses the same stone, wood and textile palette.

### Underground route

- descending stone stair beneath the bed;
- **silver wood**: pale moonlit trunks and genuinely silver leaves;
- **gold wood**: warmer golden foliage;
- **diamond wood**: cool crystalline leaves beneath strange blue stars;
- underground lake is deep indigo with still reflections;
- small elegant boats carry the sisters across the water.

### Midnight castle and ballroom

- same castle in lake and ballroom scenes;
- luminous pale stone across the lake;
- grand ballroom uses tall arches, amber lanterns, polished floor and a musicians' balcony;
- magical rather than modern luxury.

## Modern illustration set

### 1. The morning mystery

Story House block: `morning-mystery`  
Full Classic block: `p01-b01`

- morning in the sisters' shared bedchamber;
- exactly twelve princesses are present;
- several sit or stand around twelve pairs of visibly worn-through dancing shoes;
- eldest princess remains composed while the youngest struggles not to smile;
- the king can stand in the doorway, baffled;
- establish the twelve sisters' fixed costume / hair identities, though they are in tasteful
  morning robes rather than ball gowns;
- emotional read: a funny mystery with a secret behind it;
- destination:
  `public/stories/the-twelve-dancing-princesses/illustrations/generated/worn-out-shoes.webp`.

### 2. The hidden bed

Story House block: `the-sleeping-drink`  
Full Classic block: `p03-b01`

- late at night in the same bedchamber;
- exactly twelve sisters are dressed for the ball in their fixed jewel-tone gowns;
- the eldest stamps or gestures as her bed sinks into the floor to reveal the hidden stair;
- the youngest looks uneasy while the others are excited;
- investigator remains unseen;
- emotional read: the secret route has finally opened;
- destination:
  `public/stories/the-twelve-dancing-princesses/illustrations/generated/hidden-bed-stair.webp`.

### 3. The silver wood

Story House block: `the-silver-wood`  
Full Classic block: `p04-b01`

- procession of the twelve sisters through the first underground forest;
- silver leaves glow and chime under a deep blue magical sky;
- eldest leads confidently; youngest looks back as if she heard something;
- enough of the fixed gown palette remains visible to establish the same group;
- no visible investigator;
- distant hints of the next golden wood or lake may appear, but silver is the scene identity;
- emotional read: wonder mixed with the youngest sister's suspicion;
- destination:
  `public/stories/the-twelve-dancing-princesses/illustrations/generated/silver-wood.webp`.

### 4. The midnight ballroom

Story House block: `the-dance`  
Full Classic block: `p06-b01`

- grand underground ballroom at full magical splendour;
- all twelve princesses are present and recognisable by their fixed gown palette;
- favour a circular / sweeping group composition so the sisters remain the visual focus;
- dancing partners may appear, but must not obscure or duplicate the sisters;
- eldest dances confidently; youngest can be nearer the edge, tired but happy;
- lantern light, musicians' balcony and polished floor match the established midnight castle;
- emotional read: this is why the shoes are worn through;
- destination:
  `public/stories/the-twelve-dancing-princesses/illustrations/generated/midnight-ballroom.webp`.

### 5. The proof

Story House block: `the-evidence`  
Full Classic block: `p07-b02`

- throne-room table in the foreground holds a silver branch, golden branch, diamond-bright branch
  and small golden cup;
- king and the twelve princesses are beyond the evidence;
- eldest realises the secret is over; youngest looks worried but relieved;
- compose from the investigator's viewpoint so the traveller/soldier is not shown;
- retain the sisters' established appearance and palace palette;
- emotional read: surprise, recognition and the end of the mystery rather than punishment;
- destination:
  `public/stories/the-twelve-dancing-princesses/illustrations/generated/the-proof.webp`.

## Independent text / illustration contract

### Story House Edition

- existing Rackham mapping becomes `classic`;
- generated five-image set becomes `modern`;
- default illustration set: `modern`.

### Full Classic Text

- existing Rackham mapping becomes `classic`;
- the same generated files are reused with matching Full Classic page/block anchors;
- default illustration set: `classic`.

The reader must continue to allow all four combinations:

1. Story House + Classic Illustrations;
2. Story House + Modern Illustrations;
3. Full Classic Text + Classic Illustrations;
4. Full Classic Text + Modern Illustrations.

Text and art choices remain independent; do not duplicate prose or generated image files.

## Ensemble generation rules

This title is count-sensitive.

- When a scene calls for the complete group, prompt for **exactly twelve princess sisters**.
- Reject generations with thirteen sisters, missing sisters, duplicated bodies/faces, fused people
  or impossible limbs.
- The eldest and youngest are the strongest recurring anchors; the other ten are held by fixed
  colour / hair identities.
- It is acceptable for background sisters to be less facially detailed than the foreground
  characters, but they must remain plausible individuals.
- Do not force all twenty-four princess/partner figures into equal close-up detail in the ballroom;
  preserve readability and anatomical quality over crowd density.

## Human gate

Do not merge SH1.4.2 until all five modern illustrations have been viewed together in the real
reader, the recurring eldest/youngest and ensemble palette have been checked across scenes, and
Full Classic Text + Modern Illustrations has also been reviewed.
