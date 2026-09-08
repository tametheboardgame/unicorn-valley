# Managed Codex delivery

Authorised by David on 8 September 2026: the project manager breaks down and dispatches approved work through GitHub, checks the result, and reports each completed package with a game preview for David to inspect.

## Working loop

- Use the approved remediation plan and current repo state. One active implementation package at a time unless explicit dependencies allow independent work.
- Prepare one bounded branch/draft PR and a precise Codex task comment. Record its comment/task link; do not confuse dispatch with confirmed execution.
- Codex implements, tests and updates status on that branch. The manager examines the diff, relevant tests, CI on the current commit, review findings and Cloudflare preview deployment. Send bounded corrections when necessary, avoiding duplicate task triggers.
- Remain within the approved package. Preserve save compatibility and the accepted game/UI invariants. Future generated-art and child-UX gates remain human decisions.
- Report each completed package once with what changed, actual validation and remaining limitations, PR link, verified immutable game-preview link for that commit, and a short targeted check for David. Do not invent a preview URL or describe a docs-only preview as a completed feature.
- A coding task finishing is not enough to declare the package complete. Report a blocked or test-failing result accurately and request only essential input.
- Continue eligible approved work only when dependencies and required acceptance are satisfied. Under UV-D013, the manager may accept, merge and deploy technically qualified dependency-ready packages; workers still stop at any task-specific delivery boundary. This delegated manager acceptance is not physical human acceptance. Do not start R7 before the human-only WP18H replay and WP17 readiness decision.

## First dispatch: R6.5-WP19A

Use `docs/work-packages/R6.5-WP19A-PERSISTENCE-SAFETY.md`, audit A09/A10 and the approved plan. Fix guarded storage reads and committed-result propagation for purchase/collection/rewards. Preserve authoritative checkpoint semantics and future-save protection. Add meaningful fault regressions and run required validation. Keep the known unrelated browser failures separately evidenced; do not weaken assertions or claim a full green suite.

Implementation branch: `agent/r6.5-wp19a-persistence-safety`. It is stacked on `agent/r6.5-whole-game-audit-plan` while documentation PR #159 remains unmerged. Do not change the planning PR's code, merge it, or deploy production as part of this task.

## Background supervision

Completion is a semantic condition involving task results, CI and preview deployment. Supported GitHub webhook events do not include CI/deployment completion or edited bot comments, so an hourly condition check covers the whole handoff. Notify on newly reviewable packages or actionable blockers, not every check. Never automatically reissue an unacknowledged task without first establishing its state. Respect tool access failures and the existing human gates.
