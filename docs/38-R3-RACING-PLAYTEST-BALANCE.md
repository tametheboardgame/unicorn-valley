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

Status: **Complete** - PR #49

Purpose:

- clear the concrete visual/layout issues already identified by the first automated audit before broader aesthetic refinement.

Delivered:

- moved the shared activity-suggestion card to a stable upper-right layout position so it no longer covers the captured player spawn in Sunbeam Village or Rainbow Meadow;
- retained the existing suggestion behaviour, including rotation, acknowledgement and session dismissal;
- identified the Sunrise Sprint off-screen fixed-object warning as camera-fixed speed-streak presentation particles staged beyond the right viewport edge;
- changed speed streaks so they become visible only while actually intersecting the logical viewport rather than suppressing the audit finding;
- added named diagnostic anchors for the suggestion card and speed streaks;
- added browser regression tests for Village and Meadow suggestion-card/player separation and Sunrise Sprint off-screen streak visibility.

Validation:

- repository formatting, linting, TypeScript checks, unit tests, production build and static smoke test passed;
- 10/10 Chromium browser playtests passed;
- automated audit result: 0 errors, 0 warnings and 0 suggestions.

Acceptance:

- the known player/overlay warnings are resolved rather than suppressed;
- intended race UI remains inside the usable viewport;
- no new progression or input regressions are introduced;
- browser playtests remain green.

## R3-WP3.9G - Visual Tightening Pass

Status: **Complete** - PR #50

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

Delivered:

- tightened the shared procedural unicorn silhouette so creator, exploration and race textures inherit cleaner head, muzzle, ear, leg, hoof, horn, mane, tail and facial-feature relationships;
- retained deliberate scene-specific display scaling and race squash/stretch animation rather than forcing every character into one static size;
- added a presentation-only visual-tightening layer that decorates existing scenes without changing collision, save data, quests, rewards or controls;
- added cottage window framing, flower boxes, chimney detail, roof texture, stream reeds and Wonderbook-stump growth rings in Moonflower Glade;
- added readable paned windows, flower boxes, façade trim and fountain-water detail in Sunbeam Village;
- added pond ripples/reeds, event-tent trim and physical ribbon shapes around the Rainbow Run hub in Rainbow Meadow;
- added fireplace masonry, mantel candles, bed pillows, sofa structure, tea-table crockery and trophy-shelf pegs inside Moonflower Cottage;
- added restrained track-edge flowers and spectator pennants to both race scenes while keeping the racing line and obstacles visually clear;
- added browser regressions covering the presentation layer in all six target gameplay scenes plus cross-scene unicorn display proportions.

Validation:

- repository formatting, linting, TypeScript checks, unit tests, production build and static smoke test pass;
- the established automated audit reports 10 scenarios, 0 errors, 0 warnings and 0 suggestions;
- the expanded Chromium suite covers 17 browser tests, including six new scene-detail checks and a proportion-consistency check that allows deliberate race squash/stretch.

Acceptance:

- key characters feel intentionally proportioned and consistently scaled across scenes;
- no obviously oversized or undersized major NPC/prop remains without a deliberate reason;
- environments contain more readable detail without becoming visually noisy;
- interactables, landmarks and race obstacles remain clear at gameplay scale;
- the automated screenshot set shows a visibly tighter and more coherent game while still recognisably retaining the established Unicorn Valley aesthetic;
- full automated validation remains green.

## R3-WP3.9H - Final Daughter Racing Playtest and R3 Closeout

Status: **In progress** - target-player findings continue into R3-WP3.9I

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
- identify any final whole-route polish defects that are obvious enough to block R3 closeout.

Acceptance:

- the target player can reach and finish a race consistently with minimal adult intervention;
- controls are understandable enough to play rather than merely watch;
- no known progression blocker or dead-end interaction remains in the racing journey;
- losing remains positive and does not restrict core progression;
- voluntary replay is possible but never required;
- the final automated browser suite is green;
- any remaining visual issues are minor enough to defer deliberately to later production-art work rather than being obvious R3 defects.

## R3-WP3.9I - UI Tidy-up, Alignment and Nova Consistency

Status: **Next**

Dependencies: R3-WP3.9H target-player findings and PR #54 racing-flow recovery

Purpose:

- complete one final evidence-led whole-route tidy-up before R3 closes, addressing concrete presentation, alignment, transition and character-consistency problems exposed by the production daughter playtest rather than deferring obvious defects into R4.

This is a polish/recovery package, not a new feature package. It must preserve the established game structure, progression, rewards, controls and child-friendly visual direction while making the currently playable route feel intentional and internally consistent.

### UI layout and suggestion system

Deliverables:

- standardise the location title so the current place name is centred at the top of exploration scenes;
- move the activity/hint suggestion UI into a predictable top-left safe area where it does not cover the player, important landmarks, NPCs or interaction targets;
- when the suggestion card is dismissed or closed, replace it with a compact star-style button in the top-left corner so suggestions can be reopened deliberately;
- remove transient exploration status boxes such as `Pip is nearby. Explore whenever you are ready.` where they duplicate information without adding a meaningful action;
- move the persistent controls/help information to the bottom-right safe area;
- make controls/help collapsible so it remains available without permanently consuming play space;
- ensure modal dialogue, race UI, inventory controls and suggestion/help UI do not compete for the same screen region;
- preserve touch usability and large child-friendly hit targets.

