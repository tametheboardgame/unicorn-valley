---
id: MG-WP4
title: Future Mini-Game Authoring Kit and Guardrails
status: proposed
autonomy: amber
depends_on: [MG-WP3]
parallel_safe: false
human_gate: architecture-and-authoring
---

# MG-WP4 - Future Mini-Game Authoring Kit and Guardrails

## Purpose

Make the shared mini-game path the default and easiest path for every future world or Just-Games-first mini-game.

Mini-game platform impact: **changed - authoring and verification guardrails**

MG-WP4 begins only after MG-WP3 is approved and merged.

## Scope

- publish the canonical authoring recipe for a new mini-game;
- enforce unique stable `MiniGameId` values, valid scene keys and variant integrity;
- provide reusable launch/return browser contracts;
- provide reusable sandbox no-adventure-write regression contracts;
- keep verification ownership current for `src/game/minigames/**`, catalogue changes and Just Games;
- require every future work package to declare its mini-game platform impact;
- provide a deterministic non-production fixture proving one implementation can launch from world and Just Games contexts.

## Acceptance

- a fresh development agent can add a mini-game by following one documented path;
- world-first work cannot silently omit Just Games integration;
- Just-Games-first work can later receive a world placement without rewriting gameplay;
- catalogue, scene registration, sandbox and return contracts fail loudly when authored incorrectly.

## Human gate

MG-WP4 is Amber. Do not merge until the authoring workflow and guardrails have been reviewed against at least one representative existing mini-game and David approves the programme closeout.
