import type Phaser from 'phaser';
import type { SceneCategory, SceneLoadBoundary } from './SceneCompositionContract';
import type { SceneKey } from './SceneKeys';
export { isSceneKey } from './SceneKeys';
export type { SceneKey } from './SceneKeys';

export type SceneConstructor = new () => Phaser.Scene;
export type SceneRegistrationOwner = 'game-config' | 'bootstrap' | 'feature';

interface SceneManifestBase<Key extends SceneKey = SceneKey> {
  key: Key;
  category: SceneCategory;
  loadBoundary: SceneLoadBoundary;
  registrationOwner: SceneRegistrationOwner;
}

export interface StartupSceneManifestEntry<Key extends SceneKey = SceneKey>
  extends SceneManifestBase<Key> {
  loadBoundary: 'startup';
  registrationOwner: 'game-config';
}

export interface RuntimeSceneManifestEntry<Key extends SceneKey = SceneKey>
  extends SceneManifestBase<Key> {
  loadBoundary: 'runtime-eager' | 'on-demand';
  registrationOwner: 'bootstrap' | 'feature';
  load: () => Promise<SceneConstructor>;
}

export type SceneManifestEntry = StartupSceneManifestEntry | RuntimeSceneManifestEntry;

function startup<const Key extends SceneKey>(
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

function runtime<const Key extends SceneKey>(
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
  runtime(
    'ResizeTestScene',
    'diagnostic',
    'on-demand',
    'feature',
    async () => (await import('./ResizeTestScene')).ResizeTestScene,
  ),
  runtime(
    'MovementTestScene',
    'diagnostic',
    'on-demand',
    'feature',
    async () => (await import('./MovementTestScene')).MovementTestScene,
  ),
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
  startup('RainbowRunEntryScene', 'exploration'),
  runtime(
    'CrystalCupEntryScene',
    'exploration',
    'on-demand',
    'feature',
    async () => (await import('./CrystalCupEntryScene')).CrystalCupEntryScene,
  ),
  startup('NovaTutorialRaceScene', 'race'),
  startup('RaceScene', 'race'),
  startup('PipEggHatchScene', 'story'),
  startup('DoorwayStubScene', 'utility'),
  runtime(
    'DialogueTestScene',
    'diagnostic',
    'on-demand',
    'feature',
    async () => (await import('./DialogueTestScene')).DialogueTestScene,
  ),
  startup('UnicornCreatorScene', 'onboarding'),
  runtime(
    'JustGamesScene',
    'modal',
    'on-demand',
    'feature',
    async () => (await import('./JustGamesScene')).JustGamesScene,
  ),
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
    'RainbowDiscActivityScene',
    'activity',
    'on-demand',
    'feature',
    async () => (await import('../activities/RainbowDiscActivityScene')).RainbowDiscActivityScene,
  ),
  runtime(
    'ChessPlazaActivityScene',
    'activity',
    'on-demand',
    'feature',
    async () => (await import('../activities/ChessPlazaActivityScene')).ChessPlazaActivityScene,
  ),
  runtime(
    'PondLeapActivityScene',
    'activity',
    'on-demand',
    'feature',
    async () => (await import('../activities/PondLeapActivityScene')).PondLeapActivityScene,
  ),
  runtime(
    'ExplorationHudOverlayScene',
    'hud',
    'on-demand',
    'feature',
    async () => (await import('../ui/ExplorationHudOverlayScene')).ExplorationHudOverlayScene,
  ),
] as const satisfies readonly SceneManifestEntry[];

export type StartupSceneKey = Extract<
  (typeof SCENE_MANIFEST)[number],
  { loadBoundary: 'startup' }
>['key'];

const SCENE_BY_KEY = new Map<SceneKey, SceneManifestEntry>(
  SCENE_MANIFEST.map((entry) => [entry.key, entry] as const),
);

const RUNTIME_REGISTRATIONS = new WeakMap<Phaser.Game, Map<SceneKey, Promise<void>>>();

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

export function ensureSceneRegistered(game: Phaser.Game, key: SceneKey): Promise<void> {
  if (game.scene.keys[key]) {
    return Promise.resolve();
  }

  const entry = getSceneManifestEntry(key);
  if (entry.loadBoundary === 'startup') {
    return Promise.reject(new Error(`Startup scene is not registered: ${key}`));
  }

  let registrations = RUNTIME_REGISTRATIONS.get(game);
  if (!registrations) {
    registrations = new Map<SceneKey, Promise<void>>();
    RUNTIME_REGISTRATIONS.set(game, registrations);
  }

  const existing = registrations.get(key);
  if (existing) {
    return existing;
  }

  const registration = entry
    .load()
    .then((SceneConstructor) => {
      if (!game.scene.keys[key]) {
        game.scene.add(key, SceneConstructor);
      }
      registrations?.delete(key);
    })
    .catch((error: unknown) => {
      registrations?.delete(key);
      throw error;
    });

  registrations.set(key, registration);
  return registration;
}
