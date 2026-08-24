import Phaser from 'phaser';
import {
  BODY_COLOURS,
  EYE_COLOURS,
  HAIR_COLOURS,
  colourValue,
  type UnicornAppearance,
} from './UnicornAppearance';
import {
  getUnicornProductionTextureKey,
  type UnicornProductionPose,
  UNICORN_PRODUCTION_POSES,
} from './UnicornProductionArt';

interface PoseMetrics {
  bodyY: number;
  headY: number;
  headX: number;
  rearLegA: number;
  rearLegB: number;
  frontLegA: number;
  frontLegB: number;
  tailY: number;
  maneLift: number;
}

const POSE_METRICS: Readonly<Record<UnicornProductionPose, PoseMetrics>> = {
  idle: {
    bodyY: 0,
    headY: 0,
    headX: 0,
    rearLegA: 0,
    rearLegB: 0,
    frontLegA: 0,
    frontLegB: 0,
    tailY: 0,
    maneLift: 0,
  },
  'walk-a': {
    bodyY: -2,
    headY: -1,
    headX: 1,
    rearLegA: -5,
    rearLegB: 5,
    frontLegA: 6,
    frontLegB: -5,
    tailY: -2,
    maneLift: 1,
  },
  'walk-b': {
    bodyY: 1,
    headY: 1,
    headX: -1,
    rearLegA: 5,
    rearLegB: -5,
    frontLegA: -5,
    frontLegB: 6,
    tailY: 2,
    maneLift: -1,
  },
  'gallop-a': {
    bodyY: -5,
    headY: -4,
    headX: 4,
    rearLegA: -12,
    rearLegB: 9,
    frontLegA: 13,
    frontLegB: -9,
    tailY: -8,
    maneLift: 5,
  },
  'gallop-b': {
    bodyY: -1,
    headY: 0,
    headX: -1,
    rearLegA: 10,
    rearLegB: -10,
    frontLegA: -10,
    frontLegB: 12,
    tailY: -4,
    maneLift: 2,
  },
  celebrate: {
    bodyY: -8,
    headY: -11,
    headX: 3,
    rearLegA: 2,
    rearLegB: -2,
    frontLegA: -14,
    frontLegB: -12,
    tailY: -10,
    maneLift: 6,
  },
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColour(source: number, target: number, amount: number): number {
  const sourceR = (source >> 16) & 0xff;
  const sourceG = (source >> 8) & 0xff;
  const sourceB = source & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;
  const mix = (from: number, to: number) => clampChannel(from + (to - from) * amount);
  return (mix(sourceR, targetR) << 16) | (mix(sourceG, targetG) << 8) | mix(sourceB, targetB);
}

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

function fillOutlinedEllipse(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  outline: number,
  lineWidth: number,
): void {
  graphics.fillStyle(fill, 1);
  graphics.fillEllipse(x, y, width, height);
  graphics.lineStyle(lineWidth, outline, 0.9);
  graphics.strokeEllipse(x, y, width, height);
}

function fillOutlinedRoundedRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: number,
  outline: number,
  lineWidth: number,
): void {
  graphics.fillStyle(fill, 1);
  graphics.fillRoundedRect(x, y, width, height, radius);
  graphics.lineStyle(lineWidth, outline, 0.9);
  graphics.strokeRoundedRect(x, y, width, height, radius);
}

function drawTail(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
  colour: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const tailY = y + metrics.tailY * scale;
  graphics.lineStyle(4 * scale, outline, 0.78);
  graphics.fillStyle(colour, 1);

  if (appearance.tailStyle === 'curl') {
    graphics.fillCircle(x - 67 * scale, tailY + 2 * scale, 23 * scale);
    graphics.strokeCircle(x - 67 * scale, tailY + 2 * scale, 23 * scale);
    graphics.fillCircle(x - 86 * scale, tailY - 11 * scale, 16 * scale);
    graphics.strokeCircle(x - 86 * scale, tailY - 11 * scale, 16 * scale);
    graphics.fillCircle(x - 91 * scale, tailY + 12 * scale, 12 * scale);
    graphics.strokeCircle(x - 91 * scale, tailY + 12 * scale, 12 * scale);
    graphics.fillStyle(0xffffff, 0.18);
    graphics.fillCircle(x - 76 * scale, tailY - 8 * scale, 7 * scale);
    return;
  }

  graphics.beginPath();
  graphics.moveTo(x - 47 * scale, tailY - 4 * scale);
  if (appearance.tailStyle === 'ribbon') {
    graphics.bezierCurveTo(
      x - 73 * scale,
      tailY - 32 * scale,
      x - 105 * scale,
      tailY - 30 * scale,
      x - 101 * scale,
      tailY + 2 * scale,
    );
    graphics.bezierCurveTo(
      x - 99 * scale,
      tailY + 22 * scale,
      x - 77 * scale,
      tailY + 24 * scale,
      x - 61 * scale,
      tailY + 8 * scale,
    );
  } else {
    graphics.bezierCurveTo(
      x - 72 * scale,
      tailY - 35 * scale,
      x - 111 * scale,
      tailY - 20 * scale,
      x - 108 * scale,
      tailY + 16 * scale,
    );
    graphics.bezierCurveTo(
      x - 101 * scale,
      tailY + 42 * scale,
      x - 72 * scale,
      tailY + 30 * scale,
      x - 55 * scale,
      tailY + 10 * scale,
    );
  }
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
  graphics.fillStyle(0xffffff, 0.16);
  graphics.fillEllipse(x - 83 * scale, tailY - 8 * scale, 31 * scale, 10 * scale);
}

