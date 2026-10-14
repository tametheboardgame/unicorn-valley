import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { allocateByDuration, validateCleanSnapshot } from './shadowShardPlanner.mjs';

const SHA = /^[0-9a-f]{40}$/i;
const SPEC = /^tests\/play\/[a-zA-Z0-9_./-]+\.spec\.ts$/;
const COUNTS = [6, 8, 10, 12];
const ASSUMED_SETUP_MS = 90_000;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
}

function expectSource(provenance, label, sourceSha, headSha, runId) {
  if (
    !provenance ||
    !SHA.test(provenance.sourceSha ?? '') ||
    !SHA.test(provenance.headSha ?? '') ||
    !/^\d+$/.test(String(provenance.runId ?? '')) ||
    provenance.sourceSha !== sourceSha ||
    provenance.headSha !== headSha ||
    provenance.runId !== runId
  ) {
    throw new Error(label + ' source/head SHA or run ID is stale or invalid');
  }
}

/** Discovery is authoritative: historical health must never choose which specs exist. */
export function indexDiscovery(discovery, expected) {
  const provenance = discovery?.provenance;
  if (discovery?.schemaVersion !== 1 || discovery.mode !== 'discovery' ||
    provenance?.shard !== 'all/6' || !Array.isArray(discovery.tests) ||
    discovery.tests.length === 0) {
    throw new Error('Missing or invalid full discovery evidence');
  }
  expectSource(provenance, 'Discovery', expected.sourceSha, expected.headSha, expected.runId);
  const files = new Map();
  const ids = new Set();
  for (const item of discovery.tests) {
    if ((!SPEC.test(item.file ?? '') || item.file.includes('/../') || item.file.includes('/./')) ||
      typeof item.identity !== 'string' ||
      !item.identity || item.status !== 'discovered' || ids.has(item.identity)) {
      throw new Error('Discovery has duplicate, missing or invalid test identities/specs');
    }
    ids.add(item.identity);
    const group = files.get(item.file) ?? [];
    group.push(item.identity);
    files.set(item.file, group);
  }
  if (discovery.summary?.tests !== ids.size ||
    discovery.summary?.files !== files.size ||
    discovery.files?.length !== files.size) {
    throw new Error('Discovery summary or file identity inventory disagrees');
  }
  for (const summary of discovery.files) {
    if (!files.has(summary.path) || files.get(summary.path).length !== summary.tests) {
      throw new Error('Discovery per-file counts do not cover all identities');
    }
  }
  return files;
}

function healthyHistory(history, files, runId) {
  if (!Array.isArray(history)) throw new Error('Historical evidence is not an array');
  const ids = new Set([String(runId)]);
  const accepted = [];
  const rejected = [];
  for (const snapshot of history) {
    const id = String(snapshot?.provenance?.runId ?? 'unknown');
    try {
      const records = validateCleanSnapshot(snapshot, { historical: true });
      if (ids.has(id)) throw new Error('Duplicate/current historical run ID');
      ids.add(id);
      const known = new Map(records.map((x) => [x.path, x]));
      // Historical removal/addition is allowed: current manifest is always complete.
      const comparable = [...files].filter(([path, identity]) =>
        known.has(path) && known.get(path).tests === identity.length).length;
      if (!comparable) throw new Error('No comparable files');
      accepted.push({ runId: id, records: known, comparable });
    } catch (error) {
      rejected.push({ runId: id, reason: error.message });
    }
  }
  return { accepted: accepted.slice(0, 10), rejected };
}

function fileWeights(files, history) {
  const positive = history.accepted.flatMap((run) =>
    [...run.records.values()].filter((x) => x.durationMs > 0).map((x) => x.durationMs));
  positive.sort((a, b) => a - b);
  const unknownMs = positive.length
    ? Math.max(60_000, positive[Math.min(positive.length - 1, Math.ceil(positive.length * 0.9) - 1)])
    : 120_000;
  const weighted = [...files].map(([path, identities]) => {
    const samples = history.accepted.map((run) => run.records.get(path))
      .filter((record) => record?.tests === identities.length && record.durationMs > 0)
      .map((record) => record.durationMs);
    return { path, durationMs: samples.length ? median(samples) : unknownMs,
      historicalSamples: samples.length };
  });
  return { weighted, unknownMs, unknownFiles: weighted.filter((x) => x.historicalSamples === 0).length };
}

function exactPartition(files, shards) {
  const expected = new Set(files.keys());
  const assigned = new Set();
  const identities = new Set();
  for (const shard of shards) {
    if (!shard.files?.length) throw new Error('Empty shard in candidate manifest');
    for (const file of shard.files) {
      if (!expected.has(file) || assigned.has(file)) throw new Error('Missing, duplicated or foreign allocated file');
      assigned.add(file);
      for (const identity of files.get(file)) {
        if (identities.has(identity)) throw new Error('Duplicate assigned identity');
        identities.add(identity);
      }
    }
  }
  if (assigned.size !== expected.size ||
    identities.size !== [...files.values()].reduce((sum, items) => sum + items.length, 0)) {
    throw new Error('Candidate assignment loses discovered tests or files');
  }
}

