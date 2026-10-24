# SH2.0 — Cross-title illustration and visual continuity foundation

**State:** provisional visual specification for human direction approval. **No anchor images have been generated or accepted in SH2.0.** This file is not authorisation to make ten complete picture sets.

## Established house style and source precedence

For modern Story House images retain the already-approved **rich painterly storybook** treatment: natural readable anatomy, soft atmospheric lighting, tactile materials, cinematic but approachable depth, warm human emotion, carefully composed landscape reader scenes, readable focal action even when displayed small. Stay art-directed and consistent within each book, rather than chasing photorealism, flattened vector/cartoon cut-outs or recognisable film/TV designs.

Continuity priority: **accepted book-reader art and approved recovered title bible → current canonical game character/location implementation for game cast → accepted title-specific anchors → remaining written descriptions**. A new prompt does not silently redesign an approved face, coat, horn, landmark, book-prop or visual palette. For historic characters, period-safe *new* interpretations must not trace protected modern pictures.

- Approved Story House reference bibles: `docs/story-house/visual-bibles/alices-adventures-in-wonderland.md`, `.../the-tale-of-peter-rabbit.md` **only if an actual matching file is present** (otherwise reader art/manifest remain canonical), `.../the-lantern-at-the-edge-of-the-woods.md`, and other title-specific approved records. Never invent a file path as source truth.
- The exact `the-lantern-at-the-edge-of-the-woods` bible remains authoritative for **Rowan** (young warm-cream uniform coat, amber/green-brown eyes, short tousled auburn mane and tail, pale-gold horn) and **Quill** (sky-blue body, green eyes, swept midnight mane, lilac tail plume, moon-style horn, star marking, no fixed accessory). Keep Rowan child-sized beside Quill.
- SH2.9/SH2.10 must inherit accepted Glade/Meadow environment cues but not claim their new book plot creates save flags, in-world collectibles or lore revisions.
- Proposed art sizes: landscape reader image **about 3:2** (existing Lantern set uses 1536×1024 before controlled WebP sizing); support wide and modest narrow crops. Covers normally reuse a **human-approved reader image**, centre-safe for the shelf's **3:4 portrait** crop, with UI-rendered title text and no baked-in captions. Plan one reader scene that can crop well, do **not** add cover-only image without explicit reason and approval.
- Every image gets an action-specific alt description and clear relative scale; no visual essential clue depends only on colour. Avoid tiny on-image text, invented signage, trademarks, illegible character clusters and visual imitation of recent commercial book/film adaptations.

## Title continuity locks to obtain before illustration batches

| Title | First human-approved anchors | Visual progression and fixed identifiers | Indicative modern images |
| --- | --- | --- | ---: |
| **Benjamin Bunny** | Peter/Benjamin side-by-side, old Mr Benjamin, cat, McGregor garden from approved Peter reference | fixed rabbit scales and jacket, garden rows, basket/cat staging; cheerful → tense → safe | 5–7 |
| **Goldilocks** | girl front/side, three bears as a family, cottage cutaway of kitchen/bedroom | every bowl/chair/bed follows small/medium/large ratio; warm wooden neutrals with honey-gold | 4–5 |
| **Velveteen Rabbit** | new clean rabbit, worn version, Skin Horse, nursery | *same* face/seams/ear lining across worn states; warm plush nursery → quiet difficult period → green spring | 6–9 |
| **Red Riding Hood** | child/grandmother/wolf, hood turnaround, cottage/woodland map | stable red garment and wolf anatomy; leafy luminous woods, non-horror suspense and safe resolution | 4–6 |
| **Emperor's New Clothes** | emperor and courtiers, two tricksters, palace/loom room | consistent embroidered uniform and architecture; humorous expressive reaction, non-explicit parade | 4–6 |
| **Snow Queen** | Gerda and Kay in summer and winter, Queen profile, reindeer, Ice Palace establishing | Gerda outfit and age, Kay's expression evolution, cool ice geometry, warm homes, new designs independent of later adaptations | 15–22 |
| **Wind in the Willows** | Mole/Rat/Toad/Badger sheets, Toad Hall and Wild Wood, river route | stable animal anatomy relative sizes, textures/costumes and buildings; seasonal countryside palette; no Shepard/Bransom-art copying | 20–30 |
| **Secret Garden** | Mary, Dickon, Colin, Robin, manor/door/garden map | repeat exactly the garden wall/entrance/tree/bench as seasons change; age/appearance consistent across emotional changes | 24–36 |
| **Missing Moonflower** | reuse approved Quill/Rowan, real Moonflower Glade/field views, unique uncollected flower | cream/auburn Rowan and sky-blue Quill unchanged; don't imply three quest flowers stolen or relocate Moonflower Field | 10–15 |
| **Rainbow Meadow Mystery** | reuse Quill/Rowan; audit and approve Breeze from game, windmill/pond/Lookout scene sheet | bell/windmill sails/pond landmarks stable; rich broad meadow greens, gentle rainbow reflections; no quest-state changes | 10–15 |

