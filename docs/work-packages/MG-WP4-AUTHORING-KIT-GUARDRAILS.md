---
id: MG-WP4
title: Future Mini-Game Authoring Kit and Guardrails
status: complete
autonomy: amber
depends_on: [MG-WP3]
parallel_safe: false
human_gate: architecture-and-authoring
mini_game_platform_impact: changed - platform
---

# MG-WP4 - Future Mini-Game Authoring Kit and Guardrails

## Purpose

Make the shared mini-game path the default and easiest path for every future world or Just-Games-first mini-game.

Mini-game platform impact: **changed - platform** (authoring and verification guardrails)

MG-WP4 began on 2026-10-03 after MG-WP3 was approved and merged to main.

## Scope

- publish the canonical authoring recipe for a new mini-game;
- enforce unique stable MiniGameId values, valid scene keys and variant integrity;
- provide reusable launch/return browser contracts;
- provide reusable sandbox no-adventure-write regression contracts;
- keep verification ownership current for src/game/minigames/**, catalogue changes and Just Games;
- require every future work package to declare its mini-game platform impact;
- provide a deterministic non-production fixture proving one implementation can launch from world and Just Games contexts.

## Bounded checkpoints

### MG-WP4A - Authoring contract and catalogue guardrails - complete

- publish the canonical authoring recipe;
- add fail-loud catalogue validation for IDs, scene keys, Just Games exposure and variants;
- add a deterministic test-only fixture using one existing canonical game to prove the same definition/session path supports world and Just Games contexts;
- reconcile package/project status.

### MG-WP4B - Reusable behavioural verification contracts - complete

- extract reusable browser launch/return helpers that future games can opt into without copying the full Just Games suite;
- add reusable sandbox no-adventure-write regression coverage;
- keep verification ownership deterministic for mini-game platform and Just Games changes.

Implementation notes:

- the previous all-family Just Games loop is now a dedicated declarative browser contract;
- the MG-WP3 suite remains focused on catalogue/interface behaviour;
- sandbox/world side-effect assertions are shared through a test-only helper;
- mini-game verification ownership explicitly includes the reusable browser contract.

### MG-WP4C - Cross-roadmap enforcement and closeout - complete

- make the Mini-game platform impact declaration a required work-package authoring check;
- reconcile architecture/engineering documentation;
- review the recipe against a representative existing mini-game;
- run the package qualification required by repository policy;
- stop at the Amber human gate for programme closeout approval.

## Acceptance

- a fresh development agent can add a mini-game by following one documented path;
- world-first work cannot silently omit Just Games integration;
- Just-Games-first work can later receive a world placement without rewriting gameplay;
- catalogue, scene registration, sandbox and return contracts fail loudly when authored incorrectly.

## Human gate

MG-WP4 is Amber. Do not merge until the authoring workflow and guardrails have been reviewed against at least one representative existing mini-game and David approves the programme closeout.


## Representative authoring review - Sunbeam Chess

MG-WP4C reviewed the canonical authoring path against the existing `sunbeam-chess` family.

- **Stable identity:** `MiniGameCatalogue` owns one `sunbeam-chess` ID pointing to `ChessPlazaActivityScene`.
- **World wrapper:** `VillageLifeWorldManager.launchChess` owns the physical Sunbeam chess-plaza interaction and calls `launchMiniGame` with `source: 'world'` plus the interaction context.
- **Caller-independent gameplay:** `ChessPlazaActivityScene` reads `MiniGameSession`; its Back label derives from session source and exit routes through `returnFromMiniGame`.
- **Just Games reuse:** the reusable MG-WP4 browser contract launches the same `ChessPlazaActivityScene` from the catalogue and proves clean return to `JustGamesScene`.
- **Sandbox boundary:** the deterministic authoring fixture creates world and Just Games sessions for the same chess definition and applies the reusable world/sandbox side-effect contracts.
- **No duplicate implementation:** no Just-Games-specific chess gameplay scene or ruleset exists.

Review result: **conforms to the MG-WP4 authoring recipe**. No Chess product change is required for closeout.


## Closeout state

MG-WP4 implementation is complete and the repository-selected branch CI passed on 2026-10-04. David explicitly approved the Amber architecture-and-authoring closeout on 2026-10-04. The package is accepted and ready to merge.
