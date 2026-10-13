import { streamFromBranch } from './streamStatePolicy.mjs';

const sharedRegistrationPaths = new Set([
  'src/game/minigames/MiniGameCatalogue.ts',
  'src/game/scenes/SceneKeys.ts',
  'src/game/scenes/SceneManifest.ts',
  'public/stories/catalogue.json',
]);

function filePaths(pr) {
  return new Set((pr.files ?? []).map((file) => (typeof file === 'string' ? file : file.filename)));
}

export function inspectConcurrentPrs(prs) {
  const errors = [];
  const overlaps = [];
  const previews = [];
  const seen = new Set();
  const urls = new Map();
  for (const pr of prs) {
    if (seen.has(pr.number)) errors.push('Duplicate PR number: ' + pr.number);
    seen.add(pr.number);
    const stream = streamFromBranch(pr.branch);
    const preview = pr.preview;
    if (!stream || !preview) continue;
    const url = preview.branchUrl;
    const validUrl =
      typeof url === 'string' && /^https:\/\/[a-z0-9-]+\.unicorn-valley\.pages\.dev\/?$/.test(url);
    const matchesHead =
      typeof preview.deployedPrefix === 'string' &&
      typeof pr.headSha === 'string' &&
      pr.headSha.startsWith(preview.deployedPrefix) &&
      preview.deployedPrefix.length >= 7;
    const confirmed = validUrl && matchesHead && preview.status === 'success';
    previews.push({
      number: pr.number,
      stream,
      url: validUrl ? url : null,
      headBound: matchesHead,
      reportedSuccessful: confirmed,
    });
    if (validUrl && urls.has(url) && urls.get(url) !== pr.number) {
      errors.push('Independent PRs share one branch preview URL: ' + url);
    }
    if (validUrl) urls.set(url, pr.number);
  }
  for (let i = 0; i < prs.length; i++) {
    for (let j = i + 1; j < prs.length; j++) {
      const a = prs[i];
      const b = prs[j];
      const bFiles = filePaths(b);
      for (const path of filePaths(a)) {
        if (!bFiles.has(path)) continue;
        overlaps.push({
          path,
          prs: [a.number, b.number],
          streams: [streamFromBranch(a.branch), streamFromBranch(b.branch)],
          registration: sharedRegistrationPaths.has(path),
        });
      }
    }
  }
  return { errors, overlaps, previews };
}

export function evaluateFinalOverlap(candidate, otherPrs) {
  const result = inspectConcurrentPrs([candidate, ...otherPrs]);
  const errors = [...result.errors];
  const warnings = [];
  for (const conflict of result.overlaps) {
    if (!conflict.prs.includes(candidate.number)) continue;
    const other = conflict.prs.find((number) => number !== candidate.number);
    if (candidate.number < 312) {
      warnings.push('Pre-rollout PR should reconcile shared file ' + conflict.path);
      continue;
    }
    errors.push(
      'Unresolved overlap with open PR #' +
        other +
        ': ' +
        conflict.path +
        '. Agree sole owner and serialise integration before ready-for-review.',
    );
  }
  return { passed: errors.length === 0, errors, warnings, overlaps: result.overlaps };
}

/** Model the generator's published-only, title-sorted catalogue projection. */
export function projectIntegratedStoryCatalogue(base, changes) {
  const byId = new Map();
  for (const entry of [...base, ...changes.flat()]) {
    if (!entry || typeof entry.id !== 'string' || !entry.id) {
      throw new Error('Story entry requires an ID.');
    }
    if (byId.has(entry.id)) {
      throw new Error('Conflicting story ID; regenerate from the integrated source: ' + entry.id);
    }
    byId.set(entry.id, entry);
  }
  return [...byId.values()]
    .filter((story) => story.publication === 'published')
    .sort((a, b) => a.title.localeCompare(b.title));
}
