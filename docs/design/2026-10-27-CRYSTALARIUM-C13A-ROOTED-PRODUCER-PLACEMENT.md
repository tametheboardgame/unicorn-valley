# Crystalarium H6.9C13A — Rooted producer placement and unlock prototype

**Status:** player-placement design gate, **candidate only**. World draft [PR #337](https://github.com/tametheboardgame/unicorn-valley/pull/337). Parent roadmap: [H6.9C11–C16](../work-packages/R6.5-WP19H6.9C11-C16-CRYSTALARIUM-SECOND-PLAYTEST-ROADMAP.md). The user approved *exploration* of board-integrated generators, not a final layout or resource economy. This design is isolated from the real Crystalarium scene, rules, save, quests and source assets.

**Clickable, no-save visual concept:** [public/design-previews/crystalarium-c13a-generators.html](../../public/design-previews/crystalarium-c13a-generators.html). The concept compares two placement modes, supports the existing Low/Bright/Bell unlock milestones, and shows a basic free Grow action. It deliberately has **no recharge, charge depletion, fluid wallet, game persistence or world grants**. It uses representative crystal symbols and colours, **not final approved producer artwork**.

## Design hypotheses and comparison

| Dimension | A: Frame-rooted nursery (preferred) | B: Producers occupy board sockets (comparison) |
| --- | --- | --- |
| Producer location | Physical sockets embedded in the board's top/surrounding frame | Three fixed, non-mergeable, non-washable slots within the 7 × 6 grid |
| Free merge sockets | **42 / 42** remain available | **39 / 42** are available (3 permanently reserved) |
| Visual integration | Strong if rooted, continuous stone/crystal roots into the frame, not a detached source menu | Very strong physical presence inside the play area, but less usable space |
| Touch on 320px | One compact rooted row, horizontally scrollable with its own 48px+ actions; preserve first real board row above fixed recovery shelf | Each producer competes with crystal pieces and drag targets inside 7-column horizontal scroll |
| Risk of accidental merge/wash | Minimal: producer controls are not pieces | Higher: must treat producer cells as immutable objects in pointer, drag, wash, solver and accessibility contracts |
| Progression | Low always unlocked, Bright after 4 completed patterns, Bell after 7 | Same unlocks |
| Cost to existing engine and solver | Presentation + pointer source integration; existing 42-cell rules remain valid | Full rule/schema implications: 42-to-39 effective capacity, new blocked-cell type, solver and save migration |
| Recommendation | **Prototype first, preserve current game invariant** | Retain only as a comparison; requires a separate architecture, UX and solver approval before production adoption |

## Interactions common to both candidates

1. The existing story and Just Games each have one Crystalarium campaign. Family unlock is derived from **saved completed pattern count** (Low at 0, Bright at 4, Bell at 7), not a second progress tracker.
2. A producer is a **permanent board fixture** visually attached to the crystal-growth apparatus. It is not a CrystalPiece, cannot be dragged into the recovery shelf, merged, washed or deleted by Fresh Board.
3. Player may tap, keyboard-activate or (after actual device testing) drag from the appropriate rooted producer to grow a **basic free tier-zero** piece in an existing empty merge socket. Using a locked source displays a clear explanation rather than consuming a charge.
4. No producer may occupy a different-family existing crystal. Free basic growing must remain available even when all *future optional advanced* charges or fluid are zero. The free action must never be blocked by a real-time cooldown.
5. Retain original canonical save isolation, Crystalarium identity, Grotto music puzzle, 50 patterns, 18 crystal art variants, 4-slot shelf and free Brook Wash. C13A is **design-only** and cannot change these rules.

## Child-first visual treatment

- Frame option: three carved growth wells (Low blue, Bright mint, Bell lilac) linked by a continuous branch/circuit into the board frame. One clearly labelled **Grow free shard** action per unlocked producer, with a 48px target.
- Locked wells are visible but muted, with text such as “Bright: unlock at 4 patterns” and a lock icon. They remain keyboard discoverable; they do not pretend to be disabled decorative images.
- A symbolic crystal sprouts beside the well when a basic Grow action succeeds, followed by the same ordinary merge interactions as the existing board. No implicit item creation on selecting a producer.
- Use actual image-family identity when adopted in C13B; do not add a separate unfamiliar piece language. Text and icons must communicate readiness independently of colour.
- Avoid showing an idle “0 / N” charge meter before C13B is approved, as that would misrepresent free baseline growth.

## Prototype usability and technical checks

- Test 1280 × 720 desktop, 390 × 844 portrait, 320 × 700 narrow portrait, tablet landscape and phone landscape. Check physical producer touch targets, horizontal scroll isolation, 42 visible board sockets, safe shelf/bottom overlap and access to the Offer altar.
- Compare: how quickly a novice finds Grow; ability to select Low / Bright / Bell; unlock messages; 15-minute board-space usability; keyboard focus order and reduced-motion presentation.
- Perform pure-rule proof of full-board recovery and campaign solvability **without any upgraded generator** using the existing H6.9C fifty-pattern legal-action solver. For the cell-occupying alternate, a **new 39-cell solver** and explicit human capacity trade-off would be needed; do not silently claim current solver qualifies it.
- Run meaningful focused browser screenshot tests only **if adopted in the real game**. The static concept's buttons and representative grid are a comparison tool, not evidence of game correctness.
- Avoid C13A dependency on C11B/C12B visual acceptance becoming final automatically: the new UI remains under review. Do not merge PR #337.

## Decisions needed at C13A gate (not yet given)

**A or B:** frame nursery retaining all 42 cells, or three occupied cells accepting a 39-cell gameplay/architecture change.

**Placement:** along the board's top/edge or physically in-grid; choose based on real mobile evidence and accessibility. If A wins, choose a responsive orientation where the frame is visually attached without extending the vertical height enough to conceal the first board row behind the fixed shelf.

**Input:** tap producer to grow into next free cell as baseline; optionally drag from producer onto a specific empty cell if gesture handling is robust and novice testing finds it clearer.

**Artwork:** approve the physical shapes, lock/unlock cues and rooted relationship to the board; final variants should derive from shared Crystalarium art tokens, without demanding heavy launch assets.

**Only afterwards:** C13B charge schema, advanced growth probabilities/tiers, optional refill cadence, C14 Growth Fluid and wider Valley rewards. Their proposed numeric values remain hypotheses, not implementation authority.

**Next step:** user reviews the deployed, SHA-matched C13A comparison alongside the actual C11B/C12B game preview and supplies a placement/input preference. Then implement the adopted producer approach behind its own gate; C13B/C14 remain separate. Pond Leap PR #289 and shared Mini Games roadmap are out of scope.
