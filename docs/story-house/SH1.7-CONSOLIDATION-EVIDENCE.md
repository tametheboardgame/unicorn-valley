# SH1.7 — Illustrated Classics consolidation: evidence ledger

**Started:** 15 October 2026; **resumed:** 16 October 2026  
**Owner/branch:** Story House, `agent/story-house-sh1.7-consolidation`  
**Active draft PR:** [#325](https://github.com/tametheboardgame/unicorn-valley/pull/325)  
**Baseline:** `main` at SH2 roadmap merge `17e228e361e84354f10d98b1f1581072f0006d01`

This is a checkpoint ledger, **not** a completed SH1.7 sign-off. Any unknown rights, branch review, external Drive deletion or final reader gate remains explicitly open. Counts below refer to the baseline commit and need revalidation against the final PR head.

## A — Library and legacy PR inventory

- Repo tree and book manifest pass: **18** `public/stories/<id>/book.json` files, of which **17 published**, one hidden `story-house-sampler`. `public/stories/catalogue.json` contains the 17 published entries.
- Across all 18 manifests, enumerated **1,082 `path` fields ending in Markdown/image file extensions**, resolving each relative to its book folder and matching paths to GitHub's current full recursive tree: **zero missing**. These path references include chapters and images; do not present 1,082 as an illustration count.
- The catalogue holds both single- and multi-edition books; existing classic/modern cover sets and alternate editions were inspected at manifest level. Existing reader/saved progress behaviour still requires regression validation, not merely static path checks.
- **PR #230 — Lion and Mouse pilot:** original visual bible, four generated image manifests and four generated WebPs are **byte-identical at Git blob SHA** to `main`. Main book manifest has a newer modern-cover-set declaration and clarified curator note. No unique outstanding artwork. **Closed as superseded** with an explanatory audit comment; did not merge.
- **PR #261 — early Alice illustration planning:** uniquely included the 340-line historical Alice character/location/style visual bible absent from `main`. Recovered the full text to `docs/story-house/visual-bibles/alices-adventures-in-wonderland.md` with an explicit historic-state banner. Final accepted Alice reader assets are separately merged through PR #291. **Keep #261 open until recovered archive lands on main**, then close with a supersession comment.
- **SH1.2B title access:** PR #244 is merged (`581c371fe7bd73bf24a3878b9a83d0f7ffc6eab5`); corrected stale work-package status from in-progress to complete.
- **SH1.8 Lantern:** merged via PR #298 on 10 October 2026; previously reconciled in SH1 programme planning PR #323.

## B — Generated assets and Drive staging

- Recursive tree includes **149** `public/stories/*/illustrations/generated/*.webp` files. **148** are directly referenced by book manifest art paths; the single candidate unused image is `public/stories/alices-adventures-in-wonderland/illustrations/generated/alice-cover-cropped.webp`.
- The candidate's R4 manifest is `generated-assets/manifests/story-alices-adventures-in-wonderland-cover.json`. It points to Google Drive source ID `1XwgT6w-IXV_vbzPtEJCGcZocYMvG23B7`; verified its accessible Drive metadata, actual filename `alice-cover-cropped.webp`, and parent staging folder ID `1tAy3sb661zrfVnbQ1VkGFZ_Of3rM6ikA`.
- Drive folder lookup confirmed `Unicorn Valley > Generated Asset Staging`; a 400-item-capacity listing returned **157 files (152 distinct filenames)**. Exactly **five pairs** have duplicated names: `lantern-01-village-lanterns.png`, `lantern-03-first-glimmer.png`, `lantern-04-path-that-moved.png`, `lantern-05-chasing-the-light.png`, `lantern-06-walking-at-their-pace.png`. Each pair has two distinct Drive IDs. The five **currently referenced** R4 manifests were inspected and point respectively to `1T8mWE_aFeSI8jcGSA2oPFtwi1PIGIGik`, `1YUH6EFgpAXxQBr6pQrVoeUVgudEG8JS7`, `1J6cWbprNtXzGO45g2aUGqngAroWjGBGr`, `1M-crx8cRsgLhVZdxhamCba4Wy0dly-KT`, and `1siRr_bkm1nidnMWb5dT0ymYWQsdQ2Pyq`. The alternate IDs are **candidates** for retired staging versions, not verified safe deletions until every manifest/history use is checked. Do not remove any source under this pass.
- Exactly **37 Alice source PNGs**, **11 Peter Rabbit PNGs**, **11 Jemima PNGs** and **17 Lantern PNGs** appear in the staging folder. These counts represent current named Drive files, not approved illustration counts (the five Lantern duplicates inflate its 12-image source set).
- Reviewed the GitHub Actions `generated-asset-materialisation.yml`: it authenticates with Google Workload Identity Federation, takes a specific manifest path and an existing non-main branch on manual dispatch, materialises and verifies WebPs, and commits generated art on that feature branch. The automatic manifest push trigger uses `agent/story-house-*` branches; `agent/sh-*` work may need manual `workflow_dispatch`. **No live round-trip replacement was run during the audit.**
- **No deletion performed** on GitHub or Drive. The Alice unused-cover WebP/manifests should be removed only after a wider reference/code-history check plus explicit clean-up acceptance; Drive sources should remain until separately approved.

## C — Rights, metadata, cover convention

- `docs/story-library-authoring.md` now treats reuse of one **human-approved reader illustration** as the canonical modern-cover rule, with an approved dedicated-cover exception where the crop genuinely fails. It explicitly retains the accepted dedicated Lion/Mouse pilot cover and source-art sets.
- `the-duck-bread-baker/book.json` credits the author, describes the source as supplied production PDFs, and marks `rights.illustrations.status` and `rights.edition.status` as **`unknown`**. **Do not rewrite those to original or clear for publication without provenance/permission evidence from the rights holder.** Record this as an unresolved metadata acceptance question.
- **Deeper targeted metadata inspection completed for all 18 books:** the **12 published v2 multi-edition titles** specify text, illustration and edition status independently on **each** Story House and Full Classic edition and give `classic`/`modern` covers their own rights statuses. The lack of top-level rights on these books is intentional schema design, **not** evidence of missing metadata. The remaining published single-edition stories include explicit original or public-domain rights, with **The Duck Bread Baker** the single published book retaining `unknown` for illustration and edition status. This verifies that status fields exist; it does **not** recheck every historical source's legal authenticity or grant rights.
- No rights claim was silently upgraded. Preserve the existing Duck rights values pending source-production PDF provenance/permission confirmation. The rights-holder evidence request is now [issue #326](https://github.com/tametheboardgame/unicorn-valley/issues/326), which must be resolved before asserting rights clearance for broader distribution. This is **not** permission to invent a licence or to change the imported artwork.

## D — Regression checks (draft CI passed; final qualification pending)

Before moving the PR to Ready for review, re-run the published catalogue generation/check, Story Library discovery, edition/cover switching, independent saved progress, image-path integrity, and representative desktop/mobile reading checks as selected by the diff. The package currently changes documentation and stream state, not reader source, image bytes or story manuscripts. Draft CI run [#38857808036](https://github.com/tametheboardgame/unicorn-valley/actions/runs/38857808036) on replacement PR #325 passed the verification plan, Tier 0 checks, and its policy-selected draft Merge Gate. **Full exact-head final qualification remains pending**; selected Tier 1 and Chromium suites were skipped as intended for this documentation-only draft.

## E — Handover (not yet signed off)

Keep `docs/streams/state/story-house.json` in-progress while this branch is active. After rights/asset decisions, evidence and approval, finish SH1.7 and then assign SH2.0 in an integration checkpoint. Do not independently edit root `PROJECT_STATE.json`, `STATUS.md` or `AGENTS.md` in this product-stream branch.

## Open decisions / risk register

| Ref | Action | Owner/gate | Current disposition |
| --- | --- | --- | --- |
| SH1.7-01 | Merge recovered Alice visual bible, then close superseded PR #261 with traceable link | Story House; after new PR integration | Pending |
| SH1.7-02 | Alice unused-cover WebP and source manifest: one known manifest destination, no current book reference; wider code/history reuse not exhaustively disproved | Human approval before deletion | Retained intentionally; no reader breakage introduced |
| SH1.7-03 | Five duplicate Lantern Drive filenames: active IDs mapped, prior versions still to verify against every historical manifest | Human approval before any Drive delete | Preserve all source files for now |
| SH1.7-04 | Confirm The Duck Bread Baker image and edition rights from original materials/rights holder ([issue #326](https://github.com/tametheboardgame/unicorn-valley/issues/326)) | Rights holder/editorial gate, before any new distribution claim | Unknown; existing material retained, no invented rights |
| SH1.7-05 | Revalidate catalogue and reader contracts; complete full exact-head CI/Merge Gate on final PR | Story House and merge gate | Draft Tier 0 green; final qualification pending |

## Non-destructive closeout recommendation (16 October 2026)

1. **Preserve** the unused Alice cropped cover and R4 manifest: harmless repository residue is safer than losing a potentially referenced production source. The audit has identified it and assigned the prospective deletion a separate human gate. It must not be represented as deleted.
2. **Preserve** all 157 Drive staging sources, including the five duplicate-name Lantern versions, unless a future explicit source-provenance and deletion review establishes safety. Their existence does not impair the reader.
3. **Preserve** `unknown` Duck Bread Baker image/edition rights and progress the evidence/permissions question as [issue #326](https://github.com/tametheboardgame/unicorn-valley/issues/326). This is a separate publication/rightsholder prerequisite; it must not silently become `original`.
4. Subject to final qualifying checks, merge the safe retrospective documentation/archival changes, close legacy Alice PR #261 only **after** its recovered visual bible lands on main, and reconcile the Story House stream to SH2.0 in an integration checkpoint. Keep any legal or destructive follow-up open and visible.

This recommendation deliberately **does not** assert that content copyright licences were independently validated or that any image/source files were removed.
