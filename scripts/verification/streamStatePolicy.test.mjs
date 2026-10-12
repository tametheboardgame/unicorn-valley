import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateStreamFileOwnership, streamFromBranch, validateStreamState, STREAMS } from './streamStatePolicy.mjs';

function record(stream) {
  return {
    schemaVersion: 1, stream, status: 'unclaimed', workPackage: null,
    workPackagePath: null, branch: null, prNumber: null, baseMainSha: null,
    updatedOn: '2026-10-12', note: 'No accepted current package; independent draft PRs retain provisional state.',
  };
}

test('four independent records validate without global active-branch ownership', () => {
  for (const stream of STREAMS) assert.deepEqual(validateStreamState(record(stream), stream), []);
});
test('wrong stream, new fields and malformed dates fail', () => {
  assert.match(validateStreamState(record('world'), 'story-house').join(' '), /disagree/);
  assert.match(validateStreamState({ ...record('world'), unexpected: 1 }, 'world').join(' '), /Unknown/);
  assert.match(validateStreamState({ ...record('world'), updatedOn: 'garbage' }, 'world').join(' '), /date/);
});
test('active record binds one matching stream PR and latest-known main base', () => {
  const working = {
    ...record('just-games'), status: 'in_progress', workPackage: 'MG-WP7',
    workPackagePath: 'docs/work-packages/MG-WP7-POND-LEAP.md',
    branch: 'agent/mg-wp7-pond-leap', prNumber: 289, baseMainSha: 'a'.repeat(40),
  };
  assert.deepEqual(validateStreamState(working, 'just-games'), []);
  assert.match(validateStreamState({ ...working, branch: 'agent/story-house-title' }, 'just-games').join(' '), /namespace/);
  assert.match(validateStreamState({ ...working, prNumber: null }, 'just-games').join(' '), /requires/);
});
test('branch classification accepts existing world/games/story namespaces', () => {
  assert.equal(streamFromBranch('agent/r6.5-wp19h6'), 'world');
  assert.equal(streamFromBranch('agent/mg-wp7-pond-leap'), 'just-games');
  assert.equal(streamFromBranch('agent/story-house-alice-b1'), 'story-house');
  assert.equal(streamFromBranch('agent/eng-wp2-5-parallel-merge-safety'), 'engineering');
});
test('independent stream PRs can touch their own records', () => {
  for (const [branch, path] of [
    ['agent/world-crystal-brook', 'docs/streams/state/world.json'],
    ['agent/mg-wp7-pond-leap', 'docs/streams/state/just-games.json'],
    ['agent/sh-peter-rabbit', 'docs/streams/state/story-house.json'],
  ]) {
    assert.deepEqual(evaluateStreamFileOwnership({ branch, number: 312, files: [path] }).errors, []);
  }
});
test('future product PR cannot change global state or a different stream record', () => {
  const result = evaluateStreamFileOwnership({
    branch: 'agent/mg-wp7-pond-leap', number: 313,
    files: ['docs/streams/state/story-house.json', 'PROJECT_STATE.json', 'STATUS.md'],
  });
  assert.equal(result.errors.length, 3);
  assert.equal(evaluateStreamFileOwnership({
    branch: 'agent/sh-title', number: 289, files: ['PROJECT_STATE.json'],
  }).errors.length, 0);
});
test('shared registration and generated catalogue surfaces prompt ownership review', () => {
  const result = evaluateStreamFileOwnership({
    branch: 'agent/world-new-game', number: 315,
    files: ['src/game/minigames/MiniGameCatalogue.ts','public/stories/catalogue.json'],
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 2);
});
