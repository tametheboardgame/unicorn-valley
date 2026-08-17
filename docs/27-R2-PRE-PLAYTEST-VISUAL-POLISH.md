# R2-WP2.10A - Pre-Playtest Visual Polish and UX Fix Pass

Status: **In Progress**

## Why this package exists

The first daughter playtest has not happened yet. Before using that playtest as behavioural evidence, the current build needs a short presentation and clarity pass so obvious prototype roughness does not dominate the first impression.

This package is deliberately bounded. It does not add major gameplay systems or expand content. It fixes visible defects, improves the player unicorn and creator presentation, aligns world visuals with collision/navigation, and removes ambiguous UI behaviour.

R2-WP2.10 is therefore split into:

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
- ensure all customisation combinations remain visually valid;
- improve preview framing and scale.

### Creator controls

- align labels, value fields and previous/next arrows consistently;
- specifically correct the marking and accessory rows, whose arrows currently drift away from their values;
- improve spacing and grouping without reducing touch target size;
- keep name entry keyboard-safe and preserve all existing customisation choices.

### World alignment and navigation readability

- align bridge collision/walkable space to the visible bridge so the unicorn cannot appear to stand over open water while mechanically standing on the bridge;
- review player sprite origin/body relationship so feet/ground position reads consistently;
- check Glade paths, entrances, interactables and scene transition approach points for similar visual/physical mismatches;
- review Village and Cottage for the same class of obvious alignment defect.

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
- fix any other obvious presentation defect found during the pass.

### World charm pass

- reduce the most distracting scale inconsistencies in landmark props;
- improve scene depth/readability using existing procedural art rather than beginning the later production-art replacement early;
- add small restrained decorative details only where they materially improve first impression or navigation;
- preserve performance and interaction readability.

## Explicit non-goals

This package must not become R6 early.

Deferred:

- final production unicorn art;
- final environment illustration;
- complete animation replacement;
- new regions;
- new quests or major activities;
- major progression redesign;
- final music/SFX production;
- broad content expansion.

## Deliverables

- title-screen missing-graphic defect removed;
- title-screen layout/presentation polish;
- improved procedural unicorn renderer used consistently in creator and world;
- creator layout/alignment pass;
- bridge and obvious world visual/collision mismatches fixed;
- suggestion-card acknowledgement/close flow;
- exploration HUD spacing/readability pass;
- Glade/Village/Cottage visual consistency sweep;
- regression tests where layout/state logic is testable;
- production build and static smoke validation;
- hosted-build visual smoke check before the daughter playtest.

## Acceptance

- no black/missing decorative graphic is visible on the title screen;
- player unicorn reads as a deliberate, cute unicorn at creator and gameplay scale;
- creator arrows and values are consistently aligned;
- the player cannot visually stand in open water while mechanically using the Glade bridge;
- the suggestion card has an obvious acknowledgement/close path as well as another-idea and hide behaviour;
- no obvious HUD text overlaps at the target desktop layout shown in the pre-playtest screenshots;
- existing progression, inventory, quest, relationship, decorating, save and audio behaviour remains intact;
- `npm run validate` passes;
- R2-WP2.10B can begin with the daughter seeing a materially cleaner first impression.

## Follow-on package

### R2-WP2.10B - Daughter Playtest and Recovery Pass

Dependencies: R2-WP2.10A

Goal:

Use observed child behaviour as design evidence after the obvious presentation defects have been removed.

Deliverables remain those originally planned for R2-WP2.10: structured observation notes, confusion/frustration findings, delight/repetition findings, ranked issues, severe UX/progression fixes and roadmap changes driven by observed preference.
