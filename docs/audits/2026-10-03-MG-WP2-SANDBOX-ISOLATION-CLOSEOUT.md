# MG-WP2 Sandbox Isolation Closeout Audit

Date: 2026-10-03

Package: `MG-WP2 - Sandbox, Rewards and Persistence Isolation`

Mini-game platform impact: **changed - all current catalogue families**

## Result

The current mini-game portfolio now distinguishes normal world progression from `just-games` sandbox sessions.

A sandbox session may run the same gameplay implementation, but it does not intentionally mutate adventure progression, economy, collections, unlocks, race records or world location checkpoints.

The visible Just Games catalogue is not part of MG-WP2. MG-WP3 will provide the second launch surface and human-visible end-to-end sandbox entry.

## Policy boundary

The canonical policy remains `MiniGameSession.sideEffectPolicy`:

- `world` -> accepted adventure effects are allowed;
- `sandbox` -> adventure effects are suppressed or replaced with non-persistent practice results.

Legacy direct starts with no `MiniGameSession` remain world-compatible so existing test/debug routes are not silently reinterpreted as sandbox.

## Wobbly Cake

World behaviour preserved:

- repeat bake costs 1 Shimmer;
- incomplete charged bake refunds the ingredient cost on exit;
- completed repeat bake writes recipe/activity progress;
- completed repeat bake grants its Shimmer payout;
- quest mode completes Maple's cake progression.

Sandbox behaviour:

- no ingredient Shimmer charge;
- no refund path because no sandbox charge is made;
- no Maple quest completion;
- no recipe/activity progress write;
- no Shimmer payout;
- result copy explicitly states that the run is practice and adventure progress is unchanged;
- return copy uses Back to Games for Just Games sessions.

Implementation uses the shared outcome policy for quest/activity/refund effects and explicit sandbox gating for economy presentation.

## Coral Beachcombing

World behaviour preserved:

- next trail follows adventure notebook/discovery progress;
- completing a trail writes repeatable-activity, memory and discovery progress;
- result screen reports adventure notebook progress.

Sandbox behaviour:

- initial/replay trails use a deterministic in-session rotation and do not read or create an adventure save;
- completing four observations does not write notebook/collection progress;
- result copy states that the adventure notebook is unchanged;
- no notebook progress helper is called in sandbox result presentation;
- Back returns to Games for a Just Games session.

A pure `getNextSandboxBeachcombingTrail` helper provides deterministic unit-testable practice sequencing.

## Firefly Lantern

World behaviour preserved:

- existing progress reconciliation remains world-only;
- attempts still persist normal/multicolour/endless bests;
- normal/multicolour/endless milestones and associated discoveries remain unchanged;
- mode unlock behaviour remains unchanged.

Sandbox behaviour:

- entering the scene does not call the adventure progress reconciliation/read helper;
- practice exposes the mode selector in-memory;
- completing an attempt does not call `recordFireflyLanternAttempt`;
- no best score, milestone, discovery or unlock is written;
- result copy describes practice and does not claim scores are remembered;
- retry and Choose Game preserve the same sandbox `MiniGameSession`.

The sandbox branch renders practice results without constructing or persisting an adventure result model.

## Rainbow Run Racing

World behaviour preserved:

- race results persist;
- personal bests persist;
- participation and podium Rainbow Sparkles are awarded;
- ribbons/rosettes remain one-time adventure rewards;
- race discoveries and Rainbow Cup progression remain unchanged;
- world return to the Race Hub can still update the world location checkpoint.

Sandbox behaviour:

- RaceScene does not create a new adventure save solely to obtain the player appearance; it reads an existing appearance when available and otherwise uses the default appearance;
- race finish does not call `applyRaceResultToSave` or save a race result;
- practice summary grants zero Sparkles, ribbons, reward items or Rainbow Cup progression;
- finish UI reports Practice time rather than a persisted personal best;
- reward copy states that no adventure result was saved;
- a sandbox return never writes the Rainbow Run world location checkpoint.

The sandbox branch returns no persistent `RaceRewardSummary`; the finish panel derives practice-only presentation from the current run.

## Rainbow Disc

Persistence audit result:

- no score/reward/progression persistence is owned by the activity;
- the only save access is player-appearance presentation.

Sandbox correction:

- an absent save no longer causes Rainbow Disc to create a new adventure save;
- existing appearance may be read;
- default unicorn appearance is used when no save exists.

World/legacy behaviour remains compatible: a legacy/world start may still create the normal save if one does not yet exist.

## Pond Leap

Persistence audit result:

- no save, quest, economy, inventory, collection, unlock or relationship mutation path exists in `PondLeapActivityScene`.

No game-specific MG-WP2 mutation change was required.

## Sunbeam Chess

Persistence audit result:

- no save, quest, economy, inventory, collection, unlock or relationship mutation path exists in `ChessPlazaActivityScene`.

No game-specific MG-WP2 mutation change was required.

## Objective test coverage

MG-WP2 adds/extends objective contracts for:

- world versus sandbox outcome policy across every adventure-effect category;
- legacy no-session world compatibility;
- Coral sandbox trail sequencing without adventure progress;
- existing world persistence tests remain in place for Firefly, repeatable activities and racing;
- the package source audit confirms the sandbox branches bypass the Firefly and racing persistence calls and the simple games have no hidden write path.

Full end-to-end Just Games browser proof belongs to MG-WP3 once the visible launcher exists. MG-WP2's responsibility is to make those future sessions safe before exposing them.

## Save-creation rule

A sandbox mini-game must not create an adventure save merely to render or start gameplay.

This audit specifically removed hidden create-on-read behaviour from:

- Coral sandbox trail/progress presentation;
- Firefly sandbox progress reconciliation;
- Rainbow Run sandbox appearance loading;
- Rainbow Disc sandbox appearance loading.

## Compatibility retained intentionally

- world and legacy no-session launches retain existing accepted persistence;
- simple activity legacy return payloads remain available;
- racing's compatibility return registry remains for legacy/test starts;
- no separate sandbox gameplay implementation was created.

## Human gate focus

Before MG-WP2 merge, verify on the exact preview that world versions still behave normally.

The full visible sandbox human test is intentionally deferred to MG-WP3 because no Just Games UI exists yet.

For MG-WP2 the critical human regression checks are:

- Wobbly Cake still charges/refunds/pays correctly in normal world repeat mode and Maple quest mode still completes;
- Coral still advances its notebook normally in world play;
- Firefly still remembers/unlocks its world progress;
- races still save world results/rewards and return correctly;
- Rainbow Disc appearance remains correct in world play.

## Next package

After MG-WP2 approval and merge:

**MG-WP3 - Just Games Home and Catalogue Experience**

Package: `docs/work-packages/MG-WP3-JUST-GAMES-HOME-CATALOGUE.md`
