import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = /^[a-f0-9]{40}$/i;
const RUN = /^\d+$/;
const SPEC = /^tests\/play\/.+\.spec\.ts$/;
const COUNTS = [6, 8, 10, 12];
const SETUP_MS = 90_000;

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function median(samples) {
  const ordered = [...samples].sort((a, b) => a - b);
  const m = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[m] : (ordered[m - 1] + ordered[m]) / 2;
}
function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

export function validateCleanSnapshot(snapshot, { historical = false } = {}) {
  if (
    snapshot?.schemaVersion !== 1 ||
    snapshot.valid !== true ||
    !Array.isArray(snapshot.errors) ||
    snapshot.errors.length ||
    !Array.isArray(snapshot.records) ||
    !snapshot.records.length ||
    !snapshot.provenance ||
    !SHA.test(snapshot.provenance.sourceSha ?? '') ||
    !SHA.test(snapshot.provenance.headSha ?? '') ||
    !RUN.test(String(snapshot.provenance.runId ?? ''))
  ) {
    throw new Error('Missing, invalid or incomplete suite-health snapshot/provenance');
  }
  if (historical && snapshot.provenance.sourceSha !== snapshot.provenance.headSha) {
    throw new Error('Historical main snapshot must bind source and head SHAs');
  }
  const records = snapshot.records.filter((item) => item.kind === 'browser');
  const seen = new Set();
  for (const record of records) {
    if (
      !SPEC.test(record.path ?? '') ||
      seen.has(record.path) ||
      record.observed !== true ||
      !Number.isInteger(record.tests) ||
      record.tests <= 0 ||
      !['expected', 'skipped', 'unexpected', 'flaky'].every(
        (key) => Number.isInteger(record[key]) && record[key] >= 0,
      ) ||
      record.expected + record.skipped + record.unexpected + record.flaky !== record.tests ||
      record.unexpected !== 0 ||
      record.flaky !== 0 ||
      !finite(record.durationMs)
    ) {
      throw new Error('Snapshot has missing, duplicate, incomplete or non-green browser evidence');
    }
    seen.add(record.path);
  }
  if (
    !records.length ||
    snapshot.summary?.observedBrowserSpecs !== records.length ||
    snapshot.summary?.unobservedBrowserSpecs !== 0 ||
    snapshot.summary?.inventoryBrowserSpecs !== records.length
  ) {
    throw new Error('Incomplete browser inventory or observed specification coverage');
  }
  return records;
}

export function allocateByDuration(weightedFiles, shardCount) {
  if (!Number.isInteger(shardCount) || shardCount < 1 || weightedFiles.length < shardCount) {
    throw new Error('Cannot allocate empty shards');
  }
  const seen = new Set();
  for (const file of weightedFiles) {
    if (!SPEC.test(file.path ?? '') || !finite(file.durationMs) || seen.has(file.path)) {
      throw new Error('Invalid or duplicate file in proposed allocation');
    }
    seen.add(file.path);
  }
  const shards = Array.from({ length: shardCount }, (_, i) => ({
    id: i + 1,
    durationMs: 0,
    files: [],
  }));
  for (const file of [...weightedFiles].sort(
    (a, b) => b.durationMs - a.durationMs || a.path.localeCompare(b.path),
  )) {
    const target = [...shards].sort(
      (a, b) => a.durationMs - b.durationMs || a.id - b.id,
    )[0];
    target.durationMs += file.durationMs;
    target.files.push(file.path);
  }
  if (shards.some((shard) => shard.files.length === 0)) {
    throw new Error('Shadow plan contains an empty shard');
  }
  const assigned = shards.flatMap((shard) => shard.files);
  if (assigned.length !== weightedFiles.length || new Set(assigned).size !== seen.size) {
    throw new Error('Shadow plan did not cover every file exactly once');
  }
  return shards;
}

function metrics(shards) {
  const loads = shards.map((x) => x.durationMs);
  const max = Math.max(...loads);
  const min = Math.min(...loads);
  return {
    shardCount: shards.length,
    totalTestMs: loads.reduce((a, b) => a + b, 0),
    predictedCriticalPathMs: max + SETUP_MS,
    predictedRunnerMs: loads.reduce((a, b) => a + b + SETUP_MS, 0),
    skewMs: max - min,
    largestTestLoadMs: max,
    smallestTestLoadMs: min,
    setupAssumptionMsPerShard: SETUP_MS,
  };
}

function compatibleRecords(current, historical) {
  const index = new Map(historical.map((x) => [x.path, x]));
  return current.length === historical.length && current.every(
    (file) => index.has(file.path) && index.get(file.path).tests === file.tests,
  );
}

