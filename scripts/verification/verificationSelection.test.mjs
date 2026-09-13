import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesGlob, selectVerificationOwnership } from './verificationOwnership.mjs';
import { buildVerificationSelection } from './verificationSelection.mjs';

test('ownership glob matching is path-aware and supports recursive globs', () => {
  assert.equal(matchesGlob('src/game/audio/AudioSettings.ts', 'src/game/audio/**'), true);
  assert.equal(matchesGlob('src/style.css', 'src/*.css'), true);
  assert.equal(matchesGlob('src/game/ui/panel.css', 'src/**/*.css'), true);
  assert.equal(matchesGlob('src/game/audio/AudioSettings.ts', 'src/game/input/**'), false);
});

test('audio runtime changes select deterministic audio unit and browser ownership', () => {
  const plan = buildVerificationSelection(['src/game/audio/AudioSettings.ts']);
  assert.equal(plan.changeClass, 'bounded-feature');
  assert.deepEqual(plan.tiers, ['0', '1', '2']);
  assert.deepEqual(plan.owners, ['audio']);
  assert.equal(plan.unitMode, 'selected');
  assert.ok(plan.unitFilters.includes('src/game/audio'));
  assert.deepEqual(plan.unitRelatedFiles, ['src/game/audio/AudioSettings.ts']);
  assert.deepEqual(plan.browserGroups, ['audio']);
  assert.ok(plan.browserTests.includes('tests/play/r6.5-wp19g-mp3-audio-foundation.spec.ts'));
});

test('overlapping settings audio source selects both product contracts without duplicates', () => {
  const plan = buildVerificationSelection(['src/settingsAudioControls.css']);
  assert.equal(plan.changeClass, 'micro-fix');
  assert.deepEqual(plan.owners, ['audio', 'settings-ui-accessibility', 'visual-presentation']);
  assert.equal(plan.runUnit, false);
  assert.equal(plan.runTier2, true);
  assert.ok(plan.browserGroups.includes('audio'));
  assert.ok(plan.browserGroups.includes('settings-ui-accessibility'));
  assert.equal(new Set(plan.browserTests).size, plan.browserTests.length);
});

test('direct Playwright changes select the changed contract rather than a hard-coded WP bucket', () => {
  const file = 'tests/play/r6.5-wp19g-mp3-audio-foundation.spec.ts';
  const plan = buildVerificationSelection([file]);
  assert.equal(plan.changeClass, 'bounded-feature');
  assert.equal(plan.runUnit, false);
  assert.equal(plan.runTier2, true);
  assert.deepEqual(plan.browserTests, [file]);
});

test('direct unit-test changes run the changed unit contract', () => {
  const file = 'src/game/audio/AudioSettings.test.ts';
  const plan = buildVerificationSelection([file]);
  assert.equal(plan.changeClass, 'bounded-feature');
  assert.equal(plan.runUnit, true);
  assert.ok(plan.directUnitTests.includes(file));
  assert.equal(plan.unitMode, 'selected');
});

test('shared and test-infrastructure paths deterministically escalate to full qualification', () => {
  for (const file of ['src/main.ts', 'tests/support/browserDiagnostics.ts', 'scripts/build.mjs']) {
    const plan = buildVerificationSelection([file]);
    assert.equal(plan.changeClass, 'full-qualification', file);
    assert.equal(plan.unitMode, 'full', file);
    assert.deepEqual(plan.browserGroups, ['full'], file);
    assert.equal(plan.runTier3, true, file);
    assert.equal(plan.runTier4, true, file);
  }
});

test('runtime files outside the ownership map fail safe to full qualification', () => {
  const ownership = selectVerificationOwnership(['src/game/new-system/UnknownRuntime.ts']);
  assert.equal(ownership.escalateFull, true);
  assert.match(ownership.escalationReason ?? '', /unmapped runtime\/test ownership/);

  const plan = buildVerificationSelection(['src/game/new-system/UnknownRuntime.ts']);
  assert.equal(plan.changeClass, 'full-qualification');
  assert.equal(plan.unitMode, 'full');
  assert.equal(plan.runTier3, true);
});

test('authoritative full qualification ignores selective shortcuts', () => {
  const plan = buildVerificationSelection(['src/game/audio/AudioSettings.ts'], {
    forceFull: true,
    reason: 'release qualification',
  });
  assert.equal(plan.changeClass, 'full-qualification');
  assert.equal(plan.unitMode, 'full');
  assert.deepEqual(plan.browserGroups, ['full']);
  assert.deepEqual(plan.tiers, ['0', '1', '3', '4']);
  assert.equal(plan.runTier2, false);
  assert.equal(plan.runTier3, true);
  assert.equal(plan.runTier4, true);
});
