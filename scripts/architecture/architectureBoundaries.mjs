import path from 'node:path';

function normaliseRepoPath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function resolveRelativeImport(sourcePath, importSpecifier) {
  if (!importSpecifier.startsWith('.')) {
    return null;
  }

  return normaliseRepoPath(
    path.posix.normalize(
      path.posix.join(path.posix.dirname(normaliseRepoPath(sourcePath)), importSpecifier),
    ),
  ).replace(/\.(?:[cm]?js|tsx?)$/, '');
}

export const ARCHITECTURE_RULES = [
  {
    id: 'persistence-does-not-own-orchestration-or-presentation',
    sourcePrefix: 'src/game/save/',
    forbiddenTargetPrefixes: ['src/game/scenes/', 'src/game/ui/', 'src/game/application/'],
    rationale:
      'Persistence/domain code may expose save-compatible state and IDs, but scene, UI and application orchestration must depend on persistence rather than the reverse.',
  },
];

export const RETIRED_SOURCE_PATHS = new Map([
  [
    'src/game/scenes/VillageInteriorScene.ts',
    'H0J retired the duplicate pre-R6 VillageInteriorScene. The stable VillageInteriorScene key is owned by R6VillageInteriorScene through SceneManifest.',
  ],
]);

export function validateRetiredSourcePath(sourcePath) {
  const source = normaliseRepoPath(sourcePath);
  const rationale = RETIRED_SOURCE_PATHS.get(source);
  if (!rationale) {
    return [];
  }

  return [
    {
      ruleId: 'retired-source-path-does-not-return',
      sourcePath: source,
      importSpecifier: '<source>',
      resolvedTarget: source,
      rationale,
    },
  ];
}

export function validateDependency(sourcePath, importSpecifier) {
  const source = normaliseRepoPath(sourcePath);
  const target = resolveRelativeImport(source, importSpecifier);
  if (!target) {
    return [];
  }

  return ARCHITECTURE_RULES.flatMap((rule) => {
    if (!source.startsWith(rule.sourcePrefix)) {
      return [];
    }

    const forbiddenPrefix = rule.forbiddenTargetPrefixes.find((prefix) =>
      target.startsWith(prefix),
    );
    if (!forbiddenPrefix) {
      return [];
    }

    return [
      {
        ruleId: rule.id,
        sourcePath: source,
        importSpecifier,
        resolvedTarget: target,
        rationale: rule.rationale,
      },
    ];
  });
}

export function extractImportSpecifiers(sourceText) {
  const specifiers = new Set();
  const staticImportPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportPattern = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const match of sourceText.matchAll(staticImportPattern)) {
    specifiers.add(match[1]);
  }
  for (const match of sourceText.matchAll(dynamicImportPattern)) {
    specifiers.add(match[1]);
  }

  return [...specifiers];
}
