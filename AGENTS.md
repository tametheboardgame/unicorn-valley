# Agent Operating Contract

Unicorn Valley is a serious AI-assisted project. Repository state is authoritative over remembered conversation context when they conflict, unless the user explicitly changes the requirement in the current task.

## Start of work

Before substantive work:

1. Read `STATUS.md`.
2. Read `PROJECT_STATE.json`.
3. Read `PROJECT.md`.
4. Open the active work package referenced by `STATUS.md` / `PROJECT_STATE.json`.
5. Read relevant accepted entries in `DECISIONS.md`.
6. Read `ROADMAP.md` and the detailed canonical phase docs it links.
7. Read `TESTING.md` and `ACCEPTANCE.md`.
8. For code work, read `docs/architecture/ENGINEERING-STANDARDS.md` and inspect the canonical implementation paths it names.
9. Inspect the current branch, open PRs, recent commits and CI.
10. Confirm autonomy, dependencies, invariants, technical validation and any human gate.

Do not reconstruct essential state from old chat when the repository already records it.

## Source-of-truth precedence

1. Explicit current user instruction.
2. Accepted current repository/code state.
3. `STATUS.md` and `PROJECT_STATE.json`.
4. Active bounded work package under `docs/work-packages/`.
5. Accepted `DECISIONS.md` entries and `PROJECT.md`.
6. Canonical detailed project specifications under `docs/`, especially the active release contract.
7. `ROADMAP.md` and `docs/06-ROADMAP.md`.
8. Historical/closed work-package documents and old PR descriptions.
9. Remembered conversation context.

If sources materially contradict each other, resolve durable state or surface the genuine ambiguity. Do not silently choose the interpretation that creates the most work.

## Core behaviour

- Work within the active bounded package.
- Preserve accepted baseline and frozen invariants unless the package explicitly owns changing them.
- Do not broaden scope merely because execution time remains.
- Use British English in human-readable project documentation.
- Keep durable state concise and current at meaningful checkpoints.
- Preserve traceability between work package, implementation, validation and PR.
- Prefer reusable systems over bespoke scene hacks where project architecture already supports them.

## Canonical engineering paths

`docs/architecture/ENGINEERING-STANDARDS.md` is the implemented architecture guide. In particular:

- scenes use `SceneCompositionContract`, `SceneManifest` and `SceneLifecycleScope`;
- shared UI uses `UiDesignSystem`, `UiPrimitives` and the established concept/exploration components;
- native controls over canvas use `CanvasDomOverlayBridge`;
- interaction/dialogue/feedback reuse their existing subsystem coordinators and presenters;
- audio uses `src/content/audioBindings.ts` plus `src/game/audio/**`;
- mini-games use the independent `MG` platform contract in `MINIGAMES-ROADMAP.md` and `docs/architecture/MINI-GAME-PLATFORM.md`;
- test scope is selected by `scripts/verification/verificationOwnership.mjs` and fails safe to full qualification for unmapped/cross-cutting changes;
- loading/performance changes preserve `scripts/performance/performancePolicy.mjs` and stale dynamic-import recovery.

Do not create a competing scene registry, UI token set, overlay positioning system, dialogue stack, audio binding mechanism or ad hoc verification rule without an explicit architectural reason recorded in the active work package.

## Parallel World, Just Games and Story House streams

The main world, Just Games and Story House are **independent concurrent development streams**, not three permanent integration branches. Each uses a short-lived work-package branch and PR targeting `main`, with its own provisional preview URL, human feedback and final test review. See [parallel development stream ownership](docs/architecture/PARALLEL-DEVELOPMENT-STREAMS.md).

