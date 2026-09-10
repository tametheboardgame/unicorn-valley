# Durable Decisions

This file records project decisions that materially constrain future work. Detailed historical design decisions remain in the existing domain documents under `docs/`; do not duplicate their full history here.

## UV-D001 - Repository state is authoritative

Status: Accepted

Decision:

Essential project state must be recoverable from GitHub. Conversation history is working memory, not the sole source of current requirements or progress.

## UV-D002 - Existing domain documentation remains canonical

Status: Accepted

Decision:

The AI operating spine adds concise navigation and machine-readable state. It does not replace the mature game vision, systems, architecture, UX, art, release and content specifications already under `docs/`.

For R6.5, `docs/07V-R6.5-VALLEY-COMPLETENESS-BREADTH.md` remains the canonical release contract, with its named companion specifications authoritative where applicable.

## UV-D003 - Bounded work packages are the unit of autonomous execution

Status: Accepted

Decision:

Current and future substantial implementation should have a bounded file under `docs/work-packages/` containing stable ID, autonomy, dependencies, scope, non-goals, invariants, acceptance, exact technical validation and human gate.

Legacy package descriptions may remain in historical release documents; the bounded file is the concise execution hand-off for active work.

## UV-D004 - Technical validation and human acceptance are separate

Status: Accepted

Decision:

CI success does not automatically satisfy child-facing visual, playtest or product judgement. These states must be tracked independently.

## UV-D005 - Delivery mode is PR required

Status: Accepted

Decision:

Substantive work is delivered through a package branch and pull request. Existing branch conventions remain valid; new agent-led operating/infrastructure changes use `agent/` branches.

## UV-D006 - R7 remains blocked until the R6.5 human readiness gate

Status: Accepted

Decision:

Do not begin R7-WP7.1 until R6.5-WP17 explicitly confirms that the broadened valley offers enough meaningful choice for daughter-led preference evidence.

## UV-D007 - Production deployment is Red

Status: Accepted

Decision:

Agents may produce deployable builds, but production release/deployment requires explicit current authorisation.

## UV-D008 - Unicorn Valley is the autonomous-execution pilot

Status: Accepted

Decision:

Unicorn Valley is the first live project retrofitted to the AI project operating standard and is the preferred candidate for the subsequent bounded autonomous-continuation and supervised Night Shift experiments, subject to the retrofit passing fresh-agent recovery.

## UV-D009 - Landscape tablet control layout is approved implementation authority

Status: Accepted

Decision:

The four landscape-tablet concepts approved by the user on 2026-09-05 define the implementation layout for WP18C and WP18E. Their high-end 3D rendering is illustrative only; control placement, hierarchy, touch zones, screen occupation and interaction design are authoritative.

The durable specification is `docs/07AA-R6.5-WP18A-APPROVED-TABLET-UX-DIRECTION.md`.

Key constraints are:

- exploration uses lower-left movement, lower-right contextual primary action plus separate Gallop, compact top Map/Bag/Book/Settings access and a bottom-centre hint strip;
- racing uses **RUN lower-left and JUMP lower-right only**. There is no left/right steering mechanic and no separate race Gallop control. RUN must support safe press/hold, RUN + JUMP must work simultaneously, and the track centre stays clear;
- Bag uses category navigation, scrolling inventory, item details and explicit use/eat actions;
- Creator uses a large preview and progressive Main/Colours/Mane & Tail/Horn/Markings/Accessories categories;
- if implementation materially cannot follow this approved direction, stop for user input rather than silently substituting a different layout.

## UV-D010 - Whole-game audit precedes further remediation implementation

Status: Accepted scope instruction, 2026-09-08.

David requested a full analysis of the game/code, reconciliation of daughter feedback and a detailed plan for approval, including generated title art, a clearer creator, contextual-action-only visible instructions, consistent conversations/NPCs and an MP3 audio workflow. This authorises analysis and a reviewable proposal, not automatic implementation or deployment. The resulting proposal is `docs/2026-09-08-REMEDIATION-PROPOSAL.md`; its product decisions were subsequently accepted in UV-D011. Existing approved HUD/Bag/Map/Book history and the WP17/R7 gate remain intact.

## UV-D011 - Remediation plan and documentation publication approved

Status: Accepted, 2026-09-08.

David replied “I approve this” to the completed audit handoff explicitly requesting approval of the plan and authorisation to push the documentation branch/open its draft PR. All six decisions in `docs/2026-09-08-REMEDIATION-PROPOSAL.md` are accepted, including the sequence, contextual visible instructions, compact speech, progressive creator, generated title and two-folder MP3 workflow. WP19A-I are approved within their dependencies; WP19A is the next implementation package. Existing future visual acceptance, daughter replay, WP17 readiness and production gates remain. No merge or deployment is included in this publication approval.

## UV-D012 - WP19A accepted and WP18K released

Status: Accepted, 2026-09-08.

David explicitly approved WP19A closure under its documented bounded browser
qualification, merging and production deployment of PRs #159/#160, and the start
of WP18K. Main `d8f3de6f264fa5fd6e2d77d539a47f288eb50cd4` is the resulting production
baseline. This releases behaviour-preserving WP18K implementation only; WP18K
still requires separate visual-regression sign-off and is not authorised for
merge or production deployment. The approved next package after K is WP19B, not
the superseded direct WP18H exit.

