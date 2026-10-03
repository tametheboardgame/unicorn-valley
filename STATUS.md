# Project Status

Last updated: 2026-10-03

## Current work

The independent **MG - Mini-Game Development Programme** is active.

Current bounded package: **MG-WP2 - Sandbox, Rewards and Persistence Isolation**

Branch: `agent/mg-wp2-sandbox-persistence-isolation`

PR: **#266**

MG-WP1 is complete, human-approved and merged to `main` as `f5cbbbff043a4106df873c482a07603c6ca91f0c`.

### Current checkpoint - MG-WP2E

MG-WP2 implementation is complete across the current catalogue.

Completed checkpoints:

- MG-WP2A - Wobbly Cake sandbox economy/quest/progress isolation;
- MG-WP2B - Coral Beachcombing sandbox notebook/save isolation;
- MG-WP2C - Firefly Lantern sandbox best/milestone/unlock isolation;
- MG-WP2D - Rainbow Run sandbox result/reward/Cup isolation;
- MG-WP2E - no-write proof/audit for Rainbow Disc, Pond Leap and Sunbeam Chess.

Package-level evidence:

- `docs/audits/2026-10-03-MG-WP2-SANDBOX-SIDE-EFFECT-MATRIX.md`;
- `docs/audits/2026-10-03-MG-WP2-SANDBOX-ISOLATION-CLOSEOUT.md`.

Important corrections made during the package:

- Coral sandbox no longer creates an adventure save through progress reads;
- Firefly sandbox bypasses progress reconciliation and persistent attempt recording;
- racing sandbox does not create a save solely for appearance and produces a reward-free practice result;
- Rainbow Disc sandbox no longer creates an adventure save solely for appearance;
- Pond Leap and Chess were confirmed to have no adventure persistence path.

No separate sandbox gameplay implementation was created.

## Validation state

Exact-head MG-WP2 validation is running.

Objective contracts now cover:

- world/sandbox/legacy outcome policy across every adventure-effect category;
- Coral sandbox trail sequencing;
- existing world persistence contracts remain in place;
- the closeout source audit confirms Firefly/racing sandbox branches bypass persistence and the simple games have no hidden write path.

The repository performance budget remains a known baseline concern; MG-WP2 must not introduce an additional regression.

## Human gate

MG-WP2 is Amber.

Before merge, the human regression pass should confirm the normal world versions still behave as before:

- Wobbly Cake world charge/refund/payout and Maple quest flow;
- Coral world notebook progression;
- Firefly world bests/milestones/unlocks;
- race world records/rewards/returns;
- Rainbow Disc world appearance.

The visible end-to-end sandbox/Just Games human test belongs to MG-WP3 because the Just Games launcher does not exist yet.

## Next work

After MG-WP2 approval and merge:

**MG-WP3 - Just Games Home and Catalogue Experience**

Package:

`docs/work-packages/MG-WP3-JUST-GAMES-HOME-CATALOGUE.md`

## Operating reminders

- Do not start MG-WP3 on top of an unmerged MG-WP2 branch.
- Fix deterministic current-work CI failures immediately.
- If Git/GitHub access fails, reconnect before reporting a blocker.
- Keep one canonical gameplay implementation per mini-game.
