import test from 'node:test';
import assert from 'node:assert/strict';
import { normalisePlaywrightReport, reconcilePlaywrightEvidence } from './playwrightEvidence.mjs';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
const c = 'c'.repeat(40);
const provenance = { sourceSha: a, headSha: b, runId: '1234', shard: '1/2' };

function report(status = 'expected') {
  return {
    suites: [
      {
        title: '',
        suites: [
          {
            title: 'tests/play/example.spec.ts',
            file: 'tests/play/example.spec.ts',
            specs: [
              {
                title: 'shows welcome',
                file: 'tests/play/example.spec.ts',
                line: 7,
                column: 1,
                tests: [
                  {
                    projectName: '',
                    status,
                    expectedStatus: 'passed',
                    results: status === 'skipped' ? [] : [{ status: 'passed', duration: 420 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

test('normalises terminal status and per-file durations', () => {
  const result = normalisePlaywrightReport(report(), provenance);
  assert.deepEqual(result.summary, {
    tests: 1,
    files: 1,
    expected: 1,
    unexpected: 0,
    flaky: 0,
    skipped: 0,
  });
  assert.equal(result.files[0].durationMs, 420);
  assert.equal(result.tests[0].identity.includes('example.spec.ts'), true);
});

test('records deliberate skips instead of silently omitting them', () => {
  const result = normalisePlaywrightReport(report('skipped'), provenance);
  assert.equal(result.summary.skipped, 1);
  assert.equal(result.files[0].skipped, 1);
});

test('rejects empty, malformed and duplicate reports', () => {
  assert.throws(() => normalisePlaywrightReport({ suites: [] }, provenance), /No Playwright/);
  assert.throws(() => normalisePlaywrightReport({}, provenance), /missing suites/);
  const duplicate = report();
  duplicate.suites[0].suites[0].specs.push(structuredClone(duplicate.suites[0].suites[0].specs[0]));
  assert.throws(() => normalisePlaywrightReport(duplicate, provenance), /Duplicate/);
  assert.throws(
    () => normalisePlaywrightReport(report(), { ...provenance, sourceSha: 'bad' }),
    /SHA/,
  );
});

test('reconciles complete independent shards and rejects omissions/duplicates/SHA mismatches', () => {
  const first = normalisePlaywrightReport(report(), provenance);
  const otherReport = report('skipped');
  const spec = otherReport.suites[0].suites[0].specs[0];
  spec.title = 'other test';
  spec.line = 14;
  const second = normalisePlaywrightReport(otherReport, { ...provenance, shard: '2/2' });
  const manifest = {
    tests: [{ identity: first.tests[0].identity }, { identity: second.tests[0].identity }],
  };
  assert.deepEqual(reconcilePlaywrightEvidence(manifest, [first, second]), {
    complete: true,
    discovered: 2,
    recorded: 2,
    shards: 2,
  });
  assert.throws(() => reconcilePlaywrightEvidence(manifest, [first]), /Missing shard/);
  assert.throws(() => reconcilePlaywrightEvidence(manifest, [first, first]), /Duplicate/);
  assert.throws(
    () =>
      reconcilePlaywrightEvidence(manifest, [
        first,
        { ...second, provenance: { ...second.provenance, headSha: c } },
      ]),
    /Mismatched SHA/,
  );
  assert.throws(
    () => reconcilePlaywrightEvidence({ tests: [{ identity: 'not-present' }] }, [first, second]),
    /Unexpected executed/,
  );
  assert.throws(
    () =>
      reconcilePlaywrightEvidence({ ...manifest, provenance: { ...provenance, sourceSha: c } }, [
        first,
        second,
      ]),
    /mismatched SHA/,
  );
  assert.throws(
    () =>
      reconcilePlaywrightEvidence({ tests: [manifest.tests[0], manifest.tests[0]] }, [
        first,
        second,
      ]),
    /duplicated manifest/,
  );
});
