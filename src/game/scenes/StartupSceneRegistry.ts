import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { CottageInteriorScene } from './CottageInteriorScene';
import { CrystalBrookScene } from './CrystalBrookScene';
import { MoonflowerGladeScene } from './MoonflowerGladeScene';
import { PreloadScene } from './PreloadScene';
import { RainbowMeadowScene } from './RainbowMeadowScene';
import type { DeferredStartupSceneKey } from './DeferredStartupScenes';
import { getStartupSceneKeys, type StartupSceneKey } from './SceneManifest';
import { SunbeamVillageScene } from './SunbeamVillageScene';
import { TitleScene } from './TitleScene';
import { UnicornCreatorScene } from './UnicornCreatorScene';
import { WhisperingWoodsScene } from './WhisperingWoodsScene';

type SceneConstructor = new () => Phaser.Scene;

let deferredStartupScenes:
  | Promise<typeof import('./DeferredStartupScenes')>
  | null = null;

function loadDeferredStartupScene(key: DeferredStartupSceneKey): Promise<SceneConstructor> {
  deferredStartupScenes ??= import('./DeferredStartupScenes');
  return deferredStartupScenes.then(({ DEFERRED_STARTUP_SCENES }) => DEFERRED_STARTUP_SCENES[key]);
}

function createDeferredStartupBridge(key: DeferredStartupSceneKey): SceneConstructor {
  return class DeferredStartupBridgeScene extends Phaser.Scene {
    private launchData: object | undefined;

    public constructor() {
      super(key);
    }

    public init(data?: object): void {
      this.launchData = data;
    }

    public create(): void {
      const sceneManager = this.game.scene;
      void loadDeferredStartupScene(key).then((SceneClass) => {
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

const ResizeTestScene = createDeferredStartupBridge('ResizeTestScene');
const MovementTestScene = createDeferredStartupBridge('MovementTestScene');
const FireflyLanternScene = createDeferredStartupBridge('FireflyLanternScene');
const RainbowRunEntryScene = createDeferredStartupBridge('RainbowRunEntryScene');
const NovaTutorialRaceScene = createDeferredStartupBridge('NovaTutorialRaceScene');
const RaceScene = createDeferredStartupBridge('RaceScene');
const PipEggHatchScene = createDeferredStartupBridge('PipEggHatchScene');
const DoorwayStubScene = createDeferredStartupBridge('DoorwayStubScene');
const DialogueTestScene = createDeferredStartupBridge('DialogueTestScene');

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
