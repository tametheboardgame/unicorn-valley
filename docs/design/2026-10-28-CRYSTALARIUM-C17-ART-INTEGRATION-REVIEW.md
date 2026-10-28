# C17 — illustrated layout and separable art review checkpoint

**28 October 2026 — started, not accepted.** The user approved an illustrated Garden concept, not the pre-existing playable Crystalarium presentation. This checkpoint produces first-pass **original scalable SVG design studies** and a responsive browser composition; it does **not** wire art or economy into the game, change save data, or approve numerical potion balance.

## Review locations

- [Responsive no-save layout](../../public/design-previews/crystalarium-c17-illustrated-layout.html) — public preview route `/design-previews/crystalarium-c17-illustrated-layout.html` on the draft Cloudflare branch.
- [C17 asset manifest](../../public/design-assets/crystalarium-c17/manifest.json) — separate source files/provenance and planned rendering role.
- [Approved feature and art contract](2026-10-28-CRYSTALARIUM-APPROVED-VISUAL-AND-INTERACTION-CONTRACT.md).
- Draft PR [#337](https://github.com/tametheboardgame/unicorn-valley/pull/337); remain unmerged.

**Important:** first-pass backplates are procedural SVG studies with physical archways, waterfall, foliage and gems. They are **not finished painted background replacements** for the approved richly illustrated concept. The independent generated asset-board image from the conversation is a direction reference only and was not silently committed as a flattened runtime UI. A further asset-generation/painting pass is required before C17 final art approval.

## Composition and responsive contract

| Viewport | Regions and intended behaviour | Review focus |
| --- | --- | --- |
| 1440×900 | Board hero left, large three-well strip with potion reservoir, horizontally scrolling order cards right | Visible board, readable card art, no overlong text |
| 1280×720 | Same grid with roughly 55–65px board cells, wells outside board | Screenshot versus rejected stacked Growing/Tools desktop |
| 390×844 | Compact swipable order preview; potion/well band directly above horizontally scrollable 7×6 board | Source reachable, first live socket visible, Storage accessible |
| 320×700 | 48px target minimum, horizontal board scroll independent of order rail, portrait background | Initial visible row, no fixed shelf obstruction or tiny targets |
| 720×1024 portrait tablet | Between desktop/phone layout rules; revalidate order rail and wells | Avoid off-screen drop target |

**Named controls** stay live DOM buttons, never baked into artwork. The order rail mock displays multiple simultaneous cards but currently has **no real pattern ledger or puzzle completion**; a clicked card changes *visual mock state only*. The sample 100/100 potion is **unapproved numerical design**, and one-drop effect on the Low well is preview-only. The storage example shows proposed 4×3 cells, not real persisted inventory. The Help prototype shows the intended dim-and-popover visual metaphor; it **does not yet enforce** controller-level correct-action-only gameplay, which belongs to C22.

## Reusable asset rules

1. Backdrops must be clean and independent of buttons, board cells, text and recipe states. Maintain separate landscape and portrait compositions.
2. Existing canonical Crystalarium source currently draws crystals procedurally for Phaser and native portrait; C17 loose-crystal SVG studies are *only* for comparing silhouette and shape. Do not duplicate the runtime art contract without a deliberate C23 art decision.
3. Preserve Low = blue, Bright = teal and Bell = violet; distinguish by silhouette and an accessible label, not colour alone.
4. Board frame, socket states and rounded controls are CSS in the mock; the final game should use established UI design tokens, Phaser primitives and CanvasDomOverlayBridge where appropriate.
5. Background, floral foreground layers, unlock variants, liquid/drop animation, storage closed/open/drop/full states, card ready/complete variants and sound/Harmony/Polish/Wash icons still require refinements and standalone derivatives.
6. Source should be associated with the C17 manifest, reviewed image rights, optimise and load on-demand. Do not increase common/startup gzip cost.
7. All gameplay and save-path changes remain out-of-scope for this art/layout stage. Preserve existing 42 cells, first-melody Grotto and world/Just Games isolation.

## C17 acceptance checklist

- [x] Check the current World branch/PR, architecture, existing art and standards.
- [x] Produce separate desktop/portrait background SVG design studies.
- [x] Produce Low/Bright/Bell well and loose-crystal visuals plus potion, chest, board and arrow glyph studies.
- [x] Create responsive non-saving composition page with prototype order scroll, storage view and tutorial bubble.
- [x] Record rights/provenance, current proposal versus user-approved features, responsive targets and performance fallbacks.
- [ ] Verify exact-head CI and Cloudflare deployment of the preview.
- [ ] Capture and inspect actual browser screenshots at all required viewport sizes.
- [ ] Refine to **painted high-quality** background/art assets matching the approved image; no flattened UI texture.
- [ ] Obtain human approval of real-scale art and composition before bulk runtime integration.
- [ ] Close C17 and begin separately gated C18 migration only after approval.

### Risk notes

The current demo uses the browser directly without a test harness and must not be used as evidence of live Crystalarium functionality or real saves. The actual tutorial spotlight still needs correctly anchored holes, pointer-safe authorisation and child/keyboard accessibility in C22. Potion capacity, refill, extra storage cells and multiple-order save migration have later Amber gates.
