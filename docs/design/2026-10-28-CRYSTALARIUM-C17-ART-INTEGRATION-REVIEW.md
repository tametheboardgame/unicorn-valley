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


## C17 crystal generator artwork — five separate user-approved illustrations

The user reviewed the five **separately extracted, independently transparent** generator assets and confirmed they look good on 28 October 2026. Visual approval recorded for **Sky/blue, Moon/purple, Flame/red, Forest/green and Sun/gold** illustrations. Optimised 320×480 WebP assets are individually committed at `public/design-assets/crystalarium-c17/generator-*.webp` (lossless alpha, around 204–220 KB each). All five exact Git blobs match the local approved files; SHA-256 and sizes recorded in the asset manifest. Original PNGs are archived individually in the user's existing Drive folder `Unicorn Valley/C17 Generators`.

**C17 no-save comparison page:** `/design-previews/crystalarium-c17-generators.html` displays each independent artwork on the approved background at responsive widths. This approval does *not* authorise the addition of two new crystal families: the canonical game currently has Low/Bright/Bell, with existing 0/4/7 unlocking, 42 board cells and 50 patterns. Any mapping, additional generator types, Growth Potion numerical rules or persistence effects require their own planned stage/human gate. Game runtime remains untouched. Responsive visual integration and combined preview final acceptance remain outstanding.


## Five generator artwork files formally locked — 28 October 2026

Following the user's explicit instruction to **lock and commit** the five separated illustrations, mark Sky/blue, Moon/purple, Flame/red, Forest/green and Sun/gold **USER_APPROVED_LOCKED** as artwork. The optimised alpha WebPs were already transferred and committed via connected Google Drive → GitHub at `89019466`; no duplicate binary upload is necessary. Keep the original source PNGs archived in Drive and retain immutable Git blob hashes in `manifest.json`. This lock does **not** approve new crystal families, generator unlock changes, Growth Potion costs or live-game use. Next C17 art package: separate individual crystal pieces and tier silhouettes, then Potion vial/gauge/droplet states. Maintain 18 canonical family/tier visuals unless independently approved changes to the mechanic.


## C17 Low / blue crystal family — six refined tiers approved and committed

The user approved the revised, crystal-focused **Low (blue) family**, tiers 0–5, after comparing all six at approximately 48px board-cell size. Six independent 512×512 alpha WebP images are recorded in `manifest.json` with exact Git blob SHA, file size and SHA-256. The previously mismatched PNG exports were discarded; matching lossless PNG sources were regenerated directly from the approved WebP pixels and archived alongside WebPs in the user's Google Drive folder `Unicorn Valley/C17 Crystal Sprites/Low Blue Approved`. This asset approval is **USER_APPROVED_LOCKED** but **not** an implementation or save migration. Existing Low/Bright/Bell rules, merges and unlocking remain unchanged. Next artwork for user review: Bright (teal) tiers 0–5; Bell (violet) thereafter.


## Bright (teal) crystal family — six assets approved and committed (28 October 2026)

The user approved the individual **Bright (teal)** crystal-family sprites for tiers 0–5 and authorised a GitHub commit before starting Bell/violet artwork. Six independent 512×512 alpha WebPs were archived via the existing Google Drive → GitHub base64-blob workflow, with Git SHA and byte-length verification for every tier, and approved PNG copies regenerated pixel-identically to the lossless WebPs before Drive archiving. Every asset and hash is recorded in the C17 manifest. No-save review gallery: `/design-previews/crystalarium-c17-bright-crystals.html`. **Artwork only**: canonical game rules, source family counts, 42 board cells, 50 orders, C20 Growth Potion design and persistence all remain unchanged. Bell/violet is next for visual generation and separate approval.


## Bell (violet) family — six standalone sprites approved and locked (28 October 2026)

At the user's request the final canonical family **Bell/violet** has been separated into six independent transparent, 512×512 lossless WebP sprites (tiers 0–5). Labelled source/comparison sheets were used only as art references: runtime sprites omit background, card panels and text. Foreground extraction and alpha inspection, corner transparency, 48px board-size render, pixel-identity of archived PNG copies against decoded WebPs, file lengths and Git object SHA were verified. Exact checksums and storage location are recorded in `manifest.json`; original sheet and all PNG/WebP copies are archived in the user's Google Drive folder `Unicorn Valley/C17 Crystal Sprites/Bell Violet Approved`. A no-save responsive review page is available at `/design-previews/crystalarium-c17-bell-crystals.html`. The user subsequently inspected the deployed Bell gallery and replied **"looks good to me"**, granting explicit final visual approval. All six Bell assets are **USER_APPROVED_LOCKED** in the C17 manifest, completing 18/18 approved Low/Bright/Bell crystal sprites. No gameplay/rule/save changes or merge authorised.