/** A phase-one candidate only. CI's known-good static-six runners remain authoritative. */
export function buildAdaptiveCandidate({
  discovery, history = [], sourceSha, headSha, runId, activate = false,
  allowMeasuredNonSix = false,
}) {
  if (!SHA.test(sourceSha ?? '') || !SHA.test(headSha ?? '') ||
      !/^\d+$/.test(String(runId ?? ''))) {
    throw new Error('Expected complete source/head SHA and run ID');
  }
  const files = indexDiscovery(discovery, { sourceSha, headSha, runId: String(runId) });
  const historical = healthyHistory(history, files, runId);
  const { weighted, unknownMs, unknownFiles } = fileWeights(files, historical);
  const plans = {};
  for (const count of COUNTS) {
    if (files.size < count) continue;
    const shards = allocateByDuration(weighted, count);
    exactPartition(files, shards);
    plans[count] = {
      count,
      maxPredictedMs: Math.max(...shards.map((x) => x.durationMs)) + ASSUMED_SETUP_MS,
      totalPredictedRunnerMs: shards.reduce((sum, x) => sum + x.durationMs + ASSUMED_SETUP_MS, 0),
      shards: shards.map((entry) => ({
        id: entry.id, durationMs: entry.durationMs,
        files: entry.files,
        identities: entry.files.flatMap((file) => files.get(file)).sort(),
      })),
    };
  }
  if (!plans[6]) throw new Error('Fewer than six test spec files: static fallback unavailable');
  // Never authorise non-six execution on estimated timings alone.
  // Safety lock for the candidate-only phase: observations and a flag do not prove
  // wall-clock improvement, runner cost, correct execution or safe rollback.
  // WP3.3 activation must add an independently qualified approval contract.
  void activate;
  void allowMeasuredNonSix;
  const measuredProof = false;
  const choice = 6;
  return {
    schemaVersion: 1,
    mode: 'candidate-only-static-six-remains-live',
    provenance: { sourceSha, headSha, runId: String(runId) },
    summary: {
      discoveredFiles: files.size,
      discoveredIdentities: discovery.tests.length,
      cleanHistoryRuns: historical.accepted.length,
      rejectedHistory: historical.rejected,
      unknownFiles, conservativeUnknownDurationMs: unknownMs,
      recommendedCount: choice,
      nonSixActivationEligible: measuredProof,
      activationSafetyNote: 'Non-six activation needs independent measured Merge Gate and cost evidence; never infer proof from modelled durations.',
    },
    plans,
    // This can support a future bounded GitHub fromJSON matrix after independently qualified activation.
    proposedMatrix: { include: plans[choice].shards.map((shard) => ({
      shard: shard.id, total: choice, artifact: 'tier3-chromium-' + shard.id + '-of-' + choice,
    })) },
  };
}

/** Post-run safety: correct counts alone are never sufficient. */
export function verifyAdaptiveExecution({ discovery, candidate, shards }) {
  const provenance = candidate?.provenance;
  const files = indexDiscovery(discovery, provenance);
  const count = candidate?.summary?.recommendedCount;
  const planned = candidate?.plans?.[count]?.shards;
  if (!Array.isArray(planned) || planned.length !== count ||
      !Array.isArray(shards) || shards.length !== count) {
    throw new Error('Missing planned or reported shard evidence');
  }
  exactPartition(files, planned);
  const actual = new Map(shards.map((shard) => [shard.provenance?.shard, shard]));
  if (actual.size !== count) throw new Error('Missing or duplicate execution shards');
  const covered = new Set();
  const identitiesToFile = new Map(discovery.tests.map((test) => [test.identity, test.file]));
  for (const assigned of planned) {
    const id = assigned.id + '/' + count;
    const shard = actual.get(id);
    if (!shard || shard.mode !== 'execution') throw new Error('Required execution shard missing');
    expectSource(shard.provenance, 'Execution', provenance.sourceSha, provenance.headSha, provenance.runId);
    const intended = new Set(assigned.identities);
    const found = new Set();
    for (const item of shard.tests ?? []) {
      if (!intended.has(item.identity) || item.file !== identitiesToFile.get(item.identity) ||
          found.has(item.identity) ||
          !['expected', 'skipped'].includes(item.status)) {
        throw new Error('Unexpected, failed, repeated or wrongly assigned test identity');
      }
      found.add(item.identity);
      covered.add(item.identity);
    }
    if (found.size !== intended.size) throw new Error('Missing test identity in execution shard');
  }
  if (covered.size !== discovery.tests.length) throw new Error('Incomplete executed test inventory');
  return { complete: true, identities: covered.size, shards: count };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (name) => process.argv.find((part) => part.startsWith('--' + name + '='))?.slice(name.length + 3);
    if (!arg('discovery') || !arg('history') || !arg('output')) throw new Error('Expected --discovery, --history and --output');
    const candidate = buildAdaptiveCandidate({
      discovery: JSON.parse(readFileSync(arg('discovery'), 'utf8')),
      history: JSON.parse(readFileSync(arg('history'), 'utf8')),
      sourceSha: process.env.GITHUB_SHA,
      headSha: process.env.TEST_EVIDENCE_HEAD_SHA,
      runId: process.env.GITHUB_RUN_ID,
    });
    writeFileSync(arg('output'), JSON.stringify(candidate, null, 2) + '\n');
    console.log('ENG-WP3.3 safe candidate: ' + JSON.stringify(candidate.summary));
  } catch (error) {
    console.error('::error title=WP3.3 candidate incomplete::' + error.message);
    process.exitCode = 1;
  }
}
