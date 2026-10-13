# Parallel Development Streams — Ownership and Integration

Status: draft implementation in ENG-WP2.5 PR #312. Stream-state validation and non-draft freshness checks are added; GitHub platform branch protection remains unverified. Tracking [ENG-WP2.5 #306](https://github.com/tametheboardgame/unicorn-valley/issues/306).

## Three concurrent product streams

| Stream | Short-lived branch namespace | Owns | Does not own in ordinary feature work |
| --- | --- | --- | --- |
| **World** | `agent/world-*` or existing `agent/r6.5-*` | Physical regions, paths, scenery, world NPCs/dialogue/quests, story progression, world entry/exit and **initial world-first mini-game implementation** | A separate Just Games copy of gameplay; book chapter/illustration content |
| **Just Games** | `agent/mg-*` | Deeper rules/modes/practice/lessons/UX and tests for an **already integrated canonical mini-game**, catalogue/launcher presentation and sandbox compatibility | New physical world locations, quests, world-only story changes, duplicate mini-game logic |
| **Story House** | `agent/sh-*`, `agent/story-house-*` | `public/stories/<story-id>/**`, story-specific imagery/manifests, story illustration visual bibles, rights and authoring metadata | World scene design, mini-game mechanics, global reader changes for adding routine titles |

The engineering/CI governance stream may work in parallel when scoped to infrastructure. Each stream owns its work-package document, PR and preview URL, and keeps its own branch short-lived. **Every PR targets the same integration branch: `main`.** Never maintain permanently divergent world/games/story branches. Concurrent draft PRs may proceed while other streams undergo review, CI or merge.

## The legitimate boundary crossing: new mini-games

The World stream introduces a **small but functional world-first game** when a location calls for it. In that **same initial package** it must use the shared mini-game authoring contract: one stable ID in `MiniGameCatalogue.ts`, one `SceneKeys.ts`/ `SceneManifest.ts` entry, a normalised `MiniGameLauncher`/session, a minimal Just Games entry, world entry/exit and sandbox-safe behaviour. The World stream owns that *atomic integration registration* until merged.

The Just Games stream later takes ownership of enhancing **the same game scene/rules**, adding modes, assistance, practice, teaching and replay depth. It must preserve the world caller/return, progression and isolated Just Games practice semantics. It does not fork a second gameplay implementation or alter the physical world placement for ordinary improvements.

If both streams need **the same mini-game files**, they are **not parallel-safe**: one package is sequenced after the other's merged baseline, or scope is split into non-overlapping owner modules with an explicit approved interface. Catalogue/scene registry edits are small shared integration points, never an excuse for duplicated game implementations.

## Story House's content boundary

Normal title authoring changes `public/stories/<id>/**` and its title-specific generated assets and rights/visual-bible documentation. The existing story catalogue generator discovers published story folders. A new title does **not** need a bespoke reader/shelf feature or manual book-ID registration.

`public/stories/catalogue.json` is a **tracked, generated aggregate**: two different title branches can both regenerate it and conflict. On integration, update the branch to current `main`, run `npm run story:catalogue` and `npm run story:catalogue:check`, and commit the deterministic combined output. Never choose one side's catalogue wholesale or discard a title to fix a merge conflict.

Changes to the shared reader, Story Library APIs or catalogue generator are **cross-stream architectural changes**, not routine title work. Isolate them into a dedicated package and check downstream world/story impact.

## Shared files and conflict ownership

| Shared surface | Why legitimate overlap occurs | Rule |
| --- | --- | --- |
| `src/game/minigames/MiniGameCatalogue.ts`; `src/game/scenes/SceneKeys.ts`; `SceneManifest.ts` | World-first game registration and later gameplay capabilities | Registration belongs to the originating world PR; improvement stream updates it **after the integrated base** or through a separately owned PR |
| `public/stories/catalogue.json` | Generated index of independently authored books | Regenerate on fresh integrated base; do not hand-merge partial output |
| `AGENTS.md`, `DECISIONS.md`, `STATUS.md`, `PROJECT_STATE.json`, global roadmaps/CI configs | Project-wide policy, status and architecture | Avoid updating central branch/current-work-package fields on every feature preview. Keep interim detail in the stream work package/PR. Consolidate global state at meaningful **integration** checkpoints; WP2.5 will introduce per-stream machine-readable state to remove the one-global-active-package limitation |
| Shared input, save, overlay, scene composition and test infrastructure | Truly cross-cutting game systems | Identify the canonical owner first. Use a dedicated shared-system package rather than uncoordinated fixes in multiple streams |