- The **World** stream owns areas, storyline, world NPCs/quests and the **first simple world-first implementation** of a new mini-game, including its single scene/catalogue/Just Games registration in the original package.
- The **Just Games** stream deepens the same canonical mini-game implementation and catalogue presentation; it must not duplicate gameplay or independently change world placement/progression.
- The **Story House** stream owns independently discoverable book/title folders, chapters and artwork; it must not rewrite the shared reader for ordinary new titles.
- Shared registries, scene keys, generated story catalogue, root project-state and global rules are **integration touchpoints**. Check open PR file overlap and designate one owner; sequence the affected work rather than allowing concurrent edits to the same gameplay contract.
- `PROJECT_STATE.json` currently models only one global active package. Until per-stream records exist, use the stream's bounded work package and PR for interim status; reserve broad root project-state changes for meaningful integration decisions rather than each visual tweak.
- A green exact-PR-head Merge Gate does **not yet prove** qualification against a newly advanced `main`. Before merging after another stream lands, bring the PR onto current `main` and rerun its authoritative qualification; technical freshness enforcement is tracked by [ENG-WP2.5 #306](https://github.com/tametheboardgame/unicorn-valley/issues/306). Never drop tests or other stream's changes to settle conflicts.


## Mini-game platform contract

This rule applies across **all** roadmaps and work packages, not only the independent Mini-Game roadmap.

- Every current/next work package must declare the front-matter field `mini_game_platform_impact` as `none`, `changed - <id>` or `new - <id> - world-first|just-games-first`. Any bounded playable activity with its own short gameplay loop, start/finish/retry behaviour and repeatable or practice-oriented play must use the appropriate non-`none` value. `changed - platform` is reserved for shared platform work.
- A new mini-game has one stable ID, one canonical gameplay implementation and one shared launch/session contract. Do not create separate world and Just Games implementations.
- A world-first mini-game is not complete until it is registered in the canonical mini-game catalogue and exposed through Just Games.
- A Just-Games-first mini-game may be world-unplaced, but it must already be world-ready: no title-screen-only assumptions, no hard-coded return scene and no Just Games-only gameplay state.
- Mini-game scene loading remains owned by `SceneManifest`; the mini-game catalogue must not become a competing scene registry.
- Just Games sessions are sandboxed by default and must not advance quests/world flags, alter relationships, grant/consume inventory or Shimmer, or change normal adventure collections/unlocks unless a separately approved isolated persistence contract explicitly permits it.
- The project-state validator enforces the declaration before a package can be current/next. Historical work-package files are not retrofitted merely to satisfy the new metadata contract.

## Project-specific invariants

- Primary target is a young child; controls, feedback and reading burden remain child-first.
- Choice without pressure remains a core design principle.
- No adverts, purchases, public chat/profiles or real-world FOMO systems.
- Saves remain versioned and backwards-compatible unless a specifically approved migration package changes that boundary.
- Main should remain releasable.
- Touch/mobile behaviour is a first-class acceptance surface.
- Production deployment is a Red action unless explicitly authorised.
- R7 remains blocked until the R6.5 human readiness gate is released.

## Autonomy

### Green

May proceed autonomously when scope and acceptance criteria are clear. Typical examples: implementation against approved requirements, tests, regression fixes, documentation, bounded refactoring and CI improvements.

### Amber

Implementation/investigation may proceed where safe, but the defined human gate must be honoured before adoption, merge or dependent work as stated by the package. Visual judgement, child UX, major architecture and save/schema changes are normally Amber.

If an Amber gate blocks one stream, continue independent eligible Green work only when dependencies clearly permit it.

### Red

Hard stop unless explicitly authorised for the specific action. Includes production deployment, destructive data operations, irreversible migration, spending, unsafe secret handling and external publication outside an approved procedure.

## Work-package loop

1. Confirm metadata, scope, dependencies, non-goals and invariants.
2. Implement and preview small coherent changes, iterating rapidly until any required human visual/product approval.
3. Run proportionate draft validation; finalise code, docs and test impact **after** the approved baseline before full qualification.
4. Fix current-work failures while staying in scope.
5. Record material durable decisions.
6. Update `STATUS.md` and `PROJECT_STATE.json` at meaningful checkpoints.
7. Deliver through the package branch and PR.
8. Stop at required human gates.
9. Continue only to eligible independent work.

A package is not complete merely because code exists. Technical validation and human acceptance are separate gates.

## Rapid iteration, finalisation and test-review timing

**Development is optimised for iteration speed; finalisation is optimised for correctness.** The normal feature/area loop is:

1. **Plan briefly.** Confirm scope, invariants, a provisional risk/test-impact note and any human acceptance gate. A complete test inventory is **not** required before iteration.
2. **Iterate in a draft PR.** Make small changes (move the Sunbeam Village sundial, recolour Story House, revise paths), run the cheapest checks needed for a usable build and preview, publish the updated preview URL promptly, and repeat based on feedback. Neither comprehensive test reconciliation nor full documentation review is a prerequisite for each preview.
3. **Approve/freeze the behaviour.** When human visual/product approval is required, record it; routine design iteration stops.
4. **Finalise the implementation.** Review architecture and code; remove temporary workarounds and reconcile the documentation against the accepted behaviour.
5. **Review tests against the actual final diff.** Check affected behavioural contracts, add/update/replace tests and ownership or explicitly explain why existing coverage remains sufficient. Resolve issues discovered by review before qualification.
6. **Qualify and merge.** Only after these reviews, mark Ready for review, run all required unit/build/smoke/Chromium/cross-browser checks and the live-head Merge Gate. Any later non-draft commit invalidates that qualification. Production deployment needs separate authorisation.

**WP2.2 assessment is progressive:** a new/current draft work package carries a provisional impact note (possibly `TBC`); the *complete, reconciled* assessment becomes mandatory **only at finalisation/Ready for review**. A draft must not fail purely because its final review is unfinished. A justified `tests unchanged — reviewed, with reason` is acceptable. The validator must have negative tests for both incomplete draft permission and incomplete final-stage rejection.

The existing fail-safe exceptions still apply: genuinely high-risk **current** changes to CI, bootstrapping, persistence, shared architecture or security-sensitive code may need earlier targeted or full tests; do not defer known broken gameplay. Avoid turning a past high-risk commit into repeated full qualification for later trivial draft updates. A preview is provisional feedback, **not** merge or release authority.

## Interruption / execution-window procedure

Before an execution window ends or whenever context-loss risk is material:

- leave stable work committed on the appropriate branch;
- update `STATUS.md` with exactly what is complete, incomplete and next;
- update `PROJECT_STATE.json`;
- record blockers and human decisions;
- record durable decisions in `DECISIONS.md`;
- leave the repository resumable by a fresh agent without the old conversation.

### Fast-development CI contract

The default development loop is **small change -> cheap relevant checks -> preview -> human review**. Full-game qualification is a section/release gate, not the default response to every edit.

- During active implementation, run the smallest deterministic checks that make the current preview trustworthy: Tier 0 plus ownership-selected unit/browser checks and build/performance only where the changed files require them.
- Pull-request `synchronize` runs should classify the **new delta since the previous PR head** when that SHA is available. This prevents an older high-risk file elsewhere in a long-lived PR from forcing the full browser matrix again after every later tiny edit.
- A genuinely high-risk **current delta** may still escalate immediately, especially CI/build infrastructure, bootstrap, persistence/schema or other explicit escalation paths.
- Documentation-only changes must remain documentation/static-contract checks only.
- Ordinary visual/content/UI iterations must not run Tier 3 full Chromium shards or Tier 4 cross-browser solely because the wider branch previously touched shared code.
- Shared-system changes should use representative ownership-selected regression coverage during development unless the current delta itself is an explicit high-risk escalation.
- Before pushing changed source or content, run `npm run format` and `npm run format:check`, then relevant local checks. CI reports formatter, lint, architecture and policy failures together; fix the complete set rather than sending multiple single-format commits.
- Keep work in draft while iterating; do final code/docs/test-impact reconciliation before moving to **Ready for review**, which starts full authoritative unit/build, Chromium and cross-browser qualification. Any later commit to a non-draft PR requires a fresh full qualification, even when the incremental diff is small.
- The **Merge Gate** validates all required jobs for the plan and compares the qualified head against the PR's live GitHub head. A previously green, superseded SHA is not permission to merge. Never merge while the authoritative exact-head gate is red, incomplete or unverified.
- Manual full CI remains an explicit authoritative fallback; production deployment is a separate Red action.
- A full run on `main` after merge is confirmation, not a substitute for the pre-merge exact-head qualification.

### Git/tool reconnect rule

- If GitHub/Git access fails, disconnects or appears unavailable during active repository work, immediately attempt a fresh connection/status read before reporting a blocker or asking the user what to do.
- Retry/reconnect autonomously when safe. Only surface the access problem after a genuine reconnect attempt fails, permissions/credentials require user action, or the remote service is demonstrably unavailable.
- Do not substitute speculative planning for requested repository work merely because the first Git/tool call failed.

### CI status, failure remediation and chat hand-off

- Never sit in repeated CI/deployment polling loops. On a user status query such as `?`, “now?” or “where are we at?”, perform one fresh status check.
- A status query is also standing authorisation to remediate a **terminal failed CI run** on the active work branch. Do not wait for a separate “fix it” instruction.
- On failure, inspect the failed job/logs immediately. If the cause is deterministic, safe and within the active package, fix it, commit/push the correction, make one sensible check of the replacement run, and report what changed and what is now pending.
- If the failure is a stale test, update it only when the accepted product behaviour is clear; do not distort working product behaviour merely to satisfy an obsolete assertion.
- Stop for user input only when remediation requires a product/design choice, material scope expansion, destructive/Red action, a human acceptance gate, or the failure is genuinely ambiguous.
- If CI is still running after the single sensible check, return control to the user with the exact run/head state instead of polling.
- A pending CI result is a valid explicit hand-off state.

## Night Shift

Night Shift is bounded autonomous execution of already approved work only. It must respect dependencies, PR delivery, CI, Amber/Red gates and human acceptance. It must not invent new roadmap scope simply to remain busy.

## Conversation lifecycle

Conversations are working memory. At suitable checkpoints classify the originating conversation as `keep`, `archive` or `delete`. Never recommend deletion until material decisions, work products, current state and remaining work are durable.

## Delivery policy

`pr_required`

- One roadmap work package per branch unless an explicit dependency requires a stacked branch.
- Agent-led branch names begin `agent/` unless an existing active package already uses an established branch.
- Keep unrelated refactors out of package branches.
- Open work as a draft PR until package acceptance criteria and CI are satisfied.
- Do not merge Amber work across its human gate without the required acceptance.

## Completion standard

Before claiming work complete:

- required changes exist;
- required technical validation has run;
- CI state is known;
- human acceptance state is correct;
- durable status matches repository reality;
- known limitations are explicit;
- blockers and decisions are explicit;
- next action is clear.


## ENG-WP2.2 — PR-local test-impact contract

All new PRs from #307 onwards carry the PR template's TEST_IMPACT_V1 JSON evidence. The draft stage may be provisional and intentionally incomplete; no completed review is needed merely to get a working preview. At finalisation, after human approval where required and code/documentation tidy-up, the author moves the PR-local assessment to stage reviewed, lists all relevant diff areas, affected test contract paths, and a reasoned test disposition with evidence and reviewer. Only then mark Ready for review. CI validates the cumulative PR file list, including modified tests and newly introduced work packages. This rule is stream-local; do not mutate shared PROJECT_STATE.json on every small visual/content change. Prior open PRs are grandfathered. The existing risk-based tests and exact-head full qualification remain mandatory.
