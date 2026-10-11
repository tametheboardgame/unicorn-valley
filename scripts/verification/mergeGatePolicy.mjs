export function evaluateMergeGate({
  planResult,
  changeClass,
  plannedHead,
  currentHead,
  requireAuthoritative,
  required,
  outcomes,
}) {
  const failures = [];
  if (planResult !== 'success') failures.push('Verification plan did not succeed.');
  if (!plannedHead || !currentHead || plannedHead !== currentHead) {
    failures.push('Qualification is not for the current exact PR head.');
  }
  if (requireAuthoritative && changeClass !== 'full-qualification') {
    failures.push('Ready-for-review requires authoritative full qualification.');
  }

  for (const [job, isRequired] of Object.entries(required)) {
    const outcome = outcomes[job] ?? 'missing';
    if (isRequired && outcome !== 'success') {
      failures.push(`${job}: required check was ${outcome}, not success.`);
    }
    if (!isRequired && !['skipped', 'success'].includes(outcome)) {
      failures.push(`${job}: unexpected ${outcome} outside the selected plan.`);
    }
  }

  if (
    requireAuthoritative &&
    (!required.tier3 || !required.tier4 || !required.tier1 || !required.smoke || !required.build)
  ) {
    failures.push(
      'Authoritative qualification must include unit, build, smoke, Chromium and compatibility.',
    );
  }

  return {
    passed: failures.length === 0,
    authoritative: changeClass === 'full-qualification' && requireAuthoritative,
    failures,
  };
}
