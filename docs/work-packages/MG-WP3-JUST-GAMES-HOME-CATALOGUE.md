---
id: MG-WP3
title: Just Games Home and Catalogue Experience
status: complete
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

## Completion

MG-WP3 was human-approved on 2026-10-03 after testing the exact Cloudflare preview.

Completed scope includes:

- title/home entry for Just Games;
- catalogue-driven game and variant rendering;
- sandbox launch/return through the shared mini-game platform;
- launch/return coverage across all seven current game families;
- session-aware Back to Games wording;
- sticky click selection with hover-only feedback;
- scalable two-column, paged variant grid for games with many modes;
- browser regression coverage for sticky selection and non-overlapping race-mode layout;
- manifest/scene-key decoupling to avoid the original lazy-load cycle.

The final approval was given after the MG-WP3C interface pass. Subsequent commits before merge were formatting/closeout-only and did not change the approved interaction design.

## Human gate

MG-WP3 human gate: **approved 2026-10-03**.
