---
id: MG-WP2
title: Sandbox, Rewards and Persistence Isolation
status: proposed
autonomy: amber
depends_on: [MG-WP1]
parallel_safe: false
human_gate: architecture-and-regression
---

# MG-WP2 - Sandbox, Rewards and Persistence Isolation

## Purpose

Make the shared mini-game platform safe for future **Just Games** sessions by separating normal world progression effects from sandbox play.

Mini-game platform impact: **changed - all current catalogue families**

MG-WP2 begins only after MG-WP1 is approved and merged.

## Scope

Audit and isolate durable side effects for:

- Rainbow Disc;
- Pond Leap;
- Sunbeam Chess;
- Wobbly Cake;
- Coral Beachcombing;
- Firefly Lantern;
- Rainbow Run Racing.

The default rule remains:

- `world` sessions preserve current accepted progression/reward behaviour;
- `just-games` sessions use `sandbox` side effects and must not mutate normal adventure progression.

## Required isolation

Sandbox sessions must not, by default:

- advance quests;
- set world/story flags;
- alter relationships;
- grant or consume inventory;
- grant or consume Shimmer;
- change collection/Wonderbook progression;
- grant ribbons or race rewards;
- unlock world modes/content;
- write normal world activity milestones.

## Package targets

### Wobbly Cake

- no Shimmer ingredient charge;
- no incomplete-bake refund requirement because no sandbox charge occurred;
- no quest completion;
- no cake progress/economy payout.

### Coral Beachcombing

- no normal notebook/collection progression writes;
- sandbox run state remains usable for replay within the session.

### Firefly Lantern

- no milestone/unlock writes;
- no world best-score/progression mutation unless an explicitly isolated practice record store is later approved.

### Rainbow Run Racing

- no world race result write;
- no ribbons;
- no Rainbow Sparkles;
- no Rainbow Cup progression;
- no world personal-best mutation.

### Rainbow Disc, Pond Leap and Chess

- prove that no new durable adventure-state write occurs in sandbox;
- retain their current no-economy/no-quest behaviour unless the audit finds hidden side effects.

## Architecture

Use the MG-WP0 outcome/persistence boundary rather than adding game-specific checks scattered through UI code.

Game-owned result payloads remain game-specific. The shared session policy decides whether durable world effects are permitted.

## Validation

Required evidence includes:

- world-session regression proving current accepted rewards/progression remain unchanged;
- sandbox regression proving forbidden save fields remain unchanged after complete/retry/exit;
- game-specific unit/browser coverage for every family with persistent outcomes;
- no save creation solely to enter a sandbox game where a read-only/default session profile can be used.

## Non-goals

- no visible Just Games home/catalogue UI yet;
- no game redesign or balance changes;
- no durable standalone high-score system unless separately approved;
- no world quest/reward rebalance.

## Human gate

MG-WP2 is Amber.

Do not merge until the sandbox side-effect matrix is explicit, world behaviour is preserved, forbidden sandbox writes are objectively tested and David approves the isolation package.
