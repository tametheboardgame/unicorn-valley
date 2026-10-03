# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP2 - Sandbox, Rewards and Persistence Isolation**

Branch: `agent/mg-wp2-sandbox-persistence-isolation`

MG-WP1 is complete, human-approved and merged to `main` as `f5cbbbff043a4106df873c482a07603c6ca91f0c`.

### Current checkpoint - MG-WP2A

The package-level sandbox side-effect matrix is recorded at:

`docs/audits/2026-10-03-MG-WP2-SANDBOX-SIDE-EFFECT-MATRIX.md`

MG-WP2A owns Wobbly Cake sandbox isolation.

Implemented so far:

- legacy no-session starts are explicitly treated as world-compatible by the outcome gateway;
- sandbox Wobbly Cake does not charge the 1 Shimmer ingredient cost;
- sandbox completion does not advance Maple's quest;
- sandbox completion does not write recipe/activity progress;
- sandbox completion does not grant Shimmer;
- sandbox exit cannot produce an adventure-economy refund;
- result/intro copy identifies the run as practice and does not claim adventure rewards were saved;
- world-session behaviour is intentionally unchanged.

## Next work

1. validate and close MG-WP2A;
2. MG-WP2B - Coral Beachcombing persistence isolation;
3. MG-WP2C - Firefly Lantern progress/milestone isolation;
4. MG-WP2D - Rainbow Run result/reward/Cup isolation;
5. MG-WP2E - prove Rainbow Disc, Pond Leap and Chess are no-write in sandbox and close the package.

The visible Just Games catalogue remains MG-WP3 and does not begin until MG-WP2 is approved and merged.

## Validation state

MG-WP2 exact-head validation is pending.

The repository performance budget remains a pre-existing red baseline around the current first-playable/chunk thresholds; MG-WP2 must not introduce an additional regression.

## Human gate

MG-WP2 is Amber. Do not merge until the side-effect matrix is implemented, world behaviour is preserved, sandbox no-write behaviour is objectively covered, and David approves the package.

## Operating reminders

- Work in bounded game-specific isolation checkpoints.
- Fix deterministic current-work failures immediately.
- If Git/GitHub access fails, reconnect before reporting a blocker.
- Do not create separate sandbox gameplay implementations; use the existing game plus session policy.
