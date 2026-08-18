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
  const inner = radius * 0.34;
  graphics.fillTriangle(x, y - radius, x - inner, y, x + inner, y);
  graphics.fillTriangle(x, y + radius, x - inner, y, x + inner, y);
  graphics.fillTriangle(x - radius, y, x, y - inner, x, y + inner);
  graphics.fillTriangle(x + radius, y, x, y - inner, x, y + inner);
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
  graphics.fillEllipse(x - 3 * scale, y + 62 * scale, 146 * scale, 22 * scale);

  graphics.fillStyle(tail, 1);
  if (appearance.tailStyle === 'curl') {
    graphics.fillCircle(x - 67 * scale, y + 1 * scale, 21 * scale);
    graphics.fillCircle(x - 82 * scale, y - 9 * scale, 14 * scale);
    graphics.fillCircle(x - 87 * scale, y + 10 * scale, 11 * scale);
  } else if (appearance.tailStyle === 'ribbon') {
    graphics.fillTriangle(
      x - 48 * scale,
      y - 6 * scale,
      x - 101 * scale,
      y - 28 * scale,
      x - 86 * scale,
      y + 16 * scale,
    );
    graphics.fillTriangle(
      x - 63 * scale,
      y + 2 * scale,
      x - 98 * scale,
      y + 26 * scale,
      x - 80 * scale,
      y + 3 * scale,
    );
  } else {
    graphics.fillEllipse(x - 76 * scale, y - 4 * scale, 60 * scale, 36 * scale);
    graphics.fillCircle(x - 94 * scale, y + 1 * scale, 15 * scale);
  }

  // Rear legs sit slightly behind the body so the four-legged silhouette stays readable at world scale.
  graphics.fillStyle(body, 0.88);
  graphics.fillRoundedRect(x - 41 * scale, y + 27 * scale, 16 * scale, 47 * scale, 7 * scale);
  graphics.fillRoundedRect(x + 2 * scale, y + 28 * scale, 16 * scale, 46 * scale, 7 * scale);

  graphics.fillStyle(body, 1);
  graphics.fillEllipse(x - 4 * scale, y + 7 * scale, 120 * scale, 62 * scale);
  graphics.fillEllipse(x + 40 * scale, y - 9 * scale, 43 * scale, 67 * scale);
  graphics.fillRoundedRect(x - 27 * scale, y + 29 * scale, 17 * scale, 50 * scale, 7 * scale);
  graphics.fillRoundedRect(x + 27 * scale, y + 28 * scale, 17 * scale, 51 * scale, 7 * scale);

  // Softer, slightly smaller head and muzzle keep the face cute without feeling detached from the body.
  graphics.fillEllipse(x + 72 * scale, y - 32 * scale, 69 * scale, 55 * scale);
  graphics.fillEllipse(x + 99 * scale, y - 18 * scale, 29 * scale, 21 * scale);

  graphics.fillTriangle(
    x + 49 * scale,
    y - 52 * scale,
    x + 55 * scale,
    y - 76 * scale,
    x + 64 * scale,
    y - 53 * scale,
  );
  graphics.fillTriangle(
    x + 69 * scale,
    y - 54 * scale,
    x + 76 * scale,
    y - 78 * scale,
    x + 84 * scale,
    y - 53 * scale,
  );

  graphics.fillStyle(0xffffff, 0.23);
  graphics.fillTriangle(
    x + 53 * scale,
    y - 55 * scale,
    x + 56 * scale,
    y - 69 * scale,
    x + 61 * scale,
    y - 55 * scale,
  );
  graphics.fillTriangle(
    x + 73 * scale,
    y - 56 * scale,
    x + 76 * scale,
    y - 70 * scale,
    x + 81 * scale,
    y - 55 * scale,
  );

  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillEllipse(x - 18 * scale, y - 1 * scale, 50 * scale, 22 * scale);
  graphics.fillEllipse(x + 53 * scale, y - 20 * scale, 20 * scale, 34 * scale);

  // Quiet hoof shading helps the legs terminate cleanly instead of looking like four rounded sticks.
  graphics.fillStyle(0x66566f, 0.16);
  for (const [hoofX, hoofY, hoofWidth] of [
    [-41, 68, 16],
    [2, 68, 16],
    [-27, 72, 17],
    [27, 72, 17],
  ] as const) {
    graphics.fillRoundedRect(
      x + hoofX * scale,
      y + hoofY * scale,
      hoofWidth * scale,
      8 * scale,
      4 * scale,
    );
  }

  graphics.fillStyle(mane, 1);
  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, radius] of [
      [42, -46, 13],
      [33, -31, 15],
      [31, -14, 14],
      [27, 2, 12],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale, radius * scale);
    }
  } else if (appearance.maneStyle === 'swept') {
    graphics.fillTriangle(
      x + 48 * scale,
      y - 59 * scale,
      x + 20 * scale,
      y - 17 * scale,
      x + 57 * scale,
      y - 4 * scale,
    );
    graphics.fillEllipse(x + 30 * scale, y - 20 * scale, 24 * scale, 44 * scale);
  } else {
    graphics.fillCircle(x + 43 * scale, y - 45 * scale, 12 * scale);
    graphics.fillEllipse(x + 34 * scale, y - 24 * scale, 25 * scale, 43 * scale);
    graphics.fillEllipse(x + 29 * scale, y - 2 * scale, 22 * scale, 33 * scale);
  }

  graphics.fillStyle(0xf4d780, 1);
  const hornTipY = appearance.hornStyle === 'star' ? -101 : -96;
  graphics.fillTriangle(
    x + 67 * scale,
    y - 58 * scale,
    x + 77 * scale,
    y + hornTipY * scale,
    x + 82 * scale,
    y - 57 * scale,
  );
  if (appearance.hornStyle === 'star') {
    graphics.fillStyle(0xffe889, 1);
    drawStar(graphics, x + 77 * scale, y - 103 * scale, 9 * scale);
  } else if (appearance.hornStyle === 'spiral') {
    graphics.lineStyle(2.5 * scale, 0xc49250, 0.95);
    graphics.lineBetween(x + 71 * scale, y - 68 * scale, x + 81 * scale, y - 73 * scale);
    graphics.lineBetween(x + 73 * scale, y - 79 * scale, x + 80 * scale, y - 83 * scale);
  }

  graphics.fillStyle(0xe99aba, 0.13);
  graphics.fillEllipse(x + 88 * scale, y - 17 * scale, 17 * scale, 8 * scale);

  graphics.fillStyle(0x493955, 0.24);
  graphics.fillCircle(x + 102 * scale, y - 15 * scale, 2 * scale);

  graphics.fillStyle(eye, 1);
  graphics.fillCircle(x + 85 * scale, y - 35 * scale, 6.5 * scale);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(x + 87.2 * scale, y - 37.5 * scale, 2.2 * scale);
  graphics.fillStyle(0x493955, 0.82);
  graphics.fillCircle(x + 86 * scale, y - 33.5 * scale, 2 * scale);

  graphics.lineStyle(1.8 * scale, 0x6f546f, 0.38);
  graphics.lineBetween(x + 96 * scale, y - 8 * scale, x + 104 * scale, y - 6 * scale);

  graphics.fillStyle(0xffffff, 0.76);
  if (appearance.marking === 'star') {
    drawStar(graphics, x - 11 * scale, y + 6 * scale, 10 * scale);
  } else if (appearance.marking === 'heart') {
    drawHeart(graphics, x - 10 * scale, y + 1 * scale, scale * 0.72);
  } else if (appearance.marking === 'moon') {
    graphics.fillCircle(x - 10 * scale, y + 5 * scale, 11 * scale);
    graphics.fillStyle(body, 1);
    graphics.fillCircle(x - 5 * scale, y + 1 * scale, 9 * scale);
  }

  if (appearance.accessory === 'flower') {
    graphics.fillStyle(0xffc7e8, 1);
    graphics.fillCircle(x + 51 * scale, y - 58 * scale, 7 * scale);
    graphics.fillCircle(x + 59 * scale, y - 52 * scale, 7 * scale);
    graphics.fillCircle(x + 51 * scale, y - 46 * scale, 7 * scale);
    graphics.fillCircle(x + 43 * scale, y - 52 * scale, 7 * scale);
    graphics.fillStyle(0xffe79a, 1);
    graphics.fillCircle(x + 51 * scale, y - 52 * scale, 4.5 * scale);
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
