import type Phaser from 'phaser';
import type { SceneCategory, SceneLoadBoundary } from './SceneCompositionContract';

export type SceneConstructor = new () => Phaser.Scene;
export type SceneRegistrationOwner = 'game-config' | 'bootstrap' | 'feature';

interface SceneManifestBase<Key extends string = string> {
  key: Key;
  category: SceneCategory;
  loadBoundary: SceneLoadBoundary;
  registrationOwner: SceneRegistrationOwner;
}

export interface StartupSceneManifestEntry<Key extends string = string>
  extends SceneManifestBase<Key> {
  loadBoundary: 'startup';
  registrationOwner: 'game-config';
}

export interface RuntimeSceneManifestEntry<Key extends string = string>
  extends SceneManifestBase<Key> {
  loadBoundary: 'runtime-eager' | 'on-demand';
  registrationOwner: 'bootstrap' | 'feature';
  load: () => Promise<SceneConstructor>;
}

export type SceneManifestEntry = StartupSceneManifestEntry | RuntimeSceneManifestEntry;

function startup<const Key extends string>(
  key: Key,
  category: SceneCategory,
): StartupSceneManifestEntry<Key> {
  return {
    key,
    category,
    loadBoundary: 'startup',
    registrationOwner: 'game-config',
  };
}

function runtime<const Key extends string>(
  key: Key,
  category: SceneCategory,
  loadBoundary: RuntimeSceneManifestEntry['loadBoundary'],
  registrationOwner: RuntimeSceneManifestEntry['registrationOwner'],
  load: () => Promise<SceneConstructor>,
): RuntimeSceneManifestEntry<Key> {
  return { key, category, loadBoundary, registrationOwner, load };
}

export const SCENE_MANIFEST = [
  startup('BootScene', 'bootstrap'),
  startup('PreloadScene', 'bootstrap'),
  startup('TitleScene', 'bootstrap'),
  startup('ResizeTestScene', 'diagnostic'),
  startup('MovementTestScene', 'diagnostic'),
  startup('MoonflowerGladeScene', 'exploration'),
  startup('CottageInteriorScene', 'interior'),
  runtime(
    'CottageDecorateScene',
    'interior',
    'on-demand',
    'feature',
    async () => (await import('./CottageDecorateScene')).CottageDecorateScene,
  ),
  startup('SunbeamVillageScene', 'exploration'),
  startup('RainbowMeadowScene', 'exploration'),
  startup('CrystalBrookScene', 'exploration'),
  startup('WhisperingWoodsScene', 'exploration'),
  startup('FireflyLanternScene', 'activity'),
  startup('RainbowRunEntryScene', 'race'),
  startup('NovaTutorialRaceScene', 'race'),
  startup('RaceScene', 'race'),
  startup('PipEggHatchScene', 'story'),
  startup('DoorwayStubScene', 'utility'),
  startup('DialogueTestScene', 'diagnostic'),
  startup('UnicornCreatorScene', 'onboarding'),
  runtime(
    'InventoryScene',
    'modal',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./InventoryScene')).InventoryScene,
  ),
  runtime(
    'WonderbookScene',
    'modal',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./WonderbookScene')).WonderbookScene,
  ),
  runtime(
    'ShopScene',
    'modal',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./ShopScene')).ShopScene,
  ),
  runtime(
    'VillageInteriorScene',
    'interior',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./R6VillageInteriorScene')).VillageInteriorScene,
  ),
  runtime(
    'HollowTreeNookScene',
    'interior',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./HollowTreeNookScene')).HollowTreeNookScene,
  ),
  runtime(
    'WindmillLookoutScene',
    'interior',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./WindmillLookoutScene')).WindmillLookoutScene,
  ),
  runtime(
    'CrystalGrottoScene',
    'interior',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./CrystalGrottoScene')).CrystalGrottoScene,
  ),
  runtime(
    'FireflyGroveScene',
    'interior',
    'runtime-eager',
    'bootstrap',
    async () => (await import('./FireflyGroveScene')).FireflyGroveScene,
  ),
  runtime(
    'CottageStyleScene',
    'modal',
    'on-demand',
    'feature',
    async () => (await import('./CottageStyleScene')).CottageStyleScene,
  ),
  runtime(
    'SettingsScene',
    'modal',
    'on-demand',
    'feature',
    async () => (await import('./SettingsScene')).SettingsScene,
  ),
  runtime(
    'StarlightBeachScene',
    'exploration',
    'on-demand',
    'feature',
    async () => (await import('./StarlightBeachScene')).StarlightBeachScene,
  ),
  runtime(
    'MapleBakingActivityScene',
    'activity',
    'on-demand',
    'feature',
    async () => (await import('../activities/MapleBakingActivityScene')).MapleBakingActivityScene,
  ),
  runtime(
    'CoralBeachcombingActivityScene',
    'activity',
    'on-demand',
    'feature',
    async () =>
      (await import('../activities/CoralBeachcombingActivityScene')).CoralBeachcombingActivityScene,
  ),
  runtime(
    'ExplorationHudOverlayScene',
    'hud',
    'on-demand',
    'feature',
    async () => (await import('../ui/ExplorationHudOverlayScene')).ExplorationHudOverlayScene,
  ),
] as const satisfies readonly SceneManifestEntry[];

export type SceneKey = (typeof SCENE_MANIFEST)[number]['key'];
export type StartupSceneKey = Extract<
  (typeof SCENE_MANIFEST)[number],
  { loadBoundary: 'startup' }
>['key'];

const SCENE_BY_KEY = new Map<SceneKey, SceneManifestEntry>(
  SCENE_MANIFEST.map((entry) => [entry.key, entry] as const),
);

export function getSceneManifestEntry(key: SceneKey): SceneManifestEntry {
  const entry = SCENE_BY_KEY.get(key);
  if (!entry) {
    throw new Error(`Unknown scene key: ${key}`);
  }
  return entry;
}

export function getStartupSceneKeys(): StartupSceneKey[] {
  return SCENE_MANIFEST.flatMap((entry) =>
    entry.loadBoundary === 'startup' ? [entry.key as StartupSceneKey] : [],
  );
}
