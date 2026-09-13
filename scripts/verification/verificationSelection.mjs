import { classifyVerification } from './verificationPolicy.mjs';
import { selectVerificationOwnership } from './verificationOwnership.mjs';

export function buildVerificationSelection(files, options = {}) {
  const changedFiles = [...new Set(files.filter(Boolean))].sort();
  let tierPlan = classifyVerification(changedFiles, options);
  let ownership = selectVerificationOwnership(changedFiles, {
    forceFull: tierPlan.changeClass === 'full-qualification',
  });

  if (ownership.escalateFull && tierPlan.changeClass !== 'full-qualification') {
    tierPlan = classifyVerification(changedFiles, {
      forceFull: true,
      reason: ownership.escalationReason ?? 'deterministic ownership fail-safe escalation',
    });
    ownership = selectVerificationOwnership(changedFiles, { forceFull: true });
  }

  const runUnit = tierPlan.runUnit && ownership.unitMode !== 'none';
  const runTier2 = tierPlan.runTier2 && ownership.browserTests.length > 0;

  if (tierPlan.runTier2 && !runTier2) {
    tierPlan = classifyVerification(changedFiles, {
      forceFull: true,
      reason: 'Tier 2 requested but deterministic browser ownership resolved no tests; fail-safe escalation',
    });
    ownership = selectVerificationOwnership(changedFiles, { forceFull: true });
  }

  return {
    ...tierPlan,
    runUnit: tierPlan.changeClass === 'full-qualification' ? true : runUnit,
    runTier2: tierPlan.changeClass === 'full-qualification' ? false : runTier2,
    owners: ownership.owners,
    unitMode: tierPlan.changeClass === 'full-qualification' ? 'full' : ownership.unitMode,
    unitGroups: ownership.unitGroups,
    unitFilters: ownership.unitFilters,
    unitRelatedFiles: ownership.unitRelatedFiles,
    directUnitTests: ownership.directUnitTests,
    browserGroups: ownership.browserGroups,
    browserTests: ownership.browserTests,
    ownershipEscalationReason: ownership.escalationReason,
    unmappedFiles: ownership.unmappedFiles,
    browserGroup:
      tierPlan.changeClass === 'full-qualification'
        ? 'full'
        : ownership.browserGroups.join('+') || tierPlan.browserGroup,
  };
}
