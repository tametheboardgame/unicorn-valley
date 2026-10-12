/** ENG-WP2.2: draft feedback stays fast; final PRs require a diff-aware review.
 * PR #307 is the rollout boundary. Older PRs must not be retroactively gated.
 */
export const ENFORCE_FROM_PR = 307;
const BLOCK = /<!--\s*TEST_IMPACT_V1\s*([\s\S]*?)\s*END_TEST_IMPACT_V1\s*-->/g;
const AREAS = new Set(['world', 'just-games', 'story-house', 'shared', 'engineering']);
const DISPOSITIONS = new Set(['updated', 'unchanged', 'replaced', 'retired']);
const TEST = /(?:^tests\/|^src\/|^scripts\/).+\.(?:spec|test)\.[cm]?[jt]sx?$/;
const PACKAGE = /^docs\/work-packages\/[^/]+\.md$/;
const PLACEHOLDER = /\b(?:tbc|todo|pending|not reviewed|to be confirmed|n\/a)\b/i;
function meaningful(value, min = 12) {
  return typeof value === 'string' && value.trim().length >= min && !PLACEHOLDER.test(value);
}
export function impactAreasForFile(file) {
  const path = typeof file === 'string' ? file : file.filename;
  if (/^public\/stories\/|^src\/game\/(?:storyhouse|storyHouse|library)\//i.test(path) ||
      /^tests\/play\/(?:sh-|story-|.*story-house)/.test(path)) return 'story-house';
  if (/^src\/game\/minigames\/(?:MiniGameCatalogue|MiniGameLauncher|MiniGameSession)/.test(path) ||
      /^src\/game\/scenes\/(?:SceneKeys|SceneManifest)/.test(path)) return 'shared';
  if (/^src\/game\/(?:minigames|activities|racing)\//.test(path) ||
      /^tests\/play\/(?:mg-|.*(?:chess|pond-leap|rainbow-disc))/.test(path)) return 'just-games';
  if (/^scripts\/|^\.github\/|^tests\/support\/|^package(?:-lock)?\.json$|^playwright.*\.config\./.test(path)) return 'engineering';
  if (/^src\/|^public\/|^tests\/play\//.test(path)) return 'world';
  return null;
}
function requiresReview(files) {
  return files.some((file) => {
    const path = typeof file === 'string' ? file : file.filename;
    const status = typeof file === 'string' ? 'modified' : file.status;
    return impactAreasForFile(file) !== null || (status === 'added' && PACKAGE.test(path));
  });
}
export function parseImpactBlock(body) {
  const matches = [...String(body ?? '').matchAll(BLOCK)];
  if (matches.length !== 1) return { error: 'Expected exactly one TEST_IMPACT_V1 PR-description block.' };
  try {
    const value = JSON.parse(matches[0][1]);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { error: 'Test impact assessment must be a JSON object.' };
    }
    return { value };
  } catch (error) {
    return { error: 'Invalid TEST_IMPACT_V1 JSON: ' + error.message };
  }
}
export function evaluateTestImpact({ number, draft, body, files, fileExists = () => true, readPackage = () => '' }) {
  const errors = [];
  const warnings = [];
  if (!Number.isInteger(number) || number <= 0) {
    return { passed: false, errors: ['Missing PR number; cannot enforce impact review.'], warnings };
  }
  if (number < ENFORCE_FROM_PR) {
    return { passed: true, exempt: true, errors, warnings, summary: 'Existing PR predates WP2.2 rollout.' };
  }
  if (draft) {
    const parsed = parseImpactBlock(body);
    if (parsed.error) warnings.push(parsed.error + ' Provisional drafts may remain incomplete.');
    else if (!['provisional', 'reviewed'].includes(parsed.value.stage)) {
      warnings.push('Draft impact stage should be provisional or reviewed.');
    }
    return { passed: true, provisional: true, errors, warnings, summary: 'Draft preview: no final-stage impact gate.' };
  }
  if (!Array.isArray(files)) {
    return { passed: false, errors: ['Final review requires the cumulative PR file list.'], warnings };
  }
  if (!requiresReview(files)) {
    return { passed: true, errors, warnings, summary: 'No changed application, tests or new work package.' };
  }
  const parsed = parseImpactBlock(body);
  if (parsed.error) return { passed: false, errors: [parsed.error], warnings };
  const review = parsed.value;
  if (review.stage !== 'reviewed') errors.push('Ready-for-review requires stage "reviewed".');
  for (const key of ['scope', 'risk', 'reason', 'evidence', 'reviewedBy']) {
    if (!meaningful(review[key], key === 'reviewedBy' ? 3 : 15)) {
      errors.push('Final assessment needs a specific, completed ' + key + '.');
    }
  }
  if (review.codeReview !== 'reviewed' || review.documentationReview !== 'reviewed') {
    errors.push('Code and documentation reviews must both be marked "reviewed".');
  }
  if (!['accepted', 'not-required'].includes(review.humanAcceptance)) {
    errors.push('Record humanAcceptance as accepted or not-required at finalisation.');
  }
  const expected = [...new Set(files.map(impactAreasForFile).filter(Boolean))].sort();
  const declared = Array.isArray(review.areas) ? [...new Set(review.areas)].sort() : [];
  if (!declared.length || declared.some((area) => !AREAS.has(area))) {
    errors.push('Declare valid affected areas: world, just-games, story-house, shared, engineering.');
  }
  const missing = expected.filter((area) => !declared.includes(area));
  if (missing.length) errors.push('The complete PR diff requires missing area(s): ' + missing.join(', ') + '.');
  if (!DISPOSITIONS.has(review.disposition)) {
    errors.push('Select a reviewed test disposition: updated, unchanged, replaced, retired.');
  }
  const changedTests = files.filter((f) => TEST.test(f.filename ?? f)).map((f) => f.filename ?? f);
  const contracts = Array.isArray(review.contracts) ? review.contracts : [];
  if (!contracts.length || contracts.some((path) => typeof path !== 'string' || !TEST.test(path))) {
    errors.push('Name the reviewed existing/test-changed contract paths in contracts[].');
  }
  for (const path of contracts) {
    if (typeof path === 'string' && !fileExists(path)) errors.push('Reviewed contract is absent from current source: ' + path);
  }
  const notReviewed = changedTests.filter((path) => !contracts.includes(path));
  if (notReviewed.length) errors.push('Modified test contracts missing from assessment: ' + notReviewed.join(', ') + '.');
  if (review.disposition === 'unchanged' && changedTests.length) errors.push('The diff changes tests; disposition cannot be unchanged.');
  if (review.disposition === 'updated' && changedTests.length === 0) errors.push('Disposition updated requires at least one changed test contract.');
  for (const file of files) {
    const path = file.filename ?? file;
    if (file.status !== 'added' || !PACKAGE.test(path)) continue;
    let metadata = '';
    try { metadata = readPackage(path); } catch {
      errors.push('Cannot read newly added work package ' + path + '.');
      continue;
    }
    const match = metadata.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match || !/^test_impact_stage:\s*(?:provisional|reviewed)\s*$/m.test(match[1]) ||
        !/^test_impact_scope:\s*\S.+$/m.test(match[1])) {
      errors.push('New work package ' + path + ' requires test_impact_stage and test_impact_scope front matter.');
    }
  }
  return {
    passed: errors.length === 0, errors, warnings, expectedAreas: expected, changedTests,
    summary: errors.length ? 'Final test-impact review incomplete.' : 'Final PR-wide impact assessment verified.',
  };
}
