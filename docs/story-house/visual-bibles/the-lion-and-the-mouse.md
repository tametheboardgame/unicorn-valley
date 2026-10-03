# The Lion and the Mouse — generated-art visual bible

Work package: R6.5-WP19SH1.2

## Art direction

A warm, hand-painted children's storybook look: gouache-and-watercolour texture, softly rounded
shapes, expressive but natural animal faces, gentle sunlight, rich but calm savannah colours and
clear silhouettes at small reader sizes. The images should feel timeless rather than glossy,
cinematic or 3D-rendered.

No typography, captions, logos, borders or UI should be baked into the artwork.

## Character anchors

### Lion

- Adult male lion, large but approachable rather than frightening.
- Golden-tawny coat.
- Full rounded mane in warm chestnut/russet tones, slightly tousled rather than perfectly groomed.
- Amber-brown eyes.
- Broad muzzle and large paws.
- Expressive eyebrows/eye shape may carry emotion, but anatomy stays recognisably lion-like.
- His scale relative to Mouse must stay consistent: Mouse is genuinely tiny beside one paw.

### Mouse

- Small female field mouse.
- Warm grey-brown fur with a pale cream muzzle and belly.
- Large rounded ears with soft pink inner ears.
- Fine whiskers, dark bright eyes and a long slim tail.
- Brave, alert body language; never dressed or anthropomorphised with human clothing.
- Must remain recognisably the same mouse in every scene.

## Environment

- Warm African savannah/woodland edge.
- Acacia trees, sunlit dry grass, scattered green tufts and dusty earth.
- Palette: honey gold, ochre, muted sage, warm brown and soft sky blue.
- Keep backgrounds painterly and uncluttered so the story action reads instantly.

## Image set

### Cover — `cover-generated.webp`

Portrait composition. Lion resting beneath an acacia tree while Mouse stands near one enormous
paw, looking up confidently. Friendly tension rather than danger. Both faces clearly visible.
Leave some calm sky/foliage breathing room around the upper third for catalogue presentation.

### Story illustration 1 — `lion-awakens.webp`

Anchor block: `lion-sleeping`.

Mouse has accidentally crossed Lion's tail and Lion has just woken. One paw lands in front of her,
another behind, visually showing the huge scale difference. Lion is startled and imposing, Mouse is
tiny and alarmed, but the image must remain suitable for a young child and avoid aggression,
bared teeth or horror.

### Story illustration 2 — `mouse-frees-lion.webp`

Anchor block: `lion-net`.

Lion is tangled in a coarse rope net beneath the trees while Mouse determinedly chews through one
of the lower strands. Show one or two already-frayed/snapped ropes so her solution is immediately
clear. Lion looks worried but hopeful rather than injured.

### Story illustration 3 — `friends-afterwards.webp`

Anchor block: `kindness-returns`.

After the rescue, Lion is free beside the loosened rope net and lowers his head toward Mouse in
respectful friendship. Mouse stands confidently beside his paw. Warm late-afternoon light; this is
the emotional resolution and should feel calm, safe and affectionate.

## Continuity requirements

- Keep Lion's mane shape, coat, eye colour and facial proportions stable across all four assets.
- Keep Mouse's fur markings, ear proportions and scale stable across all four assets.
- The rope net in scenes 2 and 3 should read as the same coarse tan rope.
- Use the same painterly medium and palette throughout.
- No collars, crowns, clothes or fantasy accessories.
- No hunters, weapons or visible injury.
- Art should support the prose, not contradict or add new plot events.

## Delivery

Generated sources are staged only in Google Drive:
`Unicorn Valley / Generated Asset Staging`.

Repository materialisation targets:

- `public/stories/the-lion-and-the-mouse/illustrations/generated/cover-generated.webp`
- `public/stories/the-lion-and-the-mouse/illustrations/generated/lion-awakens.webp`
- `public/stories/the-lion-and-the-mouse/illustrations/generated/mouse-frees-lion.webp`
- `public/stories/the-lion-and-the-mouse/illustrations/generated/friends-afterwards.webp`

All four assets must use the R4 Drive → WIF → GitHub Actions materialisation workflow; no direct
binary upload to GitHub.
