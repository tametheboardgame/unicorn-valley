import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { indexDiscovery } from './adaptiveShardPlan.mjs';

const SIX = [1, 2, 3, 4, 5, 6];
const SHA = /^[a-f0-9]{40}$/i;

export function validateManifestCandidate({ candidate, discovery, sourceSha, headSha, runId }) {
  if (
    !SHA.test(sourceSha ?? '') ||
    !SHA.test(headSha ?? '') ||
    !/^\d+$/.test(String(runId ?? ''))
  ) {
    throw new Error('Expected complete source/head SHA and run ID');
  }
  const expected = { sourceSha, headSha, runId: String(runId) };
  const files = indexDiscovery(discovery, expected);
  const p = candidate?.provenance;
  if (
    candidate?.schemaVersion !== 1 ||
    candidate.mode !== 'candidate-only-static-six-remains-live' ||
    p?.sourceSha !== sourceSha ||
    p?.headSha !== headSha ||
    p?.runId !== String(runId) ||
    candidate.summary?.recommendedCount !== 6 ||
    candidate.summary?.nonSixActivationEligible !== false ||
    candidate.summary?.discoveredFiles !== files.size ||
    candidate.summary?.discoveredIdentities !== discovery.tests.length
  ) {
    throw new Error('Candidate is stale, incomplete or non-six activation is unqualified');
  }
  const shards = candidate.plans?.[6]?.shards;
  if (!Array.isArray(shards) || shards.length !== 6) throw new Error('Missing six canary shards');
  const expectedPaths = new Set(files.keys());
  const assignedPaths = new Set();
  const assignedIds = new Set();
  for (let i = 0; i < shards.length; i++) {
    const shard = shards[i];
    if (
      shard.id !== i + 1 ||
      !Array.isArray(shard.files) ||
      !shard.files.length ||
      !Array.isArray(shard.identities)
    )
      throw new Error('Invalid or empty canary shard');
    const ids = new Set();
    for (const path of shard.files) {
      if (!expectedPaths.has(path) || assignedPaths.has(path)) {
        throw new Error('Foreign or duplicated assigned file in candidate');
      }
      assignedPaths.add(path);
      for (const id of files.get(path)) {
        if (assignedIds.has(id)) throw new Error('Duplicate identity across planned shards');
        assignedIds.add(id);
        ids.add(id);
      }
    }
    if (
      ids.size !== shard.identities.length ||
      shard.identities.some((id) => !ids.has(id)) ||
      new Set(shard.identities).size !== ids.size
    ) {
      throw new Error('Candidate identities differ from assigned source files');
    }
  }
  if (assignedPaths.size !== expectedPaths.size || assignedIds.size !== discovery.tests.length) {
    throw new Error('Candidate omitted a discovered file or test');
  }
  return shards;
}

export function selectTier3Matrix({
  canary = false,
  candidate,
  discovery,
  sourceSha,
  headSha,
  runId,
}) {
  const mode = canary ? 'manifest6' : 'static6';
  if (canary) validateManifestCandidate({ candidate, discovery, sourceSha, headSha, runId });
  return {
    schemaVersion: 1,
    mode,
    provenance: { sourceSha, headSha, runId: String(runId) },
    matrix: { include: SIX.map((shard) => ({ shard, total: 6, mode })) },
    reason: canary
      ? 'Isolated six-way file-manifest canary, independently checked against full discovery'
      : 'Previously qualified Playwright --shard static-six fallback',
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const arg = (name) =>
      process.argv.find((item) => item.startsWith('--' + name + '='))?.slice(name.length + 3);
    if (!arg('output') || !process.env.GITHUB_OUTPUT) {
      throw new Error('Expected --output and GitHub job output');
    }
    const canary = process.env.WP33_CANARY === 'true';
    const plan = selectTier3Matrix({
      canary,
      ...(canary
        ? {
            candidate: JSON.parse(readFileSync(arg('candidate'), 'utf8')),
            discovery: JSON.parse(readFileSync(arg('discovery'), 'utf8')),
          }
        : {}),
      sourceSha: process.env.GITHUB_SHA,
      headSha: process.env.TEST_EVIDENCE_HEAD_SHA,
      runId: process.env.GITHUB_RUN_ID,
    });
    writeFileSync(arg('output'), JSON.stringify(plan, null, 2) + '\n');
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      'matrix=' + JSON.stringify(plan.matrix) + '\n' + 'mode=' + plan.mode + '\n',
    );
    console.log(
      'ENG-WP3.3 Tier 3 execution mode: ' + plan.mode + ', jobs=' + plan.matrix.include.length,
    );
  } catch (error) {
    console.error('::error title=WP3.3 matrix selection rejected::' + error.message);
    process.exitCode = 1;
  }
}
