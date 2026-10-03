---
id: MG-WP3
title: Just Games Home and Catalogue Experience
status: in_progress
autonomy: amber
depends_on: [MG-WP2]
parallel_safe: false
human_gate: ux-and-regression
---

# MG-WP3 - Just Games Home and Catalogue Experience

## Purpose

Expose the shared mini-game platform through a child-readable **Just Games** entry on the title/home screen after sandbox isolation is proven safe.

Mini-game platform impact: **changed - catalogue access layer**

MG-WP3 began on 2026-10-03 after MG-WP2 was explicitly approved and merged.

## Scope

- add a **Just Games** action to the title/home menu;
- add an on-demand `JustGamesScene`;
- render catalogue-visible game families from `MiniGameCatalogue`;
- provide selectors for catalogue variants such as Rainbow Disc mode and Rainbow Run course;
- launch every game through `MiniGameLauncher` with `source: 'just-games'`;
- return every game to Just Games through `MiniGameSession`;
- support touch and keyboard navigation;
- do not create an adventure save solely to browse or launch sandbox games.

## Invariants

- Just Games is a launcher, not a second gameplay implementation;
- no hard-coded duplicate list of mini-games;
- sandbox policy remains the default;
- world placement/quest rules remain world-owned;
- adding a future catalogue entry should not require bespoke Just Games wiring unless the game has an explicit selector UX.

## Human gate

MG-WP3 is Amber.

Do not merge until every catalogue-visible game can launch, retry and return safely from Just Games on the exact approved preview and David approves the catalogue experience.
