import type Phaser from 'phaser';
import { DialogueTestScene } from './DialogueTestScene';
import { DoorwayStubScene } from './DoorwayStubScene';
import { FireflyLanternScene } from './FireflyLanternScene';
import { MovementTestScene } from './MovementTestScene';
import { NovaTutorialRaceScene } from './NovaTutorialRaceScene';
import { PipEggHatchScene } from './PipEggHatchScene';
import { RaceScene } from './RaceScene';
import { RainbowRunEntryScene } from './RainbowRunEntryScene';
import { ResizeTestScene } from './ResizeTestScene';

export type DeferredStartupSceneKey =
  | 'ResizeTestScene'
  | 'MovementTestScene'
  | 'FireflyLanternScene'
  | 'RainbowRunEntryScene'
  | 'NovaTutorialRaceScene'
  | 'RaceScene'
  | 'PipEggHatchScene'
  | 'DoorwayStubScene'
  | 'DialogueTestScene';

type SceneConstructor = new () => Phaser.Scene;

export const DEFERRED_STARTUP_SCENES: Record<DeferredStartupSceneKey, SceneConstructor> = {
  ResizeTestScene,
  MovementTestScene,
  FireflyLanternScene,
  RainbowRunEntryScene,
  NovaTutorialRaceScene,
  RaceScene,
  PipEggHatchScene,
  DoorwayStubScene,
  DialogueTestScene,
};
