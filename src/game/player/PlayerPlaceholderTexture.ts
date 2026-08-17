import Phaser from 'phaser';

export const PLAYER_PLACEHOLDER_TEXTURE_KEY = 'player-unicorn-placeholder';

export function ensurePlayerPlaceholderTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_PLACEHOLDER_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.add.graphics();

  graphics.fillStyle(0xfff5ff, 1);
  graphics.fillEllipse(48, 48, 72, 42);
  graphics.fillCircle(82, 33, 18);

  graphics.fillStyle(0xd69af0, 1);
  graphics.fillTriangle(95, 23, 106, 3, 101, 29);
  graphics.fillTriangle(19, 42, 2, 28, 23, 53);
  graphics.fillRect(31, 62, 8, 18);
  graphics.fillRect(55, 62, 8, 18);

  graphics.fillStyle(0xf1b4ef, 1);
  graphics.fillTriangle(69, 20, 78, 5, 82, 26);
  graphics.fillTriangle(58, 24, 67, 8, 71, 29);

  graphics.fillStyle(0x4b3066, 1);
  graphics.fillCircle(88, 30, 3);

  graphics.generateTexture(PLAYER_PLACEHOLDER_TEXTURE_KEY, 112, 84);
  graphics.destroy();
}
