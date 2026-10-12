import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { reconcilePlaywrightEvidence } from './playwrightEvidence.mjs';

function arg(name) {
  return process.argv.find((value) => value.startsWith('--' + name + '='))?.slice(name.length + 3);
}

function parse(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

try {
  const discoveryPath = arg('manifest');
  const shardRoot = arg('shards');
  const reportPath = arg('output');
  if (!discoveryPath || !shardRoot || !reportPath) {
    throw new Error('Expected --manifest, --shards and --output');
  }
  const manifest = parse(discoveryPath);
  const directories = readdirSync(shardRoot, { withFileTypes: true })
    .filter((item) => item.isDirectory() && /^tier3-chromium-[1-6]-of-6$/.test(item.name))
    .map((item) => item.name)
    .sort();
  if (directories.length !== 6) {
    throw new Error('Expected exactly six static Chromium evidence directories');
  }
  const shards = directories.map((name) => {
    const report = parse(join(shardRoot, name, 'test-evidence.json'));
    if (report.mode !== 'execution') {
      throw new Error('Shard evidence is not an execution report: ' + name);
    }
    const expectedShard = name.match(/chromium-(\d)-of-6$/)?.[1] + '/6';
    if (report.provenance.shard !== expectedShard) {
      throw new Error('Shard identity conflicts with its artifact directory: ' + name);
    }
    return report;
  });
  if (manifest.mode !== 'discovery' || manifest.provenance.shard !== 'all/6') {
    throw new Error('Independent full-suite discovery manifest is invalid');
  }
  const completeness = reconcilePlaywrightEvidence(manifest, shards);
  const files = new Map();
  for (const shard of shards) {
    for (const file of shard.files) {
      const summary = files.get(file.path) ?? {
        file: file.path,
        durationMs: 0,
        tests: 0,
        skipped: 0,
      };
      summary.durationMs += file.durationMs;
      summary.tests += file.tests;
      summary.skipped += file.skipped;
      files.set(file.path, summary);
    }
  }
  const report = {
    schemaVersion: 1,
    valid: true,
    provenance: manifest.provenance,
    ...completeness,
    statuses: shards.reduce(
      (counts, shard) => {
        for (const status of ['expected', 'unexpected', 'flaky', 'skipped']) {
          counts[status] += shard.summary[status];
        }
        return counts;
      },
      { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
    ),
    files: [...files.values()].sort((a, b) => b.durationMs - a.durationMs),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(
    'WP3.1 independent full-suite reconciliation: ' +
      JSON.stringify({
        coverage: completeness,
        statuses: report.statuses,
        slowest: report.files.slice(0, 8),
      }),
  );
} catch (error) {
  console.error('::error title=WP3.1 evidence incomplete::' + error.message);
  process.exitCode = 1;
}
