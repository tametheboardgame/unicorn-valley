# Human Playtest Feedback Ledger

Last reconciled: 2026-09-08

Canonical source: `docs/07Z-R6.5-WP17-PLAYTEST-REMEDIATION.md`.

This ledger prevents daughter/user feedback from disappearing during refactors. It distinguishes implemented remediation that still needs a real replay, known open defects, deferred ideas and positive signals that must be preserved.

Status meanings:

- **IMPLEMENTED / REVALIDATE** - remediation exists and automated coverage may exist, but WP18H must confirm the child-facing outcome.
- **OPEN** - known unresolved issue. Do not lose or silently close it.
- **DEFERRED** - daughter-led idea preserved for R7/future planning, not a current blocker.
- **PRESERVE** - positive human evidence that cleanup/future work must not degrade.

## Controls, tablet UX and instructions

| Feedback | Status | Current handling |
| --- | --- | --- |
| Controls were the main problem | IMPLEMENTED / REVALIDATE | WP18A-G + WP18I/J rebuilt and hardened touch presentation; replay required. |
| Race controls obscured track/obstacles | IMPLEMENTED / REVALIDATE | Race control layout/hardening exists; daughter must replay a race. |
| Holding RUN could trigger Chrome long-press/navigation UI on Tab S8 | IMPLEMENTED / REVALIDATE | Gesture suppression/device hardening added; must be checked on the real tablet. |
| Gallop was awkward to use with direction controls | IMPLEMENTED / REVALIDATE | Concept touch composition changed; physical comfort remains a human question. |
| Tap-to-move was easiest/preferred | PRESERVE | First-class control path. WP18K must not demote it. |
| Help/instructions were keyboard/computer-oriented on tablet | IMPLEMENTED / REVALIDATE | Device-appropriate UI/hints changed; child comprehension must be retested. |
| Controls/settings on/off concepts were confusing | IMPLEMENTED / REVALIDATE | Settings/UI presentation changed; revalidate comprehension. |
| Some text was too small | IMPLEMENTED / REVALIDATE | Responsive concept UI/readability passes applied; revalidate on device. |
| Too many competing boxes/buttons, especially top UI | IMPLEMENTED / REVALIDATE | WP18I/J canonical concept shell visually approved by user. |
| Text overflow / button overlap | IMPLEMENTED / REVALIDATE | Responsive matrix and modal remediation added; continue regression coverage. |
| Direct tap vs Talk interaction felt inconsistent | IMPLEMENTED / REVALIDATE | Existing authoritative interaction paths reconciled; daughter replay required. |

## Stability and freezes

| Feedback | Status | Current handling |
| --- | --- | --- |
| Hollow Tree Nook hard freeze | IMPLEMENTED / REVALIDATE | WP18B remediation/regressions; revisit in WP18H. |
| Twinkle and Thread hard freeze | IMPLEMENTED / REVALIDATE | WP18B remediation/regressions; revisit in WP18H. |
| Sunlit Beach Bag open caused world disappearance/freeze | IMPLEMENTED / REVALIDATE | WP18B/E regression coverage; revisit in WP18H. |

## Functional and progression feedback

