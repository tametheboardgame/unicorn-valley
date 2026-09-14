import type Phaser from 'phaser';

export const PIP_SPECIES_NAME = 'Glimmerling' as const;
export const PIP_IDENTITY_TEXTURE_KEY = 'pip-canonical-glimmerling';
export const PIP_WORLD_NAME = 'pip-canonical-identity';

export const PIP_IDENTITY_PALETTE = {
  body: 0xe6b5dd,
  bodyShadow: 0xc98ac2,
  belly: 0xffe8f3,
  earInner: 0xb988cf,
  eye: 0x49345d,
  muzzle: 0xfff3f7,
  glow: 0xbff5ec,
  glowCore: 0xfff6bd,
} as const;

export function ensurePipIdentityTexture(scene: Phaser.Scene): string {
  if (scene.textures.exists(PIP_IDENTITY_TEXTURE_KEY)) {
    return PIP_IDENTITY_TEXTURE_KEY;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  const palette = PIP_IDENTITY_PALETTE;

  // A curled comet-tail gives Pip a magical silhouette that cannot be mistaken for a unicorn.
  graphics.lineStyle(11, palette.bodyShadow, 0.94);
  graphics.beginPath();
  graphics.moveTo(88, 75);
  graphics.lineTo(105, 68);
  graphics.lineTo(111, 56);
  graphics.strokePath();
  graphics.fillStyle(palette.glow, 0.32);
  graphics.fillCircle(111, 53, 13);
  graphics.fillStyle(palette.glow, 0.72);
  graphics.fillCircle(111, 53, 8);
  graphics.fillStyle(palette.glowCore, 0.98);
  graphics.fillCircle(111, 53, 4);

  // Long leaf-like ears are Pip's strongest species cue.
  graphics.fillStyle(palette.bodyShadow, 1);
  graphics.fillTriangle(45, 39, 26, 5, 55, 35);
  graphics.fillTriangle(75, 36, 102, 7, 84, 43);
  graphics.fillStyle(palette.earInner, 0.95);
  graphics.fillTriangle(43, 32, 31, 11, 50, 31);
  graphics.fillTriangle(79, 31, 97, 13, 84, 36);

  // Rounded floating body, chest and tiny tucked paws.
  graphics.fillStyle(palette.bodyShadow, 0.92);
  graphics.fillEllipse(64, 79, 55, 60);
  graphics.fillStyle(palette.body, 1);
  graphics.fillEllipse(62, 73, 52, 59);
  graphics.fillStyle(palette.belly, 0.92);
  graphics.fillEllipse(62, 79, 31, 38);
  graphics.fillStyle(palette.bodyShadow, 1);
  graphics.fillRoundedRect(43, 93, 13, 17, 6);
  graphics.fillRoundedRect(68, 93, 13, 17, 6);
  graphics.fillStyle(palette.muzzle, 0.96);
  graphics.fillRoundedRect(45, 101, 12, 7, 4);
  graphics.fillRoundedRect(69, 101, 12, 7, 4);

  // Head, cheek tufts and a tiny moon-crest make the face readable at world scale.
  graphics.fillStyle(palette.body, 1);
  graphics.fillEllipse(62, 49, 62, 52);
  graphics.fillStyle(palette.bodyShadow, 0.88);
  graphics.fillTriangle(35, 52, 25, 58, 38, 62);
  graphics.fillTriangle(88, 50, 99, 57, 86, 62);
  graphics.fillStyle(palette.glowCore, 0.94);
  graphics.fillCircle(62, 24, 5);
  graphics.fillStyle(palette.glow, 0.42);
  graphics.fillCircle(62, 24, 9);

  // Large eyes, highlights and brows support obvious curious/happy expressions.
  graphics.fillStyle(0xffffff, 0.98);
  graphics.fillEllipse(50, 47, 15, 18);
  graphics.fillEllipse(74, 47, 15, 18);
  graphics.fillStyle(palette.eye, 1);
  graphics.fillEllipse(51, 49, 8, 10);
  graphics.fillEllipse(73, 49, 8, 10);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(53, 46, 2.2);
  graphics.fillCircle(75, 46, 2.2);
  graphics.lineStyle(2, palette.eye, 0.72);
  graphics.beginPath();
  graphics.moveTo(43, 37);
  graphics.lineTo(53, 35);
  graphics.moveTo(70, 35);
  graphics.lineTo(80, 38);
  graphics.strokePath();

  // Small muzzle and smile avoid the old pig-like reading.
  graphics.fillStyle(palette.muzzle, 0.96);
  graphics.fillEllipse(62, 61, 25, 17);
  graphics.fillStyle(palette.eye, 0.9);
  graphics.fillCircle(62, 58, 2.5);
  graphics.lineStyle(2, palette.eye, 0.74);
  graphics.beginPath();
  graphics.moveTo(62, 61);
  graphics.lineTo(62, 64);
  graphics.lineTo(58, 67);
  graphics.moveTo(62, 64);
  graphics.lineTo(67, 67);
  graphics.strokePath();

  // A few luminous freckles tie the face back to Pip's sparkle/discovery role.
  graphics.fillStyle(palette.glowCore, 0.8);
  graphics.fillCircle(41, 61, 1.8);
  graphics.fillCircle(45, 64, 1.2);
  graphics.fillCircle(82, 61, 1.8);
  graphics.fillCircle(78, 65, 1.2);

  graphics.generateTexture(PIP_IDENTITY_TEXTURE_KEY, 128, 116);
  graphics.destroy();
  return PIP_IDENTITY_TEXTURE_KEY;
}

export function createPipIdentitySprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(x, y, ensurePipIdentityTexture(scene))
    .setName(PIP_WORLD_NAME)
    .setOrigin(0.5, 0.86);
}
