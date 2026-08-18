# R3-WP3.9 - Racing Playtest, Recovery and Visual Tightening

Status: **In progress**

Dependencies: R3-WP3.8

## Goal

Validate that the seven-year-old target player can reach, understand, enjoy, finish and replay Rainbow Run with minimal adult intervention, while using real playtest evidence and automated browser playtesting to remove progression blockers, control failures, visual confusion and obvious prototype-scale inconsistencies before R3 is closed.

R3-WP3.9 is deliberately broader than a numerical balance pass. The first target-player sessions showed that navigation, scene layering, interaction flow, input behaviour and visual proportions can prevent a meaningful race playtest even when the underlying race logic is technically correct. Those findings therefore belong to the R3 release gate.

## Working principles

- Fix observed problems before speculative tuning.
- A child should not need an adult to explain a route, recover from a dead control or work around a broken scene.
- Losing must remain safe and rewarding enough to continue.
- Core progression and rewards must never require winning or repeated grinding.
- Automated browser playtests should catch regressions before the target player does.
- Visual refinement should preserve the existing soft pastel aesthetic rather than replace it with a different art direction.
- R3 should finish with a cleaner, more proportionally coherent version of the whole currently playable route, not only the race screen.

## R3-WP3.9A - Meadow Access and Progression Recovery

Status: **Complete** - PR #43

Purpose:

- remove the first blocker found while attempting to reach the race content.

Delivered:

- removed the visible but inert legacy Rainbow Meadow doorway from Moonflower Glade;
- clarified that the intended route is Moonflower Glade -> Sunbeam Village -> Rainbow Meadow;
- preserved the intended connected-world layout rather than adding a teleport workaround.

Acceptance:

- the player is not shown a fake entrance;
- the route towards Rainbow Meadow is understandable from normal exploration.

## R3-WP3.9B - Sunbeam Village Visibility Recovery

Status: **Complete** - PR #44

Purpose:

- fix the player disappearing immediately after entering Sunbeam Village.

Delivered:

- corrected dynamic depth sorting so foundation layers at depths 0-3 cannot be promoted above the player;
- retained normal foreground occlusion for actual scenery;
- added regression coverage for the failure class.

Acceptance:

- the player remains visible after entering Sunbeam Village;
- world floor/background layers cannot hide the player.

## R3-WP3.9C - First Race Control and Balance Recovery

Status: **Complete** - PR #45

Purpose:

- address the first defects found after reaching Nova and the tutorial race.

Delivered:

- reduced Nova's Meadow model to an appropriate player-relative scale;
- returned the player beside Nova after conversation rather than resetting to the Meadow entrance;
- fixed SPACE so `RACE_JUMP` works even though SPACE is also bound to `INTERACT`;
- rebalanced Nova's First Run so a clean jump can win while doing nothing no longer produces an automatic victory;
- retained the guaranteed participation ribbon and non-exclusive progression.

Acceptance:

- jump input works reliably;
- Nova is not wildly out of scale;
- ignoring the tutorial hurdle is not an automatic winning strategy;
- losing does not block progression or the first ribbon.

## R3-WP3.9D - Active Race Control and Finish Flow

Status: **Complete** - PR #47

Purpose:

- make racing an active activity and remove the dead-end result flow.

Delivered:

- removed automatic player forward movement;
- keyboard racing now requires holding Right or D;
- touch/mouse racing provides a hold-to-run control;
- inherited movement keys must be released before a new race can begin moving;
- touch RUN has a global release failsafe;
- Back to Nova receives a high-priority interaction zone after the tutorial finishes;
- Enter, Space and E provide keyboard fallbacks;
- finishing the tutorial returns into Nova's post-race story rather than trapping or dumping the player.

Acceptance:

- no input means the player's racer does not advance;
- holding run advances the racer and releasing it stops active forward control;
- jump still works while running;
- the result screen cannot become a progression dead end.

## R3-WP3.9E - Automated Playtest and Visual Audit Harness

Status: **Complete** - PR #48

Purpose:

- stop relying on the target player to be the first person to discover obvious gameplay, interaction or rendering regressions.

Delivered:

- Playwright/Chromium browser playtests run in CI after normal validation;
- diagnostic-only Phaser inspection bridge;
- scripted coverage for Title, Unicorn Creator, Moonflower Glade, Cottage Interior, Sunbeam Village, Rainbow Meadow and Nova story;
- end-to-end Nova's First Run coverage including idle, run, stop, jump, finish and Back to Nova;
- Sunrise Sprint manual-control coverage;
- screenshots of major visual states;
- checks for invisible/missing players, camera framing, foreground occlusion, suspicious scale, UI/player overlap, off-screen fixed UI, interaction hit-area sanity, runtime errors and scene object-count concerns;
- machine-readable playtest report, CI summary and retained screenshot/failure artifacts.

Baseline result:

- 7/7 browser playtests passed;
- 10 visual states captured;
- 0 hard errors;
- automated visual findings were produced for follow-up rather than ignored.