## Bell approval hand-off — next C17 Growth Potion artwork

All 18 canonical crystal illustrations are visually locked, with original/sprite provenance archived and WebPs on PR #337. Advance the **art-only Growth Potion set** next: reservoir/vial and readable fill gauge, standalone droplet, well-drop feedback states and reduced-motion alternative. Treat any example numeric capacity, refill or resource cost as a visual placeholder only until the C20 economy gate. Then review the horizontal multi-order rail/card illustrations, Storage Chamber and accessible remaining iconography. No production sprite switch, resource ledger, save migration or merge authorised by the artwork approvals.


## Growth Potion visual direction locked — 28 October 2026

The user reviewed the illustrated Growth Potion contact-sheet proposal and explicitly instructed **lock that as the visual direction**. This approves the gold-and-glass cyan reservoir, separate readable gauge, small vial variants, drop/stream/splash feedback and crystal-emergence motif. The reference sheet is *not* an approved flattened playable sprite or a substitute for individual transparent components. Production candidates must split the bottle/glass/gold frame, liquid fill, gauge border and fill, separate droplet and growth effects with no baked text. Fill height is controlled by real game state at arbitrary values, not pre-rendered 0/25/50/75/100 sprites. Small icons need readable low-detail derivatives and reduced-motion states. **Next action is production candidate artwork and alpha/48px review**, followed by user approval of separated files. C20 economics, C18/C19 saves, gameplay effects and runtime wiring remain gated; World PR #337 stays draft.


## Growth Potion separated candidate archive — 28 October 2026

Following the approved visual direction, an **art-only candidate pack** was generated and extracted from the concept into **49 individual transparent PNG/WebP assets**: 43 vessel/fill-state/gauge/vial/pour/drop/splash/growth/icon/effect sprites and six exploratory glass-shell and fill-region-mask layers for arbitrary liquid levels. All 49 pass zero-alpha corner checks; an alpha-over-checkerboard QA contact sheet was produced. The raw AI asset sheet is still a reference, not a gameplay texture. **The independent sprite edges, halos, small-size legibility and dynamic fill masks remain visual/technical candidates**, not automatically user-approved final artwork. Some small effects may need manual cleanup.

