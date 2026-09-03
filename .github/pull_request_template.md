## Work package

- ID:
- Bounded package: `docs/work-packages/...`
- Autonomy: Green / Amber / Red
- Human gate: none / visual / playtest / product / release / other

## Scope

Describe the bounded outcome delivered by this PR.

## Validation

- [ ] `npm run validate`
- [ ] CI `Validate` passes
- [ ] CI `Browser playtest` passes where applicable
- [ ] CI `Browser compatibility` passes where applicable
- [ ] `Validate AI Project Contract` passes

Additional focused validation:

- 

## Acceptance / safety

- [ ] Work remains inside the named package scope.
- [ ] Accepted baseline and invariants are preserved unless this package explicitly changes them.
- [ ] Save/persistence implications have been checked.
- [ ] Mobile/touch implications have been checked.
- [ ] Required human acceptance is recorded separately from technical validation.
- [ ] No Red action such as production deployment is included without explicit authorisation.

## Durable state

- [ ] Material decisions recorded in `DECISIONS.md` if needed.
- [ ] `STATUS.md` reflects the real checkpoint where appropriate.
- [ ] `PROJECT_STATE.json` reflects the real checkpoint where appropriate.
- [ ] Next action/blocker is clear.

## Notes / limitations

List anything the next agent or reviewer needs to know.
