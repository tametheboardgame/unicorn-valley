import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCloseout } from './integrationCloseoutPolicy.mjs';

const full = [
  'docs/work-packages/ENG-WP3.2-DURATION-AWARE-SHADOW-SCHEDULER.md',
  'AGENTS.md', 'PROJECT_STATE.json', 'STATUS.md', 'scripts/verification/shadowShardPlanner.mjs',
];
const assess = (args) => evaluateCloseout({
  number: 315, draft: false, branch: 'agent/eng-wp3-2-shadow-scheduler', files: full, ...args,
});

test('full engineering close-out is accepted with all global integration files updated', () => {
  assert.deepEqual(assess({}).errors, []);
});

test('all global close-out files are mandatory on final engineering package PRs', () => {
  for (const global of ['AGENTS.md', 'PROJECT_STATE.json', 'STATUS.md']) {
    const result = assess({ files: full.filter((p) => p !== global) });
    assert.match(result.errors.join('\n'), new RegExp(global.replace('.', '\\.')));
  }
});

test('fast drafts and earlier PRs are not retroactively blocked', () => {
  assert.equal(assess({ draft: true, files: [] }).enforced, false);
  assert.equal(assess({ number: 312, files: [] }).enforced, false);
});

test('product completion updates own stream state but must not rewrite global status', () => {
  const docs = ['docs/work-packages/MG-WP7-POND-LEAP.md'];
  const result = assess({ branch: 'agent/mg-wp7-pond-leap', files: docs, completedPackages: docs });
  assert.match(result.errors.join(' '), /just-games.json/);
  const good = assess({ branch: 'agent/mg-wp7-pond-leap', files: [...docs, 'docs/streams/state/just-games.json'], completedPackages: docs });
  assert.deepEqual(good.errors, []);
  const story = assess({ branch: 'agent/story-house-title', files: docs, completedPackages: docs });
  assert.match(story.errors.join(' '), /story-house.json/);
});

test('ordinary engineering repairs without bounded completion package do not demand global churn', () => {
  assert.deepEqual(assess({ files: ['scripts/verification/fix.mjs'] }).errors, []);
});
