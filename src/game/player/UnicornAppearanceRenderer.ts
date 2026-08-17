import Phaser from 'phaser';
import {
  BODY_COLOURS,
  EYE_COLOURS,
  HAIR_COLOURS,
  colourValue,
  type UnicornAppearance,
} from './UnicornAppearance';

function drawHeart(graphics: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
  graphics.fillCircle(x - 5 * scale, y, 6 * scale);
  graphics.fillCircle(x + 5 * scale, y, 6 * scale);
  graphics.fillTriangle(
    x - 11 * scale,
    y + 2 * scale,
    x + 11 * scale,
    y + 2 * scale,
    x,
    y + 14 * scale,
  );
}

export function drawUnicornAppearance(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
  scale = 1,
): void {
  const body = colourValue(BODY_COLOURS, appearance.bodyColour);
  const eye = colourValue(EYE_COLOURS, appearance.eyeColour);
  const mane = colourValue(HAIR_COLOURS, appearance.maneColour);
  const tail = colourValue(HAIR_COLOURS, appearance.tailColour);

  graphics.fillStyle(tail, 1);
  if (appearance.tailStyle === 'curl') {
    graphics.fillCircle(x - 64 * scale, y + 5 * scale, 24 * scale);
    graphics.fillCircle(x - 78 * scale, y - 5 * scale, 17 * scale);
  } else if (appearance.tailStyle === 'ribbon') {
    graphics.fillTriangle(
      x - 52 * scale,
      y - 8 * scale,
      x - 105 * scale,
      y - 30 * scale,
      x - 92 * scale,
      y + 18 * scale,
    );
  } else {
    graphics.fillEllipse(x - 75 * scale, y, 72 * scale, 42 * scale);
  }

  graphics.fillStyle(body, 1);
  graphics.fillEllipse(x, y + 16 * scale, 122 * scale, 72 * scale);
  graphics.fillCircle(x + 64 * scale, y - 17 * scale, 37 * scale);
  graphics.fillRoundedRect(x - 38 * scale, y + 42 * scale, 16 * scale, 42 * scale, 7 * scale);
  graphics.fillRoundedRect(x + 22 * scale, y + 42 * scale, 16 * scale, 42 * scale, 7 * scale);

  graphics.fillStyle(mane, 1);
  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, radius] of [
      [28, -26, 20],
      [14, -10, 20],
      [7, 10, 17],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale, radius * scale);
    }
  } else if (appearance.maneStyle === 'swept') {
    graphics.fillTriangle(
      x + 40 * scale,
      y - 50 * scale,
      x + 5 * scale,
      y - 12 * scale,
      x + 64 * scale,
      y + 2 * scale,
    );
  } else {
    graphics.fillEllipse(x + 27 * scale, y - 10 * scale, 42 * scale, 78 * scale);
  }

  graphics.fillStyle(0xf4d780, 1);
  const hornHeight = appearance.hornStyle === 'star' ? 48 : 42;
  graphics.fillTriangle(
    x + 67 * scale,
    y - 50 * scale,
    x + 80 * scale,
    y - (50 + hornHeight) * scale,
    x + 86 * scale,
    y - 44 * scale,
  );
  if (appearance.hornStyle === 'star') {
    graphics.fillCircle(x + 80 * scale, y - 98 * scale, 8 * scale);
  } else if (appearance.hornStyle === 'spiral') {
    graphics.lineStyle(3 * scale, 0xc49250, 0.9);
    graphics.lineBetween(x + 76 * scale, y - 65 * scale, x + 85 * scale, y - 73 * scale);
  }

  graphics.fillStyle(eye, 1);
  graphics.fillCircle(x + 78 * scale, y - 20 * scale, 5.5 * scale);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillCircle(x + 80 * scale, y - 22 * scale, 2 * scale);

  graphics.fillStyle(0xffffff, 0.75);
  if (appearance.marking === 'star') {
    graphics.fillCircle(x + 16 * scale, y + 11 * scale, 9 * scale);
  } else if (appearance.marking === 'heart') {
    drawHeart(graphics, x + 16 * scale, y + 6 * scale, scale * 0.75);
  } else if (appearance.marking === 'moon') {
    graphics.fillCircle(x + 16 * scale, y + 8 * scale, 11 * scale);
    graphics.fillStyle(body, 1);
    graphics.fillCircle(x + 21 * scale, y + 4 * scale, 9 * scale);
  }

  if (appearance.accessory === 'flower') {
    graphics.fillStyle(0xffc7e8, 1);
    graphics.fillCircle(x + 42 * scale, y - 46 * scale, 8 * scale);
    graphics.fillCircle(x + 52 * scale, y - 40 * scale, 8 * scale);
    graphics.fillCircle(x + 42 * scale, y - 34 * scale, 8 * scale);
    graphics.fillCircle(x + 32 * scale, y - 40 * scale, 8 * scale);
    graphics.fillStyle(0xffe79a, 1);
    graphics.fillCircle(x + 42 * scale, y - 40 * scale, 5 * scale);
  } else if (appearance.accessory === 'bow') {
    graphics.fillStyle(0xe98cb5, 1);
    graphics.fillTriangle(
      x + 30 * scale,
      y - 43 * scale,
      x + 48 * scale,
      y - 34 * scale,
      x + 30 * scale,
      y - 27 * scale,
    );
    graphics.fillTriangle(
      x + 62 * scale,
      y - 43 * scale,
      x + 44 * scale,
      y - 34 * scale,
      x + 62 * scale,
      y - 27 * scale,
    );
  } else if (appearance.accessory === 'bell') {
    graphics.fillStyle(0xdfe6ec, 1);
    graphics.fillCircle(x + 45 * scale, y + 22 * scale, 9 * scale);
    graphics.lineStyle(4 * scale, 0xb7c0c8, 1);
    graphics.lineBetween(x + 35 * scale, y + 4 * scale, x + 45 * scale, y + 15 * scale);
  }
}

export function createUnicornAppearanceTexture(
  scene: Phaser.Scene,
  textureKey: string,
  appearance: UnicornAppearance,
): string {
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }

  const graphics = scene.add.graphics();
  drawUnicornAppearance(graphics, 112, 100, appearance, 1);
  graphics.generateTexture(textureKey, 230, 190);
  graphics.destroy();
  return textureKey;
}