- Candidate ZIP: [Google Drive archived pack](https://drive.google.com/file/d/11D9Sz8CAhY6UfohDHycSb73s4xfLDtcN/view), SHA-256 `4fd793121f52f5ffd539899adb682ed88ddc60e79f0a9fd4144c3fedaf47fe13` (5,310,775 bytes).
- [QA contact sheet](https://drive.google.com/file/d/1Dgxaj_nG4QTUgSvL1JRDi17Xd5WODEm1/view).
- Manifest metadata in `public/design-assets/crystalarium-c17/manifest.json` records archive/link/checksum and explicit `NOT_COMMITTED_TO_GITHUB_RUNTIME` status. The candidate PNGs/WebPs are **not yet copied into the GitHub tree**; do not label them gameplay-integrated or source-qualified. They are available to review and archive without losing the originals.
- Future C17 work: inspect art at 48px/actual UI sizes; correct halo/text/cut-off issues; approve individual components; commit exact optimised binary files to the existing World branch and verify blob hashes; then obtain SHA-matched Cloudflare screenshots and composite with proper code-driven fill, never five fixed state sprites as the resource source of truth. C18/C19/C20 mechanics and save/economy are still separately gated.


## C17 Growth Potion transparent sprite import — 28 October 2026

49 individually transparent lossless WebP assets are now **verified in the World draft branch** at `public/design-assets/crystalarium-c17/growth-potion-assets/` (aggregate 1,553,670 bytes, each Git blob SHA recorded in the C17 manifest). This comprises 43 reservoir/gauge/vial/pour/droplet/splash/growth/button/effect sprite candidates and six *experimental* glass shell + arbitrary fill-region mask layers. The no-save responsive [review gallery](../../public/design-previews/crystalarium-c17-growth-potion-assets.html) shows them at 48, 96 and 160px against checkerboard/dark backgrounds. The original processed PNG/WebP ZIP and QA contact sheet are archived in Google Drive; the ZIP SHA-256 is `4fd793121f52f5ffd539899adb682ed88ddc60e79f0a9fd4144c3fedaf47fe13`. **Design direction is locked, individual exported sprite quality and masked fill geometry are NOT yet approved**. No live game imports, economy/resource state, persistence migration, gameplay or merge authorisation. C17 still needs halo/legibility/composition visual review and Cloudflare SHA-bound preview, then remaining order-card/storage art before C18-C24.


### C17 Growth Potion correction pass — 28 October 2026

On user instruction, corrected **32 individual asset files**, including replacement 5 pour poses and **7 additional interpolated poses** for a coherent **12-frame** fixed-anchor sequence; removed extraneous sheet-crop columns and low-opacity neutral fringes on eight small button/icons. Replaced the earlier flat cyan dynamic-fill experiment with independently masked, textured **aqua/deep-blue swirling liquid** for reservoir, vial and gauge; created independent shell, region-mask, texture and movable specular-line components for arbitrary percentages. The original static fill comparisons and all unrelated assets remain unchanged. The corrected WebPs are source-verified (626,662 total bytes in the transfer pack) and backed by matching Git blob SHAs on the World draft branch. [Standalone responsive 0–100% and 12-frame review](../../public/design-previews/crystalarium-c17-growth-potion-refined.html) is no-save, not production gameplay. Raw PNG/WebP corrections and QA previews are archived in the [refined ZIP](https://drive.google.com/file/d/1qm83CuOrhNISOazrQ5xv-tjyZxbP0wC4/view); binary-only stored transfer SHA-256 `e3114c595837554ad98a3fde1ce13aee29f9165521fdcd2243a0ddca5bd41486`. **Next human gate:** inspect the exact deployed gallery for continuous-fill quality, animation and 48px edges before locking these refined sprites. No C18–C24 implementation, economy amounts, save mutation or merge authorised.


### C17 Growth Potion targeted polish, final visual candidate — 28 October 2026

Corrected the specific issues from user review: 12 source pouring poses were repainted/alpha-warped to **remove the straight right-side crop seam**, and their stream extents now vary deliberately through the opening frames, reaching a long curved pour before breaking into droplets. The fixed bottle anchor remains unchanged. Three replacement line sprites add a **bright, glow-backed liquid surface** to reservoir, vial and gauge; the no-save dynamic demonstration renders that rim after the glass, clips it to the interior mask, and moves it with arbitrary fill percentages. No staged percent-only sprite was substituted for canonical state.

**Exactly 15 lossless WebP candidates updated** on draft World PR #337 (12 pour frames and three surface lines), with SHA/byte provenance in the C17 manifest. Stored archive: https://drive.google.com/file/d/1SU5FdvMhOKVVnPWmUy1hahgJAdC4lWE5/view. The 12 frames have individually distinct extents and no high-opacity cropped column at x=322; transparent corners and independently separated liquid/glass layers were checked. Refined preview path: `/design-previews/crystalarium-c17-growth-potion-refined.html`. **Await human inspection on an exact-head deployed preview before final artwork lock.** This is C17 art only: no live game renderer, C20 economy, save migration or PR merge.


### C17 review-only lint recovery — 28 October 2026

Exact-head Tier 0 on `de997289` reported four Biome `lint/suspicious/useIterableCallbackReturn` errors, all in the two C17 Growth Potion **no-save** gallery HTML controls (implicit return from `forEach` callbacks). Existing unit, architecture, verification, ownership, performance and type checks passed. This checkpoint changes only the control callback forms to explicit void bodies, preserving click/slider/preview semantics. The large body of unrelated `useTemplate` warnings across repository files was not rewritten in the World art branch. Recheck Tier 0 and draft Merge Gate against the new exact head; no gameplay asset or save changes.


## C17 Growth Potion asset artwork: final human approval and lock — 28 October 2026

The user reviewed the corrected flowing/pouring sequence and luminous dynamic waterline, confirmed satisfaction and explicitly instructed **lock and commit the final artwork**. All **62 independently transparent lossless Growth Potion WebPs** at `public/design-assets/crystalarium-c17/growth-potion-assets/` are now **USER_APPROVED_LOCKED** visual art, with unchanged per-file SHA/size provenance in `manifest.json`; all 62 were verified against the exact World PR #337 file listing before this lock. The set includes the 12-frame curved pour, movable separate surface highlights, glass shells/masks, reservoir, vial, gauge, droplets, splash/crystal emergence and UI icon variants. Source/QA and correction archives remain in the recorded Google Drive locations. **Do not regenerate or redraw these assets in normal implementation**; minor real-scale adjustments should be performed in the later layout/integration gate without silently replacing the approved illustrations.

The 0–100% slider and sample fill sprites are **demonstrations only**. C17 whole-screen composition and art loading, reduced-motion behaviour and dynamic mask alignment in the live game require technical integration and testing; C18/C19 saved-state changes, C20 costs/capacity/refill, and H6.9D merge have **not** been accepted by this artwork decision. World PR #337 stays draft/unmerged. **Next artwork package:** the scrollable multi-card Resonance Order rail and individually composable ready/incomplete/locked card surfaces, then Storage Chamber and remaining UI icons.


### C17 Resonance Order card/rail visual candidates — 28 October 2026

Created **13 independent blank UI art candidates**, with Git blob hashes in the manifest: six ornate parchment order card visual states (normal, in-progress, ready-glowing, focused, locked, completed), a separable ready aura, indigo/gold decorative rail in **SVG and WebP**, and separate left/right scroll arrow artwork in **SVG and WebP**. These card surfaces contain no baked recipes/text/Offer buttons or game economy, and are intentionally neutral on rarity/rewards/time; earlier generative sheets showing invented timers/currencies/characters are **rejected as game specification** and are not imported. [No-save preview](../../public/design-previews/crystalarium-c17-resonance-orders.html) demonstrates horizontal keyboard/touch/trackpad scrolling plus explicit left/right arrows, 1/2/3/5 illustrative active cards, ready glow and full-card Offer affordance. Card imagery uses **the already-approved Low/Bright/Bell tier WebPs**, not unrelated source sheet crystal designs. The mock card titles/requirements are purely illustrative and do not change the authored fifty-pattern ledger. Original/source candidate pack archived [in Drive](https://drive.google.com/file/d/1bzE52SjuLlxTMlsDjESKn55nw8zKIxLe/view). **The new order art has not received user visual approval**. It is staged on draft PR #337 only; do not implement the 50-order engine, change saves/economy, or merge. Next C17 review is composition/legibility and final art tuning, then Storage Chamber assets.


**Source correction:** The visual right-arrow WebP pointed right, but its original SVG vector source used the left-arrow path. The right vector now mirrors the arrow strokes independently, preserving its gold frame. The associated manifest SHA/byte record is updated, no other art changed.


**Preview composition correction:** The interactive no-save order review now reserves a board-left area and constrains the right-hand order rail to an actual side-panel width on desktop, so 2–5 concurrent cards require genuine horizontal scrolling. Under 900px, the preview remains single-column and touch swipeable. This is a layout presentation change only; the real board/runtime is untouched.


### C17 Resonance Order visual refinement checkpoint — 28 October 2026

Following review, refined the original approved-style **order card and rail visuals without replacing the underlying gold/parchment illustrations**. Five new *independent transparent SVG overlays* are staged beside the existing 13 order assets: a distinct cool-blue in-progress accent, stronger teal/gold ready glow, completed green-and-gold checkmark crest, and symmetrical flowering-blue-crystal rail end ornaments. A card's crystal silhouettes, requirement amounts, label and exact progress percentage remain real DOM content, and the whole ready card (not a separate Offer control) is the simulated click target. The rail keeps native sideways overflow with visible left/right controls; embellishments are pointer-transparent and do not cover the card viewport. The no-save reviewer now has correct 8px progress tracks and accessible controls; earlier Tier 0 preview failures motivated fixes for button types, interactive grouping and CSS properties. Browser DOM smoke executed at **1280×720, 1440×900, 390×844 and 320×700** with five overflowing cards, navigation and mock offer, without JS errors or page overflow. Contact sheet shows normal, progressing, ready, completed and locked card appearances over the existing art. Assets and review page remain **CANDIDATE pending human visual approval**; they are not imported into the real Crystalarium, and no queue, save, potion, C18–C24 or H6.9D gate changes are authorised. Transfer/source ZIP archived in [Google Drive](https://drive.google.com/file/d/1MjlM3fro15bU6m8wCcj0QoXQ1RXmcO-D/view).


### C17 source validation corrections — 28 October 2026

CI Tier 0 on `935b7769` identified eight missing SVG accessibility titles, three redundant/non-semantic ARIA roles in the no-save reviewer, and one manifest JSON array formatting mismatch. Corrected these exact issues while preserving the approved card silhouettes, five visual overlay files, original source artwork, accessible native buttons and scrolling interactions. No runtime gameplay, balance, queue, storage or saves altered. Recheck Tier 0 against the new exact PR head before claiming qualification.


## C17 Resonance Order family formally locked — 28 October 2026

The user approved the final refined **six illustrated card skins plus twelve independent rail, navigation and progress/ready/completed visual pieces** (18 assets total) and expressly requested this lock before Storage Chamber generation. All 18 SHA- and size-verified original WebP/SVG Git blobs are unchanged and marked **USER_APPROVED_LOCKED** in the C17 manifest. The approved interaction presentation features a sideways-swipable/scrollable order rail, multiple simultaneously visible orders, a glowing ready card as the **whole-card Offer target**, blue progress treatment, a green-and-gold completed check and floral crystal rail ends. Keep requirements, counters, crystals and readiness as real UI state. Avoid inventing rewards, rarity, timers or separate Offer buttons. This approval covers **only artwork**, not final C17 responsive composition or C18/C21 order rules and saved-state migration. PR #337 stays draft/unmerged. **Next art work:** Storage chest closed/open/hover/full states, modular miniature chamber/socket frame, and separately composable Board-return icon and interaction states; 4×3 capacity remains a human-gated proposal, not approved save migration.


## C17 Storage Chamber illustrated art candidates — 28 October 2026

Generated **14 independent transparent SVG components** for the approved single-chest Storage Chamber approach, then staged them on World draft PR #337 under `public/design-assets/crystalarium-c17/storage-chamber/` with Git blob SHA/byte evidence in `manifest.json`: ornate gold-and-indigo chest (closed/open/legal-drop/full), separate chamber frame, five socket states (empty/occupied/selected/legal-drop/blocked), three Board-return destination states and an icon for closing the chamber. No text, save data, quantities, rarity categories or inventory stack values are baked into the artwork. The actual Low/Bright/Bell approved crystal sprites remain authoritative and are overlaid separately. The [no-save responsive design review](../../public/design-previews/crystalarium-c17-storage-chamber.html) shows a **provisional 4×3 / 12-slot** miniature board, one persistent chest, storage-to-board selection and drop affordances, a four-legacy-piece example and full-board/full-chamber safe rejection demonstration. Local HTML/JavaScript checks and 1280×720, 1440×900, 390×844 and 320×700 headless DOM interaction checks passed with no page JS errors or horizontal document overflow. This represents C17 **visual candidate work only**: the 12-slot capacity, stored-piece migration, exact hitboxes, drag semantics and C19 transfer model require a separate human gate and cannot be inferred from the preview. Earlier AI-generated room/shelf/filter concepts contain unapproved stack/rank/currency features and are **not** part of this implementation contract. The new SVG artwork has **not** received user visual approval. Existing world/Just Games storage, 42-cell board, persistence, potion economy and H6.9D merge scope remain unchanged; PR #337 stays draft/unmerged.


## C17 Storage Chamber artwork locked; 4×3 design baseline accepted — 29 October 2026

The owner reviewed the completed Storage Chamber visuals, agreed the **4 columns × 3 rows = 12 independent crystal slots** arrangement is appropriate, and expressly instructed us to lock the artwork and verify its commit. The **14 previously committed independent SVGs** in `public/design-assets/crystalarium-c17/storage-chamber/` were verified against exact GitHub SHA/byte sizes and are now **USER_APPROVED_LOCKED**. The originals are not redrawn or modified by this approval. The permanent single chest entry/drop target, opened chamber overlay, independent slot state visuals, closed/open/full/ready feedback, and Board-return affordance are the approved presentation baseline. Approved 12 slots are a **design target** for C19; this does not migrate four legacy shelf pieces, authorise a save-schema change, or qualify atomic transfers. Keep failed/cancelled/full operations non-destructive, permit free recovery and preserve the separate Just Games/world saves.

The **C17 illustrated component art** is now largely locked (backgrounds/board art, generators, 18 canonical crystal sprites, 62 Growth Potion visuals, 18 Resonance Order pieces and 14 Storage Chamber pieces). **Next bounded C17 work:** audit and complete missing contextual tool/Help/Sound/Leave/Polish/Harmony/Wash/Fresh Board icons and focus/disabled/reduced-motion states; assemble an accurate desktop/portrait full-screen composition at 1280×720, 1440×900, 390×844, 320×700 and tablet portrait; check tutorial spotlight, order overflow, accessible 48px targets, lazy loading, visual fallback and asset sizes. Then seek the remaining C17 human design gate before **C18 multi-order rules and migration**, followed by **C19 atomic Storage Chamber implementation** and its separate save/migration gate. Draft World PR #337 remains unmerged; no production-game mechanics, persistent state or potion economics are changed by this art approval.

The previous commit `0939a9fe` had failing **Tier 0** due to one semantic grouping error in the isolated Storage Chamber no-save HTML preview and an existing C17 manifest formatting mismatch (the three-family array), both corrected in this lock checkpoint. This is not a claim that exact-head CI has already qualified; recheck on the new commit.


## C17 final contextual artwork and source-bound composition review (29 October 2026)

Generated **ten individual SVG contextual glyphs** (Harmony, Polish, Brook Wash, Fresh Board, Help, Sound On/Off, Leave, Settings and Skip Guide), styled as independent ornate lapis-and-gold medallions, **without baked labels or state**. Original SVG XML parsed and a separate [icon gallery](../../public/design-previews/crystalarium-c17-context-controls.html) displays proposed normal/focus/disabled treatment through CSS. Art is **candidate, awaiting user acceptance**. PNG/WebP approved backgrounds, board frame, crystal-family sprites, Growth Potion, Resonance Order artwork and Storage Chamber are **unchanged**.

A new [full composition mock](../../public/design-previews/crystalarium-c17-final-composition.html) uses the existing files by source path: desktop board-left, three existing wells and Growth Potion beside the board, independently scrollable multi-card order rail and subservient icon tools; mobile board-first with scroll contained to the oversized minimum-48px board, a compact well row, order rail and action strip. It contains a real **42-button 7×6 DOM board** and sample Low/Bright/Bell sprites, a simulated 12-slot Storage Chamber and a spotlight demonstration that highlights an existing review element. No 50-order ledger, saves, Growth Potion values, unlock economy or new crystal families are touched.

**Local checks:** independent SVG parsing and Node JavaScript syntax passed. Headless Chromium structural/interaction tests at **320×700, 390×844, 768×1024, 1280×720, 1440×900** found 42 independent sockets, min 48px socket width, four order cards with genuine horizontal overflow, six tool buttons, working review-only storage/spotlight interactions, no document horizontal overflow and zero JavaScript exceptions. The browser sandbox blocked local file/HTTP asset navigation; therefore these are **layout/DOM checks, not final source-bound painted-art screenshots**. The SHA-bound Cloudflare exact-head preview and subsequent human screenshot acceptance are required before closing C17. Source/archive: [Drive](https://drive.google.com/file/d/15xTZqev4gJreRThUDZygnIxvY6NdXvZy/view?usp=drivesdk). The 4×3/12-slot design and other earlier art remain approved, but **final socket state illustrations, frame fit, real loading fallbacks and desktop/mobile composition require review**.

**Next development gate:** inspect exact-head C17 composite and fine-tune only if the owner requests. On C17 sign-off, proceed to **C18 pure multi-order state and safe old-save mapping**, then C19 atomic Storage Chamber and legacy four-piece migration, C20 economy design, C21–C24 gameplay UI/tutorial/responsiveness. Draft World PR #337 stays unmerged. Do not alter root integration records or other workstreams.


### C17 frame-fit and desktop viewport correction — 29 October 2026

Owner's 1918×852 screenshot showed two defects in the **art-only final composition review**: vertical document scrolling and the independent 7×6 sockets extending beneath the ornate approved frame. Fixed with a proportional shared frame/grid coordinate system: the real 42 DOM buttons use bounded 7×6 CSS tracks and an inset opening (18% top, 18.5% sides, 17.5% bottom), rather than fixed minimum track sizes that escaped their frame. For wide desktop viewports, the frame preserves its 6:5 ratio and scales to both the available board-column width and height; the contextual tool strip sits beneath orders in the right column to keep the board visible without scrolling the document. On phone, the board remains 556px wide with separate horizontal pan so every socket retains a 48px target, while vertical document scroll remains intentional. The order rail independently scrolls sideways. Local headless Chromium DOM/layout tests passed 1280×720, 1440×900, 1534×682 (screenshot-equivalent), 390×844 and 320×700, with 42 contained sockets, no desktop page scroll, no page-wide horizontal overflow, 48px minimum socket bounds and functional Help/Storage demo controls. New dedicated Playwright regression: `tests/play/h6.9c17-art-composition-fit.spec.ts`. This is a **candidate corrected design** pending owner visual review on an exact-commit deployment, not C17 sign-off or a gameplay/production implementation. No Crystalarium mechanics, saved state, potion balance or C18–C24 gate changes; PR #337 stays draft/unmerged.
