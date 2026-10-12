import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesGlob, selectVerificationOwnership } from './verificationOwnership.mjs';
import { buildVerificationSelection } from './verificationSelection.mjs';
import { buildContractInventory, inspectContractInventory } from './contractInventory.mjs';

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

test('mini-game platform changes select mini-game unit and browser ownership', () => {
  const plan = buildVerificationSelection(['src/game/minigames/MiniGameSession.ts']);
  assert.equal(plan.changeClass, 'bounded-feature');
  assert.deepEqual(plan.owners, ['mini-games']);
  assert.equal(plan.unitMode, 'selected');
  assert.ok(plan.unitFilters.includes('src/game/minigames'));
  assert.deepEqual(plan.browserGroups, ['mini-games']);
  assert.ok(plan.browserTests.includes('tests/play/mg-wp3-just-games.spec.ts'));
  assert.ok(
    plan.browserTests.includes('tests/play/mg-wp4-mini-game-launch-return-contract.spec.ts'),
  );
  assert.ok(plan.browserTests.includes('tests/play/r6.5-wp14-repeatable-activities.spec.ts'));
});

test('Just Games scene changes select both world-navigation and mini-game contracts', () => {
  const plan = buildVerificationSelection(['src/game/scenes/JustGamesScene.ts']);
  assert.deepEqual(plan.owners, ['mini-games', 'world-navigation']);
  assert.ok(plan.browserGroups.includes('mini-games'));
  assert.ok(plan.browserTests.includes('tests/play/mg-wp3-just-games.spec.ts'));
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

test('WP2.1 inventory reconciles the actual test suite and legacy ownership debt', () => {
  const report = inspectContractInventory(process.cwd(), '2026-10-11');
  assert.deepEqual(report.errors, []);
  assert.ok(report.summary.browser > 100);
  assert.ok(report.summary.unit > 100);
  assert.ok(report.summary.unownedBrowser > 0);
  assert.ok(report.summary.mappedBrowser > 0);
  assert.ok(report.contracts.some((record) => record.smoke));
  assert.ok(report.contracts.some((record) => record.compatibility));
});

test('WP2.1 detects missing references, unowned additions and stale exceptions', () => {
  const audio = 'tests/play/audio.spec.ts';
  const missing = 'tests/play/missing.spec.ts';
  const report = buildContractInventory({
    browserSpecs: [audio, 'tests/play/new-feature.spec.ts'],
    unitSpecs: [],
    browserGroups: { audio: [audio, missing] },
    unitGroups: { audio: [] },
    ownershipRules: [
      {
        id: 'audio',
        sourceGlobs: ['src/game/audio/**'],
        browserGroups: ['audio'],
        unitGroups: ['audio'],
      },
    ],
    smokeSpecs: [missing],
    legacyUnowned: [missing],
    lifecycle: {},
    asOf: '2026-10-11',
  });
  for (const code of [
    'MISSING_BROWSER_REFERENCE',
    'MISSING_PROFILE_REFERENCE',
    'STALE_UNOWNED_BASELINE',
    'NEW_UNOWNED_BROWSER',
  ]) {
    assert.ok(report.errors.some((issue) => issue.code === code), code);
  }
});

test('WP2.1 legacy ownership debt remains visible without silently growing', () => {
  const path = 'tests/play/legacy.spec.ts';
  const report = buildContractInventory({
    browserSpecs: [path],
    unitSpecs: [],
    browserGroups: {},
    unitGroups: {},
    ownershipRules: [],
    legacyUnowned: [path],
    lifecycle: {},
  });
  assert.equal(report.errors.length, 0);
  assert.ok(report.warnings.some((issue) => issue.code === 'LEGACY_UNOWNED_BROWSER'));
  assert.equal(report.summary.unownedBrowser, 1);
});

test('WP2.1 retirement needs replacement and quarantine has an expiry', () => {
  const active = 'tests/play/active.spec.ts';
  const report = buildContractInventory({
    browserSpecs: [active],
    unitSpecs: [],
    browserGroups: { demo: [active] },
    unitGroups: { demo: [] },
    ownershipRules: [
      { id: 'demo', sourceGlobs: [], browserGroups: ['demo'], unitGroups: ['demo'] },
    ],
    lifecycle: {
      [active]: { status: 'quarantined', reason: 'Flaky', expiresOn: '2026-10-10' },
      'tests/play/retired.spec.ts': { status: 'retired', reason: 'Obsolete' },
    },
    asOf: '2026-10-11',
  });
  assert.ok(report.errors.some((issue) => issue.code === 'EXPIRED_QUARANTINE'));
  assert.ok(report.errors.some((issue) => issue.code === 'UNJUSTIFIED_RETIREMENT'));
});
