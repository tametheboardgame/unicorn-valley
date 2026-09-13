export const UNIT_GROUPS = Object.freeze({
  'settings-ui-accessibility': [
    'src/game/accessibility',
    'src/game/settings',
    'src/game/ui',
  ],
  audio: ['src/game/audio'],
  'input-player': ['src/game/input', 'src/game/player'],
  'world-navigation': ['src/game/world'],
  'interaction-dialogue': ['src/game/interaction', 'src/game/dialogue', 'src/game/population'],
  racing: ['src/game/racing'],
  'activities-economy': [
    'src/game/activities',
    'src/game/economy',
    'src/game/inventory',
    'src/game/home',
  ],
  'progression-story': [
    'src/game/story',
    'src/game/quests',
    'src/game/discovery',
    'src/game/relationships',
    'src/game/wonderbook',
    'src/game/suggestions',
    'src/content',
  ],
  onboarding: ['src/game/intro', 'src/game/player'],
  atmosphere: ['src/game/atmosphere'],
  'visual-presentation': ['src/game/visual', 'src/game/ui'],
});

export const BROWSER_GROUPS = Object.freeze({
  'settings-ui-accessibility': [
    'tests/play/r6-wp6.14-settings-pause-accessibility.spec.ts',
    'tests/play/r6-wp6.6-touch-accessibility.spec.ts',
    'tests/play/r6.5-wp18i-settings-scroll.spec.ts',
    'tests/play/r6.5-wp18j-responsive-concept-ui.spec.ts',
  ],
  audio: [
    'tests/play/r6.5-wp19g-mp3-audio-foundation.spec.ts',
    'tests/play/r6-wp6.14-settings-pause-accessibility.spec.ts',
  ],
  'input-player': [
    'tests/play/automated-playtest.spec.ts',
    'tests/play/r6-wp6.18c-click-navigation-facing.spec.ts',
    'tests/play/r6-wp6.6-touch-accessibility.spec.ts',
    'tests/play/r6.5-wp19d-remediation.spec.ts',
  ],
  'world-navigation': [
    'tests/play/automated-playtest.spec.ts',
    'tests/play/r6.5-world-state-continue.spec.ts',
    'tests/play/r6.5-wp19b-world-navigation.spec.ts',
  ],
  'interaction-dialogue': [
    'tests/play/automated-playtest.spec.ts',
    'tests/play/r6-wp6.15-global-ui-dialogue-transition.spec.ts',
    'tests/play/r6.5-wp19d-remediation.spec.ts',
  ],
  racing: [
    'tests/play/r6-wp6.18e-crystal-cascade-balance.spec.ts',
    'tests/play/r6-wp6.18h-mobile-race-controls.spec.ts',
    'tests/play/r6.5-wp12-race-expansion.spec.ts',
  ],
  'activities-economy': [
    'tests/play/r6.5-wp14-repeatable-activities.spec.ts',
    'tests/play/r6.5-wp18e-bag-map-food.spec.ts',
    'tests/play/r6-wp6.18d1-sunbeam-shops.spec.ts',
  ],
  'progression-story': [
    'tests/play/r6.5-wp11-existing-valley-quest-pack.spec.ts',
    'tests/play/r6.5-wp13-cross-region-followups.spec.ts',
    'tests/play/r6.5-wp15-wonderbook-progress.spec.ts',
  ],
  onboarding: [
    'tests/play/r6-wp6.11-main-menu-deluxe.spec.ts',
    'tests/play/r6-wp6.12-profile-redesign.spec.ts',
    'tests/play/r6-wp6.13-unicorn-creator-plus.spec.ts',
  ],
  atmosphere: [
    'tests/play/r5-wp5.9c-global-atmosphere-weather.spec.ts',
    'tests/play/r6.5-final-graphics-tightening.spec.ts',
  ],
  'visual-presentation': [
    'tests/play/r6.5-wp18j-responsive-concept-ui.spec.ts',
    'tests/play/r6.5-wp19f-ui-consistency.spec.ts',
    'tests/play/r6.5-final-graphics-tightening.spec.ts',
  ],
});

export const ESCALATION_GLOBS = Object.freeze([
  '.github/**',
  'scripts/**',
  'package.json',
  'package-lock.json',
  'tsconfig*.json',
  'vite.config.*',
  'playwright*.config.*',
  'biome.json',
  'src/main.ts',
  'src/game/application/**',
  'src/game/save/**',
  'src/game/events/**',
  'src/game/config/**',
  'src/game/performance/**',
  'src/game/scenes/SceneManifest*',
  'src/game/scenes/SceneRuntimeRegistry*',
  'src/game/scenes/SceneComposition*',
  'src/game/scenes/SceneLifecycleScope*',
  'tests/support/**',
  'tests/deployment/**',
]);

