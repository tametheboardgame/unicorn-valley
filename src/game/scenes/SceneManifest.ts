import type Phaser from 'phaser';
import { BootScene } from './BootScene';
import { CottageDecorateScene } from './CottageDecorateScene';
import { CottageInteriorScene } from './CottageInteriorScene';
import { CrystalBrookScene } from './CrystalBrookScene';
import { DialogueTestScene } from './DialogueTestScene';
import { DoorwayStubScene } from './DoorwayStubScene';
import { FireflyLanternScene } from './FireflyLanternScene';
import { MoonflowerGladeScene } from './MoonflowerGladeScene';
import { MoonflowerPatchScene } from './MoonflowerPatchScene';
import { MovementTestScene } from './MovementTestScene';
import { NovaTutorialRaceScene } from './NovaTutorialRaceScene';
import { PipEggHatchScene } from './PipEggHatchScene';
import { PreloadScene } from './PreloadScene';
import { RaceScene } from './RaceScene';
import { RainbowMeadowScene } from './RainbowMeadowScene';
import { RainbowRunEntryScene } from './RainbowRunEntryScene';
import { ResizeTestScene } from './ResizeTestScene';
import { SunbeamVillageScene } from './SunbeamVillageScene';
import { TitleScene } from './TitleScene';
import { UnicornCreatorScene } from './UnicornCreatorScene';
import { WhisperingWoodsScene } from './WhisperingWoodsScene';
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
  scene: SceneConstructor;
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
  scene: SceneConstructor,
): StartupSceneManifestEntry<Key> {
  return {
    key,
    category,
    loadBoundary: 'startup',
    registrationOwner: 'game-config',
    scene,
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
  startup('BootScene', 'bootstrap', BootScene),
  startup('PreloadScene', 'bootstrap', PreloadScene),
  startup('TitleScene', 'bootstrap', TitleScene),
  startup('ResizeTestScene', 'diagnostic', ResizeTestScene),
  startup('MovementTestScene', 'diagnostic', MovementTestScene),
  startup('MoonflowerGladeScene', 'exploration', MoonflowerGladeScene),
  startup('CottageInteriorScene', 'interior', CottageInteriorScene),
  startup('CottageDecorateScene', 'interior', CottageDecorateScene),
  startup('MoonflowerPatchScene', 'exploration', MoonflowerPatchScene),
  startup('SunbeamVillageScene', 'exploration', SunbeamVillageScene),
  startup('RainbowMeadowScene', 'exploration', RainbowMeadowScene),
  startup('CrystalBrookScene', 'exploration', CrystalBrookScene),
  startup('WhisperingWoodsScene', 'exploration', WhisperingWoodsScene),
  startup('FireflyLanternScene', 'activity', FireflyLanternScene),
  startup('RainbowRunEntryScene', 'race', RainbowRunEntryScene),
  startup('NovaTutorialRaceScene', 'race', NovaTutorialRaceScene),
  startup('RaceScene', 'race', RaceScene),
  startup('PipEggHatchScene', 'story', PipEggHatchScene),
  startup('DoorwayStubScene', 'utility', DoorwayStubScene),
  startup('DialogueTestScene', 'diagnostic', DialogueTestScene),
  startup('UnicornCreatorScene', 'onboarding', UnicornCreatorScene),
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

export function getStartupSceneConstructors(): SceneConstructor[] {
  return SCENE_MANIFEST.flatMap((entry) => (entry.loadBoundary === 'startup' ? [entry.scene] : []));
}
