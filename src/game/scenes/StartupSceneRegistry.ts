import type Phaser from 'phaser';
import { BootScene } from './BootScene';
import { CottageDecorateScene } from './CottageDecorateScene';
import { CottageInteriorScene } from './CottageInteriorScene';
import { CrystalBrookScene } from './CrystalBrookScene';
import { DialogueTestScene } from './DialogueTestScene';
import { DoorwayStubScene } from './DoorwayStubScene';
import { FireflyLanternScene } from './FireflyLanternScene';
import { MoonflowerGladeScene } from './MoonflowerGladeScene';
import { MovementTestScene } from './MovementTestScene';
import { NovaTutorialRaceScene } from './NovaTutorialRaceScene';
import { PipEggHatchScene } from './PipEggHatchScene';
import { PreloadScene } from './PreloadScene';
import { RaceScene } from './RaceScene';
import { RainbowMeadowScene } from './RainbowMeadowScene';
import { RainbowRunEntryScene } from './RainbowRunEntryScene';
import { ResizeTestScene } from './ResizeTestScene';
import { getStartupSceneKeys, type StartupSceneKey } from './SceneManifest';
import { SunbeamVillageScene } from './SunbeamVillageScene';
import { TitleScene } from './TitleScene';
import { UnicornCreatorScene } from './UnicornCreatorScene';
import { WhisperingWoodsScene } from './WhisperingWoodsScene';

type SceneConstructor = new () => Phaser.Scene;

const STARTUP_SCENE_CONSTRUCTORS: Record<StartupSceneKey, SceneConstructor> = {
  BootScene,
  PreloadScene,
  TitleScene,
  ResizeTestScene,
  MovementTestScene,
  MoonflowerGladeScene,
  CottageInteriorScene,
  CottageDecorateScene,
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