export const OWNERSHIP_MAP = Object.freeze([
  {
    id: 'settings-ui-accessibility',
    sourceGlobs: [
      'src/game/accessibility/**',
      'src/game/settings/**',
      'src/game/ui/**',
      'src/game/scenes/SettingsScene.ts',
      'src/settingsAudioControls.css',
    ],
    unitGroups: ['settings-ui-accessibility'],
    browserGroups: ['settings-ui-accessibility'],
  },
  {
    id: 'audio',
    sourceGlobs: [
      'src/game/audio/**',
      'src/generated/audioCatalogue.ts',
      'src/settingsAudioControls.css',
      'public/audio/**',
    ],
    unitGroups: ['audio'],
    browserGroups: ['audio'],
  },
  {
    id: 'input-player',
    sourceGlobs: ['src/game/input/**', 'src/game/player/**'],
    unitGroups: ['input-player'],
    browserGroups: ['input-player'],
  },
  {
    id: 'world-navigation',
    sourceGlobs: ['src/game/world/**', 'src/game/scenes/**'],
    unitGroups: ['world-navigation'],
    browserGroups: ['world-navigation'],
  },
  {
    id: 'interaction-dialogue',
    sourceGlobs: ['src/game/interaction/**', 'src/game/dialogue/**', 'src/game/population/**'],
    unitGroups: ['interaction-dialogue'],
    browserGroups: ['interaction-dialogue'],
  },
  {
    id: 'racing',
    sourceGlobs: [
      'src/game/racing/**',
      'src/game/scenes/RaceScene.ts',
      'src/game/scenes/NovaTutorialRaceScene.ts',
      'src/game/scenes/RainbowRunEntryScene.ts',
    ],
    unitGroups: ['racing'],
    browserGroups: ['racing'],
  },
  {
    id: 'activities-economy',
    sourceGlobs: [
      'src/game/activities/**',
      'src/game/economy/**',
      'src/game/inventory/**',
      'src/game/home/**',
      'src/game/scenes/InventoryScene.ts',
      'src/game/scenes/ShopScene.ts',
    ],
    unitGroups: ['activities-economy'],
    browserGroups: ['activities-economy'],
  },
  {
    id: 'progression-story',
    sourceGlobs: [
      'src/game/story/**',
      'src/game/quests/**',
      'src/game/discovery/**',
      'src/game/relationships/**',
      'src/game/wonderbook/**',
      'src/game/suggestions/**',
      'src/game/scenes/WonderbookScene.ts',
      'src/content/**',
    ],
    unitGroups: ['progression-story'],
    browserGroups: ['progression-story'],
  },
  {
    id: 'onboarding',
    sourceGlobs: [
      'src/game/intro/**',
      'src/game/scenes/TitleScene.ts',
      'src/game/scenes/UnicornCreatorScene.ts',
      'src/game/scenes/PipEggHatchScene.ts',
    ],
    unitGroups: ['onboarding'],
    browserGroups: ['onboarding'],
  },
  {
    id: 'atmosphere',
    sourceGlobs: ['src/game/atmosphere/**'],
    unitGroups: ['atmosphere'],
    browserGroups: ['atmosphere'],
  },
  {
    id: 'visual-presentation',
    sourceGlobs: [
      'src/game/visual/**',
      'src/*.css',
      'src/**/*.css',
      'public/**',
    ],
    unitGroups: ['visual-presentation'],
    browserGroups: ['visual-presentation'],
  },
]);

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

export function globToRegExp(glob) {
  const placeholder = '__DOUBLE_STAR__';
  const escaped = escapeRegex(glob)
    .replaceAll('**', placeholder)
    .replaceAll('*', '[^/]*')
    .replaceAll(placeholder, '.*');
  return new RegExp(`^${escaped}$`);
}

export function matchesGlob(path, glob) {
  return globToRegExp(glob).test(path);
}

