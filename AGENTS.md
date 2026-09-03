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
8. Inspect the current branch, open PRs, recent commits and CI.
9. Confirm autonomy, dependencies, invariants, technical validation and any human gate.

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
2. Implement the smallest coherent change set.
3. Run specified technical validation.
4. Fix current-work failures while staying in scope.
5. Record material durable decisions.
6. Update `STATUS.md` and `PROJECT_STATE.json` at meaningful checkpoints.
7. Deliver through the package branch and PR.
8. Stop at required human gates.
9. Continue only to eligible independent work.

A package is not complete merely because code exists. Technical validation and human acceptance are separate gates.

## Interruption / execution-window procedure

Before an execution window ends or whenever context-loss risk is material:

- leave stable work committed on the appropriate branch;
- update `STATUS.md` with exactly what is complete, incomplete and next;
- update `PROJECT_STATE.json`;
- record blockers and human decisions;
- record durable decisions in `DECISIONS.md`;
- leave the repository resumable by a fresh agent without the old conversation.

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