function actualStaticSix(current, shards, provenance) {
  if (!Array.isArray(shards) || shards.length !== 6) {
    return { available: false, reason: 'six current per-shard execution reports not provided' };
  }
  const seen = new Map();
  const ids = new Set();
  const load = [];
  const fileToShard = {};
  for (const shard of shards) {
    const p = shard?.provenance;
    if (
      shard?.mode !== 'execution' ||
      !p ||
      p.runId !== provenance.runId ||
      p.sourceSha !== provenance.sourceSha ||
      p.headSha !== provenance.headSha ||
      !/^[1-6]\/6$/.test(p.shard ?? '') ||
      ids.has(p.shard) ||
      !Array.isArray(shard.tests)
    ) {
      return { available: false, reason: 'mismatched, incomplete or duplicated current shard evidence' };
    }
    ids.add(p.shard);
    let total = 0;
    for (const t of shard.tests) {
      if (!SPEC.test(t.file ?? '') || !finite(t.durationMs) || !['expected', 'skipped'].includes(t.status)) {
        return { available: false, reason: 'untrusted shard test record' };
      }
      if (fileToShard[t.file] !== undefined && fileToShard[t.file] !== p.shard) {
        return { available: false, reason: 'source file split between static shards' };
      }
      fileToShard[t.file] = p.shard;
      const prev = seen.get(t.file) ?? { durationMs: 0, tests: 0 };
      prev.durationMs += t.durationMs;
      prev.tests += 1;
      seen.set(t.file, prev);
      total += t.durationMs;
    }
    load.push({ id: Number(p.shard.split('/')[0]), durationMs: total, files: [] });
  }
  if (
    seen.size !== current.length ||
    current.some((file) => {
      const observed = seen.get(file.path);
      return !observed || observed.tests !== file.tests ||
        Math.abs(observed.durationMs - file.durationMs) > 0.01;
    })
  ) {
    return { available: false, reason: 'current shard files do not match the validated health inventory' };
  }
  for (const file of current) {
    const index = Number(fileToShard[file.path].split('/')[0]) - 1;
    load.find((shard) => shard.id === index + 1).files.push(file.path);
  }
  load.sort((a, b) => a.id - b.id);
  return { available: true, kind: 'measured-test-duration-only', ...metrics(load), shards: load };
}

export function makeShadowReport({ current, history = [], shards = [] }) {
  const now = validateCleanSnapshot(current);
  if (!Array.isArray(history)) throw new Error('History must be a list of independent reports');
  const eligible = [];
  const ignored = [];
  const runIds = new Set([String(current.provenance.runId)]);
  for (const item of history) {
    try {
      const records = validateCleanSnapshot(item, { historical: true });
      const id = String(item.provenance.runId);
      if (runIds.has(id)) throw new Error('Duplicate/current run identity');
      runIds.add(id);
      eligible.push({ report: item, records });
    } catch (error) {
      ignored.push({ runId: String(item?.provenance?.runId ?? 'unknown'), reason: error.message });
    }
  }
  const weights = new Map();
  const usable = [...now.filter((file) => file.durationMs > 0).map((file) => file.durationMs)];
  const defaultMs = usable.length ? Math.max(60_000, percentile(usable, 0.9)) : 120_000;
  const weighted = now.map((file) => {
    const samples = [file.durationMs];
    let historicalSamples = 0;
    for (const entry of eligible.slice(0, 10)) {
      const older = entry.records.find((other) => other.path === file.path && other.tests === file.tests);
      if (older && older.durationMs > 0) {
        samples.push(older.durationMs);
        historicalSamples++;
      }
    }
    const estimated = file.durationMs === 0 && historicalSamples === 0;
    const record = {
      path: file.path,
      tests: file.tests,
      durationMs: estimated ? defaultMs : median(samples.filter((n) => n > 0)),
      source: estimated ? 'conservative-unmeasured-default' : historicalSamples ? 'clean-history-median' : 'current-clean-only',
      historicalSamples,
    };
    weights.set(file.path, record);
    return record;
  });
  const plans = COUNTS.map((count) => {
    if (weighted.length < count) return { count, available: false, reason: 'insufficient files for non-empty shards' };
    const allocation = allocateByDuration(weighted, count);
    return { count, available: true, ...metrics(allocation), shards: allocation };
  });
  const staticSix = actualStaticSix(now, shards, current.provenance);
  const comparisonRuns = [];
  for (const entry of eligible) {
    if (!compatibleRecords(now, entry.records)) {
      ignored.push({ runId: String(entry.report.provenance.runId), reason: 'inventory or test count changed' });
      continue;
    }
    const historyWeights = entry.records.map((file) => ({ path: file.path, durationMs: file.durationMs }));
    const replay = {};
    for (const count of COUNTS) {
      replay[count] = historyWeights.length >= count
        ? metrics(allocateByDuration(historyWeights, count)) : null;
    }
    if (staticSix.available) {
      const byPath = new Map(historyWeights.map((f) => [f.path, f.durationMs]));
      const staticReplay = staticSix.shards.map((shard) => ({
        id: shard.id,
        durationMs: shard.files.reduce((sum, file) => sum + byPath.get(file), 0),
        files: shard.files,
      }));
      replay.staticSixCurrentAssignment = metrics(staticReplay);
    }
    comparisonRuns.push({
      runId: String(entry.report.provenance.runId),
      sha: entry.report.provenance.sourceSha,
      kind: 'historical-model-replay-not-observed-runner-time',
      model: replay,
    });
  }
  return {
    schemaVersion: 1,
    mode: 'shadow-only-no-execution-authority',
    provenance: current.provenance,
    summary: {
      files: weighted.length,
      tests: now.reduce((sum, item) => sum + item.tests, 0),
      historyAccepted: eligible.length,
      historyComparable: comparisonRuns.length,
      historyIgnored: ignored.length,
      historicalEvidence: comparisonRuns.length >= 2 ? 'multi-run-model' : 'insufficient-history',
      unknownDefaultMs: defaultMs,
      nonZeroCurrentSamples: usable.length,
    },
    caveat: 'This is file-test-runtime modelling plus 90s setup assumptions, NOT measured CI wall time or proof of end-to-end Merge Gate speed. Queue time, browser compatibility and smoke may dominate. Execution stays static six shards.',
    staticSix,
    plans,
    comparisons: comparisonRuns,
    ignored,
  };
}

