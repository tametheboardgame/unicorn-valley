# Crystalarium H6.9C11A / C12A – Interactive Teaching and Interface Design Review

Status: **design candidate awaiting human visual acceptance**. This fulfils the design-definition portion of [the C11–C16 roadmap](../work-packages/R6.5-WP19H6.9C11-C16-CRYSTALARIUM-SECOND-PLAYTEST-ROADMAP.md); it is not gameplay implementation or authorisation for H6.9D. World PR #337 stays draft. Baseline targeted Crystalarium browser CI #40540785493 passed 16/16 before these proposed changes.

Reviewable visual prototype: [Crystalarium C11/C12 interactive concept](../../public/design-previews/crystalarium-c11-c12.html). Once Cloudflare deploys this branch, the standalone URL ends in /design-previews/crystalarium-c11-c12.html. **The prototype is a separate, demo-only experience**, not the real game and does not read or write adventure or Just Games saves.

## C11A – Literal one-action-at-a-time tutorial

The existing guide is a prompt overlay and the player can ignore it. That is not the desired lesson. C11B must implement a controller-authorised interaction sequence: the spotlighted gameplay target is the **only executable gameplay action** at that moment. Unrelated gameplay controls must appear unavailable and be rejected before any rule or save call. Keep Skip, Leave & Save, Replay Help, settings/sound, accessible navigation and cancellation available.

| Step | Spotlight and suggested words | Allowed gameplay action | Actual success condition | Recovery |
| --- | --- | --- | --- | --- |
| **1 Grow** | Highlight Grow Shard: "Tap here to grow a crystal" | One basic Low grow | A successful, persisted spawn on a real free socket | If no room, show accessible Skip or non-destructive space recovery; never trap a full board |
| **2 Pick up** | The **newly grown** Low shard: "Pick up this crystal" | Select/pick the new occupied source socket | Captured drag/keyboard selection, no save | Other cells ignored, cancelled drag returns to this step |
| **3 Merge** | One pre-existing matching Low shard: "Drop onto its twin" | Move the newly grown piece onto the highlighted equal-family and equal-tier destination | Successful persisted merge, not merely pointer-up | Invalid/outside drop safely snaps back; wrong pair has no save or counter |
| **4 Match art** | Exact resulting tier-one art and identical goal image: "The picture matches!" | Activate/focus the actual goal card | Explicit non-mutating recipe inspection event | Offer still locked until inspection; support keyboard focus |
| **5 Offer** | Whole goal altar gently illuminates: "Tap Offer Pattern!" | Canonical Offer only if every requirement is met | Successfully persisted increment in completed/offer counters | If missing/changed, derive the next feasible step; no phantom success |
| **6 Celebrate** | Brief visible chord/sparkle, completion message, free control | All ordinary gameplay actions after saved offer | Tutorial preference recorded separately for World and Just Games | Reduced motion gets still outline/text, global mute stays silent |

### Source state and action policy

- A fresh game already starts with **two Low tier-zero pieces** in the 42-cell board. The lesson grows a third authentic shard, **merges the newly grown shard with one of the two existing twins**, compares the resulting tier-one piece with the first recipe and offers. Do not fake any gameplay state or overwrite existing pieces.
- At runtime, derive the valid origin and destination from current board/shelf contents rather than globally hardcoding indices 0 and 1. Only the illustrative concept uses fixed positions.
- Before controller mutation, evaluate an action policy such as Grow, Pick(index), Merge(source,target), InspectGoal(goal-id), Offer, Skip, Help, Leave, Sound. Only a correct enabled gameplay command reaches the existing pure rules. The guide only advances **after a successful save** of an accepted gameplay change; inspecting the goal is deliberately non-mutating.
- Capture, drag and pointer cancellation are not persistent actions; reject wrong selection and invalid drops without loss or saving. Do not disable Phaser scene-wide input or place an invisible overlay across crystal pointer hit targets. Mouse, real touch, tap-to-select and keyboard all use the same policy.
- Persist guide seen/replay per session source. Existing guide keys/saves should be migrated or honoured. On old/progressed saves, replay should start at a **feasible** step or offer accessible read-only hints, never demand impossible first-play choreography or re-lock a previously completed songbook. The world-only Grotto opening melody is entirely unchanged.
- Contextual lessons for shelf, free Brook Wash, new families, harmony, polishing, later producers and fluid are much shorter and individually skippable; do not suddenly lock a mature save after an update.
- Each target has a non-colour icon/outline, "Step X of 5" instruction, aria state and 48px touch target. Reduce-motion replaces pulsing with a stable ring; sound never carries essential information. Leaving, rotation or reload at any step must recover control.

### C11B required tests

