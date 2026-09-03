# Project-wide Acceptance Gates

These gates apply across bounded work packages unless an explicitly approved package changes them.

## Baseline preservation

- No unintended regression against the accepted baseline in `PROJECT.md` and `STATUS.md`.
- Protected gameplay, save, child-UX and release invariants remain intact unless the package explicitly owns changing them.

## Technical correctness

- Required format/lint/type/test/build/performance/smoke checks pass.
- Browser playtest and compatibility checks pass where required by CI.
- New durable rules or state transitions receive objective automated coverage where practical.
- No known progression blocker is introduced.

## Child UX and accessibility

- Essential controls and exits are understandable.
- Touch targets remain safe and usable on supported mobile/tablet layouts.
- Required instruction does not depend on excessive reading.
- Errors and failed actions are recoverable and clearly signalled.
- Reduced-motion, assistance and other established accessibility behaviour is preserved where relevant.

## Human/product acceptance

Technical completion and human acceptance are separate states.

Where a package specifies a visual, playtest, product or release gate:

- CI success does not automatically release the gate;
- the human acceptance state must be recorded explicitly;
- dependent work must respect the gate unless it is genuinely independent and authorised by the roadmap.

## Compatibility and persistence

- Supported browser behaviour remains within the established compatibility contract.
- Versioned local saves continue to load correctly.
- Schema changes require deliberate migration/backwards-compatibility handling.

## Performance

- Existing performance budgets remain satisfied.
- New ambient life/content must not create avoidable mobile performance regressions.

## Safety and product boundaries

- No adverts, payments, public chat/profiles or FOMO mechanics.
- No new external data collection or secret-bearing integration without an approved security/product review.

## Delivery quality

- Scope remains bounded to the approved work package.
- Material decisions are recorded durably.
- `STATUS.md` and `PROJECT_STATE.json` reflect repository reality at meaningful checkpoints.
- The next capable agent can resume without hidden conversational context.
- Production deployment is not performed without explicit current authorisation.
