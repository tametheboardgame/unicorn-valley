# SH2.0 — Ten-title editorial and semantic-scene briefs

**Status:** draft recommendations, not approved scripts/art. **Baseline:** 17 existing published Story House titles. **Proposed next IDs are absent** from the baseline catalogue; do not create `public/stories/<slug>` packages until each source and human gate is satisfied.

## Shared editorial contract

Primary experience: safe and inviting to a seven-year-old player, with Read Together and Early/Independent Reader discovery where appropriate. Preserve what makes each classic meaningful; do not retell frightening injury, cruelty, grief, hunger or prejudice gratuitously. Distinguish an **original new Story House Edition** (child-friendly prose with original source credit) from any verbatim **Full Classic Text** (entire vetted edition with its actual translator, unaltered content and separate progress). Never label a shortened excerpt a full classic.

The stable proposed book ID is separate from human-facing working title. IDs are lower-kebab-case, never duplicated, and name the folder, `book.json`, metadata and title-specific image manifest namespace. Proposed `chapter.id` and `blockId` values below are *unique within the title*, illustrative and subject to manuscript freeze: the final Markdown **must** carry `<!-- block:... -->` markers matching every illustration blockId; each illustration needs useful alt text and no title baked into imagery.

| WP | Stable ID | Proposed primary reading format | Story House / Full Classic plan | Indicative new modern images |
| --- | --- | --- | --- | ---: |
| SH2.1 | `the-tale-of-benjamin-bunny` | Short illustrated, flowing 3–4 chapters | Original retelling; **conditional** complete 1904 English edition | 5–7 |
| SH2.2 | `goldilocks-and-the-three-bears` | Paged picture book or 2 brief flowing chapters (choose before manuscript) | Original adaptation of **selected historical variant**; **no Full Classic initially** | 4–5 |
| SH2.3 | `the-velveteen-rabbit` | Short flowing 4–5 chapters | Original retelling; conditional original 1922 Full Classic | 6–9 |
| SH2.4 | `little-red-riding-hood` | Short flowing 3–4 chapters | Original adaptation with **named Perrault/Grimm lineage**; conditional exact-version classic | 4–6 |
| SH2.5 | `the-emperors-new-clothes` | Short comic flowing 3 chapters | Original retelling; **Full Classic on hold** until translation identified | 4–6 |
| SH2.6 | `the-snow-queen` | 7–8 flowing sections/chapters | Seven-story adapted sequence; conditional verified translation Full Classic | 15–22 |
| SH2.7 | `the-wind-in-the-willows` | 8–12 adapted chapters | Original abridged edition; conditional **complete 12-chapter** source edition | 20–30 |
| SH2.8 | `the-secret-garden` | 10–12 adapted chapters | Original age-aware abridgement; conditional **complete 27-chapter** source edition | 24–36 |
| SH2.9 | `the-missing-moonflower` | 4–5 original flowing chapters | **Single original** Story House edition, Quill's Valley Tales Book 2 | 10–15 |
| SH2.10 | `the-rainbow-meadow-mystery` | 4–5 original flowing chapters | **Single original** Story House edition, Quill's Valley Tales Book 3 | 10–15 |

Budgets are **caps for planning and review batches**, not mandatory image generation targets. Do not generate all images up front. Choose a human-approved reader image for modern catalogue cover, with a centre-safe 3:4 crop; retain classic/source art only when separately vetted.

---

## SH2.1 — The Tale of Benjamin Bunny

**Editorial premise:** Peter's cousin Benjamin persuades him back into Mr McGregor's garden to collect Peter's jacket and shoes. Their confidence gives way to caution when a cat interrupts; old Mr Benjamin brings them safely home. Preserve adventure and consequence without overplaying fear or corporal punishment.

**Reader:** 3–4 scenes/chapters. Proposed chapter IDs and illustration anchors:
1. `benjamin-finds-peter`: cousin reunion, Peter's misplaced clothes; blocks `benjamin-and-peter`, `garden-from-outside`.
2. `back-to-the-garden`: gate, scarecrow and recovering the shoes/jacket; blocks `scarecrow-clothes`, `vegetable-paths`.
3. `the-cat-and-the-basket`: the trapped pair and old Mr Benjamin's arrival; blocks `cat-on-basket`, `old-benjamin-rescue`.
4. `home-again`: safe return and clear reflection; block `safe-at-the-burrow`.

