# C20 Growth Potion economic gate D: non-saving balance study

**Status:** Candidate design and test model, **NOT APPROVED ECONOMY**  
**Stream:** World; existing draft PR #337; no merge or production authorisation  
**Owner instruction:** Start C20 (31 October 2026). The earlier C20 artwork, 12-frame pouring animation, generator interaction and bright painted layout are accepted and must remain unchanged.

## What C20 already has

The illustrated game has the locked Growth Potion reservoir artwork and a real pouring/emergence cue emitted *only after the controller has accepted and persisted a growth action*. The gauge currently displays **Free growth**. There is **no potion quantity, cost, refill, spending or resource persistence**; changing that requires a separate economic Gate D decision.

Do not mistake the visual artwork being approved for numeric refill/cost approval. Retain the canonical 42 sockets, Low/Bright/Bell wells, 0/4/7 unlocks, 50 authored patterns, separate Just Games saves, atomic Growth/Offer and no-hard-wait promise.

## Three capacity candidates, two recovery mechanics

| Option | Capacity | Basic crystal | Refined crystal | Free continuation | Candidate rewards |
| --- | --- | --- | --- | --- | --- |
| S100/S150/S200 | 100, 150 or 200 drops | 1 drop | 2 drops | A free Brook Spring button instantly restores 25 drops at any remaining balance | +1 on accepted saved merge, +3 on accepted saved Offer |
| B100/B150/B200 | 100, 150 or 200 drops | 1 drop while stocked | 2 drops | When potion reaches zero, basic crystal growth costs **zero**; a refined growth still needs potion | +1 on accepted saved merge, +3 on accepted saved Offer |

**All numbers, rewards and recovery options are proposals**, not decisions. The pure `CrystalariumPotionCandidateRules.ts` module explicitly does not connect to the live game, renderer or persistence. Its tests protect no-charge-on-failure, no-negative-stock, capped reward, idempotent outcome and long-run free continuation.

### Design trade-offs to test

- **Brook Spring** communicates that liquid is being replenished, fits the bottle visual story and introduces one extra button/tap when low. It must be always available, instant, and free in both Just Games and Crystal Brook. Prefer a compact refill affordance beside the reservoir, not a new full-size panel.
- **Free basic at zero** avoids any interruption to exploration, but makes the meter function mainly as a refined-growth acceleration pool. It may be easier for a seven-year-old, and should announce clearly that basic crystals are still free.
- **100 vs 150 vs 200:** Lower stocks make the refill or reserve rule more visible; larger stocks reduce interruptions over long sessions. Choose based on 5, 15 and 45-minute playtest rather than assuming a larger number adds fun.
- **Rewards:** Proposed +1 merge/+3 Offer, but awards must follow accepted *saved* results only. Cap at capacity, never award on rejected/cancelled/failing transactions or double-credit on reload. Consider omitting rewards entirely if it obscures cause and effect.
- **Advanced source:** The existing optional free refined vein unlocks late, and must never become a mandatory potion-paid route for completing the authored campaign. Keep the original free basic loop as a reliable fallback.

## Gate D implementation boundary

1. Show a clearly labelled **no-save economic design preview** with the locked reservoir/gauge art, exact 100/150/200 numbers, proposed recovery comparison and safe input/keyboard controls. It cannot be mistaken for a live save or synced game.
2. Capture owner choice for capacity, minimum/max fill, refill method, basic/refined cost, merge/Offer rewards, whether free basic at zero is always on, and reset/new/legacy save behaviour. Reject passive timers, microtransactions, world/quest awards and extra charges.
3. Before production code, plan an explicit versioned upgrade for *both* adventure and Just Games stores, and a safe handling of old, invalid, future and write-failed records. A saved accepted growth must update the crystal and potion atomically, or neither.
4. Only after owner approval wire the chosen rules into the canonical controller, complete bottle/gauge visual, level-dependent fill art, low/zero/sufficient feedback and an accessible refill control if selected. Potion must not block Help, Skip, exit, Wash, storage or other safe recovery.
5. Validate 50-offer dry-state solvability and 5/15/45-minute sessions with a device/browser matrix, no resource duplication after retry, real stored crystals, muted/reduced-motion, return/reload, 320/390 touch and desktop 1006/1280/1440. Record exact-head CI and human playable acceptance separately.

## Acceptance and next stage

