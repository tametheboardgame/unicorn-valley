# The Ugly Duckling — modern Story House visual bible

Work package: **R6.5-WP19SH1.4.3**

## Purpose

Create one coherent six-image modern illustration set for **The Ugly Duckling** and make it
independently selectable against both the Story House retelling and the Full Classic Text.

The existing Vilhelm Pedersen files remain the **Classic Illustrations** option. The generated set
becomes **Modern Illustrations**.

This title is the SH1 transformation test. The central quality bar is that the same young bird
remains recognisable across changing age, body proportions, seasons and emotional state, culminating
in a young swan who feels like the natural continuation of the grey juvenile rather than a replacement
character.

## Visual direction

- warm hand-painted children's storybook illustration;
- soft gouache / watercolour texture with natural countryside detail;
- expressive but fundamentally bird-like animals, not clothed or heavily anthropomorphised;
- emotional readability through posture, eye line and composition rather than cartoon exaggeration;
- strong seasonal progression from warm farmyard light through winter blue-grey to luminous spring;
- avoid making the grey bird grotesque, dirty or frightening;
- no baked-in typography, captions, logos, borders or UI;
- original compositions, not recreations of the historical Pedersen pictures.

## Main character continuity

### Grey juvenile

- larger and leggier than the yellow ducklings around him;
- soft charcoal-grey / silver-grey plumage;
- dark grey bill;
- dark expressive eyes;
- slightly oversized webbed feet early in the story;
- awkward proportions, but healthy and sympathetic;
- retain the same broad face, bill shape and eye expression through the seasonal sequence.

### Developing bird

- neck length, body size and wing development increase gradually;
- grey plumage becomes smoother and slightly paler;
- do not turn the bird white before the spring reveal;
- winter proportions should already hint at the swan he is becoming.

### Young swan

- the same facial identity translated into mature white plumage;
- slender curved neck and developed wings;
- calm, slightly tentative posture at first;
- final emotional shift is confidence and belonging, not vanity.

## Environment continuity

### Farmyard

- rustic countryside farm with warm timber, straw, rough fencing and water nearby;
- mother duck and yellow siblings establish the protagonist's difference in scale and colour.

### Open country and water

- the world broadens as he leaves the yard;
- reeds, fields, low water and changing trees carry the seasonal progression.

### Winter

- blue-grey water, snow, bare branches and brittle reeds;
- visual stillness and cold are more important than explicit peril.

### Spring lake

- fresh green trees, flowers and clear reflective water;
- warm light and open space contrast with the cramped farmyard;
- the final two images should feel like the same place and the same newly transformed bird.

## Modern illustration set

### 1. Farmyard outsider

Story House block: `into-the-yard`  
Full Classic block: `p04-b04`

- warm farmyard scene with the grey juvenile among smaller yellow ducklings;
- mother duck remains nearby;
- his different scale and colouring are obvious without making him unattractive;
- emotional read: uncertain, gentle and visibly out of place;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/farmyard-outsider.webp`.

### 2. Leaving the farmyard

Story House block: `beyond-the-hedge`  
Full Classic block: `p05-b01`

- the same grey bird walks away from the farmyard;
- other birds remain grouped behind near the gate;
- wider country opens ahead of him;
- emotional read: lonely but determined;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/leaving-farmyard.webp`.

### 3. The first swans

Story House block: `the-first-swans`  
Full Classic block: `p09-b01`

- the older grey juvenile looks up from cold water or snowy reeds;
- a flock of white swans crosses a glowing sky overhead;
- his neck and wings are noticeably more developed than at the farm;
- emotional read: awe and longing he cannot yet explain;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/first-swans.webp`.

### 4. Winter ice

Story House block: `first-snow`  
Full Classic block: `p09-b04`

- the same older grey juvenile stands at the edge of freezing water;
- snow-covered reeds and distant winter buildings frame the scene;
- his proportions are more swan-like, but the plumage remains grey;
- emotional read: endurance rather than graphic distress;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/winter-ice.webp`.

### 5. Spring meeting

Story House block: `his-reflection`  
Full Classic block: `p11-b01`

- the transformed young white swan is now on a bright spring lake;
- another swan approaches calmly across the water;
- preserve recognisable facial and posture continuity from the grey-bird stages;
- emotional read: astonishment, caution and first acceptance;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/spring-meeting.webp`.

### 6. A new season

Story House block: `a-new-season`  
Full Classic block: `p11-b04`

- the young swan swims among several other swans;
- warm evening light, flowers and open water complete the visual arc;
- the protagonist remains identifiable within the group;
- emotional read: calm belonging after the long journey;
- destination:
  `public/stories/the-ugly-duckling/illustrations/generated/spring-belonging.webp`.

## Transformation continuity rules

This title should be judged as a sequence, not as six independent bird pictures.

- Keep the protagonist's eye expression, bill profile and broad facial proportions recognisable.
- Increase neck length, body size and wing development gradually through the grey-bird stages.
- Do not make the protagonist white before the spring images.
- The spring swan should still feel like the same bird when winter and spring are viewed side by side.
- The emotional arc should progress from uncertainty → departure → longing → endurance → recognition →
  belonging.

## Independent text / illustration contract

### Story House Edition

- existing Pedersen mapping becomes `classic`;
- generated six-image set becomes `modern`;
- default illustration set: `modern`.

### Full Classic Text

- existing Pedersen mapping becomes `classic`;
- the same generated files are reused with matching Full Classic page/block anchors;
- default illustration set: `classic`.

The reader must continue to allow all four combinations:

1. Story House + Classic Illustrations;
2. Story House + Modern Illustrations;
3. Full Classic Text + Classic Illustrations;
4. Full Classic Text + Modern Illustrations.

Text and art choices remain independent; do not duplicate prose or generated image files.

## Human gate

Do not merge SH1.4.3 until all six generated images have been viewed together in the real reader,
the protagonist's transformation reads as one continuous individual, and Full Classic Text + Modern
Illustrations has also been checked.