function matchesAnyGlob(path, globs) {
  return globs.some((glob) => matchesGlob(path, glob));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function isDocumentation(path) {
  return (
    path.startsWith('docs/') ||
    /(^|\/)(README|AGENTS|TESTING)\.md$/.test(path) ||
    ['STATUS.md', 'PROJECT_STATE.json', 'ROADMAP.md', 'CHANGELOG.md'].includes(path)
  );
}

function isDirectUnitTest(path) {
  return path.startsWith('src/') && /\.test\.[cm]?[jt]sx?$/.test(path);
}

function isDirectBrowserTest(path) {
  return path.startsWith('tests/play/') && path.endsWith('.spec.ts');
}

function isRelatedRuntimeSource(path) {
  return (
    path.startsWith('src/') &&
    /\.[cm]?[jt]sx?$/.test(path) &&
    !isDirectUnitTest(path) &&
    !path.endsWith('.d.ts')
  );
}

function isRuntimeOrTestPath(path) {
  return path.startsWith('src/') || path.startsWith('public/') || path.startsWith('tests/');
}

export function selectVerificationOwnership(files, options = {}) {
  const changedFiles = uniqueSorted(files.filter(Boolean));
  if (options.forceFull === true) {
    return {
      owners: ['authoritative-full'],
      unitMode: 'full',
      unitGroups: ['full'],
      unitFilters: [],
      unitRelatedFiles: [],
      directUnitTests: [],
      browserGroups: ['full'],
      browserTests: [],
      escalateFull: false,
      escalationReason: null,
      unmappedFiles: [],
    };
  }

  const escalationFiles = changedFiles.filter((path) => matchesAnyGlob(path, ESCALATION_GLOBS));
  if (escalationFiles.length > 0) {
    return {
      owners: [],
      unitMode: 'full',
      unitGroups: ['full'],
      unitFilters: [],
      unitRelatedFiles: [],
      directUnitTests: [],
      browserGroups: ['full'],
      browserTests: [],
      escalateFull: true,
      escalationReason: `ownership escalation path: ${escalationFiles.join(', ')}`,
      unmappedFiles: [],
    };
  }

  const owners = [];
  const unitGroups = [];
  const browserGroups = [];
  const mappedFiles = new Set();

  for (const rule of OWNERSHIP_MAP) {
    const matchingFiles = changedFiles.filter((path) => matchesAnyGlob(path, rule.sourceGlobs));
    if (matchingFiles.length === 0) continue;
    owners.push(rule.id);
    unitGroups.push(...rule.unitGroups);
    browserGroups.push(...rule.browserGroups);
    for (const path of matchingFiles) mappedFiles.add(path);
  }

  const directUnitTests = changedFiles.filter(isDirectUnitTest);
  const directBrowserTests = changedFiles.filter(isDirectBrowserTest);
  for (const path of [...directUnitTests, ...directBrowserTests]) mappedFiles.add(path);
  for (const path of changedFiles.filter(isDocumentation)) mappedFiles.add(path);

  const unmappedFiles = changedFiles.filter(
    (path) => isRuntimeOrTestPath(path) && !mappedFiles.has(path),
  );
  if (unmappedFiles.length > 0) {
    return {
      owners: uniqueSorted(owners),
      unitMode: 'full',
      unitGroups: ['full'],
      unitFilters: [],
      unitRelatedFiles: [],
      directUnitTests: uniqueSorted(directUnitTests),
      browserGroups: ['full'],
      browserTests: [],
      escalateFull: true,
      escalationReason: `unmapped runtime/test ownership; fail-safe escalation: ${unmappedFiles.join(', ')}`,
      unmappedFiles,
    };
  }

  const selectedUnitGroups = uniqueSorted(unitGroups);
  const unitFilters = uniqueSorted(
    selectedUnitGroups.flatMap((group) => UNIT_GROUPS[group] ?? []),
  );
  const selectedBrowserGroups = uniqueSorted(browserGroups);
  const browserTests = uniqueSorted([
    ...selectedBrowserGroups.flatMap((group) => BROWSER_GROUPS[group] ?? []),
    ...directBrowserTests,
  ]);
  const unitRelatedFiles = uniqueSorted(changedFiles.filter(isRelatedRuntimeSource));
  const selectedDirectUnitTests = uniqueSorted(directUnitTests);
  const hasUnitSelection =
    unitFilters.length > 0 || unitRelatedFiles.length > 0 || selectedDirectUnitTests.length > 0;

  return {
    owners: uniqueSorted(owners),
    unitMode: hasUnitSelection ? 'selected' : 'none',
    unitGroups: selectedUnitGroups,
    unitFilters,
    unitRelatedFiles,
    directUnitTests: selectedDirectUnitTests,
    browserGroups: selectedBrowserGroups,
    browserTests,
    escalateFull: false,
    escalationReason: null,
    unmappedFiles: [],
  };
}