Acceptance:

- exploration HUD elements occupy stable, predictable screen regions;
- no persistent hint/help box covers the player or a primary world interaction in the normal camera framing;
- dismissed suggestions remain discoverable through the compact star control;
- location name, hints and controls are visually distinct and do not appear scattered around the screen;
- the removed Pip/status text is not required for progression or comprehension.

### World alignment, collision and browser framing

Deliverables:

- tighten the Moonflower Glade bridge walkable/collision area so the unicorn's hooves remain visually supported by the bridge rather than hanging over its edge;
- inspect the bridge approach and camera framing in both travel directions so the visual bridge and walkable route agree;
- locate and remove the reported invisible collision wall in Sunbeam Village at the daughter-playtest position unless it represents a clearly visible physical obstacle;
- correct Moonflower Cottage foreground/layering where the nearby flower is visually buried beneath dirt/path or cottage geometry;
- review nearby cottage/path/flower depth relationships for the same class of defect;
- correct the browser/game centring so the canvas is horizontally centred rather than leaving a visibly larger purple gutter on one side;
- prefer filling the available browser viewport where this can be done without distorting the logical game aspect ratio, unsafe cropping or inconsistent input mapping;
- if full-viewport fill would create unacceptable scaling/cropping, retain aspect-preserving scaling but make the surrounding gutter symmetrical and intentional.

Acceptance:

- the bridge's visible surface and collision/walk area agree at normal play scale;
- no unexplained invisible wall remains at the reported Sunbeam Village location;
- the Moonflower Cottage flower and nearby environment layers read correctly;
- the game is visually centred in the browser at supported desktop sizes;
- any retained letterboxing/gutter is symmetrical rather than obviously offset;
- pointer/touch coordinate mapping remains correct after any scaling change.

### Movement consistency across scene transitions

Deliverables:

- standardise how held movement input behaves when travelling through doors, gates and world transitions;
- choose one predictable transition rule for exploration and apply it consistently rather than allowing some scenes to inherit a held direction while others stop;
- prevent stale key/button state from causing unintended movement immediately after a scene starts;
- retain deliberate continuous movement only where it is clearly beneficial and reliable;
- add regression coverage across representative Glade, Village, Meadow and Cottage transitions.

Acceptance:

- entering equivalent world/door transitions produces the same movement-state behaviour every time;
- a held key cannot create an unexpected uncontrolled movement burst after loading the destination scene;
- keyboard and pointer/touch adapters remain consistent with the chosen rule.

### Nova visual identity and race flow

Deliverables:

- make Nova use one recognisable visual identity in Rainbow Meadow, Nova dialogue and racing;
- use the pink racing-unicorn Nova design as the canonical appearance across those contexts rather than alternating between a purple unicorn, a star token and a different race model;
- replace the star-only Nova dialogue representation with a proper Nova character/portrait treatment derived from the same pink-racer identity;
- ensure scale differences between world/dialogue/race are presentation-only and do not change the character's colours, mane/tail identity or defining features;
- preserve the player's sensible pre-conversation position when returning from Nova dialogue rather than moving the player unexpectedly to one side of Nova;
- make talking to Nova offer an immediate race decision when the current quest/race phase allows it, using clear child-facing copy such as `Do you want to race now?`;
- route a positive choice directly to Nova's First Run or Sunrise Sprint as appropriate while retaining a safe `Not now` path back to exploration;
- keep the physical Rainbow Run start as an equally valid way to begin racing.

Acceptance:

- Nova is immediately recognisable as the same pink unicorn in Meadow, dialogue and race contexts;
- returning from Nova dialogue does not unexpectedly relocate the player away from the interaction position;
- talking to Nova can lead directly into the currently appropriate race without requiring an unnecessary extra walk to the start area;
- declining a race returns cleanly to normal exploration;
- existing quest/ribbon/reward progression remains unchanged.

### Validation and closeout

Deliverables:

- add or extend Playwright regressions for HUD placement, suggestion reopen behaviour, controls collapse, bridge collision alignment, Sunbeam collision recovery, scene-transition input reset and Nova identity/race routing where practical;
- rerun the complete static validation and Chromium browser playtest/audit suite;
- capture updated screenshots of Moonflower Glade, Sunbeam Village, Rainbow Meadow, Nova dialogue and race presentation for final R3 visual review;
- run a final production smoke check after Cloudflare deployment;
- update R3-WP3.9/R3 status and transition to R4-WP4.1 only when this tidy-up and the target-player closeout gate both pass.

Acceptance:

- the currently playable route has no known obvious HUD-placement, bridge-alignment, invisible-collision, transition-input or Nova-identity defect from the final playtest list;
- automated browser validation is green with no new hard findings;
- remaining presentation defects are minor enough to defer deliberately to later production-art work;
- the final production build is suitable to close R3 without requiring adult workarounds for these issues.

## R3-WP3.9 completion rule

R3-WP3.9 is complete only after **3.9F, 3.9G, 3.9H and 3.9I** have passed. R4 should not begin merely because the underlying racing code exists.

The release closes when both the automated quality gate and the real target-player gate support the same conclusion: Rainbow Run and the currently playable route are understandable, finishable, visually coherent enough for this stage, recoverable when mistakes happen and enjoyable enough that replay can be chosen rather than demanded.