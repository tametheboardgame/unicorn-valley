---
id: MG-WP4
title: Future Mini-Game Authoring Kit and Guardrails
status: active
autonomy: amber
depends_on: [MG-WP3]
parallel_safe: false
human_gate: architecture-and-authoring
---

# MG-WP4 - Future Mini-Game Authoring Kit and Guardrails

## Purpose

Make the shared mini-game path the default and easiest path for every future world or Just-Games-first mini-game.

Mini-game platform impact: **changed - authoring and verification guardrails**

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

### MG-WP4A - Authoring contract and catalogue guardrails

- publish the canonical authoring recipe;
- add fail-loud catalogue validation for IDs, scene keys, Just Games exposure and variants;
- add a deterministic test-only fixture using one existing canonical game to prove the same definition/session path supports world and Just Games contexts;
- reconcile package/project status.

### MG-WP4B - Reusable behavioural verification contracts

- extract reusable browser launch/return helpers that future games can opt into without copying the full Just Games suite;
- add reusable sandbox no-adventure-write regression coverage;
- keep verification ownership deterministic for mini-game platform and Just Games changes.

### MG-WP4C - Cross-roadmap enforcement and closeout

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