- **C19 Gate C:** User accepted the compact drag-first 4×3 chamber, close/instructions layout and working return. The previous final C19 browser re-run had not finished before a C20 commit superseded the PR head; C19 technical gate requires new exact-head passing evidence.
- **C20 Gate D:** Not approved until actual resource economy choices are selected. Pure candidate model and preview are safe work *within* the requested start, but must not debit or migrate live saves.
- **After Gate D:** Implementation and gameplay tests, followed by existing C21–C23 polish, C24 hardening and H6.9D full qualification. Keep PR #337 draft and unmerged.

## C20 candidate-economy findings, authored campaign audit (31 October)

A dedicated pure analysis, `CrystalariumPotionBalanceAnalysis.ts`, now reads all **50** actual `RESONANCE_PATTERNS` instead of relying on an invented sample. It estimates the **tier-zero shard requirements and mandatory pairwise merges** for each pattern, including three tier-one crystals (6 shards and 3 merges) for each harmony. Across the 50 separately constructed recipes:

- **950 basic shard growth actions**, **812 merges**, **50 offers**, **14 crafted harmonies** (an estimate that ignores initial starter shards and optional stock re-use).
- At proposed basic cost **1**, merge reward **1**, offer reward **3**, the simple net is **−950 + 812 + 150 = +12** drops. **38** patterns are individually potion-positive, **3** neutral and **9** negative. This is before clipping when the reservoir is full, so it does not mean the player's actual saved stock increases by 12.
- Same shard costs with **merge reward 1, offer reward 0** gives a net **−138**. With **merge reward 0, offer reward 3**, net **−800**. No rewards yields **−950**.
- Merely changing capacity from 100 to 150 or 200 **does not change those net crafting requirements**. Capacity determines the buffer; recovery/reward policy determines whether it is useful.
- These are **analytical recipe costs, not timed 5/15/45-minute playtests, full board/storage operation or a legal gameplay solver**. C18's simultaneous orders, legacy starter crystals, reusing materials, occasional polished/refined growth, full bottle reward clipping and actual action interleaving affect the outcome.

**Implication:** The originally proposed +1/+3 reward structure nearly self-funds the whole campaign, which may make a visible Growth Potion meter feel inconsequential. Comparing at least one lower-reward candidate at Gate D is now advisable, rather than assuming 100/100/+1/+3 is balanced. No numeric option has been approved.

**No-hardlock correction:** The isolated `free-basic-at-zero` trial model now treats basic growth as free whenever the remaining stock is **less than the basic cost**, not only when literally zero. Otherwise a future 2-drop candidate with 1 drop remaining could softlock basic creation. This is still an unconnected test rule, not a live game change.

## Verified persistence integration boundary for the later approved stage

Repository inspection confirms `CURRENT_SAVE_SCHEMA_VERSION` currently protects **adventure v12**, while **Crystalarium Chamber v3** stores the independently persisted 12-slot inventory. `CrystalariumFullPersistence.ts` already owns both the adventure `SaveService.saveWithResult` path and the sandbox `unicorn-valley:just-games:crystalarium:v1` localStorage key. Its loader upgrades old nested records, and its writer refuses malformed/future-version sandbox state. `CrystalariumFullMode.apply` already saves accepted results **before** committing the new state, emitting growth animation or awarding feedback.

**Proposed migration, not implemented:** after Gate D approval, introduce a nested **Chamber/potion v4** record that preserves all existing v3 members (42 board cells, 12 storage slots, queue IDs/cursor, counters, unlocks and discovered art) plus an explicitly validated potion amount under the approved capacity. Add a coordinated adventure schema **v12→v13** migration and nested v1/v2/v3→v4 idempotent upgrade, while keeping the existing sandbox storage *key* stable and validating its nested version. Initial potion fill for migrated and newly started games, fresh-board resets, max changes, invalid/future saves and save failure behaviour all require the owner's exact Gate D values. Never reset or silently overwrite progress while migrating.

**Single-transaction contract:** an approved successful growth/refined action must derive both the updated crystal state and its potion debit from the *same immutable input*; the save service writes one combined state, and on failure the old inventory and potion stay untouched. Accepted merges/Offers award potion exactly once in the same transaction, capped at approved capacity; do not award from transient animation, rendering, reload, a repeated click, a rejected merge, a failed write or an already fulfilled card. No separate localStorage potion counter, new world inventory resource or duplicated Crystalarium controller. Tests will exercise both source paths and future-version fail-closed policy before rollout.

This verification is a **design safeguard only**, not authorisation to change schema 12, Chamber v3 or the live controller.