export function formatShadowReport(report) {
  const rows = report.plans.map((plan) => plan.available
    ? `| ${plan.count} | ${Math.round(plan.largestTestLoadMs / 1000)}s | ${Math.round(plan.predictedCriticalPathMs / 1000)}s | ${Math.round(plan.predictedRunnerMs / 60000)} min | ${Math.round(plan.skewMs / 1000)}s |`
    : `| ${plan.count} | unavailable | - | - | - |`);
  return [
    '# ENG-WP3.2 — duration-aware Chromium shadow allocation', '',
    `Current run: ${report.provenance.runId}; head: ${report.provenance.headSha}`,
    `Mode: ${report.mode}`, '',
    '| Proposed shards | Longest file-test workload | Critical path + assumed setup | Estimated runner cost | Load spread |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows, '',
    `Current static-six test durations: ${report.staticSix.available ? Math.round(report.staticSix.largestTestLoadMs / 1000) + 's max shard test workload' : report.staticSix.reason}`,
    `Comparable historical replay runs: ${report.summary.historyComparable} (${report.summary.historicalEvidence}); ignored: ${report.summary.historyIgnored}`,
    `Unmeasured-file conservative estimate: ${report.summary.unknownDefaultMs} ms`, '',
    report.caveat, '',
    'WP3.3 must qualify dynamic execution separately; no scheduler activation or merge-gate changes in this package.', '',
  ].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (key) => process.argv.find((x) => x.startsWith('--' + key + '='))?.slice(key.length + 3);
    const health = arg('health');
    const shardRoot = arg('shards');
    const output = arg('output');
    const markdown = arg('markdown');
    if (!health || !shardRoot || !output || !markdown) {
      throw new Error('Expected --health, --shards, --output and --markdown');
    }
    const current = JSON.parse(readFileSync(health, 'utf8'));
    const history = arg('history') ? JSON.parse(readFileSync(arg('history'), 'utf8')).reports ?? [] : [];
    const shardNames = readdirSync(shardRoot).filter((x) => /^tier3-chromium-[1-6]-of-6$/.test(x));
    const shards = shardNames.map((name) => JSON.parse(
      readFileSync(join(shardRoot, name, 'test-evidence.json'), 'utf8'),
    ));
    const report = makeShadowReport({ current, history, shards });
    writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    writeFileSync(markdown, formatShadowReport(report));
    console.log('ENG-WP3.2 observational shadow: ' + JSON.stringify(report.summary));
  } catch (error) {
    console.error('::warning title=Shadow scheduling unavailable::' + error.message);
    process.exitCode = 1;
  }
}