| Feedback | Status | Current handling |
| --- | --- | --- |
| Echo could not be spoken to | IMPLEMENTED / REVALIDATE | Addressed in functional remediation; verify through real progression. |
| Moonflower Cottage back wall/window collision wrong | **OPEN** | Still reproducible in 2026-09-07 review. Explicitly excluded from WP18I/J and WP18K. Must remain visible before R7 readiness. |
| Decoration placement/removal/bag state was confusing/inconsistent | IMPLEMENTED / REVALIDATE | Functional/modal remediation exists; replay required. |
| Bag exposed only six items/no scalable access | IMPLEMENTED / REVALIDATE | Category/scroll behaviour added; verify with a populated Bag. |
| Food could be collected but not meaningfully used | IMPLEMENTED / REVALIDATE | Food-use behaviour exists; verify child can discover/use it. |
| Bakery purchase success was unclear and encouraged repeat purchases | IMPLEMENTED / REVALIDATE | Purchase feedback remediation exists; replay required. |
| Earnings/reward feedback could be unclear | IMPLEMENTED / REVALIDATE | Reward presentation changed; child comprehension still matters. |
| Maple could not be found while actively questing | IMPLEMENTED / REVALIDATE | Discoverability/root-cause remediation was part of WP18D; verify naturally in replay. |
| Backward tap movement could flicker facing direction | IMPLEMENTED / REVALIDATE | Regression addressed; verify during normal movement. |
| Circle/placeholder/icon forms could appear over/instead of unicorn bodies | IMPLEMENTED / REVALIDATE | Character/world consistency remediation exists; any recurrence is a regression. |

## NPC/world-state consistency

| Feedback | Status | Current handling |
| --- | --- | --- |
| Core NPC could appear in multiple mutually exclusive places/activities | IMPLEMENTED / REVALIDATE | WP18F authoritative presence work; verify through free play. |
| Nova could remain at race while also picnic/cottage, sometimes as symbols | IMPLEMENTED / REVALIDATE | Same presence/body consistency work; recurrence is a regression. |

## Quest clarity and discoverability

| Feedback | Status | Current handling |
| --- | --- | --- |
| Sometimes could not work out what to do because instructions were unclear | IMPLEMENTED / REVALIDATE | New contextual UI/hints approved; daughter replay is authoritative. |
| Pebble-style directions such as “far side of the story house” were unclear | IMPLEMENTED / REVALIDATE | World/quest clarity was part of remediation; verify in context. |
| Sometimes mixed up Unicorn Town and following area | IMPLEMENTED / REVALIDATE | Navigation/location presentation improved; revalidate. |
| Spent most time looking for people, missions and unlocks | PRESERVE | Self-directed quest/search motivation is a core positive behaviour. |

## Visual/world feedback

| Feedback | Status | Current handling |
| --- | --- | --- |
| Whispering Woods was liked but could feel more magical | IMPLEMENTED / REVALIDATE | WP18F visual pass occurred; preserve its liked identity while checking result. |
| Shell Cove did not convincingly read as a cove | IMPLEMENTED / REVALIDATE | World-quality remediation targeted it; revalidate visually. |
| Crystal-area triangles did not read clearly as crystals/stalactites | IMPLEMENTED / REVALIDATE | Crystal readability remediation targeted it; revalidate. |
| Sunbeam Village shops needed stronger place/identity/interior quality | IMPLEMENTED / REVALIDATE | WP18F/place-quality work targeted shops; revalidate. |
| Crystal Brook approach/gateway needed a more convincing path/cave entrance | IMPLEMENTED / REVALIDATE | World-quality remediation targeted the gateway; revalidate. |
| Unicorn neck/mane looked wrong/“too saggy” | IMPLEMENTED / REVALIDATE | Mane/character presentation remediation occurred; revalidate. |
| Pip/some unicorns could read as circles/balls/placeholders | IMPLEMENTED / REVALIDATE | Character presentation remediation occurred; any recurrence is a regression. |

## Daughter-led ideas preserved for future work

These are **not authorised for WP18K**. They are inputs to R7/future prioritisation after WP17 releases readiness.

| Idea | Status |
| --- | --- |
| Unicorn sandcastles at the beach | DEFERRED |
| Interactive mushrooms / attractive environment objects doing something | DEFERRED |
| Deeper usable/eatable food | DEFERRED |
| Temporary food abilities/effects, e.g. a short speed boost | DEFERRED |
| Unicorn Palace unlocked after many good deeds/quests, with king/queen and further problems | DEFERRED |
| Multi-step social events such as preparing/fixing things for a party | DEFERRED |
| Richer recurring friend characters with coherent activities/presence | DEFERRED |

