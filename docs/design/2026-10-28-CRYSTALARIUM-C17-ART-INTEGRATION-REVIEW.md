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


## Painterly background decision — 28 October 2026

**DESKTOP BACKGROUND USER APPROVED AND LOCKED.** The user inspected the clean 1536×1024 AI-generated garden scenery and explicitly said it looks great; subsequently authorised locking it. Preserve the exact original source (SHA-256 `3a913c4fd9038725c112230b01af1e5fa5ca30666f4f236cffdd5130588adb33`) and the prepared 1920×1080 WebP derivative (SHA-256 `bb31ab491d498d5aebb31546575cd244126e4437467f40a2ec6558f5db13e6f8`). The full landscape painting is an artwork approval, **not yet human acceptance of the in-game overlays**. Do not regenerate the desktop image to solve contrast: shade UI panels locally instead.

**PORTRAIT CANDIDATE CREATED, NOT APPROVED.** Unlike cropped desktop scenery, the new independent portrait scene was generated vertically. The 9:16 central art crop (576×1024, source SHA-256 `524ccce0da3c43389363eb336b5b29b2cf786c8270ea2fb192e090fb4f22c162`) is preserved separately from the 1080×1920 WebP derivative (SHA-256 `f25bae9923d06070cab91a741967d1a266b68779889f443568ee9c3c464bf684`). The original generation canvas included white side margins; the accepted artefact must be the **clean margin-free crop**. Mobile artwork awaits user approval.

**Binary integration not yet completed:** the downloaded/created raster files are present as conversation assets but have **not been committed as Git blobs** to PR #337. The current GitHub design preview uses earlier SVG stand-ins. Do not mark desktop background as shipped or replace production art until the checksum-verified PNG and WebP bytes are ingested. Asset identification, status and provenance are recorded in `public/design-assets/crystalarium-c17/manifest.json`. Keep pointer events and all text/control states in separate UI layers; defer actual Cloudflare art visual gate until correct binary delivery.


## Portrait background approved and locked — 28 October 2026

The user inspected the actual clean-margin **1080×1920 portrait WebP** and said that it looks good; the assistant independently confirmed its distinct portrait composition, crystal-garden colour and suitable board/HUD layering. **Decision: USER_APPROVED_LOCKED** for the portrait background. Preserve the exact 576×1024 original art crop and 1080×1920 WebP derivative with the checksums in `manifest.json`. Do not regenerate the art merely to address overlay text contrast. Both desktop and portrait illustrations are now locked; interactive game overlays, screenshot layouts and art integration remain independently gated. **Neither painted raster is yet committed as a GitHub binary**; the placeholder SVGs in the deployed preview are not this approved art.


## C17 responsive painted-art integration preparation — 28 October 2026

**Implemented on World PR #337:** the separate no-save responsive design review now follows the approved spatial composition — potion/generators to the left, 42-cell board central, scrollable order rail across the top and right-side action stack; mobile remains board first, then generator band and swipeable orders. It selects the committed 16:9 or 9:16 approved painting **only if an actual WebP loads**, otherwise retains the previous SVG design study with an explicit status label. Snapshot and geometry tests at 320×700, 390×844, 1280×720 and 1440×900 assert the layout contract. `scripts/art/verifyCrystalariumC17Assets.mjs` fail-closes on absent files or incorrect SHA-256 and is to be invoked when files are uploaded. Source and target naming/checkout instructions are in `public/design-assets/crystalarium-c17/PAINTED-BACKGROUNDS.md`.

**External hand-off still required:** two approved binary WebPs must be uploaded to their exact paths on the existing World branch; connected GitHub API text/tree writes cannot open local conversation-asset bytes. No new generator art or further user design choices are needed. Do not call final C17 painted-art screenshot review, or final composition acceptance, until actual WebP resources load successfully in the SHA-bound preview. The original PNGs and source hashes remain archived as conversation assets, not runtime files. No live Crystalarium modes/saves changed by this no-save visual integration.


## GitHub binary artwork ingestion completed — 28 October 2026

Supersedes prior manual-upload blocker above. Both exact approved WebPs now exist as **GitHub blob objects** with byte-identical Git hashes verified from the local approved files. They were transferred through the user's existing Google Drive/Unicorn Valley folder and committed to the World PR at `public/design-assets/crystalarium-c17/`. Original full-quality PNGs are archived in the same private Google Drive folder; WebP remains the only runtime painting. See `PAINTED-BACKGROUNDS.md` for exact bytes and checksums and `manifest.json` for provenance and approval. The C17 browser suite must now assert **painted** art, not accept SVG fallback; contrast/geometry screenshots and user composition review remain open. No gameplay or save behaviour changed.


## C17 ornate board art candidate — 28 October 2026

Generated an illustrated board-layer reference, and **extracted a separate transparent frame plus four standalone socket-state WebPs** (empty, selected, legal drop, illegal drop). They are purposefully **not one baked 42-cell painting**: artwork does not respond to input and each socket retains its own DOM button, hitbox, keyboard focus and selectable visual state. The original, labelled asset-art generation sheet is archived in the user's connected Drive folder under `Unicorn Valley/C17 Board Candidates`; the playable source never uses that flattened reference sheet. Exact Git blobs and checksum provenance are in `manifest.json`.

**Review candidate:** `/design-previews/crystalarium-c17-board-frame.html`. Includes the approved painted garden behind a dark board-surface layer, the frame and an interactive 7×6 visual-state toggle. It writes no gameplay save. The user has **not yet approved this specific board art**, and it must not replace the production Crystalarium or change its 42-cell rules. Inspect desktop/320px screenshots and frame inset geometry, then accept/refine. An extraction from a generation sheet is an initial art study, not guaranteed scalable nine-slice production art.


## C17 frame-only correction and user approval — 28 October 2026

The first proposed `board-frame-candidate.webp` was **rejected by the user** because it included board/background artwork instead of only the frame. It has been removed from the World branch active assets. The replacement `board-frame-only-approved-candidate.webp` is a standalone 1536×1024 painted stone/ivy/crystal/flower **alpha** overlay. The transparency of all four corners and the full central rectangle was validated against checkerboard, alpha analysis and the 409,368-byte WebP; no scenery, backing tiles or interactions are included. Full source PNG and WebP archived in user's Google Drive/Unicorn Valley/C17 Board Candidates folder. SHA-256 and Git blob references are in the asset manifest.

The user has now said **'frames look good'** about the corrected frame. This locks its visual direction, **not** its final in-game sizing. Updated preview `/design-previews/crystalarium-c17-board-frame.html` begins with the *frame alone over a transparency checkerboard*, with optional switches for the separate 7×6 DOM grid and the painted garden. The four previously staged socket-state WebPs remain separable and **not yet final-approved**. Integration into the real puzzle, 320px hit-box validation and C17 final page/layout acceptance remain gated; no saves or gameplay were touched.