function drawMane(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
  colour: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const lift = metrics.maneLift * scale;
  graphics.fillStyle(colour, 1);
  graphics.lineStyle(3.5 * scale, outline, 0.82);

  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, radius] of [
      [43, -47, 14],
      [34, -31, 16],
      [31, -13, 15],
      [27, 4, 12],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale - lift, radius * scale);
      graphics.strokeCircle(x + dx * scale, y + dy * scale - lift, radius * scale);
    }
  } else if (appearance.maneStyle === 'swept') {
    graphics.beginPath();
    graphics.moveTo(x + 49 * scale, y - 60 * scale - lift);
    graphics.bezierCurveTo(
      x + 30 * scale,
      y - 46 * scale - lift,
      x + 18 * scale,
      y - 20 * scale - lift,
      x + 55 * scale,
      y - 4 * scale - lift,
    );
    graphics.bezierCurveTo(
      x + 44 * scale,
      y - 18 * scale - lift,
      x + 47 * scale,
      y - 40 * scale - lift,
      x + 49 * scale,
      y - 60 * scale - lift,
    );
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  } else {
    graphics.beginPath();
    graphics.moveTo(x + 48 * scale, y - 58 * scale - lift);
    graphics.bezierCurveTo(
      x + 23 * scale,
      y - 50 * scale - lift,
      x + 19 * scale,
      y - 23 * scale - lift,
      x + 31 * scale,
      y - 3 * scale - lift,
    );
    graphics.bezierCurveTo(
      x + 44 * scale,
      y - 17 * scale - lift,
      x + 47 * scale,
      y - 39 * scale - lift,
      x + 48 * scale,
      y - 58 * scale - lift,
    );
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  graphics.fillStyle(0xffffff, 0.2);
  graphics.fillEllipse(x + 34 * scale, y - 34 * scale - lift, 8 * scale, 27 * scale);
}

function drawHorn(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
): void {
  const hornBase = 0xf2cf72;
  const hornShade = 0xb8894a;
  const hornTipY = appearance.hornStyle === 'star' ? -104 : -99;
  graphics.fillStyle(hornBase, 1);
  graphics.lineStyle(3 * scale, hornShade, 0.9);
  graphics.beginPath();
  graphics.moveTo(x + 67 * scale, y - 58 * scale);
  graphics.lineTo(x + 78 * scale, y + hornTipY * scale);
  graphics.lineTo(x + 84 * scale, y - 57 * scale);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  if (appearance.hornStyle === 'star') {
    graphics.fillStyle(0xffe990, 1);
    drawStar(graphics, x + 78 * scale, y - 106 * scale, 10 * scale);
    return;
  }

  graphics.lineStyle(2.2 * scale, hornShade, 0.95);
  graphics.lineBetween(x + 70 * scale, y - 70 * scale, x + 82 * scale, y - 75 * scale);
  if (appearance.hornStyle === 'spiral') {
    graphics.lineBetween(x + 72 * scale, y - 82 * scale, x + 81 * scale, y - 87 * scale);
  }
}

function drawMarking(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
  body: number,
): void {
  graphics.fillStyle(0xffffff, 0.86);
  if (appearance.marking === 'star') {
    drawStar(graphics, x - 13 * scale, y + 5 * scale, 11 * scale);
  } else if (appearance.marking === 'heart') {
    drawHeart(graphics, x - 13 * scale, y, scale * 0.78);
  } else if (appearance.marking === 'moon') {
    graphics.fillCircle(x - 13 * scale, y + 5 * scale, 12 * scale);
    graphics.fillStyle(body, 1);
    graphics.fillCircle(x - 7 * scale, y + 1 * scale, 9.5 * scale);
  }
}

