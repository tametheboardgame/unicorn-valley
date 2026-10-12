import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const STREAMS = ['world', 'just-games', 'story-house', 'engineering'];
const STATES = ['unclaimed', 'in_progress', 'waiting_human', 'blocked', 'complete'];
const SHA = /^[0-9a-f]{40}$/i;
const ROOT_GLOBALS = new Set(['PROJECT_STATE.json', 'STATUS.md']);
const STREAM_PATH = /^docs\/streams\/state\/([a-z-]+)\.json$/;
export const SHARED_SURFACES = [
  'src/game/minigames/MiniGameCatalogue.ts',
  'src/game/scenes/SceneKeys.ts',
  'src/game/scenes/SceneManifest.ts',
  'public/stories/catalogue.json',
];

export function streamFromBranch(branch) {
  if (typeof branch !== 'string') return null;
  if (/^agent\/(?:eng-|engineering-)/.test(branch)) return 'engineering';
  if (/^agent\/(?:mg-|just-games-)/.test(branch)) return 'just-games';
  if (/^agent\/(?:sh-|story-house-)/.test(branch)) return 'story-house';
  if (/^agent\/(?:world-|r\d+(?:\.\d+)?-)/.test(branch)) return 'world';
  return null;
}

export function validateStreamState(state, expectedStream) {
  const errors = [];
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return ['Expected one JSON stream-state object.'];
  }
  const allowed = [
    'schemaVersion', 'stream', 'status', 'workPackage', 'workPackagePath',
    'branch', 'prNumber', 'baseMainSha', 'updatedOn', 'note',
  ];
  const extra = Object.keys(state).filter(key => !allowed.includes(key));
  if (extra.length) errors.push('Unknown stream-state fields: ' + extra.join(', '));
  if (state.schemaVersion !== 1) errors.push('Stream-state schemaVersion must be 1.');
  if (!STREAMS.includes(expectedStream) || state.stream !== expectedStream) {
    errors.push('Stream-state file and stream identity disagree.');
  }
  if (!STATES.includes(state.status)) errors.push('Invalid stream status.');
  if (typeof state.updatedOn !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(state.updatedOn) ||
      Number.isNaN(Date.parse(state.updatedOn))) {
    errors.push('Invalid stream updatedOn date.');
  }
  if (typeof state.note !== 'string' || state.note.trim().length < 15) {
    errors.push('Stream status note must explain the last decision.');
  }
  const activeValues = [
    typeof state.workPackage === 'string' && state.workPackage.length > 3,
    typeof state.workPackagePath === 'string' && /^docs\/work-packages\/[a-zA-Z0-9_.-]+\.md$/.test(state.workPackagePath),
    typeof state.branch === 'string' && state.branch.length > 8,
    Number.isInteger(state.prNumber) && state.prNumber > 0,
    typeof state.baseMainSha === 'string' && SHA.test(state.baseMainSha),
  ];
  if (state.status === 'unclaimed' || state.status === 'complete') {
    if ([state.workPackage, state.workPackagePath, state.branch, state.prNumber, state.baseMainSha].some(value => value !== null)) {
      errors.push('Unclaimed/complete stream records cannot point to an active PR.');
    }
  } else if (activeValues.some(value => !value)) {
    errors.push('Active stream requires package, real path, branch, PR number and base-main SHA.');
  } else if (streamFromBranch(state.branch) !== expectedStream) {
    errors.push('Active stream branch namespace does not match record owner.');
  }
  return errors;
}

export function evaluateStreamFileOwnership({ branch, files, number, enforceFrom = 312 }) {
  const errors = [];
  const warnings = [];
  const stream = streamFromBranch(branch);
  if (!Array.isArray(files)) return { stream, errors: ['Missing cumulative PR file list.'], warnings };
  if (!Number.isInteger(number) || number < enforceFrom) {
    return { stream, errors, warnings, exempt: true };
  }
  if (!stream) {
    warnings.push('Unknown branch namespace; manual stream ownership review required.');
    return { stream, errors, warnings };
  }
  if (stream === 'engineering') return { stream, errors, warnings };
  for (const file of files) {
    const path = typeof file === 'string' ? file : file.filename;
    if (ROOT_GLOBALS.has(path)) {
      errors.push('Product stream must not rewrite global integration state: ' + path);
    }
    const match = path.match(STREAM_PATH);
    if (match && match[1] !== stream) {
      errors.push('Product stream may only update its own status record: ' + path);
    }
    if (SHARED_SURFACES.includes(path)) {
      warnings.push('Shared integration surface requires sole owner and coordination: ' + path);
    }
  }
  return { stream, errors, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let failed = false;
  for (const stream of STREAMS) {
    try {
      const data = JSON.parse(readFileSync('docs/streams/state/' + stream + '.json', 'utf8'));
      const errors = validateStreamState(data, stream);
      for (const error of errors) console.error('ERROR ' + stream + ': ' + error);
      if (errors.length) failed = true;
    } catch (error) {
      console.error('ERROR ' + stream + ': ' + error.message);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
  else console.log('ENG-WP2.5 stream-state contract: four records valid.');
}