**Do not lock unreviewed new identities just from the table.** The first anchor stage for each title must compare actual approved reference images and, for game characters, the latest canonical runtime art and accepted world location layout.

## Anchor/image approval sequence for each title

1. **Source/readability gate:** editor approves story tone, specific historical lineage, title scenes and source permissions; no character generation before this for rights-sensitive material.
2. **Character/location mini-bible:** agree 2–3 reference sheets or establishing scenes (short tales) or 3–6 (long classics) with silhouettes, clothing/fur, side-by-side scale, repeat key props and architecture. These are *reference assets*, not automatically published reader illustrations.
3. **Anchor lock:** human approves character faces, palette, locations, crops and visual originality. Rejected anchors are regenerated without changing the entire house style. Preserve accepted anchor reference in a durable title-specific visual bible.
4. **Illustration batches:** short books 2–4 scenes per review; long classics 3–6 scenes per chapter group; originals 3–5. Confirm every prompt maps to a frozen narrative `blockId` and approved continuity lock before generating next batch.
5. **Reader and catalogue review:** approved reader art at actual rendered size, landscape width, phone/tablet reader, desktop/large-screen, image ordering, alt text and modern-cover crop. Check classic-source and modern style fallbacks independently where applicable.
6. **Provenance:** archive exact source image, acceptance decision and final R4 materialisation manifest, plus supersession history; no loss of approved prior images.

## Accessibility and child-centred art acceptance

- Recognisable subject in thumbnail-sized 3:4 crop, full narrative beats conveyed without tiny text.
- Expressive, friendly animals and people with stable anatomy. Threats and hardship are atmospheric, not frightening at bedtime.
- Colour is not the only clue to a mystery or character emotion. Give motion/perspective clues and descriptive alt text.
- Respect meaningful disability representation in *The Secret Garden*; avoid making a miracle recovery an implied real-world health promise.
- Avoid detailed nudity in *Emperor's New Clothes* and graphic predation in *Red Riding Hood*. Remain faithful to the approved retelling rather than inventing a sanitised 'Full Classic Text'.
- Use original art/character designs; classic-source pictures remain provenance-separated, and newly generated modern art should not stylistically impersonate recent film versions.

## Source and production safety

- Generation may occur only after per-title human anchor approval, not automatically from SH2.0 approval.
- Existing Google Drive `Generated Asset Staging` → Workload Identity Federation → GitHub Actions WebP pipeline is the canonical asset route. Preserve original staged sources, render expected dimensions and ensure all generated WebPs are referenced through book chapter manifests before final acceptance.
- No runtime reader changes, game world redesign, bulk staging deletion or art publication in SH2.0.
- Cover-only exception: require human approval stating why existing reader images cannot be cropped to 3:4, then record distinct art source/rights.

**Human SH2.0 gate:** accept or amend this shared style; agree continuity owners, 10 indicative image budgets, review cadence and per-title anchor requirements. A later title-specific gate still judges actual images.
