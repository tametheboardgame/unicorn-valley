# SH2.0 — Reusable Story House title-production and acceptance contract

**Applies to:** SH2.1–SH2.10. **SH2.0 itself is documentation/research only** and has no title preview or generated image. Ownership stays solely on the Story House product stream. Use this checklist in each title PR with real evidence (no ceremonial ticks).

## A — Title/source and manuscript

- [ ] Reconfirm latest `main`, no clashing active Story House title PR and ID unused in the generated catalogue.
- [ ] Open a **separate short-lived** `agent/story-house-*` or `agent/sh-*` branch and draft PR, work package + stream-local state reference. No unrelated World/Just Games changes.
- [ ] Record exact canonical source edition and translation, provenance URLs, original period art and new art rights **independently**. Different UK/world distribution permissions must be genuinely reviewed. `unknown` is a decision blocker to reuse, not an invitation to set `public-domain`.
- [ ] Editor reviews child-friendly treatment of the named story (age, difficult/dated material, treatment of disability, fear, harm, humour and tone). No copy/paste from modern retellings.
- [ ] Freeze single authentic Story House retelling manuscript in plain Markdown, chapter/part IDs and stable semantic `<!-- block:semantic-id -->` markers.
- [ ] Choose `schemaVersion: 1` for a single edition and `schemaVersion: 2` only if a genuine separate Full Classic is *both* complete and independently approved. Distinct `edition.id` and progress; no duplicate catalogue title card.
- [ ] Each Full Classic Text is **complete**, source-verified and credited as such. Do not silently abridge or modernise under that label; decide whether to include unmodified dated language with helpful edition context.
- [ ] Record genre/audience/length, short catalogue blurb (aim ≤80 characters), author/byline, `series` and order for originals (Book 2/3) with no duplicate stable series position.

## B — Character/location continuity anchors

- [ ] Compare accepted Story House reader art and historical bibles; compare game canon only for Quill/Rowan and game locations that are actually involved.
- [ ] Create a small title-specific visual bible, including recurring characters' profiles, expressions, body scale, palette, architecture, path geography and distinct props.
- [ ] Human review of 2–3 (short) or 3–6 (long) anchor sheets/scenes; lock accepted versions before bulk scenes.
- [ ] Derive each planned illustration from an actual chapter `blockId`, not from a loose caption without matching text.
- [ ] Preserve historic/original drawings separately from generated modern sets; never replace accepted source art with a 'reproduction'.
- [ ] Record baseline art count, review batches and approved final art count.

## C — Source assets, materialisation and crop

- [ ] For each human-approved reader image, stage original PNG/WebP in `Unicorn Valley/Generated Asset Staging`, with a stable verified Drive file ID and filename; do not upload binary blobs manually via text GitHub APIs.
- [ ] Create a single R4 manifest under `generated-assets/manifests/story-*.json` with provider/fileId, `expectedSourceName`, destination within the **title's** `public/stories/<id>/**` folder, transform bounds, quality and monotonically updated revision.
- [ ] Use existing WIF-authenticated `.github/workflows/generated-asset-materialisation.yml` on the non-main development branch. Inspect result/asset size, image decode, final WebP, actual path and build; no credentials pasted into prompts or Git.
- [ ] Use full-width reader art with action-specific `alt` attributes, width/height, a readable arrangement and `blockId` anchors; ensure every referenced binary exists on the branch.
- [ ] After art acceptance, choose a **reader image** for modern `coverSets`, confirm centre-safe 3:4 crop and UI title overlay. Dedicated-cover exception requires a recorded human gate.
- [ ] Keep all approved source art/historic images safe on replacement; do not bulk-delete Drive source files.

## D — Content integration and regressions

- [ ] Add `public/stories/<book-id>/book.json` and chapters/illustrations only within this title. Work with generated catalogue, **never** hand-edit an aggregate to discard a parallel title.
- [ ] Run `npm run story:catalogue`, `npm run story:catalogue:check` after synchronising with current `main`.
- [ ] Verify text/schema rights/edition sets, unique story and chapter IDs, stable block anchors, resolved paths, no orphan reader references and meaningful source credits.
- [ ] Verify reader navigation, text edition switching where present, independent reading progress, restart/continue, illustration choice, cover fallback and no broken legacy saves.
- [ ] Focused unit contracts include `src/game/storyLibrary/StoryLibraryDiscovery.test.ts`, `StoryLibraryExperience.test.ts`, `StoryLibraryService.test.ts` and `StoryReadingService.test.ts`; select browser checks using current verification ownership policy.
- [ ] Check child-friendly desktop/phone/tablet rendering and relevant keyboard/touch interaction, correct alt text, 3:4 cropped shelf cover, image loading and long-reader performance when relevant.

## E — Human acceptance, qualification, merge and handover

- [ ] Publish title-specific draft preview when assets/manuscript are usable; capture user editorial and visual acceptance explicitly. Preview is **not** merge or publication authority.
- [ ] After acceptance, finalise art/source provenance and test-impact block on the **actual cumulative diff**; select existing contracts or add tests when changed behaviour requires them.
- [ ] Move to Ready for review only after human gate. Qualify **that exact head**: Tier 0, selected/unit, build/smoke, all static-six Chromium shards, compatibility and final Merge Gate, per repository policy.
- [ ] Ensure live PR head still includes current `main`; if another stream landed, refresh and requalify before merge. Do not merge failed/skipped/incomplete required checks.
- [ ] Verify merge result, record real PR/commit and link title preview/art acceptance, release Story House stream-local ownership and assign the next SH2.n. Root `STATUS.md` and `PROJECT_STATE.json` remain **integration-owned**, not changed in concurrent Story House PR.
- [ ] No unapproved external publication, production deployment, rights reinterpretation, scope expansion or destructive Drive cleanup.

## SH2.0-only acceptance before SH2.1

- [ ] User accepts ten title editorial/age tone briefs and source-variant choices, including Goldilocks and Little Red Riding Hood ending/translation.
- [ ] User accepts provisional reading-mode and *conditional* Full Classic strategy, as well as whether a historic image source should be used.
- [ ] User approves shared painterly visual direction, cross-title continuity requirements, title budgets and staging/checkpoint cadence.
- [ ] Rights register lists precise sources with legal review status, restricted assets and any outstanding permissions clearly identified; **no assumption that every title is cleared for publication**.
- [ ] Record human approval and exact PR/CI proof before marking SH2.0 `complete`. It then hands off **SH2.1 Benjamin Bunny** in its own branch.

**Operational note:** the previous R4 image pipeline has already been proven by earlier programmes, but SH2.0 does *not* re-run a replacement or upload a binary image. The first approved SH2.1 asset must use the existing known workflow, not invent a new one.
