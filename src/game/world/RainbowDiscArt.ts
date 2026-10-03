import Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import { SUPPORTING_RESIDENT_ART_LAYOUT } from '../population/SupportingResidentArt';

export const RAINBOW_DISC_COLOURS = [
  0xee6f73, 0xf3a556, 0xf3d465, 0x79bf78, 0x67b9dd, 0x7f82d7, 0xb575cc,
] as const;

export function createRainbowDiscRing(
  scene: Phaser.Scene,
  name: string,
  x: number,
  y: number,
  radius = 19,
  thickness = 7,
): Phaser.GameObjects.Graphics {
  const disc = scene.add.graphics().setPosition(x, y).setName(name);
  const segment = (Math.PI * 2) / RAINBOW_DISC_COLOURS.length;

  RAINBOW_DISC_COLOURS.forEach((colour, index) => {
    const start = -Math.PI / 2 + segment * index + 0.015;
    const end = -Math.PI / 2 + segment * (index + 1) - 0.015;
    disc.lineStyle(thickness, colour, 1);
    disc.beginPath();
    disc.arc(0, 0, radius, start, end, false);
    disc.strokePath();
  });

  disc.lineStyle(2, 0xffffff, 0.62);
  disc.strokeCircle(0, 0, radius + thickness / 2);
  disc.lineStyle(2, 0x73546f, 0.38);
  disc.strokeCircle(0, 0, radius - thickness / 2);

  disc.setInteractive(
    new Phaser.Geom.Circle(0, 0, radius + thickness + 8),
    Phaser.Geom.Circle.Contains,
  );

  return disc;
}

export function drawRainbowTarget(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  thickness = 7,
): void {
  const segment = (Math.PI * 2) / RAINBOW_DISC_COLOURS.length;
  RAINBOW_DISC_COLOURS.forEach((colour, index) => {
    const start = -Math.PI / 2 + segment * index + 0.02;
    const end = -Math.PI / 2 + segment * (index + 1) - 0.02;
    graphics.lineStyle(thickness, colour, 0.96);
    graphics.beginPath();
    graphics.arc(x, y, radius, start, end, false);
    graphics.strokePath();
  });
}

export function resolveRainbowDiscHornCatchPoint(
  sprite: Phaser.GameObjects.Sprite,
  appearance: UnicornAppearance,
): { x: number; y: number } {
  const tipOffset =
    appearance.hornStyle === 'star'
      ? -82
      : appearance.hornStyle === 'short'
        ? -75
        : appearance.hornStyle === 'crystal' || appearance.hornStyle === 'moon'
          ? -85
          : -88;
  const textureX =
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX + 78 * SUPPORTING_RESIDENT_ART_LAYOUT.drawScale;
  const textureY =
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY +
    (tipOffset + 10) * SUPPORTING_RESIDENT_ART_LAYOUT.drawScale;
  const originTextureX = SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth * sprite.originX;
  const originTextureY = SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight * sprite.originY;
  const localX =
    (textureX - originTextureX) *
    (sprite.displayWidth / SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth);
  const localY =
    (textureY - originTextureY) *
    (sprite.displayHeight / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight);

  return {
    x: sprite.x + (sprite.flipX ? -localX : localX),
    y: sprite.y + localY,
  };
}
