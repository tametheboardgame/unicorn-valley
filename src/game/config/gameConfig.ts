import Phaser from 'phaser';
import { getStartupSceneConstructors } from '../scenes/SceneManifest';
import { GAME_HEIGHT, GAME_WIDTH } from './gameConstants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#49376f',
  input: {
    activePointers: 2,
  },
  render: {
    antialias: true,
    // Camera follow uses fractional world positions. Rounding final render positions prevents
    // fixed HUD text/icons from visibly oscillating by a pixel while the camera eases behind
    // the unicorn, without changing movement, collision or input coordinates.
    roundPixels: true,
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
  scene: getStartupSceneConstructors(),
};
