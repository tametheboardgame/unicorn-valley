# MG-WP2 Sandbox Side-Effect Matrix

Date: 2026-10-03

Package: `MG-WP2 - Sandbox, Rewards and Persistence Isolation`

Mini-game platform impact: **changed - all current catalogue families**

## Policy

`world` sessions preserve accepted adventure behaviour.

`just-games` sessions use `sandbox` policy and must not mutate adventure progression, economy, collections, quest state or unlocks.

Legacy direct starts with no `MiniGameSession` continue to behave as world sessions for compatibility.

## Matrix

| Game family | World writes to preserve | Sandbox policy | MG-WP2 implementation target |
| --- | --- | --- | --- |
| Rainbow Disc | none identified beyond transient activity state | no durable adventure writes | prove no hidden save mutation |
| Pond Leap | none identified beyond transient activity state | no durable adventure writes | prove no hidden save mutation |
| Sunbeam Chess | none identified beyond transient activity state | no durable adventure writes | prove no hidden save mutation |
| Wobbly Cake | quest completion; recipe/activity progress; repeat ingredient Shimmer spend; incomplete-run refund; finished-cake Shimmer payout | no quest write; no notebook/progress write; no Shimmer spend/refund/payout | MG-WP2A |
| Coral Beachcombing | notebook/trail progress and next-trail progression | no notebook/collection progression write | MG-WP2B |
| Firefly Lantern | attempt history; best scores; milestones; mode unlocks | no adventure attempt/milestone/best/unlock write; run result remains session-local | MG-WP2C |
| Rainbow Run Racing | race result save; personal bests; ribbons; Rainbow Sparkles; Rainbow Cup progression; world location checkpoint on world return | no race record/reward/Cup write; no adventure location checkpoint when returning to Just Games | MG-WP2D |

## Read policy

Sandbox sessions may read:

- appearance/profile presentation;
- accessibility and settings;
- static game/course definitions;
- existing display-only records where the game needs them for presentation.

Reading existing state must not require creation of a new adventure save solely to enter a sandbox game.

## Result presentation policy

A sandbox result screen must not claim that:

- Shimmer was spent or earned;
- a quest advanced;
- a notebook/collection was updated;
- a milestone or unlock was saved;
- a personal best/ribbon/Cup result was written.

Practice results may remain visible for the current session/run, but durable standalone records are out of scope until a separate non-progression namespace is approved.

## Checkpoint sequence

### MG-WP2A - Wobbly Cake

Block:

- ingredient charge;
- quest completion;
- recipe notebook progress;
- Shimmer payout;
- refund path.

Update copy to describe a practice bake.

### MG-WP2B - Coral Beachcombing

Block trail/notebook persistence while preserving the current run and replay flow.

### MG-WP2C - Firefly Lantern

Separate run result presentation from durable attempt/best/milestone/unlock writes.

### MG-WP2D - Rainbow Run Racing

Separate race result presentation from durable race result, reward, ribbon, Cup and personal-best writes. Ensure Just Games return does not update a world location checkpoint.

### MG-WP2E - No-write proof and closeout

Prove Rainbow Disc, Pond Leap and Chess have no durable adventure write, add cross-game sandbox regression coverage, and complete the package audit.
