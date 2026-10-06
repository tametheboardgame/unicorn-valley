import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { CottageInteriorScene } from './CottageInteriorScene';
import { CrystalBrookScene } from './CrystalBrookScene';
import { MoonflowerGladeScene } from './MoonflowerGladeScene';
import { PreloadScene } from './PreloadScene';
import { RainbowMeadowScene } from './RainbowMeadowScene';
import { getStartupSceneKeys, type StartupSceneKey } from './SceneManifest';
import { SunbeamVillageScene } from './SunbeamVillageScene';
import { TitleScene } from './TitleScene';
import { UnicornCreatorScene } from './UnicornCreatorScene';
import { WhisperingWoodsScene } from './WhisperingWoodsScene';

type SceneConstructor = new () => Phaser.Scene;
type LazySceneLoader = () => Promise<SceneConstructor>;

function createLazyStartupBridge(
  key: StartupSceneKey,
  loadScene: LazySceneLoader,
): SceneConstructor {
  return class LazyStartupBridgeScene extends Phaser.Scene {
    private launchData: object | undefined;

    public constructor() {
      super(key);
    }

    public init(data?: object): void {
      this.launchData = data;
    }

    public create(): void {
      const sceneManager = this.game.scene;
      void loadScene().then((SceneClass) => {
        if (sceneManager.keys[key] !== this) {
          return;
        }

        sceneManager.stop(key);
        sceneManager.remove(key);
        sceneManager.add(key, SceneClass, true, this.launchData);
      });
    }
  };
}

const ResizeTestScene = createLazyStartupBridge(
  'ResizeTestScene',
  async () => (await import('./ResizeTestScene')).ResizeTestScene,
);
const MovementTestScene = createLazyStartupBridge(
  'MovementTestScene',
  async () => (await import('./MovementTestScene')).MovementTestScene,
);
const FireflyLanternScene = createLazyStartupBridge(
  'FireflyLanternScene',
  async () => (await import('./FireflyLanternScene')).FireflyLanternScene,
);
const RainbowRunEntryScene = createLazyStartupBridge(
  'RainbowRunEntryScene',
  async () => (await import('./RainbowRunEntryScene')).RainbowRunEntryScene,
);
const NovaTutorialRaceScene = createLazyStartupBridge(
  'NovaTutorialRaceScene',
  async () => (await import('./NovaTutorialRaceScene')).NovaTutorialRaceScene,
);
const RaceScene = createLazyStartupBridge(
  'RaceScene',
  async () => (await import('./RaceScene')).RaceScene,
);
const PipEggHatchScene = createLazyStartupBridge(
  'PipEggHatchScene',
  async () => (await import('./PipEggHatchScene')).PipEggHatchScene,
);
const DoorwayStubScene = createLazyStartupBridge(
  'DoorwayStubScene',
  async () => (await import('./DoorwayStubScene')).DoorwayStubScene,
);
const DialogueTestScene = createLazyStartupBridge(
  'DialogueTestScene',
  async () => (await import('./DialogueTestScene')).DialogueTestScene,
);

const STARTUP_SCENE_CONSTRUCTORS: Record<StartupSceneKey, SceneConstructor> = {
  BootScene,
  PreloadScene,
  TitleScene,
  ResizeTestScene,
  MovementTestScene,
  MoonflowerGladeScene,
  CottageInteriorScene,
  SunbeamVillageScene,
  RainbowMeadowScene,
  CrystalBrookScene,
  WhisperingWoodsScene,
  FireflyLanternScene,
  RainbowRunEntryScene,
  NovaTutorialRaceScene,
  RaceScene,
  PipEggHatchScene,
  DoorwayStubScene,
  DialogueTestScene,
  UnicornCreatorScene,
};

export function getStartupSceneConstructors(): SceneConstructor[] {
  return getStartupSceneKeys().map((key) => STARTUP_SCENE_CONSTRUCTORS[key]);
}
