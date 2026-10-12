import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateTestImpact, impactAreasForFile, parseImpactBlock } from './testImpactPolicy.mjs';

const changed = [
  { filename: 'src/game/activities/PondLeapActivityScene.ts', status: 'modified' },
  { filename: 'tests/play/mg-wp7-pond-leap.spec.ts', status: 'modified' },
];
const completed = {
  stage: 'reviewed',
  scope: 'Review revised Pond Leap gameplay and Just Games integration',
  risk: 'Player input and safe world return after repeated attempts',
  areas: ['just-games'],
  disposition: 'updated',
  contracts: ['tests/play/mg-wp7-pond-leap.spec.ts'],
  reason: 'Updated the existing Pond Leap contract to match the approved activity',
  evidence: 'Checked representative launch, completion and return interactions',
  reviewedBy: 'Engineering reviewer',
  codeReview: 'reviewed',
  documentationReview: 'reviewed',
  humanAcceptance: 'accepted',
};
const body = (value) =>
  '<!-- TEST_IMPACT_V1\n' + JSON.stringify(value) + '\nEND_TEST_IMPACT_V1 -->';
const evaluate = (options = {}) =>
  evaluateTestImpact({
    number: 307,
    draft: false,
    body: body(completed),
    files: changed,
    fileExists: () => true,
    ...options,
  });

test('draft PRs permit unfinished provisional reviews', () => {
  assert.equal(evaluate({ draft: true, body: '' }).passed, true);
  assert.equal(evaluate({ draft: true, body: body({ stage: 'provisional' }) }).passed, true);
  assert.equal(evaluate({ draft: true, body: 'broken impact block' }).passed, true);
});
test('old PRs are not retroactively blocked', () => {
  assert.equal(evaluate({ number: 289, body: '', draft: false }).exempt, true);
});
test('substantive final PRs require exactly one complete review', () => {
  assert.equal(evaluate({ body: '' }).passed, false);
  assert.match(
    evaluate({ body: body({ stage: 'provisional' }) }).errors.join(),
    /stage "reviewed"/,
  );
  assert.match(parseImpactBlock(body(completed) + body(completed)).error, /exactly one/);
});
test('completed changed-test review passes with real areas and contract paths', () => {
  assert.deepEqual(evaluate().errors, []);
});
test('cosmetic-only change can justify keeping existing tests', () => {
  const review = {
    ...completed,
    areas: ['world'],
    disposition: 'unchanged',
    contracts: ['tests/play/r6.5-wp19f-ui-consistency.spec.ts'],
    reason: 'Only building colour changed; existing visual and interaction contracts remain valid',
  };
  const result = evaluate({
    files: [{ filename: 'src/style.css', status: 'modified' }],
    body: body(review),
  });
  assert.equal(result.passed, true, result.errors.join('\n'));
});
test('incorrect area and missing changed test are both rejected', () => {
  const bad = evaluate({
    body: body({
      ...completed,
      areas: ['world'],
      contracts: ['tests/play/unrelated.spec.ts'],
    }),
  });
  assert.ok(bad.errors.some((error) => error.includes('missing area')));
  assert.ok(bad.errors.some((error) => error.includes('Modified test contracts missing')));
});
test('false unchanged, placeholder and absent test all fail', () => {
  const bad = evaluate({
    body: body({ ...completed, disposition: 'unchanged', evidence: 'TBC', reason: 'pending' }),
    fileExists: () => false,
  });
  assert.match(bad.errors.join(' '), /cannot be unchanged/);
  assert.match(bad.errors.join(' '), /completed evidence/);
  assert.match(bad.errors.join(' '), /absent from current source/);
});
test('new work packages require stage metadata but old ones do not', () => {
  const added = { filename: 'docs/work-packages/NEW-WP.md', status: 'added' };
  const bad = evaluate({ files: [added], readPackage: () => '---\nid: NEW-WP\n---' });
  assert.match(bad.errors.join(' '), /requires test_impact_stage/);
  const good = evaluate({
    files: [added],
    body: body({
      ...completed,
      disposition: 'unchanged',
      reason: 'This planning-only package does not change executable behaviour',
    }),
    readPackage: () =>
      '---\nid: NEW-WP\ntest_impact_stage: reviewed\ntest_impact_scope: Scene review completed\n---',
  });
  assert.equal(good.passed, true, good.errors.join('\n'));
});
test('documentation-only PRs need no gameplay impact gate', () => {
  assert.equal(
    evaluate({ files: [{ filename: 'docs/architecture/README.md', status: 'modified' }], body: '' })
      .passed,
    true,
  );
});
test('source classification separates all three streams and shared platforms', () => {
  assert.equal(impactAreasForFile('public/stories/some-book/book.json'), 'story-house');
  assert.equal(impactAreasForFile('src/game/minigames/MiniGameCatalogue.ts'), 'shared');
  assert.equal(impactAreasForFile('scripts/verification/testImpactPolicy.mjs'), 'engineering');
  assert.equal(impactAreasForFile('src/game/world/CrystalBrookScene.ts'), 'world');
});

test('deliberately retired test must name an existing replacement contract', () => {
  const removed = 'tests/play/mg-old-mode.spec.ts';
  const replacement = 'tests/play/mg-new-mode.spec.ts';
  const review = {
    ...completed,
    disposition: 'retired',
    contracts: [removed, replacement],
    reason: 'The former game mode was replaced by the approved new canonical mode',
  };
  const files = [{ filename: removed, status: 'removed' }];
  const good = evaluate({
    files,
    body: body(review),
    fileExists: (path) => path === replacement,
  });
  assert.equal(good.passed, true, good.errors.join('\n'));
  const bad = evaluate({
    files,
    body: body({ ...review, contracts: [removed] }),
    fileExists: () => false,
  });
  assert.match(bad.errors.join(' '), /existing replacement contract/);
  const falseUpdate = evaluate({
    files,
    body: body({ ...review, disposition: 'updated' }),
    fileExists: (path) => path === replacement,
  });
  assert.match(falseUpdate.errors.join(' '), /Deleting a test requires/);
});

test('new browser test contracts must appear in final assessment of actual PR diff', () => {
  const added = {
    filename: 'tests/play/mg-wp7-new-mode-contract.spec.ts',
    status: 'added',
  };
  const incomplete = evaluate({ files: [...changed, added] });
  assert.equal(incomplete.passed, false);
  assert.match(incomplete.errors.join(' '), /Modified test contracts missing/);
  const completedReview = evaluate({
    files: [...changed, added],
    body: body({
      ...completed,
      contracts: [
        ...completed.contracts,
        'tests/play/mg-wp7-new-mode-contract.spec.ts',
      ],
      evidence: 'Both updated and newly introduced contracts reviewed against the complete PR diff',
    }),
  });
  assert.equal(completedReview.passed, true, completedReview.errors.join('\n'));
});
