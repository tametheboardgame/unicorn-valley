import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectContractInventory } from './contractInventory.mjs';

const SHA = /^[0-9a-f]{40}$/i;
const STATUSES = ['expected', 'unexpected', 'flaky', 'skipped'];

function assertProvenance(value) {
  if (!value || !SHA.test(value.sourceSha ?? '') || !SHA.test(value.headSha ?? '') ||
      !String(value.runId ?? '').trim()) {
    throw new Error('Missing or invalid source/head SHA or run provenance');
  }
}

function counts() {
  return { tests: 0, expected: 0, unexpected: 0, flaky: 0, skipped: 0, durationMs: 0 };
}

function issue(code, path, detail) {
  return { code, path, detail };
}

/** WP2.4 observes health; WP2.1 remains authoritative for contract ownership. */
export function assessSuiteHealth({
  inventory,
  reconciliation,
  shards,
  history = [],
  asOf = new Date().toISOString().slice(0, 10),
  slowThresholdMs = 180000,
}) {
  if (!inventory || !Array.isArray(inventory.contracts) || !Array.isArray(inventory.errors)) {
    throw new Error('Missing WP2.1 contract inventory');
  }
  if (!reconciliation || reconciliation.valid !== true || reconciliation.complete !== true ||
      !Number.isInteger(reconciliation.discovered) || reconciliation.discovered < 1 ||
      reconciliation.recorded !== reconciliation.discovered || reconciliation.shards !== 6) {
    throw new Error('WP3.1 reconciliation is missing or incomplete');
  }
  assertProvenance(reconciliation.provenance);
  if (!Array.isArray(shards) || shards.length !== 6) {
    throw new Error('Exactly six completed Chromium shard reports are required');
  }
  const observed = new Map();
  const identities = new Set();
  const shardNames = new Set();
  const totals = counts();
  for (const shard of shards) {
    if (shard?.mode !== 'execution' || !Array.isArray(shard.tests)) {
      throw new Error('Missing actual shard execution tests');
    }
    assertProvenance(shard.provenance);
    const p = shard.provenance;
    if (p.sourceSha !== reconciliation.provenance.sourceSha ||
        p.headSha !== reconciliation.provenance.headSha ||
        p.runId !== reconciliation.provenance.runId ||
        !/^[1-6]\/6$/.test(p.shard) || shardNames.has(p.shard)) {
      throw new Error('Mismatched or duplicated shard provenance');
    }
    shardNames.add(p.shard);
    for (const test of shard.tests) {
      if (typeof test.identity !== 'string' || typeof test.file !== 'string' ||
          !/^tests\/play\/.+\.spec\.ts$/.test(test.file) ||
          identities.has(test.identity) || !STATUSES.includes(test.status) ||
          !Number.isFinite(test.durationMs) || test.durationMs < 0) {
        throw new Error('Invalid or duplicated terminal test identity or duration');
      }
      identities.add(test.identity);
      const record = observed.get(test.file) ?? counts();
      record.tests++;
      record[test.status]++;
      record.durationMs += test.durationMs;
      observed.set(test.file, record);
      totals.tests++;
      totals[test.status]++;
    }
  }
  if (identities.size !== reconciliation.recorded) {
    throw new Error('Shard identity count disagrees with independent reconciliation');
  }
  for (const status of STATUSES) {
    if (totals[status] !== reconciliation.statuses?.[status]) {
      throw new Error('Shard status count disagrees with independent reconciliation');
    }
  }
  if (!Array.isArray(history)) throw new Error('Health history must be an array');
  const seenRuns = new Set();
  const previous = history.map((run) => {
    if (run?.schemaVersion !== 1 || run.valid !== true || !Array.isArray(run.records)) {
      throw new Error('Historical health evidence must be complete');
    }
    assertProvenance(run.provenance);
    const key = run.provenance.runId + ':' + run.provenance.headSha;
    if (seenRuns.has(key) || (run.provenance.runId === reconciliation.provenance.runId &&
        run.provenance.headSha === reconciliation.provenance.headSha)) {
      throw new Error('Duplicated current or historical health run');
    }
    seenRuns.add(key);
    return new Map(run.records.map((record) => [record.path, record]));
  });

  const errors = [...inventory.errors];
  const warnings = [...(inventory.warnings ?? [])];
  const known = new Set(inventory.contracts.map((item) => item.path));
  for (const path of observed.keys()) {
    if (!known.has(path)) errors.push(issue('UNKNOWN_EXECUTED_SPEC', path, 'Not in WP2.1 inventory'));
  }
  const records = inventory.contracts.map((contract) => {
    const observation = contract.kind === 'browser' ? observed.get(contract.path) : null;
    const pastFailures = previous.filter((run) => {
      const earlier = run.get(contract.path);
      return earlier && (earlier.unexpected > 0 || earlier.flaky > 0);
    }).length;
    if (contract.kind === 'browser' && !observation) {
      warnings.push(issue('NOT_OBSERVED', contract.path, 'No execution evidence for inventoried spec'));
    }
    if (observation?.skipped) {
      warnings.push(issue('RUNTIME_SKIPS', contract.path, observation.skipped + ' actual runtime skips'));
    }
    if (observation && observation.durationMs >= slowThresholdMs) {
      warnings.push(issue('SLOW_SPEC_OBSERVED', contract.path, observation.durationMs + ' ms in one run'));
    }
    if (pastFailures >= 2) {
      warnings.push(issue('REPEATED_FAILURE_HISTORY', contract.path, pastFailures + ' prior runs'));
    }
    if (contract.reviewedOn && /^\d{4}-\d{2}-\d{2}$/.test(contract.reviewedOn) &&
        Date.parse(asOf) - Date.parse(contract.reviewedOn) > 180 * 86400000) {
      warnings.push(issue('REVIEW_OVERDUE', contract.path, 'Reviewed ' + contract.reviewedOn));
    }
    return {
      path: contract.path,
      kind: contract.kind,
      owners: contract.owners,
      lifecycle: contract.status,
      reviewedOn: contract.reviewedOn,
      observed: Boolean(observation),
      ...(observation ?? counts()),
      previousFailureRuns: pastFailures,
    };
  });
  const slow = records
    .filter((record) => record.kind === 'browser' && record.observed)
    .sort((a, b) => b.durationMs - a.durationMs);
  return {
    schemaVersion: 1,
    valid: errors.length === 0,
    asOf,
    provenance: reconciliation.provenance,
    evidenceMode: previous.length ? 'multi-run-history' : 'single-run-snapshot',
    thresholds: { slowSpecMs: slowThresholdMs, reviewDays: 180 },
    summary: {
      inventoryBrowserSpecs: records.filter((x) => x.kind === 'browser').length,
      inventoryUnitSpecs: records.filter((x) => x.kind === 'unit').length,
      observedBrowserSpecs: observed.size,
      unobservedBrowserSpecs: records.filter((x) => x.kind === 'browser' && !x.observed).length,
      legacyUnownedBrowserSpecs: inventory.summary?.unownedBrowser ?? null,
      actualRuntimeSkips: totals.skipped,
      slowSpecs: slow.filter((x) => x.durationMs >= slowThresholdMs).length,
      confirmedRecurringFailureSpecs: records.filter((x) => x.previousFailureRuns >= 2).length,
      historyRuns: previous.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    slowest: slow.slice(0, 20).map((x) => ({ path: x.path, durationMs: x.durationMs })),
    errors,
    warnings,
    records,
  };
}

export function formatSuiteHealth(report) {
  const s = report.summary;
  return [
    '# Chromium test-suite health',
    '',
    'Source: ' + report.provenance.sourceSha,
    'PR head: ' + report.provenance.headSha,
    'Run: ' + report.provenance.runId,
    'Evidence: ' + report.evidenceMode + ' (one run is not proof of recurring flakiness)',
    '',
    '## Inventory and evidence',
    '',
    '- Browser specs: ' + s.inventoryBrowserSpecs + ', observed: ' + s.observedBrowserSpecs,
    '- Unobserved browser specs: ' + s.unobservedBrowserSpecs,
    '- Unit specs: ' + s.inventoryUnitSpecs,
    '- Historical unowned browser specs: ' + s.legacyUnownedBrowserSpecs,
    '- Runtime skips: ' + s.actualRuntimeSkips,
    '- Slow specs: ' + s.slowSpecs,
    '- Confirmed repeated failures: ' + s.confirmedRecurringFailureSpecs,
    '- Independent historical runs: ' + s.historyRuns,
    '- Errors: ' + s.errors + '; warnings: ' + s.warnings,
    '',
    '## Slowest observed files',
    '',
    ...report.slowest.slice(0, 12).map((x) => '- ' + x.path + ': ' + x.durationMs + ' ms'),
    '',
    '## Errors',
    '',
    ...(report.errors.length ? report.errors.slice(0, 25).map((x) => '- ' + x.code + ': ' + x.path) : ['- None']),
    '',
    '## Warnings (first 25)',
    '',
    ...(report.warnings.length ? report.warnings.slice(0, 25).map((x) => '- ' + x.code + ': ' + x.path) : ['- None']),
    '',
    'Historical debt remains visible, not automatically retired or blocked. Full detail is in JSON.',
    '',
  ].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (name) =>
      process.argv.find((part) => part.startsWith('--' + name + '='))?.slice(name.length + 3);
    const input = arg('reconciliation');
    const shardRoot = arg('shards');
    const output = arg('output');
    const markdown = arg('markdown');
    if (!input || !shardRoot || !output || !markdown) {
      throw new Error('Expected --reconciliation, --shards, --output and --markdown');
    }
    const directories = readdirSync(shardRoot, { withFileTypes: true })
      .filter((item) => item.isDirectory() && /^tier3-chromium-[1-6]-of-6$/.test(item.name))
      .map((item) => item.name)
      .sort();
    if (directories.length !== 6) throw new Error('Missing six shard directories');
    const shards = directories.map((name) =>
      JSON.parse(readFileSync(join(shardRoot, name, 'test-evidence.json'), 'utf8')),
    );
    const report = assessSuiteHealth({
      inventory: inspectContractInventory(),
      reconciliation: JSON.parse(readFileSync(input, 'utf8')),
      shards,
      ...(arg('history') ? { history: JSON.parse(readFileSync(arg('history'), 'utf8')) } : {}),
    });
    writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    writeFileSync(markdown, formatSuiteHealth(report));
    console.log('ENG-WP2.4 suite health: ' + JSON.stringify(report.summary));
    for (const error of report.errors) console.error('ERROR ' + error.code + ': ' + error.path);
    if (!report.valid) process.exitCode = 1;
  } catch (error) {
    console.error('::error title=Suite health reporting failed::' + error.message);
    process.exitCode = 1;
  }
}
