import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContractInventory } from './contractInventory.mjs';
import { assessSuiteHealth, formatSuiteHealth } from './suiteHealth.mjs';

const provenance = {
  sourceSha: 'a'.repeat(40),
  headSha: 'b'.repeat(40),
  runId: '123',
  shard: 'all/6',
};
const paths = Array.from({ length: 6 }, (_, i) => 'tests/play/health-' + (i + 1) + '.spec.ts');

function fixture() {
  const inventory = buildContractInventory({
    browserSpecs: paths,
    unitSpecs: [],
    browserGroups: { health: paths },
    unitGroups: {},
    ownershipRules: [],
    legacyUnowned: [],
    asOf: '2026-10-12',
  });
  const shards = paths.map((path, index) => ({
    mode: 'execution',
    provenance: { ...provenance, shard: index + 1 + '/6' },
    tests: [{
      file: path,
      identity: 'test-' + index,
      status: index === 0 ? 'skipped' : 'expected',
      durationMs: index === 1 ? 240000 : 200,
    }],
  }));
  const reconciliation = {
    valid: true,
    complete: true,
    provenance,
    discovered: 6,
    recorded: 6,
    shards: 6,
    statuses: { expected: 5, unexpected: 0, flaky: 0, skipped: 1 },
  };
  return { inventory, reconciliation, shards, asOf: '2026-10-12' };
}

test('valid full run reports true skips and slow files, not imagined flakiness', () => {
  const report = assessSuiteHealth(fixture());
  assert.equal(report.valid, true);
  assert.equal(report.summary.observedBrowserSpecs, 6);
  assert.equal(report.summary.actualRuntimeSkips, 1);
  assert.equal(report.summary.slowSpecs, 1);
  assert.equal(report.summary.confirmedRecurringFailureSpecs, 0);
  assert.match(formatSuiteHealth(report), /one run is not proof/);
});

test('legacy unowned warns but new unowned contract blocks', () => {
  const input = fixture();
  function inventory(legacyUnowned) {
    return buildContractInventory({
      browserSpecs: paths,
      unitSpecs: [],
      browserGroups: { health: paths.slice(1) },
      unitGroups: {},
      ownershipRules: [],
      legacyUnowned,
    });
  }
  assert.equal(assessSuiteHealth({ ...input, inventory: inventory([paths[0]]) }).valid, true);
  const report = assessSuiteHealth({ ...input, inventory: inventory([]) });
  assert.equal(report.valid, false);
  assert(report.errors.some((x) => x.code === 'NEW_UNOWNED_BROWSER'));
});

test('missing file, expired quarantine and vanished replacement fail closed', () => {
  const input = fixture();
  const inventory = buildContractInventory({
    browserSpecs: paths,
    unitSpecs: [],
    browserGroups: { health: [...paths, 'tests/play/missing.spec.ts'] },
    unitGroups: {},
    ownershipRules: [],
    lifecycle: {
      [paths[0]]: { status: 'quarantined', reason: 'known flake', expiresOn: '2026-10-01' },
      'tests/play/retired.spec.ts': {
        status: 'replaced',
        reason: 'superseded',
        replacedBy: 'tests/play/not-here.spec.ts',
      },
    },
    asOf: '2026-10-12',
  });
  const report = assessSuiteHealth({ ...input, inventory });
  assert.equal(report.valid, false);
  for (const code of ['MISSING_BROWSER_REFERENCE', 'EXPIRED_QUARANTINE', 'MISSING_REPLACEMENT']) {
    assert(report.errors.some((entry) => entry.code === code));
  }
});

test('missing results, inconsistent SHA, duplicate shards and unknown files reject', () => {
  const input = fixture();
  assert.throws(
    () => assessSuiteHealth({ ...input, reconciliation: { ...input.reconciliation, complete: false } }),
    /incomplete/,
  );
  const mismatched = structuredClone(input);
  mismatched.shards[0].provenance.headSha = 'c'.repeat(40);
  assert.throws(() => assessSuiteHealth(mismatched), /provenance/);
  assert.throws(
    () => assessSuiteHealth({ ...input, shards: [...input.shards.slice(0, 5), input.shards[0]] }),
    /duplicated/,
  );
  assert.throws(() => assessSuiteHealth({ ...input, shards: input.shards.slice(1) }), /six/);
  const unknown = structuredClone(input);
  unknown.shards[0].tests[0].file = 'tests/play/foreign.spec.ts';
  assert(assessSuiteHealth(unknown).errors.some((x) => x.code === 'UNKNOWN_EXECUTED_SPEC'));
});

test('repeated failures require two independently identified historical runs', () => {
  const input = fixture();
  const history = [1, 2].map((id) => ({
    schemaVersion: 1,
    valid: true,
    provenance: { ...provenance, runId: String(id) },
    records: [{ path: paths[2], unexpected: 1, flaky: 0 }],
  }));
  assert.equal(
    assessSuiteHealth({ ...input, history: history.slice(0, 1) })
      .summary.confirmedRecurringFailureSpecs,
    0,
  );
  const twice = assessSuiteHealth({ ...input, history });
  assert.equal(twice.summary.confirmedRecurringFailureSpecs, 1);
  assert(twice.warnings.some((x) => x.code === 'REPEATED_FAILURE_HISTORY'));
  assert.throws(() => assessSuiteHealth({ ...input, history: [history[0], history[0]] }), /Duplicated/);
});
