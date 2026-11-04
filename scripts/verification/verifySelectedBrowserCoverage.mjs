import { readFileSync, writeFileSync } from 'node:fs';
import { normalisePlaywrightReport, reconcilePlaywrightEvidence } from './playwrightEvidence.mjs';

const sourceSha = process.env.GITHUB_SHA;
const runId = process.env.GITHUB_RUN_ID;
if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? '') || !/^\d+$/.test(runId ?? '')) {
  throw new Error('Missing valid GitHub source SHA and workflow run identity');
}
const discovery = normalisePlaywrightReport(
  JSON.parse(readFileSync('selected-discovery.json', 'utf8')),
  { sourceSha, headSha: sourceSha, runId, shard: 'all/6' },
  { discovery: true },
);
const execution = normalisePlaywrightReport(
  JSON.parse(readFileSync('playtest-artifacts/playwright-results.json', 'utf8')),
  { sourceSha, headSha: sourceSha, runId, shard: '1/1' },
);
const reconciliation = reconcilePlaywrightEvidence(discovery, [execution]);
const result = {
  ...reconciliation,
  discovered: discovery.summary.discovered,
  expected: execution.summary.expected,
  skipped: execution.summary.skipped,
  unexpected: execution.summary.unexpected,
  flaky: execution.summary.flaky,
};
writeFileSync('selected-browser-reconciliation.json', JSON.stringify(result, null, 2) + '\n');
console.log('Selected browser exact-cover reconciliation: ' + JSON.stringify(result));