Pure guide action matrix: authorised target versus all rejected actions, zero mutation on refusal, accepted-and-saved-only stage changes, storage failure, skip and replay at every phase, no legal pair/full board, migrated progressed guide key, Just Games save isolation and preserved Grotto story. Browser: 320x700, 390x844, desktop 1280x720 and tablet landscape; physical touch drag and pointercancel, keyboard-only lesson, focus/scroll, Leave/re-entry, rotation, muted/reduced-motion. The human gate is completion of an early pattern with no adult explanation.

## C12A – Three distinct magical work surfaces

### Desktop 1280x720 composition

- **Left: Crystal Board.** Preserve its 7 columns x 6 rows, real merge/drag feedback, 4-slot safe shelf, Leave/Save and Help. Place small guided text *above* or alongside the board without hiding sockets or intercepting drag events.
- **Upper-right: Resonance Pattern altar.** A physically distinct blue-lilac goal card: chapter/progress, named pattern, *actual identical board crystal art*, required/owned numbers, harmony requirement, and a big **Offer Pattern** action anchored *within this altar*, not among Grow/Harmony/Polish controls.
- **Middle-right: Crystal Growing bed.** Low/Bright/Bell source identities, unlock/selection state, Grow Shard and later Grow Polished/Crystal. In C12 there is **no new charge counter**; reserve visual space for C13 rooted generators to be approved separately.
- **Lower-right: Crystal Tools.** Harmony, Polish, free Brook Wash and Fresh Board; subordinate to the goal/grow loop. Clearly indicate why temporarily unavailable. Keep destructive confirmation and no accidental reset.
- Existing local palette guidance: midnight navy #142944, slate #243f63, bright aqua #9adbea, pale gold #ffe5a0, harmony lilac #e8cffe. These are reference colours from the current UI, not new global tokens. Visuals should be tactile, rounded/faceted and polished rather than developer-menu-like.

### Portrait 390x844 / 320x700

Header with compact Leave/Help → **short illustrated goal altar and embedded Offer** → brief single-step tutorial banner only while active → crystal board with whole first row above fixed shelf → growth/tool sections further down. Keep the seven 48px sockets horizontally scrollable, with native swipe not stealing crystal drag. One-goal recipes should be side-by-side; three-goal finale can wrap its art but keep the 50-of-50 heading legible. Avoid adding a second sticky strip that overlaps the 4-slot shelf.

### Offer readiness exactly matches the rules

When canonical canOfferPattern(state) is true **including harmony cost**, add restrained glow/rim to the altar and Offer button, a "Ready to offer" label and an accessible announcement. When false, show missing counts and an inert Offer without glow, even if crystals look similar. Recalculate after every accepted grow/merge/restore/shelve/wash/harmony/polish/offer. Do not falsely leave the button ready after consumption. On chapter 50, show "Songbook complete – keep growing" rather than pretending another offer exists. Respect global mute, focus retention, reduced motion and performance budgets.

### Device and visual acceptance matrix

Capture: desktop 1280x720, tablet portrait/landscape, phone landscape, 390x844, 320x700, each with first lesson and ready-to-offer; include multi-goal late pattern, completed 50/50, sound-off and keyboard focus. Assert the whole initial board row remains visible above the fixed shelf and 48px hitboxes remain intact. No runtime gameplay rules, save key, Grotto world integration or catalogue changes belong to C12B.

## C13A groundwork – board-rooted producers (still awaiting a later independent gate)

Preferred trial: Low/Bright/Bell crystal beds rooted **on a frame strip physically adjacent to the board** (not inside the 42 mutable cells); each grows a free tier-zero shard and unlocks at 0/4/7 completed offers respectively. Compare against producers occupying 3 board sockets only with actual visual and solver evidence, because reducing 42 available places risks full-board recovery, scroll, 48px targets and progression. A pinned strip or shelf-like structure must not become movable/washable.

C13B can later add finite **advanced-tier bonus** charges and C14 Growth Fluid, but base growth is *always free and unlimited*. Proposed recharge and fluid numbers remain exploratory, and Just Games cannot spend adventure resources. **No recharge, fluid, wallet, save schema, world quest or timer was implemented during C11A/C12A.**

## Implementation, review and ownership gates

C11A/C12A are **design review deliverables**, not proof of actual input gating or new game UI. C11B/C12B implementation should follow human inspection of the concept and real-device preview; then C13A gets its own rooted-generator placement review before irreversible economy/state work. Separate C14 world rewards need independent approval. World draft PR #337 remains unmerged; Pond Leap PR #289 (shared catalogue/Mini Games roadmap) is not modified. H6.9D full six-shard/seven-profile CI and authorised merge remain blocked until final game acceptance.