**Pre-merge ownership check:** compare the PR's changed files with other *open* workstream PRs. If the same gameplay file appears in both, explicitly serialise the work or refactor to eliminate ownership overlap. Shared generated/policy files are reviewed and reconciled deliberately, not silently overwritten. File overlap can sometimes be harmless in different hunks, but code ownership, accepted behaviour and coverage still need checking.

## Independent previews, testing and merge discipline

- Each stream gets a unique work-package branch, draft PR and **branch-specific preview URL**; verify the returned URL and candidate commit correspond to that branch. Never use another PR's preview as evidence or deploy production to show a draft.
- Fast draft loop remains **change → minimal safe build/smoke → preview → feedback**, without full contract reconciliation on each cosmetic edit. Existing fail-safe current-delta escalation remains.
- After human visual/functional approval, perform code/documentation review, complete the **WP2** actual-diff test-impact assessment, then mark Ready for review for full **exact-head** qualification.
- **Merge freshness is a separate requirement from exact-head CI**: a green result for the same PR head may still be stale after another stream merges to `main`. The WP2.5 authoritative Merge Gate now queries latest `main` and requires it to be an ancestor of the current PR head. If it advanced after candidate qualification, update/rebase the branch, resolve registry/generated-file integration and rerun authoritative CI. Platform branch protection with strict up-to-date checks remains necessary to cover the merge-time race. Never rely on a green old-base head alone.
- Future WP2.5 automation must reject a stale integration base in the merge gate or use a required up-to-date protected branch/merge queue. It must **not** block draft previews. Configure `Merge Gate` as a platform-required check with repository-admin access.
- Every stream's new/retired contracts must be reconciled at finalisation, including world and Just Games entry/return for mini-games and Story Library catalogue integrity for books. No stream may remove assertions or skips simply to get green.
- GitHub CI concurrency is keyed by PR number so a new push to one PR should not cancel another PR's tests; the shared pool of hosted runners may still queue jobs. Do not run needless full qualification on drafts.

## Readiness checks (pending technical enforcement)

ENG-WP2.5 will prove two or three concurrent workstream PRs keep separate previews, package state and CI; integration in different merge orders preserves both sides' content; a newer `main` invalidates stale final qualification; and changed-file overlap has a visible owner decision. **Policy adoption alone does not assert those tests or protections already exist.**

## ENG-WP2.5 stream-local source of truth

Stream-local records now reside at `docs/streams/state/world.json`, `just-games.json`, `story-house.json`, and `engineering.json`. For an ordinary product work package, update only its matching record (ID, path, branch, PR, source-main SHA, date and meaningful note). Global `PROJECT_STATE.json` and `STATUS.md` describe the last integration checkpoint and are not transient feature-branch journals. The initial `unclaimed` status means the central record has not yet been adopted by a particular PR; it does **not** assert that no draft PR exists.

A new non-draft product-stream PR is checked against its cumulative changed files: no changing root status or another stream's record. Existing older PRs are grandfathered mechanically while their reviews should use the same practices. Shared `MiniGameCatalogue.ts`, scene keys/manifest and generated Story index receive an explicit coordination warning; the owning workstream must sequence overlaps and regenerate story catalogue after refreshing to current main.

Authoritative Merge Gate now checks the **live** GitHub `main` commit, PR head SHA and their merge-base relationship after the existing required CI results. It also rechecks that `main` did not move during the comparison. Missing API evidence blocks the final check. Drafts retain fast provisional qualification. This in-repo check is not a substitute for GitHub repository-admin strict branch protection or merge queue.
