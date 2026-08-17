import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { DoorwayStubScene } from '../scenes/DoorwayStubScene';
import { MoonflowerGladeScene } from '../scenes/MoonflowerGladeScene';
import { MovementTestScene } from '../scenes/MovementTestScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { ResizeTestScene } from '../scenes/ResizeTestScene';
import { TitleScene } from '../scenes/TitleScene';
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
    DoorwayStubScene,
  ],
};
