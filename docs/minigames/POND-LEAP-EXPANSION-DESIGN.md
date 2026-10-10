# Pond Leap Expansion Design

Programme: **MG-WP7 — Pond Leap expansion**

Status: **approved roadmap direction / implementation design**

Canonical game ID: `pond-leap`

Canonical gameplay scene: `PondLeapActivityScene`

World home: **Rainbow Meadow pond**

## Product objective

Turn Lily Pad Leap from one fixed five-hop timing sequence into a small replayable timing game while preserving the quality that makes the current version work: the player watches one visible meter and presses one obvious **LEAP** action.

WP7 should add depth through course patterns, readable timing assistance and distinct play goals, not by adding control complexity.

## Current implementation audit

The existing game already has several good foundations:

- one canonical scene shared by world and Just Games;
- touch and keyboard call the same leap action;
- a visible moving marker and green target zone;
- five progressively tighter/faster hops;
- clear splash feedback;
- a forgiving same-pad retry after a miss;
- a clear completion overlay and replay action;
- no adventure progression side effects.

The main limitations are:

1. every run uses the same fixed pad layout and timing sequence;
2. difficulty changes are hidden rather than player-selected;
3. course geometry and timing rules are hard-coded into scene arrays;
4. the only replay goal is perfect versus non-perfect;
5. there is no relaxed practice loop or deliberately challenge-oriented loop.

## Core gameplay model

Every Pond Leap mode uses the same simple skill loop:

1. **Read** the next lily pad and visible green timing zone.
2. **Watch** the marker sweep.
3. **Leap** with touch, Space or Enter.
4. **Land or splash** according to the exact visible timing window.
5. **Recover quickly** and continue according to the current mode rules.

There is no hidden spatial aim and no separate touch versus keyboard rules path.

## Timing assistance

Player-facing timing profiles:

### Relaxed

- slower marker sweep;
- wider green zone;
- intended for younger/new players and Practice Pond;
- misses still count as misses.

### Standard

- default current-style timing feel;
- moderate sweep speed and target width.

### Quick

- faster sweep;
- narrower green zone;
- intended for repeat play and Ripple Rush;
- no hidden catch-up or forced success.

Assistance modifies only visible/readable timing parameters.

## Course model

Course definitions should own:

- stable course ID and child-facing title;
- pad positions / visual pattern;
- timing-centre sequence;
- per-hop base tolerance;
- per-hop speed progression;
- optional presentation accent;
- challenge length where a mode needs more than the default five hops.

Initial course direction:

### Sunny Steps

The closest successor to the current course.

- broad left-to-right crossing;
- alternating high/low pads;
- moderate timing-centre movement;
- best first course.

### Reed Weave

- more pronounced vertical zig-zag;
- timing centres move more strongly from left to right;
- visually framed by reeds/ripples;
- medium difficulty.

### Twinkle Trail

- tighter visual rhythm and quicker later hops;
- target centres vary more dramatically;
- intended for confident repeat play.

Exact coordinates may be tuned in browser/human review, but all courses must remain readable in the 1280 x 720 logical viewport.

## Modes

### Classic Crossing

The default world-compatible mode.

- cross five successful hops;
- miss = splash + immediate retry on the same pad;
- no fail state;
- selectable Relaxed / Standard / Quick help;
- completion records splashes and perfect crossing for the current run.

This preserves the current game's forgiving identity.

### Practice Pond

A bounded practice mode rather than endless play.

Initial shape:

- 10 leap attempts;
- no run failure;
- successful leaps build a streak;
- misses reset the current streak but continue;
- visible best-this-visit streak;
- player may choose assistance/course pattern.

The purpose is learning the rhythm and improving timing without pressure.

### Ripple Rush

A short challenge run.

Initial shape:

- 8 successful hops through a challenge pattern;
- timing tightens/speeds up in visible steps;
- the player has a clear splash allowance, initially 3;
- exceeding the allowance ends the run with an encouraging result;
- completion reports clean hops, splashes and best streak for the visit.

Ripple Rush must feel tense but never arbitrary. The visible timing zone remains the source of truth.

## World and Just Games integration

Rainbow Meadow remains the physical home.

- world pond interaction launches **Classic Crossing** directly;
- existing world placement, frog identity and return target remain unchanged;
- Just Games may expose Classic / Practice / Ripple Rush as variants if that improves direct access;
- in-scene **Modes** navigation should allow switching without returning to the catalogue;
- every mode uses `PondLeapActivityScene`.

If no variant ID is supplied, the scene must default safely to Classic Crossing for backward compatibility.

## Input contract

### Touch / pointer

- one large LEAP button remains the primary action;
- course/mode/help buttons must meet normal touch-target sizing;
- no drag gesture is introduced.

### Keyboard

- Space / Enter = leap;
- menu choices use the normal button/navigation conventions;
- Escape = explicit context-safe exit.

### Stylus

Stylus follows pointer/touch behaviour with no separate rules path.

## Presentation principles

- keep the rounded bright activity shell;
- keep the frog and lily pads as the visual focus;
- do not add a whole-screen dark/shadow overlay;
- highlight the next destination pad subtly so route progression is obvious;
- splash feedback should finish quickly enough that a miss does not feel like punishment;
- show the selected mode/course/help in compact text rather than long instructions;
- mode rules should fit in one short sentence plus visible counters;
- result overlays should provide direct replay/change-mode actions.

## Progress and records

WP7 adds no adventure progression, Shimmer, inventory, quests or unlock gates.

Default records are session-local:

- current splashes;
- current/best streak;
- current course result;
- best-this-visit challenge streak/result.

Durable records remain out of scope unless later added through an isolated mini-game record namespace.

## Automated qualification

Add deterministic coverage for:

- timing assistance profile maths;
- course/pattern sequencing;
- Classic same-pad retry;
- Practice streak reset/continuation;
- Ripple Rush splash allowance and completion/failure;
- default/backward-compatible launch;
- world launch/return;
- Just Games launch/return;
- touch-equivalent and keyboard leap path;
- result/replay/mode navigation;
- representative small-screen containment.

Prefer deterministic rule helpers over browser tests that depend on sampling a moving marker at exactly the right frame.

## Human acceptance

A child-facing preview is mandatory before merge.

Judge:

- is the leap moment obvious without adult explanation;
- is the green window readable;
- does Relaxed help without feeling fake;
- do the three courses feel meaningfully different;
- does Practice feel safe for experimentation;
- does Ripple Rush feel exciting rather than punishing;
- is splash recovery quick;
- are results/replay controls obvious;
- does the child choose to play another run.
