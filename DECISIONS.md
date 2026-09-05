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
- racing uses lower-left steering and lower-right Jump/Gallop with the track centre kept clear;
- Bag uses category navigation, scrolling inventory, item details and explicit use/eat actions;
- Creator uses a large preview and progressive Main/Colours/Mane & Tail/Horn/Markings/Accessories categories;
- if implementation materially cannot follow this approved direction, stop for user input rather than silently substituting a different layout.
