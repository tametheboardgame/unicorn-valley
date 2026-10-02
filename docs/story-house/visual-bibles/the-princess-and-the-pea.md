# The Princess and the Pea — modern Story House visual bible

Work package: **R6.5-WP19SH1.3.4**

## Purpose

Create one coherent three-image modern illustration set for **The Princess and the Pea** and make
it independently selectable against both the Story House retelling and the Full Classic Text.

The existing Alfred Walter Bayes, Edmund Dulac and H. J. Ford files remain the **Classic
Illustrations** option. The generated set becomes **Modern Illustrations**.

## Visual direction

- warm hand-painted children's storybook illustration;
- soft gouache / watercolour texture with expressive faces and tactile fabric;
- elegant fairy-tale palace without glossy CGI styling;
- playful visual humour around the absurd mattress tower;
- dramatic storm light outside contrasted with warm palace interiors;
- consistent character appearance, costume and palace geography across all three scenes;
- no baked-in typography, captions, logos, borders or UI.

## Character continuity

### The princess

- young adult woman with dark chestnut hair;
- expressive, intelligent face;
- deep blue travelling dress and cloak in the arrival scene, soaked and muddy from the storm;
- same face and hair throughout;
- dry nightwear / simple pale dressing gown for the bedroom and morning scenes;
- dignified but capable of laughing at the situation.

### The queen

- older woman with silver-grey hair;
- burgundy / plum royal dress;
- practical, observant and slightly mischievous rather than cruel;
- recognisable in the bedroom and morning scene.

### The prince

- young adult man with warm brown hair;
- dark green / teal court clothes;
- sympathetic, amused expression;
- may appear at the doorway scene and should be present in the morning-resolution scene.

## Palace continuity

- warm stone palace with carved dark wood;
- golden lamps / candles;
- deep red and blue textiles;
- guest bedroom has the same tall arched window visible in scenes 2 and 3;
- storm scene uses blue-grey rain and lightning outside while the palace interior glows warmly.

## Modern illustration set

### 1. Storm at the palace

Story House block: `the-door-opens`  
Full Classic block: `p01-b03`

- palace doors open onto a fierce night storm;
- princess stands soaked on the threshold, rain dripping from her hair and cloak;
- queen regards her curiously from inside;
- prince can be visible behind the queen;
- emotional read: awkward arrival, kindness and curiosity rather than suspicion;
- destination:
  `public/stories/the-princess-and-the-pea/illustrations/generated/storm-doorstep.webp`.

### 2. The impossible bed

Story House block: `the-tallest-bed`  
Full Classic block: `p02-b01`

- queen secretly places the tiny pea on the bedstead;
- absurdly tall stack of mattresses and feather beds rises above her;
- ladder and soft bedding make the scale immediately readable;
- retain gentle visual humour;
- destination:
  `public/stories/the-princess-and-the-pea/illustrations/generated/mattress-tower.webp`.

### 3. Morning answer

Story House block: `morning-answer`  
Full Classic block: `p02-b03`

- next morning at breakfast or just outside the guest room;
- princess looks exhausted while explaining that something hard kept her awake;
- queen reacts with delighted recognition;
- prince looks surprised / amused rather than solemn;
- visual read: the test has produced its ridiculous answer;
- destination:
  `public/stories/the-princess-and-the-pea/illustrations/generated/morning-answer.webp`.

## Independent text / illustration contract

### Story House Edition

- existing Bayes / Dulac / Ford mapping becomes `classic`;
- generated three-image set becomes `modern`;
- default illustration set: `modern`.

### Full Classic Text

- existing Bayes / Dulac / Ford mapping becomes `classic`;
- the same generated files are reused with Full Classic page/block anchors;
- default illustration set: `classic`.

The reader must therefore allow all four combinations:

1. Story House + Classic Illustrations;
2. Story House + Modern Illustrations;
3. Full Classic Text + Classic Illustrations;
4. Full Classic Text + Modern Illustrations.

Text and art choices remain independent; do not duplicate prose or generated image files.

## Human gate

Do not merge SH1.3.4 until all three generated images have been viewed together in the real reader
and the Full Classic Text + Modern Illustrations combination has also been checked.