Acceptance:

- hard gameplay/render failures fail CI;
- non-blocking visual concerns are surfaced as warnings/suggestions;
- future work packages can extend the same automated play library.

## R3-WP3.9F - Automated Findings and Layout Cleanup

Status: **Next**

Purpose:

- clear the concrete visual/layout issues already identified by the first automated audit before broader aesthetic refinement.

Deliverables:

- stop the persistent activity-suggestion card obscuring the player in Sunbeam Village;
- stop the same class of overlap in Rainbow Meadow;
- investigate and correct fixed Sunrise Sprint UI reported outside the logical viewport;
- review the automated screenshots for any closely related spacing, clipping or spawn-composition defects;
- rerun the complete browser playtest and visual-audit suite after fixes.

Acceptance:

- the known player/overlay warnings are resolved rather than suppressed;
- intended race UI remains inside the usable viewport;
- no new progression or input regressions are introduced;
- browser playtests remain green.

## R3-WP3.9G - Visual Tightening Pass

Status: **Planned after R3-WP3.9F**

Purpose:

- keep the current soft, colourful, child-friendly aesthetic while improving proportions, detail, consistency and visual intentionality across the currently playable game.

This is a tightening pass, not the final R6 production-art replacement.

Deliverables:

### Character proportions and consistency

- player-unicorn proportion review at creator, world and race scales;
- NPC scale consistency review, including Nova and all currently repeated characters;
- body/head/leg/horn/mane/tail proportion tightening where silhouettes currently look awkward;
- improve face and feature placement where simple geometry currently reads as accidental rather than stylised;
- ensure characters remain recognisable and readable at normal gameplay scale.

### Environment proportions and detail

- review paths, bridges, doors, buildings, trees, flowers, signs and important props for obvious scale inconsistencies;
- add selective low-cost detail where large flat shapes currently make scenes feel unfinished;
- improve important landmarks so their visual form better communicates what they are;
- retain uncluttered navigation and child-readable silhouettes.

### Race presentation tightening

- review racer size relationships, obstacle proportions, track dressing and finish-line presentation;
- ensure race objects communicate their gameplay role at speed;
- correct decorative elements that visually compete with obstacles, controls or racers.

### Composition and consistency

- review spawn points and camera framing using the automated screenshot set;
- tighten spacing around fixed HUD elements and modal overlays;
- align the visual language of Moonflower Glade, Sunbeam Village, Rainbow Meadow, Cottage Interior and Rainbow Run without flattening their individual identities;
- preserve the existing palette and overall aesthetic unless a specific element demonstrably harms readability.

Acceptance:

- key characters feel intentionally proportioned and consistently scaled across scenes;
- no obviously oversized or undersized major NPC/prop remains without a deliberate reason;
- environments contain more readable detail without becoming visually noisy;
- interactables, landmarks and race obstacles remain clear at gameplay scale;
- the automated screenshot set shows a visibly tighter and more coherent game while still recognisably retaining the established Unicorn Valley aesthetic;
- full automated validation remains green.

## R3-WP3.9H - Final Daughter Racing Playtest and R3 Closeout

Status: **Planned after R3-WP3.9G**

Purpose:

- run the cleanest R3 build through the target-player gate and close the release based on observed behaviour rather than developer assumption.

Playtest targets:

- reach Rainbow Meadow through normal exploration without route coaching;
- understand that racing requires active running plus jumping with minimal adult instruction;
- finish Nova's First Run reliably;
- complete Sunrise Sprint without progression blockers;
- recover from obstacle hits without the race feeling ruined;
- understand the result/reward sufficiently to continue;
- observe whether race length feels too short, appropriate or tiring;
- observe whether Extra help is discoverable/useful if difficulty is encountered;
- observe whether the player voluntarily chooses another race or replay without prompting.

Deliverables:

- final observation notes;
- any evidence-led difficulty, reward or race-length adjustments;
- fixes for any repeated frustration point revealed by the final test;
- final automated browser/visual validation;
- R3 roadmap/status update and transition to R4-WP4.1.

Acceptance:

- the target player can reach and finish a race consistently with minimal adult intervention;
- controls are understandable enough to play rather than merely watch;
- no known progression blocker or dead-end interaction remains in the racing journey;
- losing remains positive and does not restrict core progression;
- voluntary replay is possible but never required;
- the final automated browser suite is green;
- any remaining visual issues are minor enough to defer deliberately to later production-art work rather than being obvious R3 defects.

## R3-WP3.9 completion rule

R3-WP3.9 is complete only after **3.9F, 3.9G and 3.9H** have passed. R4 should not begin merely because the underlying racing code exists.

The release closes when both the automated quality gate and the real target-player gate support the same conclusion: Rainbow Run is understandable, finishable, visually coherent enough for this stage, recoverable when mistakes happen and enjoyable enough that replay can be chosen rather than demanded.
