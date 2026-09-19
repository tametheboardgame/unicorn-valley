# Project Status

Last updated: 2026-09-19

## Current work

`R6.5-WP19H2.9 - Story Home & Future Expansion` is active on draft PR #175 / branch
`agent/r6.5-wp19h2-moonflower-cottage`.

H2.0 through H2.8 are human-approved. H2.10 has not started.

## H2.8 acceptance record

David explicitly approved H2.8 on 19 September 2026 after the final decoration-editor input and legacy
overlay cleanup.

The accepted H2.8 result includes:

- four dedicated unplaced starter decorations on fresh and migrated saves;
- the two-panel collection browser with player-facing item groups;
- direct mouse/touch decoration-point activation plus the `Decorate here` contextual action;
- Place / Replace / Move / Remove with correct ownership and persistence;
- exact return position after decoration/style editing;
- item-specific decoration presentation rather than generic coloured blobs;
- rugs below actors without collision and solid freestanding floor items with Y-aware collision;
- removal of the obsolete modal reskin and `COTTAGE DECORATING` overlay that had blocked the rebuilt
  editor's controls.

Two final browser-fixture issues found after human approval were test-contract problems rather than
player-facing regressions. The continuing H2.9 branch now accounts for cottage camera scroll when
activating world markers and seeds test inventory through the active schema checkpoint.

## H2.9 implementation

Runtime candidate: `289c0723e2530f0c0c67524d6c4469fe13bc43f7`.

H2.9 now provides:

- the strange egg bound to the canonical `cottage.egg-nest` semantic anchor instead of a private raw
  cottage coordinate;
- unchanged existing egg growth, inspection and Luma hatch services;
- five explicit future story/display semantic sockets with reservation footprints;
- a protected future portal bay derived from the same semantic-anchor model;
- separate future-expansion reservations and decoration-protection zones so the current egg nest is
  protected from decorating without being incorrectly treated as unused future floor capacity;
- authored decoration-slot validation against protected story/portal capacity;
- Willow and Nova visitor contracts that verify their definitions resolve to semantic visitor anchors;
- an inert architectural treatment for the future portal bay, with no input, destination or fast-travel
  behaviour;
- browser coverage for semantic egg placement/growth/hatching and the non-interactive portal bay.

## Current gate

Exact-head CI run `35448257904` for runtime candidate `289c0723` has passed:

- verification planning;
- formatting, lint, architecture, verification policy and TypeScript;
- project-state contract;
- unit contracts;
- production build;
- static smoke;
- hard performance architecture budget.

All three full Chromium shards and the Chromium/Firefox/WebKit compatibility matrix are currently running.
Cloudflare has deployed the exact runtime candidate successfully.

Immutable preview: https://80fe4e07.unicorn-valley.pages.dev

Stable branch preview: https://agent-r6-5-wp19h2-moonflower.unicorn-valley.pages.dev

## Next work

1. Allow exact-head browser qualification for `289c0723` to finish.
2. Fix only H2.9-owned failures if that matrix exposes any.
3. David performs the H2.9 human gate: check the egg nest/growth/hatch flow, a visitor if available,
   the deliberately inert portal-bay architecture, and that Decorate mode does not expose protected
   story/portal capacity.
4. Do not start H2.10 until H2.9 is explicitly approved.

## Merge gate

PR #175 remains draft and unmerged. Production is unchanged. The complete H2 package must still reach
H2.11 and pass David's final whole-cottage playtest before merge.
