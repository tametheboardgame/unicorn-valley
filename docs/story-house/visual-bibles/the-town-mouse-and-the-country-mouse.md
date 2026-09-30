# The Town Mouse and the Country Mouse — modern Story House visual bible

Work package: **R6.5-WP19SH1.3.2**

## Purpose

Create a coherent modern illustration set for the existing Joseph Jacobs / Richard Heighway Story House title without replacing its historic public-domain illustration set.

The existing Heighway artwork remains the **Classic Illustrations** option. The generated images become the **Modern Illustrations** option introduced by SH1.2A.

## Visual direction

- warm hand-painted children's storybook illustration;
- soft gouache / watercolour texture with rich but readable detail;
- expressive, natural mouse faces;
- golden countryside light contrasted with richer, darker town interiors;
- suitable for a young child;
- no typography, captions, logos, borders or UI baked into artwork;
- no human clothing or accessories on the mice;
- consistent character proportions and fur colours across every scene.

## Character continuity

### Country Mouse

- warm chestnut / tawny-brown field mouse;
- cream underside;
- slightly rounder, softer silhouette;
- relaxed posture and open, welcoming expressions.

### Town Mouse

- slimmer grey-brown / silver-grey mouse;
- pale cream underside;
- tidier, more alert silhouette;
- upright, refined body language without clothing.

The same two mouse designs must remain immediately recognisable in all three images.

## Environment continuity

### Country

Rustic timber furniture, pottery, baskets, dried plants and wildflowers. Beans, bacon, cheese and bread form the simple meal. The atmosphere is humble, generous and safe.

### Town

A grand dining room after a feast with polished serving dishes, cakes, jellies and richer reds/golds. The atmosphere is luxurious but exposed and unsafe.

## Modern illustration set

1. **Country welcome** — block `country-welcome`: Country Mouse shares the simple supper with Town Mouse.
2. **Town feast and danger** — block `town-feast`: the lavish town meal is interrupted by danger.
3. **Peaceful resolution** — block `danger-at-dinner`: after the danger and moral, the final image resolves the story visually with a calm country meal.

Generated destinations:

- `public/stories/the-town-mouse-and-the-country-mouse/illustrations/generated/country-welcome.webp`
- `public/stories/the-town-mouse-and-the-country-mouse/illustrations/generated/town-feast-danger.webp`
- `public/stories/the-town-mouse-and-the-country-mouse/illustrations/generated/peaceful-ending.webp`

## Current staging review

The image model returned the first batch as a three-panel composition. The three clean panels were split into separate PNG source assets before Drive staging so the reader receives normal individual images.

Known review item before merge: the current town-danger panel depicts a cat at the doorway, while the Jacobs text specifies two huge mastiffs. Replace that Drive source in place with a mastiff-accurate scene before final visual approval unless the human review explicitly accepts a different danger interpretation.

Historic Heighway assets remain unchanged.
