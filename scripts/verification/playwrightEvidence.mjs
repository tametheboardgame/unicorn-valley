import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXPECTED_STATUSES = new Set(['expected', 'unexpected', 'flaky', 'skipped']);

function requiredText(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(name + ' must be a non-empty string');
  }
  return value.trim();
}

function normaliseFile(value) {
  const file = requiredText(value, 'Playwright test file').replaceAll('\\', '/');
  const index = file.lastIndexOf('tests/play/');
  // Playwright 1.55's JSON reporter emits paths relative to config.rootDir;
  // a nested spec is "folder/example.spec.ts", not "tests/play/folder/...".
  if (index < 0 && (file.startsWith('/') || file.startsWith('../'))) {
    throw new Error('Invalid Playwright spec path: ' + file);
  }
  const relative = index < 0 ? 'tests/play/' + file.replace(/^\.\//, '') : file.slice(index);
  if (!/^tests\/play\/.+\.spec\.ts$/.test(relative) || relative.includes('/../')) {
    throw new Error('Invalid Playwright spec path: ' + file);
  }
  return relative;
}

/** Read-only report normalisation. WP2 contract inventory still owns coverage. */
export function normalisePlaywrightReport(report, provenance, { discovery = false } = {}) {
  if (!report || !Array.isArray(report.suites))
    throw new Error('Invalid Playwright JSON report: missing suites');
  const sourceSha = requiredText(provenance.sourceSha, 'sourceSha');
  const headSha = requiredText(provenance.headSha, 'headSha');
  const runId = requiredText(provenance.runId, 'runId');
  const shard = requiredText(provenance.shard, 'shard');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha) || !/^[0-9a-f]{40}$/i.test(headSha)) {
    throw new Error('Source/head SHA must be full Git commit hashes');
  }
  if (!(discovery && shard === 'all/6')) {
    if (!/^[1-9]\d*\/[1-9]\d*$/.test(shard)) {
      throw new Error('Invalid shard identity: ' + shard);
    }
    const [number, total] = shard.split('/').map(Number);
    if (number > total) throw new Error('Shard number exceeds total');
  }
  const tests = [];
  const seen = new Set();

  function walk(suite, ancestors) {
    const titles = suite.title ? [...ancestors, suite.title] : ancestors;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const file = normaliseFile(spec.file ?? suite.file);
        const project = typeof test.projectName === 'string' ? test.projectName : '';
        const line = Number(spec.line);
        const column = Number(spec.column);
        const titlePath = [...titles, spec.title].filter(Boolean);
        if (!Number.isInteger(line) || !Number.isInteger(column) || titlePath.length === 0) {
          throw new Error('Invalid Playwright spec identity in ' + file);
        }
        // Project + exact source location + suite/title disambiguates parametrised cases.
        const identity = JSON.stringify([file, project, line, column, titlePath]);
        if (seen.has(identity)) throw new Error('Duplicate Playwright test identity: ' + identity);
        seen.add(identity);
        const status = test.status;
        if (!EXPECTED_STATUSES.has(status))
          throw new Error('Unknown Playwright status: ' + String(status));
        if (!discovery && !Array.isArray(test.results)) {
          throw new Error('Missing Playwright test results: ' + identity);
        }
        if (!discovery && status !== 'skipped' && test.results.length === 0) {
          throw new Error('Executed test has no results: ' + identity);
        }
        const attempts = (test.results ?? []).map((result) => {
          const durationMs = Number(result.duration);
          if (!Number.isFinite(durationMs) || durationMs < 0) {
            throw new Error('Invalid duration for ' + identity);
          }
          return { status: requiredText(result.status, 'attempt status'), durationMs };
        });
        tests.push({
          identity,
          file,
          project,
          titlePath,
          line,
          column,
          status,
          expectedStatus: typeof test.expectedStatus === 'string' ? test.expectedStatus : null,
          attempts,
          durationMs: attempts.reduce((sum, item) => sum + item.durationMs, 0),
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, titles);
  }
  for (const suite of report.suites) walk(suite, []);
  if (tests.length === 0)
    throw new Error('No Playwright test identities found: refusing empty evidence');
  tests.sort((a, b) => a.identity.localeCompare(b.identity));
  const files = new Map();
  for (const test of tests) {
    const record = files.get(test.file) ?? { path: test.file, tests: 0, durationMs: 0, skipped: 0 };
    record.tests += 1;
    record.durationMs += test.durationMs;
    if (test.status === 'skipped') record.skipped += 1;
    files.set(test.file, record);
  }
  return {
    schemaVersion: 1,
    mode: discovery ? 'discovery' : 'execution',
    provenance: { sourceSha, headSha, runId, shard },
    summary: {
      tests: tests.length,
      files: files.size,
      expected: tests.filter((t) => t.status === 'expected').length,
      unexpected: tests.filter((t) => t.status === 'unexpected').length,
      flaky: tests.filter((t) => t.status === 'flaky').length,
      skipped: tests.filter((t) => t.status === 'skipped').length,
    },
    files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)),
    tests,
  };
}

