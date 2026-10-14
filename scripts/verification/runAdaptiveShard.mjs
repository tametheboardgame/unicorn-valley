import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { indexDiscovery } from './adaptiveShardPlan.mjs';
import { validateManifestCandidate } from './tier3Matrix.mjs';
import { normalisePlaywrightReport } from './playwrightEvidence.mjs';

const NUM = /^[1-6]$/;

export function assignedShard({ candidate, discovery, sourceSha, headSha, runId, shard }) {
  if (!NUM.test(String(shard ?? ''))) throw new Error('Expected shard 1–6');
  const list = validateManifestCandidate({ candidate, discovery, sourceSha, headSha, runId });
  const result = list[Number(shard) - 1];
  if (!result || result.id !== Number(shard)) throw new Error('Incorrect shard allocation');
  return result;
}

export function verifyManifestShardResult({ candidate, discovery, evidence, shard }) {
  const p = candidate.provenance;
  const assigned = assignedShard({
    candidate,
    discovery,
    ...p,
    shard,
  });
  const files = indexDiscovery(discovery, p);
  const report = evidence;
  if (
    report.mode !== 'execution' ||
    report.provenance?.sourceSha !== p.sourceSha ||
    report.provenance?.headSha !== p.headSha ||
    report.provenance?.runId !== p.runId ||
    report.provenance?.shard !== shard + '/6'
  ) {
    throw new Error('Stale or mismatched manifest shard execution evidence');
  }
  const required = new Set(assigned.identities);
  const observed = new Set();
  for (const test of report.tests ?? []) {
    if (
      !required.has(test.identity) ||
      observed.has(test.identity) ||
      !assigned.files.includes(test.file) ||
      !['expected', 'skipped'].includes(test.status) ||
      !files.get(test.file)?.includes(test.identity)
    ) {
      throw new Error('Wrong, duplicated or failed manifest shard test');
    }
    observed.add(test.identity);
  }
  if (
    observed.size !== required.size ||
    report.summary?.tests !== required.size ||
    report.summary.unexpected !== 0 ||
    report.summary.flaky !== 0
  ) {
    throw new Error('Manifest execution has missing tests or non-green outcomes');
  }
  return { shard: Number(shard), files: assigned.files.length, identities: observed.size };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (name) =>
      process.argv.find((x) => x.startsWith('--' + name + '='))?.slice(name.length + 3);
    if (!arg('candidate') || !arg('discovery') || !arg('shard')) {
      throw new Error('Expected --candidate, --discovery and --shard');
    }
    const candidate = JSON.parse(readFileSync(arg('candidate'), 'utf8'));
    const discovery = JSON.parse(readFileSync(arg('discovery'), 'utf8'));
    const provenance = {
      sourceSha: process.env.GITHUB_SHA,
      headSha: process.env.TEST_EVIDENCE_HEAD_SHA,
      runId: process.env.GITHUB_RUN_ID,
    };
    const assigned = assignedShard({ candidate, discovery, ...provenance, shard: arg('shard') });
    console.log(
      'ENG-WP3.3 manifest shard ' +
        assigned.id +
        ': ' +
        assigned.files.length +
        ' whole files, ' +
        assigned.identities.length +
        ' test identities',
    );
    const child = spawnSync('npm', ['run', 'test:play', '--', ...assigned.files], {
      stdio: 'inherit',
      env: process.env,
    });
    let resultError;
    try {
      const report = JSON.parse(readFileSync('playtest-artifacts/playwright-results.json', 'utf8'));
      const evidence = normalisePlaywrightReport(report, {
        ...provenance,
        shard: assigned.id + '/6',
      });
      console.log(
        'ENG-WP3.3 manifest execution: ' +
          JSON.stringify(
            verifyManifestShardResult({ candidate, discovery, evidence, shard: assigned.id }),
          ),
      );
    } catch (error) {
      resultError = error;
    }
    if (child.error || child.status !== 0 || resultError) {
      throw new Error(
        'Playwright or source-bound manifest verification failed: ' +
          (resultError?.message ?? child.error?.message ?? 'browser runner exit ' + child.status),
      );
    }
  } catch (error) {
    console.error('::error title=WP3.3 manifest shard failed::' + error.message);
    process.exitCode = 1;
  }
}