**Visual anchor gate:** reuse approved Peter Rabbit illustrations as continuity references where possible. Lock Peter's face, blue jacket, scale, Mr McGregor's vegetable rows and garden gate; establish Benjamin (brown fur/relative age), old Mr Benjamin and cat as new approved consistent subjects. Avoid imitating later copyrighted Peter Rabbit film art.

**Source/edition decision:** Potter 1904 original source candidate Gutenberg #14407. Separate original drawings and full-text edition check; don't simply copy later restored scans. Human review: acceptable child-friendly treatment of the original discipline and continuity with Peter's existing art.

## SH2.2 — Goldilocks and the Three Bears

**Premise:** a curious child enters a quiet cottage, tries bowls/chairs/beds in a clear three-size pattern, is discovered, leaves promptly and learns about respecting others' homes. Do not make her moral recklessness into a violent confrontation.

**Reader:** Prefer **paged picture book** with 5–6 short narrative pages. Proposed scene/semantic anchors: `bear-cottage-arrival`, `three-porridge-bowls`, `three-chairs`, `broken-small-chair`, `three-beds`, `bears-return`, `goldilocks-leaves`. If one image serves multiple pages, retain separate semantic block IDs without forced extra illustrations.

**Visual:** lock Goldilocks' face/hair/clothes, three bears visibly distinct by **size not only costume**, repeat exact three bowl/chair/bed shapes and woodland-cottage proportions. Warm, soft, gently comic atmosphere.

**Source choice:** specific complete Goldilocks version to be selected between documented Pyle/Brooke historical variants (see rights register), rather than copying a recent illustrated book. Recommend *no* Full Classic in initial production because no single universally authoritative historic 'original' text exists.

## SH2.3 — The Velveteen Rabbit

**Premise:** a cloth rabbit hopes to become real, learns patience from the Skin Horse, becomes cherished and worn through love, faces the child's illness and the loss of the nursery, then encounters a hopeful transformation. The story may be sad, but must be clear, compassionate and non-graphic.

**Reader:** 4–5 chapters, candidate IDs `nursery-newcomer`, `skin-horse-secret`, `well-loved-rabbit`, `the-sickroom`, `becoming-real`. Image anchors `rabbit-among-toys`, `skin-horse-advice`, `rabbit-and-child`, `worn-velvet-closeup`, `safe-distance-from-fire`, `fairy-in-the-woods`, `rabbit-in-spring`.

**Visual:** recurring velvet seam, faded pink sateen ear lining, loose stuffing, one chipped whisker and readable wear progression. Skin Horse should feel kindly and wise, not uncanny. The illness/removal moment uses distance, compassion and hope; never flames/body horror.

**Rights:** candidate Williams 1922 source and separate Nicholson historical illustrations; original modern art default. Human review of loss, health language, transformative ending and exact classic rights.

## SH2.4 — Little Red Riding Hood

**Premise:** the child carries food to grandmother through the woods, ignores advice, faces a cunning wolf and is ultimately reunited with grandmother. This **rescue ending is a proposed Grimm-style adaptation, not the unaltered Perrault ending**, and requires explicit version/attribution sign-off.

**Reader:** 3–4 chapters `basket-for-grandmother`, `forest-path`, `wolf-at-cottage`, `safe-reunion`. Image anchors `red-cloak-and-basket`, `sunlit-forest-turn`, `grandmother-cottage-exterior`, `wolf-at-the-door`, `red-hood-notices`, `grandmother-safe`.

**Visual:** stable crimson hood and simple historical countryside outfit, distinct grandmother clothing, expressive but non-grotesque wolf, recognisable woodland fork and welcoming cottage. Avoid threat/fright close-ups and graphic implied eating/dissection.

**Source:** select actual Grimm-version translation for rescuer outcome, or select the Perrault tradition and author a differently justified conclusion. Never present a hybrid as a verbatim Full Classic.

## SH2.5 — The Emperor's New Clothes

**Premise:** an emperor cares so much about appearances that tricksters exploit him; the crowd is afraid to tell the truth until a child speaks plainly. Focus on wit, social courage and sensible kindness rather than humiliating exposure.

