const DOC_OR_STATE_PATTERNS = [
  /^docs\//,
  /(^|\/)README\.md$/,
  /(^|\/)AGENTS\.md$/,
  /(^|\/)TESTING\.md$/,
  /^STATUS\.md$/,
  /^PROJECT_STATE\.json$/,
  /^ROADMAP\.md$/,
  /^CHANGELOG\.md$/,
];

const MICRO_PRESENTATION_PATTERNS = [/^src\/.*\.css$/];

const CROSS_CUTTING_PATTERNS = [
  /^\.github\//,
  /^scripts\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^tsconfig(?:\..+)?\.json$/,
  /^vite\.config\./,
  /^playwright(?:\..+)?\.config\./,
  /^biome\.json$/,
  /^src\/main\.ts$/,
  /^src\/game\/(application|save|events|config)\//,
  /^src\/game\/scenes\/(SceneManifest|SceneRuntimeRegistry|SceneComposition|SceneLifecycleScope)/,
  /^tests\/support\//,
];

const BOUNDED_RUNTIME_PATTERNS = [
  /^src\/game\/[^/]+\//,
  /^src\/content\//,
  /^src\/[^/]+\.ts$/,
  /^public\//,
  /^tests\/play\//,
  /^tests\/deployment\//,
];

function matchesAny(path, patterns) {
  return patterns.some((pattern) => pattern.test(path));
}

export function classifyVerification(files, options = {}) {
  const changedFiles = [...new Set(files.filter(Boolean))].sort();
  const forceFull = options.forceFull === true;
  const reason = options.reason ?? null;

  if (forceFull) {
    return fullPlan(changedFiles, reason ?? 'authoritative full qualification requested');
  }

  if (changedFiles.length === 0) {
    return fullPlan(changedFiles, 'no changed files resolved; fail-safe escalation');
  }

  const allDocsOrState = changedFiles.every((path) => matchesAny(path, DOC_OR_STATE_PATTERNS));
  if (allDocsOrState) {
    return {
      changeClass: 'docs-only',
      reason: 'all changed files are durable documentation or project state',
      changedFiles,
      tiers: ['0'],
      runTypecheck: false,
      runUnit: false,
      runBuild: false,
      runPerformance: false,
      runTier2: false,
      runTier3: false,
      runTier4: false,
      runProjectContract: true,
      browserGroup: 'none',
    };
  }

  const allDocsOrMicroPresentation = changedFiles.every(
    (path) =>
      matchesAny(path, DOC_OR_STATE_PATTERNS) || matchesAny(path, MICRO_PRESENTATION_PATTERNS),
  );
  const hasPresentationChange = changedFiles.some((path) =>
    matchesAny(path, MICRO_PRESENTATION_PATTERNS),
  );
  if (allDocsOrMicroPresentation && hasPresentationChange) {
    return {
      changeClass: 'micro-fix',
      reason: 'bounded CSS/presentation-only change',
      changedFiles,
      tiers: ['0', '2'],
      runTypecheck: false,
      runUnit: false,
      runBuild: true,
      runPerformance: true,
      runTier2: true,
      runTier3: false,
      runTier4: false,
      runProjectContract: changedFiles.some((path) => matchesAny(path, DOC_OR_STATE_PATTERNS)),
      browserGroup: 'presentation-smoke',
    };
  }

  const crossCuttingFiles = changedFiles.filter((path) =>
    matchesAny(path, CROSS_CUTTING_PATTERNS),
  );
  if (crossCuttingFiles.length > 0) {
    return fullPlan(
      changedFiles,
      `shared/core/build/test-infrastructure change: ${crossCuttingFiles.join(', ')}`,
    );
  }

  const allBounded = changedFiles.every(
    (path) =>
      matchesAny(path, DOC_OR_STATE_PATTERNS) || matchesAny(path, BOUNDED_RUNTIME_PATTERNS),
  );
  if (allBounded) {
    return {
      changeClass: 'bounded-feature',
      reason: 'runtime/test changes are contained outside shared escalation paths',
      changedFiles,
      tiers: ['0', '1', '2'],
      runTypecheck: true,
      runUnit: true,
      runBuild: true,
      runPerformance: true,
      runTier2: true,
      runTier3: false,
      runTier4: false,
      runProjectContract: changedFiles.some((path) => matchesAny(path, DOC_OR_STATE_PATTERNS)),
      browserGroup: 'critical-runtime-smoke',
    };
  }

  const unknownFiles = changedFiles.filter(
    (path) =>
      !matchesAny(path, DOC_OR_STATE_PATTERNS) &&
      !matchesAny(path, MICRO_PRESENTATION_PATTERNS) &&
      !matchesAny(path, CROSS_CUTTING_PATTERNS) &&
      !matchesAny(path, BOUNDED_RUNTIME_PATTERNS),
  );
  return fullPlan(
    changedFiles,
    `unknown/unmapped change; fail-safe escalation: ${unknownFiles.join(', ') || 'mixed paths'}`,
  );
}

function fullPlan(changedFiles, reason) {
  return {
    changeClass: 'full-qualification',
    reason,
    changedFiles,
    tiers: ['0', '1', '3', '4'],
    runTypecheck: true,
    runUnit: true,
    runBuild: true,
    runPerformance: true,
    runTier2: false,
    runTier3: true,
    runTier4: true,
    runProjectContract: true,
    browserGroup: 'full',
  };
}
