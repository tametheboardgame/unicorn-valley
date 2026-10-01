# The Elves and the Shoemaker — modern Story House visual bible

Work package: **R6.5-WP19SH1.3.3**

## Purpose

Create a coherent modern illustration set for the Story House Edition of **The Elves and the
Shoemaker** without replacing its historic public-domain artwork.

The Story House Edition keeps the Otto Ubbelohde and George Cruikshank images as **Classic
Illustrations**. The generated set becomes **Modern Illustrations**. The separate Full Classic Text
edition remains unchanged.

## Visual direction

- warm hand-painted children's storybook illustration;
- soft gouache / watercolour texture with tactile leather, timber, cloth and winter light;
- cosy nineteenth-century fairy-tale workshop rather than a modern shoe shop;
- expressive, gentle faces suitable for young children;
- magical without glowing fantasy effects overwhelming the physical workshop;
- consistent character scale, costume and workshop geography across all three images;
- no typography, captions, logos, borders or UI baked into the art.

## Character continuity

### Shoemaker

- kind middle-aged man;
- practical shirt, waistcoat and apron;
- slightly tired but warm face;
- careful hands and understated expressions rather than caricature.

### Shoemaker's wife

- kind, observant middle-aged woman;
- simple period dress and shawl;
- warm, capable presence;
- appears with the shoemaker when they discover the elves.

### The two elves

Both elves are tiny — no taller than one of the shoemaker's boots.

Shared:
- youthful, cheerful faces;
- pointed ears kept subtle rather than exaggerated;
- agile proportions and tiny hands suited to detailed cobbling;
- initially dressed in simple worn work clothes;
- clearly the same pair in every scene.

Distinction:
- Elf A: chestnut-brown hair, slightly rounder face;
- Elf B: dark auburn hair, slightly slimmer face.

For the final scene they wear the specific gifts from the text: tiny shirts, warm coats, trousers,
socks and polished shoes.

## Environment continuity

The same small workshop should remain recognisable throughout:

- heavy wooden workbench as the visual anchor;
- leather pieces, awls, thread, lasts, small hammer and finished shoes;
- shelves of tools and leather;
- warm lamplight / firelight at night;
- frosted or snowy window for the Christmas-period scenes;
- curtain or doorway where the shoemaker and his wife can hide and watch.

## Modern illustration set

### 1. The mysterious finished shoes

- block: `mysterious-help`
- morning in the workshop;
- the shoemaker stops in surprise before a beautifully finished pair of shoes on the workbench;
- his wife can be just behind him, sharing the discovery;
- visual read: wonder and gratitude, not spooky magic;
- destination:
  `public/stories/the-elves-and-the-shoemaker/illustrations/generated/mysterious-shoes.webp`.

### 2. The midnight secret

- block: `midnight-secret`
- the strongest narrative image;
- two tiny elves work rapidly on shoes at the familiar bench;
- shoemaker and wife quietly peek from behind the curtain;
- tiny tools, leather and half-finished shoes make the action readable;
- warm midnight lamplight with snow beyond the window;
- visual read: delighted discovery;
- destination:
  `public/stories/the-elves-and-the-shoemaker/illustrations/generated/midnight-secret.webp`.

### 3. The thank-you gifts

- block: `thank-you-gifts`
- the two elves discover and put on the tiny clothes and polished shoes;
- one twirls while the other dances or stamps happily in the new shoes;
- shoemaker and wife watch unseen from the same hiding place;
- visual read: celebration, gratitude and completion;
- destination:
  `public/stories/the-elves-and-the-shoemaker/illustrations/generated/thank-you-gifts.webp`.

## Illustration-set contract

For the **Story House Edition**:

- existing Ubbelohde / Cruikshank files become the `classic` illustration set;
- generated files become the `modern` illustration set;
- default illustration set: `modern`;
- historic files and provenance remain untouched.

For the **Full Classic Text** edition:

- the existing Walter Crane / Ubbelohde / Cruikshank mapping becomes the `classic` illustration set;
- the same three generated files are reused as the `modern` illustration set;
- the generated files are mapped to `p01-b01`, `p03-b03` and `p05-b02` so they sit beside the matching Lucy Crane passages;
- default illustration set: `classic`;
- text edition and illustration set remain independent, allowing Full Classic Text + Modern Illustrations without duplicating prose or image files.

## Human gate

Do not merge SH1.3.3 until the three generated images have been viewed together in the real Story
House reader and approved for character, workshop and style continuity.