function drawAccessory(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
): void {
  if (appearance.accessory === 'flower') {
    graphics.fillStyle(0xffbfdc, 1);
    for (const [dx, dy] of [
      [0, -7],
      [8, 0],
      [0, 7],
      [-8, 0],
    ] as const) {
      graphics.fillCircle(x + (52 + dx) * scale, y + (-52 + dy) * scale, 7 * scale);
    }
    graphics.fillStyle(0xffe28a, 1);
    graphics.fillCircle(x + 52 * scale, y - 52 * scale, 5 * scale);
  } else if (appearance.accessory === 'bow') {
    graphics.fillStyle(0xe77aa8, 1);
    graphics.fillTriangle(
      x + 33 * scale,
      y - 9 * scale,
      x + 50 * scale,
      y + 1 * scale,
      x + 34 * scale,
      y + 12 * scale,
    );
    graphics.fillTriangle(
      x + 68 * scale,
      y - 9 * scale,
      x + 50 * scale,
      y + 1 * scale,
      x + 67 * scale,
      y + 12 * scale,
    );
    graphics.fillCircle(x + 50 * scale, y + 1 * scale, 6 * scale);
  } else if (appearance.accessory === 'bell') {
    graphics.lineStyle(3 * scale, 0x9aa8b5, 1);
    graphics.lineBetween(x + 42 * scale, y + 2 * scale, x + 51 * scale, y + 16 * scale);
    graphics.fillStyle(0xe6edf2, 1);
    graphics.fillCircle(x + 52 * scale, y + 21 * scale, 9 * scale);
    graphics.fillStyle(0x8495a5, 1);
    graphics.fillCircle(x + 52 * scale, y + 24 * scale, 2.4 * scale);
  }
}