/** Fail-closed evidence reconciliation; a report does not choose or retire tests. */
export function reconcilePlaywrightEvidence(manifest, shards) {
  if (!manifest || !Array.isArray(manifest.tests) || manifest.tests.length === 0) {
    throw new Error('Missing non-empty discovered test manifest');
  }
  if (!Array.isArray(shards) || shards.length === 0) throw new Error('Missing shard evidence');
  const expected = new Set();
  for (const test of manifest.tests) {
    if (typeof test.identity !== 'string' || expected.has(test.identity)) {
      throw new Error('Invalid or duplicated manifest identity');
    }
    expected.add(test.identity);
  }
  const actual = new Set();
  const seenShards = new Set();
  const reference = shards[0].provenance;
  if (!reference || !/^\d+\/\d+$/.test(reference.shard)) {
    throw new Error('Invalid first shard provenance');
  }
  if (manifest.provenance) {
    if (
      manifest.provenance.sourceSha !== reference.sourceSha ||
      manifest.provenance.headSha !== reference.headSha ||
      manifest.provenance.runId !== reference.runId
    ) {
      throw new Error('Discovered manifest has a mismatched SHA or run identity');
    }
  }
  const shardCount = Number(reference.shard.split('/')[1]);
  for (const shard of shards) {
    const p = shard.provenance;
    if (
      p.sourceSha !== reference.sourceSha ||
      p.headSha !== reference.headSha ||
      p.runId !== reference.runId
    ) {
      throw new Error('Mismatched SHA or run identity across shards');
    }
    if (Number(p.shard.split('/')[1]) !== shardCount || seenShards.has(p.shard)) {
      throw new Error('Duplicate or inconsistent shard identity: ' + p.shard);
    }
    seenShards.add(p.shard);
    for (const test of shard.tests) {
      if (!expected.has(test.identity))
        throw new Error('Unexpected executed test: ' + test.identity);
      if (actual.has(test.identity)) throw new Error('Duplicate executed test: ' + test.identity);
      actual.add(test.identity);
    }
  }
  if (seenShards.size !== shardCount) throw new Error('Missing shard evidence');
  for (const identity of expected) {
    if (!actual.has(identity)) throw new Error('Missing executed or skipped test: ' + identity);
  }
  return {
    complete: true,
    discovered: expected.size,
    recorded: actual.size,
    shards: seenShards.size,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (name) =>
      process.argv
        .find((item) => item.startsWith('--' + name + '='))
        ?.split('=')
        .slice(1)
        .join('=');
    const input = requiredText(arg('input'), 'input');
    const output = requiredText(arg('output'), 'output');
    const report = JSON.parse(readFileSync(input, 'utf8'));
    const discovery = process.argv.includes('--discovery');
    const evidence = normalisePlaywrightReport(
      report,
      {
        sourceSha: process.env.GITHUB_SHA,
        headSha: process.env.TEST_EVIDENCE_HEAD_SHA,
        runId: process.env.GITHUB_RUN_ID,
        shard: discovery ? 'all/6' : process.env.TEST_EVIDENCE_SHARD,
      },
      { discovery },
    );
    writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
    console.log('WP3.1 Playwright evidence: ' + JSON.stringify(evidence.summary));
  } catch (error) {
    console.error('WP3.1 evidence could not be trusted: ' + error.message);
    process.exitCode = 1;
  }
}
