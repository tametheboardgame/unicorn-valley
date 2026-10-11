import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { classifyVerification } from './verificationPolicy.mjs';

test('docs-only changes select Tier 0 and project-contract validation', () => {
  const plan = classifyVerification(['docs/architecture/RUNTIME-ARCHITECTURE.md', 'STATUS.md']);
  assert.equal(plan.changeClass, 'docs-only');
  assert.deepEqual(plan.tiers, ['0']);
  assert.equal(plan.runProjectContract, true);
  assert.equal(plan.runTier3, false);
});

test('CSS-only presentation changes stay bounded to fast presentation feedback', () => {
  const plan = classifyVerification(['src/style.css']);
  assert.equal(plan.changeClass, 'micro-fix');
  assert.deepEqual(plan.tiers, ['0', '2']);
  assert.equal(plan.runUnit, false);
  assert.equal(plan.runBuild, true);
  assert.equal(plan.browserGroup, 'presentation-smoke');
});

test('bounded subsystem changes select unit, build/performance and critical browser smoke', () => {
  const plan = classifyVerification(['src/game/audio/AudioSettings.ts']);
  assert.equal(plan.changeClass, 'bounded-feature');
  assert.deepEqual(plan.tiers, ['0', '1', '2']);
  assert.equal(plan.runUnit, true);
  assert.equal(plan.runTier2, true);
  assert.equal(plan.browserGroup, 'critical-runtime-smoke');
});

test('shared state and bootstrap changes automatically escalate to full qualification', () => {
  for (const file of ['src/main.ts', 'src/game/save/SaveService.ts', 'package.json']) {
    const plan = classifyVerification([file]);
    assert.equal(plan.changeClass, 'full-qualification', file);
    assert.equal(plan.runTier3, true, file);
    assert.equal(plan.runTier4, true, file);
  }
});

test('unknown files fail safe by escalating rather than silently skipping', () => {
  const plan = classifyVerification(['runtime-we-do-not-know.xyz']);
  assert.equal(plan.changeClass, 'full-qualification');
  assert.match(plan.reason, /fail-safe escalation/);
});

test('manual/full-WP qualification overrides a bounded change', () => {
  const plan = classifyVerification(['src/style.css'], {
    forceFull: true,
    reason: 'manual full CI',
  });
  assert.equal(plan.changeClass, 'full-qualification');
  assert.deepEqual(plan.tiers, ['0', '1', '3', '4']);
});

test('six-shard Chromium matrix preserves the required aggregate merge gate', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const tier3 = workflow.split('\n  tier3:\n')[1]?.split('\n  tier4:\n')[0];
  assert.ok(tier3, 'Tier 3 workflow block must exist');
  const shardRef = '${{ matrix.shard }}';
  const expected = [1, 2, 3, 4, 5, 6];
  const matrixLine = tier3.match(/^\s+shard: \[([^\]]+)\]$/m)?.[1];
  assert.ok(matrixLine, 'Tier 3 shard matrix must be defined');
  const shards = matrixLine.split(',').map((number) => Number(number.trim()));
  assert.deepEqual(shards, expected, 'Every Chromium shard must be selected exactly once');
  assert.ok(tier3.includes(`name: Tier 3 - full Chromium (${shardRef}/6)`));
  assert.ok(tier3.includes(`run: npm run test:play -- --shard=${shardRef}/6`));
  assert.ok(tier3.includes(`name: tier3-chromium-${shardRef}-of-6`));
  assert.ok(tier3.includes('fail-fast: false'));
  assert.ok(tier3.includes('timeout-minutes: 45'));
  const gate = workflow.split('\n  merge-gate:\n')[1];
  assert.ok(gate, 'Merge Gate must remain present');
  assert.match(gate, /^\s+needs: \[.*\btier3\b.*\]$/m);
  assert.ok(gate.includes('RESULT_TIER3: ${{ needs.tier3.result }}'));
});