export function drawUnicornAppearance(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
  scale = 1,
  pose: UnicornProductionPose = 'idle',
): void {
  const metrics = POSE_METRICS[pose];
  const body = colourValue(BODY_COLOURS, appearance.bodyColour);
  const eye = colourValue(EYE_COLOURS, appearance.eyeColour);
  const mane = colourValue(HAIR_COLOURS, appearance.maneColour);
  const tail = colourValue(HAIR_COLOURS, appearance.tailColour);
  const bodyOutline = mixColour(body, 0x5a4867, 0.46);
  const bodyShade = mixColour(body, 0x735f78, 0.22);
  const bodyHighlight = mixColour(body, 0xffffff, 0.38);
  const hairOutline = mixColour(mane, 0x493a58, 0.45);
  const tailOutline = mixColour(tail, 0x493a58, 0.45);
  const bodyY = y + metrics.bodyY * scale;
  const headX = x + metrics.headX * scale;
  const headY = y + metrics.headY * scale;

  graphics.fillStyle(0x4b3658, 0.12);
  graphics.fillEllipse(x - 4 * scale, y + 67 * scale, 154 * scale, 24 * scale);

  drawTail(graphics, x, bodyY, scale, appearance, tail, tailOutline, metrics);

  const rearLegs = [
    { x: -43, offset: metrics.rearLegA, alpha: 0.86 },
    { x: 3, offset: metrics.rearLegB, alpha: 0.9 },
  ] as const;
  for (const leg of rearLegs) {
    graphics.fillStyle(bodyShade, leg.alpha);
    graphics.fillRoundedRect(
      x + leg.x * scale,
      bodyY + (27 + leg.offset) * scale,
      18 * scale,
      50 * scale,
      8 * scale,
    );
  }

  fillOutlinedEllipse(
    graphics,
    x - 6 * scale,
    bodyY + 7 * scale,
    124 * scale,
    66 * scale,
    body,
    bodyOutline,
    4 * scale,
  );
  fillOutlinedEllipse(
    graphics,
    x + 39 * scale,
    bodyY - 9 * scale,
    47 * scale,
    72 * scale,
    body,
    bodyOutline,
    4 * scale,
  );

  const frontLegs = [
    { x: -29, offset: metrics.frontLegA },
    { x: 27, offset: metrics.frontLegB },
  ] as const;
  for (const leg of frontLegs) {
    fillOutlinedRoundedRect(
      graphics,
      x + leg.x * scale,
      bodyY + (29 + leg.offset) * scale,
      18 * scale,
      52 * scale,
      8 * scale,
      body,
      bodyOutline,
      3 * scale,
    );
    graphics.fillStyle(bodyShade, 0.32);
    graphics.fillRoundedRect(
      x + leg.x * scale,
      bodyY + (68 + leg.offset) * scale,
      18 * scale,
      10 * scale,
      5 * scale,
    );
  }

  fillOutlinedEllipse(
    graphics,
    headX + 72 * scale,
    headY - 34 * scale,
    72 * scale,
    58 * scale,
    body,
    bodyOutline,
    4 * scale,
  );
  fillOutlinedEllipse(
    graphics,
    headX + 101 * scale,
    headY - 18 * scale,
    32 * scale,
    23 * scale,
    mixColour(body, 0xffdfd6, 0.12),
    bodyOutline,
    3 * scale,
  );

  graphics.fillStyle(body, 1);
  graphics.lineStyle(3 * scale, bodyOutline, 0.9);
  for (const ear of [
    [51, -55, 57, -80, 66, -55],
    [71, -57, 79, -82, 88, -55],
  ] as const) {
    graphics.fillTriangle(
      headX + ear[0] * scale,
      headY + ear[1] * scale,
      headX + ear[2] * scale,
      headY + ear[3] * scale,
      headX + ear[4] * scale,
      headY + ear[5] * scale,
    );
    graphics.strokeTriangle(
      headX + ear[0] * scale,
      headY + ear[1] * scale,
      headX + ear[2] * scale,
      headY + ear[3] * scale,
      headX + ear[4] * scale,
      headY + ear[5] * scale,
    );
  }
  graphics.fillStyle(0xffd7e0, 0.42);
  graphics.fillTriangle(
    headX + 55 * scale,
    headY - 58 * scale,
    headX + 58 * scale,
    headY - 72 * scale,
    headX + 63 * scale,
    headY - 57 * scale,
  );
  graphics.fillTriangle(
    headX + 76 * scale,
    headY - 59 * scale,
    headX + 79 * scale,
    headY - 74 * scale,
    headX + 84 * scale,
    headY - 57 * scale,
  );

  graphics.fillStyle(bodyHighlight, 0.58);
  graphics.fillEllipse(x - 19 * scale, bodyY - 3 * scale, 52 * scale, 21 * scale);
  graphics.fillEllipse(headX + 58 * scale, headY - 24 * scale, 22 * scale, 34 * scale);
  graphics.fillStyle(0xe99aba, 0.12);
  graphics.fillEllipse(headX + 91 * scale, headY - 17 * scale, 18 * scale, 9 * scale);

  drawMane(graphics, headX, headY, scale, appearance, mane, hairOutline, metrics);
  drawHorn(graphics, headX, headY, scale, appearance);
  drawMarking(graphics, x, bodyY, scale, appearance, body);
  drawAccessory(graphics, headX, headY, scale, appearance);

  graphics.fillStyle(0x493955, 0.28);
  graphics.fillCircle(headX + 104 * scale, headY - 15 * scale, 2.2 * scale);

  graphics.fillStyle(eye, 1);
  graphics.fillCircle(headX + 86 * scale, headY - 37 * scale, 7.5 * scale);
  graphics.fillStyle(0x2f2940, 0.82);
  graphics.fillCircle(headX + 87 * scale, headY - 35 * scale, 3 * scale);
  graphics.fillStyle(0xffffff, 0.96);
  graphics.fillCircle(headX + 88.5 * scale, headY - 39.3 * scale, 2.5 * scale);
  graphics.lineStyle(2 * scale, bodyOutline, 0.45);
  graphics.lineBetween(
    headX + 97 * scale,
    headY - 8 * scale,
    headX + 106 * scale,
    headY - 6 * scale,
  );

  if (pose === 'celebrate') {
    graphics.fillStyle(0xffef9a, 0.95);
    drawStar(graphics, x - 70 * scale, y - 55 * scale, 7 * scale);
    drawStar(graphics, x + 114 * scale, y - 86 * scale, 6 * scale);
  }
}

export function createUnicornAppearanceTexture(
  scene: Phaser.Scene,
  textureKey: string,
  appearance: UnicornAppearance,
): string {
  for (const pose of UNICORN_PRODUCTION_POSES) {
    const frameKey = getUnicornProductionTextureKey(textureKey, pose);
    if (scene.textures.exists(frameKey)) {
      scene.textures.remove(frameKey);
    }

    const graphics = scene.add.graphics();
    drawUnicornAppearance(graphics, 118, 108, appearance, 1, pose);
    graphics.generateTexture(frameKey, 244, 202);
    graphics.destroy();
  }

  return textureKey;
}
