import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { CottageDecorateScene } from '../scenes/CottageDecorateScene';
import { CottageInteriorScene } from '../scenes/CottageInteriorScene';
import { CrystalBrookScene } from '../scenes/CrystalBrookScene';
import { DialogueTestScene } from '../scenes/DialogueTestScene';
import { DoorwayStubScene } from '../scenes/DoorwayStubScene';
import { InventoryScene } from '../scenes/InventoryScene';
import { MarigoldPicnicScene } from '../scenes/MarigoldPicnicScene';
import { MoonflowerGladeScene } from '../scenes/MoonflowerGladeScene';
import { MoonflowerPatchScene } from '../scenes/MoonflowerPatchScene';
import { MovementTestScene } from '../scenes/MovementTestScene';
import { NovaStoryScene } from '../scenes/NovaStoryScene';
import { NovaTutorialRaceScene } from '../scenes/NovaTutorialRaceScene';
import { PebbleStoryScene } from '../scenes/PebbleStoryScene';
import { PipEggHatchScene } from '../scenes/PipEggHatchScene';
import { PipEggStoryScene } from '../scenes/PipEggStoryScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { RaceScene } from '../scenes/RaceScene';
import { RainbowMeadowScene } from '../scenes/RainbowMeadowScene';
import { RainbowRunEntryScene } from '../scenes/RainbowRunEntryScene';
import { ResizeTestScene } from '../scenes/ResizeTestScene';
import { ShopScene } from '../scenes/ShopScene';
import { SunbeamVillageScene } from '../scenes/SunbeamVillageScene';
import { TitleScene } from '../scenes/TitleScene';
import { UnicornCreatorScene } from '../scenes/UnicornCreatorScene';
import { WillowStoryScene } from '../scenes/WillowStoryScene';
import { WonderbookScene } from '../scenes/WonderbookScene';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#49376f',
  render: {
    antialias: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    ResizeTestScene,
    MovementTestScene,
    MoonflowerGladeScene,
    CottageInteriorScene,
    CottageDecorateScene,
    MoonflowerPatchScene,
    SunbeamVillageScene,
    RainbowMeadowScene,
    CrystalBrookScene,
    RainbowRunEntryScene,
    NovaStoryScene,
    NovaTutorialRaceScene,
    RaceScene,
    WillowStoryScene,
    MarigoldPicnicScene,
    PebbleStoryScene,
    PipEggStoryScene,
    PipEggHatchScene,
    DoorwayStubScene,
    DialogueTestScene,
    UnicornCreatorScene,
    WonderbookScene,
    InventoryScene,
    ShopScene,
  ],
};