**Reader:** 3 chapters `the-emperors-fashion`, `invisible-cloth`, `parade-of-honesty`. Image anchors `wardrobe-palace`, `empty-looms`, `courtiers-pretend`, `procession-canopy`, `child-speaks`.

**Visual:** ornate warm palace, comic two-trickster chemistry, richly varied court costumes; parade framed with **large royal robe, discreet framing and non-explicit silhouettes**, no genital/nude focus. Keep the child honest rather than cruel.

**Rights:** Andersen 1837; choose and clear a named translation for any classic mode. Modern script original fresh wording.

## SH2.6 — The Snow Queen

**Premise:** an enchanted mirror distorts Kay's outlook; his friend Gerda travels through contrasting worlds to find him and help him rediscover kindness. The sequence preserves the seven-story spine while being accessible and emotionally safe.

**Reader:** 7 adapted story-chapters (optionally introductory eighth). IDs/central scenes: `the-magic-mirror` (`mirror-shards`), `kay-and-gerda` (`summer-window-garden`), `the-enchanted-garden` (`flower-woman`), `prince-and-princess` (`warm-palace`), `the-little-robber-girl` (`forest-camp`), `lapland-and-finland` (`reindeer-through-snow`), `the-snow-queens-palace` (`kay-ice-tiles`, `gerdas-return`). Source seven-section mapping to be checked to avoid losing an original chapter.

**Visual:** central child faces, Kay's cold/rescued contrast, Gerda's coat, one consistent regal-but-distant Queen, reindeer, Snow Palace crystallography; temperature/palette progression from warm garden to cool ice and home. **15–22** planned images, delivered in reviewed chapters with 2–3 continuity anchors first.

**Sensitive material:** mysterious mirror/robber girl not nightmarish; emphasise persistence, support and hope. Danish original translated edition undecided; classic on hold until selected.

## SH2.7 — The Wind in the Willows

**Premise:** Mole and Rat share the river and friendship; Toad's extravagant escapades lead to trouble; Badger helps restore balance and Toad Hall. Adapt the full narrative arc without presenting dangerous driving as admirable.

**Reader:** short version **8–12** chapters mapped to twelve original chapter themes. Proposed sections: `mole-meets-rat`, `life-by-river`, `toad-and-motorcars`, `lost-in-wild-wood`, `badgers-home`, `toads-trouble`, `friends-and-family`, `the-return-to-toad-hall` (expanded where needed to retain original key character arcs). Illustrative anchor list `mole-emerges`, `river-boat`, `toads-car`, `wild-wood-snow`, `badger-fireplace`, `toad-hall-exterior`, `the-reunion`.

**Visual:** stable proportions of **Mole/Rat/Toad/Badger** (animal faces, waistcoat/cottage clothing, not anthropomorphic film clones), navigable riverbank, Wild Wood and Toad Hall continuity; scale of roads and vehicles. **20–30** images over 3+ staged batches; no unreviewed marathon generation.

**Rights:** Original Grahame 1908 text candidate; **do not use Bransom or E. H. Shepard art as if UK-public-domain**. Full Classic is a separate complete text edition decision after source verification.

## SH2.8 — The Secret Garden

**Premise:** Mary arrives at the Yorkshire manor lonely and guarded, discovers a neglected walled garden, befriends Dickon and Colin and helps transform the garden and her relationships. Preserve emotional complexity without endorsing dated stereotypes or false claims about illness/disability.

**Reader:** 10–12 compact Story House chapters with working IDs `mary-arrives`, `the-strange-house`, `finding-the-key`, `robin-and-the-door`, `the-hidden-garden`, `meeting-dickon`, `colins-secret`, `the-garden-grows`, `spring-together`, `a-changed-home`. Full Classic remains **27 original chapters** if source clearance and content review succeed.

**Visual:** locked Mary, Dickon, Colin, Robin, gardener Ben, manor interior, corridor layout and garden door, garden geography + repeat seasonal states (bare winter walls to lush spring) using reappearing physical features. **24–36** staged images with recurring character anchors; avoid artwork signalling disabled children as 'lesser' or magical cure promises.

