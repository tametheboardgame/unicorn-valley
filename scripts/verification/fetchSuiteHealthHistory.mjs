import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = /^[0-9a-f]{40}$/i;
const ALLOWED_EVENTS = new Set(['push', 'schedule', 'workflow_dispatch']);
const ALLOWED_CONCLUSIONS = new Set(['success', 'failure']);

/** Only completed default-branch runs are suitable baselines for a PR. */
export function eligibleHistoryRuns(runs, currentRunId, maxCandidates = 12) {
  if (!Array.isArray(runs)) throw new Error('GitHub did not return workflow runs');
  return runs
    .filter(
      (run) =>
        run.head_branch === 'main' &&
        ALLOWED_EVENTS.has(run.event) &&
        run.status === 'completed' &&
        ALLOWED_CONCLUSIONS.has(run.conclusion) &&
        /^\d+$/.test(String(run.id)) &&
        SHA.test(run.head_sha ?? '') &&
        String(run.id) !== String(currentRunId),
    )
    .sort((left, right) => Number(right.id) - Number(left.id))
    .slice(0, maxCandidates);
}

/** An artifact is historical evidence only if its run identity and full records agree. */
export function validateHistoricalHealth(snapshot, run) {
  if (
    !snapshot ||
    snapshot.schemaVersion !== 1 ||
    snapshot.valid !== true ||
    !Array.isArray(snapshot.errors) ||
    snapshot.errors.length !== 0 ||
    !Array.isArray(snapshot.records) ||
    snapshot.records.length === 0 ||
    !snapshot.provenance ||
    snapshot.provenance.runId !== String(run.id) ||
    snapshot.provenance.sourceSha !== run.head_sha ||
    snapshot.provenance.headSha !== run.head_sha
  ) {
    throw new Error('Historical artifact is incomplete or not bound to its main run');
  }
  const paths = new Set();
  for (const record of snapshot.records) {
    if (
      typeof record.path !== 'string' ||
      !/^tests\/play\/.+\.spec\.ts$/.test(record.path) &&
        !(record.kind === 'unit' && /^src\/.+\.test\.[cm]?[jt]sx?$/.test(record.path)) ||
      paths.has(record.path) ||
      !['browser', 'unit'].includes(record.kind) ||
      !['tests', 'expected', 'unexpected', 'flaky', 'skipped', 'durationMs'].every(
        (field) => Number.isFinite(record[field]) && record[field] >= 0,
      )
    ) {
      throw new Error('Invalid or duplicated historical contract record');
    }
    paths.add(record.path);
  }
  return snapshot;
}

/** Injected fetch functions make selection and errors testable without GitHub access. */
export async function collectHistory({
  runs,
  currentRunId,
  lookupArtifacts,
  downloadReport,
  maxRuns = 5,
}) {
  const candidates = eligibleHistoryRuns(runs, currentRunId);
  const reports = [];
  const notes = [];
  for (const run of candidates) {
    if (reports.length >= maxRuns) break;
    try {
      const listing = await lookupArtifacts(run.id);
      if (!Array.isArray(listing?.artifacts)) throw new Error('Invalid artifact listing');
      const artifact = listing.artifacts.find(
        (entry) => entry.name === 'suite-health' && !entry.expired && Number.isInteger(entry.id),
      );
      if (!artifact) {
        notes.push({ runId: String(run.id), reason: 'No retained suite-health artifact' });
        continue;
      }
      const report = validateHistoricalHealth(await downloadReport(artifact.id), run);
      reports.push(report);
    } catch (error) {
      notes.push({ runId: String(run.id), reason: String(error.message) });
    }
  }
  return { reports, notes, candidates: candidates.length };
}

async function main() {
  const argument = (name) =>
    process.argv.find((value) => value.startsWith('--' + name + '='))?.slice(name.length + 3);
  const output = argument('output');
  const metadata = argument('metadata');
  if (!output || !metadata) throw new Error('Expected --output and --metadata');

  const repo = process.env.GITHUB_REPOSITORY ?? '';
  const token = process.env.GITHUB_TOKEN ?? '';
  const runId = process.env.GITHUB_RUN_ID ?? '';
  const result = { reports: [], notes: [], candidates: 0 };
  let status = 'no-eligible-history';
  try {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token || !/^\d+$/.test(runId)) {
      throw new Error('Historical lookups require a repository, read token and run ID');
    }
    const endpoint = 'https://api.github.com/repos/' + repo + '/';
    const request = async (path) => {
      const response = await fetch(endpoint + path, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ' + token,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('GitHub history API returned HTTP ' + response.status);
      return response;
    };
    const downloadReport = async (artifactId) => {
      const response = await request('actions/artifacts/' + artifactId + '/zip');
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 2097152) {
        throw new Error('Historical suite-health archive exceeds the 2 MiB safety limit');
      }
      const directory = mkdtempSync(join(tmpdir(), 'uv-suite-health-'));
      try {
        const archive = join(directory, 'artifact.zip');
        writeFileSync(archive, bytes);
        return JSON.parse(
          execFileSync('unzip', ['-p', archive, 'suite-health.json'], {
            encoding: 'utf8',
            maxBuffer: 2097152,
            timeout: 5000,
          }),
        );
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    };
    const listing = await (
      await request('actions/workflows/ci.yml/runs?branch=main&status=completed&per_page=30')
    ).json();
    const found = await collectHistory({
      runs: listing.workflow_runs,
      currentRunId: runId,
      lookupArtifacts: async (id) =>
        (await request('actions/runs/' + id + '/artifacts?per_page=100')).json(),
      downloadReport,
    });
    Object.assign(result, found);
    status = found.reports.length > 0 ? 'history-loaded' : 'no-eligible-history';
  } catch (error) {
    status = 'history-unavailable';
    result.notes.push({ runId, reason: String(error.message) });
    console.warn('::warning title=WP2.4 historical evidence unavailable::' + error.message);
  }
  writeFileSync(output, JSON.stringify(result.reports, null, 2) + '\n');
  writeFileSync(
    metadata,
    JSON.stringify(
      {
        schemaVersion: 1,
        status,
        source: 'completed main CI artifacts (successful or failed runs with valid evidence)',
        currentRunId: runId || null,
        candidates: result.candidates,
        retainedHistoryRuns: result.reports.length,
        historyRunIds: result.reports.map((report) => report.provenance.runId),
        notes: result.notes,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('ENG-WP2.4 history: ' + status + ', accepted runs: ' + result.reports.length);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('WP2.4 history collector failed to write local evidence: ' + error.message);
    process.exitCode = 1;
  });
}