## UV-D013 - Delegated overnight remediation acceptance authority

Status: Accepted, 2026-09-08.

David authorised the approved remediation roadmap to continue overnight. The
manager may accept, merge and deploy technically qualified, dependency-ready
work packages and dispatch the next approved package without routine further
David sign-off. This is delegated **manager acceptance**, not evidence of
physical human or daughter/device acceptance. WP18H's physical Galaxy Tab S8
replay and WP17's final readiness decision remain human-only; R7, unapproved
scope, purchases and unsafe/destructive actions remain prohibited. WP18K's
current correction task remains delivery-only on PR #161: the worker does not
merge, deploy production or start WP19B.

## UV-D014 - Per-package human approval restored

Status: Accepted, 2026-09-09.

David ended the overnight delegation and explicitly restored a human approval
pause at every completed work package. This supersedes UV-D013 for future
acceptance, merge, production deployment and dependency continuation while
preserving its historical record. Codex and the manager may complete bounded
WP18K correction and qualification work on PR #161, but WP18K must then stop for
David's explicit approval. No merge, production deployment, WP19B or R7 work is
authorised before that approval. WP18H's physical Galaxy Tab S8 replay and
WP17's readiness decision remain separate human-only gates.

## UV-D015 - WP18K accepted and WP19B released after production verification

Status: Accepted, 2026-09-09.

David explicitly approved WP18K after reviewing the corrected immutable preview
and authorised its merge and the start of WP19B. PR #161 merged as main
`250f0855f013f4ba54a6de4056181cf5affa0d57`; exact-head CI and contract checks
passed. Cloudflare reports a successful deployment for that merge SHA at
`https://7a667b82.unicorn-valley.pages.dev`. WP19B implementation is released
only after the production alias passes the supported isolated startup, save,
reload and Continue smoke bound to the merge SHA. UV-D014 continues to require
David's explicit approval before WP19B merge, production deployment or WP19C.


## UV-D016 - WP19B accepted and WP19C released after production verification

Status: Accepted, 2026-09-09.

David explicitly approved WP19B after playing its preview and authorised merge
and progression to WP19C. PR #162 merged as main
`c2d98ae3287cc8ab6b2548f5efbf5548b7d87979` from approved head
`fc07a52588a080260303328e65d0a4ce7267d6d7`; its three workflows passed and no
review threads were open. Cloudflare reports successful production deployment
of the merge SHA at `https://39034745.unicorn-valley.pages.dev`. WP19C begins
only after the supported isolated startup/save/reload/Continue smoke passes
against the production alias while checked out at that SHA. David also observed
that some places appear to have two layers of paths; this mild visual issue is
explicitly deferred to the final graphics-specific pass, did not block WP19B,
and is not WP19C scope. No locations or diagnosis are inferred. UV-D014 still
requires David's explicit approval before WP19C merge, production deployment or
WP19D.

## UV-D017 - David-approved WP19C creator concept supersedes the first preview

Status: Accepted implementation authority, 2026-09-09.

David rejected the first WP19C preview's alignment, text behind the unicorn,
small cycling controls and redundant renaming. He then explicitly approved the
concept committed at `docs/design/wp19c-approved-creator-concept.jpg` as the
visual target. Its inner cream/lavender/plum/gold interface, large contained
preview, pencil-only rename entry, separate Colours/Mane/Tail/Horn/Markings/
Accessories categories, direct illustrated cards, swatches and aligned footer
actions supersede UV-D009's old Main plus combined Mane & Tail creator detail.
Only supported cosmetic IDs may be depicted, using the shared appearance
renderer. This approves implementation, not merge, production deployment or
WP19D; David's finished-WP visual gate remains pending.

## UV-D018 - David's WP19C tablet layout feedback is correction authority

Status: Accepted implementation feedback, 2026-09-09.

David accepted the direction but rejected preview `cb1417d6` as finished work.
The four original tablet captures under
`docs/evidence/wp19c-david-layout-feedback/` require bounded WP19C correction:
contained grids, component-only option artwork, clear footer separation,
retirement of legacy preview/name decoration, persistent tab/selection state,
keyboard-accessible pencil renaming and repeat-entry lifecycle safety. This
does not release the visual gate or authorise merge, production or WP19D.

## UV-D019 - David's second WP19C correction expands the supported catalogue

Status: Accepted implementation feedback, 2026-09-10.

David rejected candidate `068f3f4e` after reviewing all six category captures
under `docs/evidence/wp19c-david-20260910/`. WP19C must remove generated-surface
echoes at their lifecycle owner, improve vertical rhythm and component-card
scale, use the selected body colour behind marking art, retain exactly one
adaptive accessible pencil, and polish Randomise/Reset with authored icons.
This feedback explicitly authorises one new save-compatible mane, tail and horn
and one accessory, producing six/six/six/eight actual catalogue choices while
preserving every existing ID. It does not approve merge, production or WP19D.