**Editorial gate:** original language involving empire, class and disability receives clear historical/contextual note in an unmodified Full Classic; new Story House edition may sensitively rewrite wording, but cannot silently alter a labelled Full Classic.

## SH2.9 — The Missing Moonflower (working title)

**Series:** `quills-valley-tales`, **order 2**, after accepted `the-lantern-at-the-edge-of-the-woods`. Original 4–5 chapters; player has no required world quest to finish the book.

**Draft narrative:** A small unusual moonflower fails to open on the edge of Moonflower Field, puzzling Rowan. Quill helps him look for ordinary light, water and care rather than a stolen magical prize. The journey crosses Moonflower Glade's field, streamside and homely path, where they discover a shadowed patch and help a flower find a better place. The story ends with a gentle understanding of patience and attention, not by taking Willow's quest flowers or changing world progression.

**Working chapter/scene anchors:** `a-flower-that-wouldnt-open` (`moonflower-at-dusk`), `ask-quill` (`quill-and-rowan-book`), `following-the-light` (`streamside-clues`), `the-sheltered-patch` (`flower-in-shadow`), `moonlight-returns` (`quiet-glow`, `return-home`).

**Canon guardrail:** Willow's three special collectible Moonflowers are accessible in the continuous in-world Moonflower Field and are essential to Willow's established quest, then appear in Willow's garden. **This new story must not remove or 'hide' them, undo friendship, imply the old Moonflower Patch scene still exists, or add world flags.** Rowan is a book-only young cream unicorn; Quill is the game-accurate sky-blue librarian, and neither acquires a new permanent ability. The precise botany/mystery device needs editorial review before script.

**Visual:** reuse approved Book 1 [Lantern visual bible](visual-bibles/the-lantern-at-the-edge-of-the-woods.md) for Rowan and Quill; Moonflower Field and cottage cues must match accepted current Glade. **10–15** candidate scenes; book art only, no game-map change.

## SH2.10 — The Rainbow Meadow Mystery (working title)

**Series:** `quills-valley-tales`, **order 3**. Original 4–5 chapters; stand-alone. Follow the same child-friendly curiosity/observation arc without repeating Book 2's flower-light problem.

**Draft narrative:** Rowan hears an odd tiny sound near the old windmill on Rainbow Meadow. Quill points him towards nearby friends and clues: the pond's reflections, the meadow's tall grasses and a breeze passing through a windmill bell. Breeze helps them understand the pattern, and the solution is an ordinary, reassuring combination of wind and place rather than a villain. The last scene is a picnic celebrating a mystery shared.

**Working chapters/scenes:** `the-odd-meadow-sound` (`windmill-distance`), `clues-by-the-pond` (`rainbow-reflection`), `breeze-and-the-bell` (`breeze-answers`, `three-soft-notes`), `a-view-from-the-hill` (`windmill-lookout`), `the-meadow-celebrates` (`meadow-picnic`).

**Canon guardrail:** accepted Rainbow Meadow includes Windmill Lookout, the pond, nature pocket, Picnic Hill and established Breeze/windmill bell discovery. **Do not assert that the lookout is already unlocked for every player or replay the actual Breeze windmill quest as if uncompleted/mandatory**; book events are independent of save flags. If the published narrative needs a new landmark, seek World-stream review first.

**Visual:** reuse Rowan and Quill canon from Book 1; Breeze's in-game appearance must be audited from existing game references before human anchor lock. Maintain recognisable windmill sails, bell, pond, picnic area and Crystal Brook corridor without redrawing the game map. **10–15** images, staged and human-reviewed.

---

## Title-by-title editorial sign-off record

For each SH2.n before manuscripts/assets: [ ] exact source version [ ] territory/translation/illustration legal evidence [ ] story-house text strategy [ ] Full Classic yes/no with evidence [ ] chapter/block plan [ ] character/location anchors [ ] final image budget/batches [ ] cover reuse candidate [ ] age-sensitive treatment [ ] reviewer/date [ ] per-title PR and preview. SH2.0's overall approval will not waive later book-level visual acceptance.

**Review points requiring a human decision before SH2.0 closes:** Red Riding Hood version/ending, Goldilocks historical narrative variant, whether optional Full Classic editions warrant production and distribution review, the two original Valley mysteries' plot concepts, and cross-title modern illustration style/target density.
