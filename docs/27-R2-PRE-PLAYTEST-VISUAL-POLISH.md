# R2-WP2.10A - Pre-Playtest Visual Polish and UX Fix Pass

Status: **Complete**

## Why this package exists

The first daughter playtest has not happened yet. Before using that playtest as behavioural evidence, the current build needed a short presentation and clarity pass so obvious prototype roughness would not dominate the first impression.

This package is deliberately bounded. It does not add major gameplay systems or expand content. It fixes visible defects, improves the player unicorn and creator presentation, aligns world visuals with collision/navigation, and removes ambiguous UI behaviour.

R2-WP2.10 is split into:

- **R2-WP2.10A - Pre-Playtest Visual Polish and UX Fix Pass**
- **R2-WP2.10B - Daughter Playtest and Recovery Pass**

R3 remains blocked on completion of R2-WP2.10B.

## Goal

Make the existing R2 vertical slice look coherent, cute, readable and intentional enough that the first child playtest measures enjoyment and comprehension rather than reacting primarily to obvious visual defects.

## Confirmed issues from pre-playtest review

### Title screen

- remove the growing/shrinking black square caused by the current decorative sparkle asset path/rendering;
- replace it with a dependable in-engine magical focal graphic;
- improve composition so the screen feels like a game title screen rather than a framed prototype panel;
- improve hierarchy for Continue, Change my unicorn, Start over and current-location status;
- retain large, readable controls and persistent sound access.

### Player unicorn and creator preview

- rework the procedural unicorn silhouette so it reads as one coherent cute character rather than assembled geometric parts;
- improve head/body proportion, leg placement, eye/face placement and grounding;
- correct mane, tail, horn, marking and accessory anchors;
- ensure customisation combinations remain visually coherent;
- improve preview framing and scale.

### Creator controls

- align labels, value fields and previous/next arrows consistently;
- specifically correct the marking and accessory rows, whose arrows previously drifted beyond the intended layout;
- improve spacing and grouping without reducing touch target size;
- keep name entry keyboard-safe and preserve all existing customisation choices.

### World alignment and navigation readability

- align bridge collision/walkable space to the visible bridge so the player centre can no longer travel into the oversized invisible crossing gap;
- preserve the existing player physics model rather than introduce a risky global origin change;
- review Glade paths, entrances, interactables and scene transition approach points for similar obvious mismatches;
- review Village and Cottage presentation for the same class of issue.

### Suggestion card UX

- add a clear positive acknowledgement/close action;
- retain the ability to request another suggestion;
- retain a low-pressure way to hide suggestions for the current session;
- avoid wording where every visible option feels like a rejection;
- ensure dismissing a card never changes gameplay progress or penalises the player.

### HUD and general UI

- remove text overlaps and cramped top-left composition;
- improve spacing between location title, control help and suggestion card;
- keep Bag and Sound controls consistent with the shared storybook skin;
- review button padding, borders, shadows, typography and alignment across the existing R2 screens;
- fix other obvious presentation defects found during the pass.

### World charm pass

- reduce the most distracting scale inconsistencies in landmark props;
- improve scene depth/readability using existing procedural art rather than beginning the later production-art replacement early;
- add restrained decorative detail only where it improves first impression or navigation;
- preserve performance and interaction readability.

## Explicit non-goals

This package does not become R6 early.

Deferred:

- final production unicorn art;
- final environment illustration;
- complete animation replacement;
- new regions;
- new quests or major activities;
- major progression redesign;
- final music/SFX production;
- broad content expansion.

## Implementation result

The pass delivered:

- replacement of the title-screen SVG decoration with an in-engine sparkle/halo treatment, removing the black-square failure mode;
- tighter title composition and clearer primary/secondary action hierarchy;
- a rebuilt procedural unicorn silhouette with improved body/head proportions, four readable legs, muzzle/ear detail, grounding shadow and cleaner mane/tail presentation;
- corrected horn, marking and accessory anchors;
- creator preview and control-panel polish, including compact Horn, Marking and Accessory rows that remain within the 1280-pixel logical canvas;
- Glade bridge collision narrowed to the visible 190-pixel bridge deck instead of the previous oversized invisible crossing gap;
- a clearer suggestion-card flow with **Got it!**, close, **Another idea** and **Hide ideas for now** actions;
- Glade HUD spacing/readability improvements and a reduction in the oversized foreground-flower distraction;
- lighter Village/Cottage HUD consistency adjustments;
- removal of the obsolete title SVG preload path.

## Validation

Full repository validation passes:

- formatting;
- lint, with non-blocking existing/recommended style warnings only;
- TypeScript type-check;
- unit tests;
- production build;
- static output smoke test.

The hosted build still requires the normal post-merge visual glance before it is handed to the daughter, because automated build validation cannot judge subjective appearance.

## Acceptance

- no black/missing decorative graphic is used by the title screen;
- the player unicorn is represented by the rebuilt coherent procedural renderer at creator and gameplay scale;
- creator arrows and values remain inside the intended layout and align consistently;
- Glade bridge collision now matches the visible bridge deck width in the crossing direction;
- the suggestion card has an obvious acknowledgement/close path as well as another-idea and session-hide behaviour;
- the cramped Glade HUD composition shown in the pre-playtest screenshot has been spaced out;
- existing progression, inventory, quest, relationship, decorating, save and audio behaviour remains intact under full validation;
- R2-WP2.10B can begin after the deployed visual build receives its final glance.

## Follow-on package

### R2-WP2.10B - Daughter Playtest and Recovery Pass

Dependencies: R2-WP2.10A

Goal:

Use observed child behaviour as design evidence after the obvious presentation defects have been removed.

Deliverables remain those originally planned for R2-WP2.10: structured observation notes, confusion/frustration findings, delight/repetition findings, ranked issues, severe UX/progression fixes and roadmap changes driven by observed preference.
