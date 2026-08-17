import Phaser from 'phaser';
import {
  BODY_COLOURS,
  EYE_COLOURS,
  HAIR_COLOURS,
  colourValue,
  type UnicornAppearance,
} from './UnicornAppearance';

function drawHeart(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
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

function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
): void {
  const points: Phaser.Geom.Point[] = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.45;
    points.push(new Phaser.Geom.Point(x + Math.cos(angle) * pointRadius, y + Math.sin(angle) * pointRadius));
  }
  graphics.fillPoints(points, true);
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

  graphics.fillStyle(0x4b3658, 0.13);
  graphics.fillEllipse(x - 4 * scale, y + 62 * scale, 152 * scale, 24 * scale);

  graphics.fillStyle(tail, 1);
  if (appearance.tailStyle === 'curl') {
    graphics.fillCircle(x - 69 * scale, y + 4 * scale, 22 * scale);
    graphics.fillCircle(x - 84 * scale, y - 6 * scale, 15 * scale);
    graphics.fillCircle(x - 88 * scale, y + 12 * scale, 12 * scale);
  } else if (appearance.tailStyle === 'ribbon') {
    graphics.fillTriangle(
      x - 48 * scale,
      y - 5 * scale,
      x - 104 * scale,
      y - 27 * scale,
      x - 88 * scale,
      y + 18 * scale,
    );
    graphics.fillTriangle(
      x - 65 * scale,
      y + 3 * scale,
      x - 101 * scale,
      y + 28 * scale,
      x - 82 * scale,
      y + 4 * scale,
    );
  } else {
    graphics.fillEllipse(x - 78 * scale, y - 2 * scale, 64 * scale, 38 * scale);
    graphics.fillCircle(x - 96 * scale, y + 3 * scale, 16 * scale);
  }

  graphics.fillStyle(body, 0.9);
  graphics.fillRoundedRect(x - 43 * scale, y + 27 * scale, 17 * scale, 47 * scale, 8 * scale);
  graphics.fillRoundedRect(x + 7 * scale, y + 28 * scale, 17 * scale, 46 * scale, 8 * scale);

  graphics.fillStyle(body, 1);
  graphics.fillEllipse(x - 3 * scale, y + 8 * scale, 126 * scale, 66 * scale);
  graphics.fillEllipse(x + 42 * scale, y - 9 * scale, 47 * scale, 72 * scale);
  graphics.fillRoundedRect(x - 28 * scale, y + 31 * scale, 18 * scale, 48 * scale, 8 * scale);
  graphics.fillRoundedRect(x + 30 * scale, y + 30 * scale, 18 * scale, 49 * scale, 8 * scale);

  graphics.fillEllipse(x + 72 * scale, y - 31 * scale, 75 * scale, 58 * scale);
  graphics.fillEllipse(x + 101 * scale, y - 18 * scale, 31 * scale, 23 * scale);

  graphics.fillTriangle(
    x + 48 * scale,
    y - 53 * scale,
    x + 54 * scale,
    y - 79 * scale,
    x + 66 * scale,
    y - 54 * scale,
  );
  graphics.fillTriangle(
    x + 70 * scale,
    y - 55 * scale,
    x + 77 * scale,
    y - 80 * scale,
    x + 86 * scale,
    y - 53 * scale,
  );

  graphics.fillStyle(mane, 1);
  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, radius] of [
      [41, -47, 14],
      [32, -31, 16],
      [31, -13, 15],
      [27, 3, 13],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale, radius * scale);
    }
  } else if (appearance.maneStyle === 'swept') {
    graphics.fillTriangle(
      x + 47 * scale,
      y - 61 * scale,
      x + 19 * scale,
      y - 17 * scale,
      x + 58 * scale,
      y - 4 * scale,
    );
    graphics.fillEllipse(x + 29 * scale, y - 20 * scale, 25 * scale, 46 * scale);
  } else {
    graphics.fillCircle(x + 43 * scale, y - 46 * scale, 13 * scale);
    graphics.fillEllipse(x + 34 * scale, y - 24 * scale, 27 * scale, 45 * scale);
    graphics.fillEllipse(x + 29 * scale, y - 2 * scale, 24 * scale, 35 * scale);
  }

  graphics.fillStyle(0xf4d780, 1);
  const hornTipY = appearance.hornStyle === 'star' ? -101 : -96;
  graphics.fillTriangle(
    x + 68 * scale,
    y - 58 * scale,
    x + 78 * scale,
    y + hornTipY * scale,
    x + 84 * scale,
    y - 57 * scale,
  );
  if (appearance.hornStyle === 'star') {
    graphics.fillStyle(0xffe889, 1);
    drawStar(graphics, x + 78 * scale, y - 103 * scale, 9 * scale);
  } else if (appearance.hornStyle === 'spiral') {
    graphics.lineStyle(2.5 * scale, 0xc49250, 0.95);
    graphics.lineBetween(x + 72 * scale, y - 68 * scale, x + 82 * scale, y - 73 * scale);
    graphics.lineBetween(x + 74 * scale, y - 79 * scale, x + 81 * scale, y - 83 * scale);
  }

  graphics.fillStyle(0x493955, 0.22);
  graphics.fillCircle(x + 104 * scale, y - 15 * scale, 2.1 * scale);

  graphics.fillStyle(eye, 1);
  graphics.fillCircle(x + 86 * scale, y - 34 * scale, 7 * scale);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(x + 88.5 * scale, y - 37 * scale, 2.4 * scale);
  graphics.fillStyle(0x493955, 0.82);
  graphics.fillCircle(x + 87 * scale, y - 32.5 * scale, 2.2 * scale);

  graphics.fillStyle(0xffffff, 0.76);
  if (appearance.marking === 'star') {
    drawStar(graphics, x - 11 * scale, y + 7 * scale, 10 * scale);
  } else if (appearance.marking === 'heart') {
    drawHeart(graphics, x - 10 * scale, y + 2 * scale, scale * 0.72);
  } else if (appearance.marking === 'moon') {
    graphics.fillCircle(x - 10 * scale, y + 6 * scale, 11 * scale);
    graphics.fillStyle(body, 1);
    graphics.fillCircle(x - 5 * scale, y + 2 * scale, 9 * scale);
  }

  if (appearance.accessory === 'flower') {
    graphics.fillStyle(0xffc7e8, 1);
    graphics.fillCircle(x + 51 * scale, y - 59 * scale, 7 * scale);
    graphics.fillCircle(x + 59 * scale, y - 53 * scale, 7 * scale);
    graphics.fillCircle(x + 51 * scale, y - 47 * scale, 7 * scale);
    graphics.fillCircle(x + 43 * scale, y - 53 * scale, 7 * scale);
    graphics.fillStyle(0xffe79a, 1);
    graphics.fillCircle(x + 51 * scale, y - 53 * scale, 4.5 * scale);
  } else if (appearance.accessory === 'bow') {
    graphics.fillStyle(0xe98cb5, 1);
    graphics.fillTriangle(
      x + 34 * scale,
      y - 7 * scale,
      x + 50 * scale,
      y + 1 * scale,
      x + 34 * scale,
      y + 10 * scale,
    );
    graphics.fillTriangle(
      x + 66 * scale,
      y - 7 * scale,
      x + 50 * scale,
      y + 1 * scale,
      x + 66 * scale,
      y + 10 * scale,
    );
    graphics.fillCircle(x + 50 * scale, y + 1 * scale, 5 * scale);
  } else if (appearance.accessory === 'bell') {
    graphics.lineStyle(3 * scale, 0xb7c0c8, 1);
    graphics.lineBetween(x + 41 * scale, y + 3 * scale, x + 50 * scale, y + 15 * scale);
    graphics.fillStyle(0xdfe6ec, 1);
    graphics.fillCircle(x + 51 * scale, y + 20 * scale, 8 * scale);
    graphics.fillStyle(0x9eaab4, 1);
    graphics.fillCircle(x + 51 * scale, y + 23 * scale, 2 * scale);
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
  drawUnicornAppearance(graphics, 112, 105, appearance, 1);
  graphics.generateTexture(textureKey, 230, 190);
  graphics.destroy();
  return textureKey;
}
