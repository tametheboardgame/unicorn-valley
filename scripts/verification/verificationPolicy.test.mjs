import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { classifyVerification } from './verificationPolicy.mjs';
import { selectTier3Matrix } from './tier3Matrix.mjs';

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

test('bounded Tier 3 matrix retains six static shards and the aggregate Merge Gate', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const tier3 = workflow.split('\n  tier3:\n')[1]?.split('\n  tier4:\n')[0];
  const selection = workflow.split('\n  tier3-execution-plan:\n')[1]?.split('\n  tier3:\n')[0];
  assert.ok(tier3, 'Tier 3 job must remain');
  assert.ok(selection, 'A source-checked matrix selector is mandatory');
  const fallback = selectTier3Matrix({
    sourceSha: 'a'.repeat(40), headSha: 'b'.repeat(40),
    runId: '123', canary: false,
  });
  assert.equal(fallback.mode, 'static6');
  assert.deepEqual(fallback.matrix.include.map((row) => row.shard), [1, 2, 3, 4, 5, 6]);
  assert.ok(fallback.matrix.include.every((row) => row.total === 6 && row.mode === 'static6'));
  const shardRef = '${{ matrix.shard }}';
  assert.ok(tier3.includes('matrix: ${{ fromJSON(needs.tier3-execution-plan.outputs.matrix) }}'));
  assert.ok(tier3.includes('needs: [plan, tier0, tier1, tier3-execution-plan]'));
  assert.ok(tier3.includes('name: Tier 3 - full Chromium (' + shardRef + '/6)'));
  assert.ok(tier3.includes("if: matrix.mode == 'static6'"));
  assert.ok(tier3.includes('run: npm run test:play -- --shard=' + shardRef + '/6'));
  assert.ok(tier3.includes("if: matrix.mode == 'manifest6'"));
  assert.ok(tier3.includes('name: tier3-chromium-' + shardRef + '-of-6'));
  assert.ok(tier3.includes('fail-fast: false'));
  assert.ok(tier3.includes('timeout-minutes: 45'));
  assert.ok(selection.includes('needs: [plan, tier0, test-discovery]'));
  assert.ok(selection.includes('github.event.pull_request.number == 316'));
  const gate = workflow.split('\n  merge-gate:\n')[1];
  assert.ok(gate, 'Merge Gate must remain present');
  assert.match(gate, /^\s+needs: \[.*\btier3\b.*\]$/m);
  assert.ok(gate.includes('RESULT_TIER3: ${{ needs.tier3.result }}'));
});