If any deferred idea already has a partial implementation, WP18K must not delete it merely because it is listed as future-facing. Trace usage and preserve working content unless it is demonstrably dead/obsolete.

## Positive signals that must be preserved

| Positive evidence | Status |
| --- | --- |
| Rainbow Meadow appearance was liked | PRESERVE |
| Whispering Woods was liked | PRESERVE |
| Tree Nook was “really cool” | PRESERVE |
| Tree Nook mushrooms were specifically loved | PRESERVE |
| Firefly activity was loved | PRESERVE |
| Fireflies mapping clearly to Star Coins was understood/liked | PRESERVE |
| Earning currency, discovering things and spending money were enjoyable | PRESERVE |
| Questing/unlocking drove most self-directed play | PRESERVE |
| Tap-to-move was independently chosen as easiest | PRESERVE |
| Child said she would play again | PRESERVE |

## Readiness rule

WP18K cleanup may change architecture, ownership and dead code only. It must not erase this evidence. WP18H must update this ledger from the next real daughter replay. R7 stays blocked until WP17 explicitly releases readiness.

## 2026-09-08 additional audit and user-request disposition

The original rows remain historical remediation/replay evidence. These new observations supersede any implication that all creator/layout/prompt work is already satisfactory. See the audit for evidence and the proposal for approval-dependent scope.

- Creator crowding/progressive categories: OPEN, latest user report plus desktop browser confirmation; WP19C proposed.
- Keyboard/tap labels beneath objects: OPEN, Glade label reproduced; WP19D proposed, migrate all actions before removing labels.
- Roaming-resident short speech/engagement consistency: OPEN DESIGN GAP; timed 2.6-second feedback and independent interaction path confirmed in source; WP19D/E proposed.
- All applicable moving residents must expose Talk: VERIFICATION REQUIRED for the full resident inventory; no blanket claim of completion from Nova/Echo fixes.
- Generated title background: REQUESTED / PROPOSED WP19F; existing title is procedural artwork.
- MP3 music/SFX upload workflow: REQUESTED / PROPOSED WP19G/H; existing audio is procedural.
- Grotto/Grove preferred tap navigation: OPEN SOURCE GAP, WP19B proposed; confirm and cover normal input during implementation.
- Save-read failure and false purchase success on storage failure: IMPLEMENTED / TECHNICALLY QUALIFIED in WP19A, awaiting manager closure. Focused tests cover denied reads, checkpoint-less primary failure, throwing post-commit listeners and the three-Shimmer/Berry-Bun failed-write/retry order. Exact-head CI passes all five save-recovery cases, including denied storage. David confirmed that the Berry Bun and unicorn edits persisted after reload; this remains normal-use evidence, not fault injection. The full browser job timed out with unrelated explicit UI failures and is not claimed green; see `docs/evidence/R6.5-WP19A-BROWSER-QUALIFICATION.md`.
- Cottage collision remains OPEN; WP19B owns proposed closure.

No new daughter replay occurred during this audit. Future ideas and all positive preservation requirements above remain unchanged. WP18H now follows the proposed integrated WP19I gate if the plan is approved.

- New-game Map current-location mismatch: OPEN / BROWSER-REPRODUCED. Map marks Cottage during Glade play; audit A16 / proposed WP19B.

### Audit validation addendum, 8 September 2026

Core validation passed 427 tests. Current-release Chromium run: 34 passed, 5 failed, 21 not run. Beach repeated Bag and retired-item checks passed. Nook completed seven full returns before its total-budget timeout; this does not establish a renewed freeze. Twinkle & Thread was skipped by the serial group and remains unverified. Bag tests include stale coordinates/wrappers plus a distinct numerical tablet size failure (A17). Race matrix timed out without a specific proven gameplay defect. Keep human items open for their required replay; see the audit for exact trace evidence and coverage.
