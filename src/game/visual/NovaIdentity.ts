import type Phaser from 'phaser';

export const NOVA_IDENTITY_TEXTURE_KEY = 'nova-canonical-pink-racer';
export const NOVA_RACE_TINT = 0xf09ad1;

export function ensureNovaIdentityTexture(scene: Phaser.Scene): string {
  if (scene.textures.exists(NOVA_IDENTITY_TEXTURE_KEY)) {
    return NOVA_IDENTITY_TEXTURE_KEY;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  // Tail, legs and body establish Nova's bright pink racing silhouette.
  graphics.fillStyle(0xd95ea9, 1);
  graphics.fillEllipse(28, 62, 32, 66);
  graphics.fillStyle(0xea8bc4, 1);
  graphics.fillRoundedRect(52, 68, 14, 39, 6);
  graphics.fillRoundedRect(76, 70, 14, 38, 6);
  graphics.fillRoundedRect(101, 67, 14, 40, 6);
  graphics.fillStyle(0xf2a4d1, 1);
  graphics.fillEllipse(80, 59, 92, 58);

  // Head and muzzle keep the same pale-pink face used in the world presentation.
  graphics.fillStyle(0xf7c1df, 1);
  graphics.fillCircle(119, 42, 28);
  graphics.fillEllipse(137, 52, 29, 20);

  // Nova's blue-violet mane is the feature that distinguishes her from a simple pink tint.
  graphics.fillStyle(0x75bfe5, 1);
  graphics.fillEllipse(101, 37, 24, 56);
  graphics.fillStyle(0x8b75d2, 0.95);
  graphics.fillEllipse(96, 31, 13, 43);

  // Gold horn, ear and eye.
  graphics.fillStyle(0xffd96f, 1);
  graphics.fillTriangle(125, 17, 134, 0, 139, 22);
  graphics.fillStyle(0xef9bc9, 1);
  graphics.fillTriangle(108, 20, 115, 4, 122, 23);
  graphics.fillStyle(0x513b62, 1);
  graphics.fillCircle(128, 39, 4);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillCircle(129, 38, 1.5);

  // Small racing-star flank mark.
  graphics.fillStyle(0xffef98, 1);
  graphics.fillCircle(72, 59, 7);
  graphics.fillStyle(0xffffff, 0.8);
  graphics.fillCircle(69, 56, 2);

  graphics.generateTexture(NOVA_IDENTITY_TEXTURE_KEY, 160, 112);
  graphics.destroy();
  return NOVA_IDENTITY_TEXTURE_KEY;
}

export function createNovaIdentitySprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(x, y, ensureNovaIdentityTexture(scene))
    .setName('nova-canonical-identity')
    .setOrigin(0.5, 0.82);
}
