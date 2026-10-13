const SHA = /^[0-9a-f]{40}$/i;

/** A passing old PR head is not qualified if latest main has moved beyond it. */
export function evaluateMergeFreshness({
  targetBranch,
  liveMainSha,
  candidateHeadSha,
  comparison,
}) {
  const failures = [];
  if (targetBranch !== 'main') failures.push('PR must target the integrated main branch.');
  if (!SHA.test(liveMainSha ?? '') || !SHA.test(candidateHeadSha ?? '')) {
    failures.push('Missing live main or candidate PR SHA.');
  }
  if (
    !comparison ||
    !['ahead', 'identical'].includes(comparison.status) ||
    comparison.behind_by !== 0 ||
    comparison.base_commit?.sha !== liveMainSha ||
    comparison.merge_base_commit?.sha !== liveMainSha
  ) {
    failures.push(
      'PR head does not include the latest main; refresh branch and rerun full qualification.',
    );
  }
  return { passed: failures.length === 0, failures };
}
