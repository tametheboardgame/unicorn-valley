import type Phaser from 'phaser';
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
  rearA: number;
  rearB: number;
  frontA: number;
  frontB: number;
  tailY: number;
  maneLift: number;
}

const POSES: Readonly<Record<UnicornProductionPose, PoseMetrics>> = {
  idle: { bodyY: 0, headY: 0, headX: 0, rearA: 0, rearB: 0, frontA: 0, frontB: 0, tailY: 0, maneLift: 0 },
  'walk-a': { bodyY: -2, headY: -1, headX: 1, rearA: -5, rearB: 5, frontA: 6, frontB: -5, tailY: -3, maneLift: 1 },
  'walk-b': { bodyY: 1, headY: 1, headX: -1, rearA: 5, rearB: -5, frontA: -5, frontB: 6, tailY: 2, maneLift: -1 },
  'gallop-a': { bodyY: -5, headY: -4, headX: 4, rearA: -12, rearB: 9, frontA: 13, frontB: -9, tailY: -8, maneLift: 5 },
  'gallop-b': { bodyY: -1, headY: 0, headX: -1, rearA: 10, rearB: -10, frontA: -10, frontB: 12, tailY: -4, maneLift: 2 },
  celebrate: { bodyY: -8, headY: -11, headX: 3, rearA: 2, rearB: -2, frontA: -14, frontB: -12, tailY: -10, maneLift: 6 },
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColour(source: number, target: number, amount: number): number {
  const sr = (source >> 16) & 0xff;
  const sg = (source >> 8) & 0xff;
  const sb = source & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const mix = (from: number, to: number) => clampChannel(from + (to - from) * amount);
  return (mix(sr, tr) << 16) | (mix(sg, tg) << 8) | mix(sb, tb);
}

function ellipse(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  outline: number,
  lineWidth = 3,
): void {
  g.fillStyle(fill, 1);
  g.fillEllipse(x, y, width, height);
  g.lineStyle(lineWidth, outline, 0.88);
  g.strokeEllipse(x, y, width, height);
}

function roundedRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: number,
  outline: number,
  lineWidth = 3,
): void {
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(lineWidth, outline, 0.88);
  g.strokeRoundedRect(x, y, width, height, radius);
}

function star(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
  const inner = radius * 0.34;
  g.fillTriangle(x, y - radius, x - inner, y, x + inner, y);
  g.fillTriangle(x, y + radius, x - inner, y, x + inner, y);
  g.fillTriangle(x - radius, y, x, y - inner, x, y + inner);
  g.fillTriangle(x + radius, y, x, y - inner, x, y + inner);
}

function heart(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
  g.fillCircle(x - 5 * scale, y, 6 * scale);
  g.fillCircle(x + 5 * scale, y, 6 * scale);
  g.fillTriangle(x - 11 * scale, y + 2 * scale, x + 11 * scale, y + 2 * scale, x, y + 14 * scale);
}

function drawTail(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
  fill: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const ty = y + metrics.tailY;
  g.fillStyle(fill, 1);
  g.lineStyle(3.5, outline, 0.85);

  if (appearance.tailStyle === 'curl') {
    for (const [dx, dy, r] of [[-66, 1, 23], [-84, -12, 17], [-94, 8, 13]] as const) {
      g.fillCircle(x + dx, ty + dy, r);
      g.strokeCircle(x + dx, ty + dy, r);
    }
  } else if (appearance.tailStyle === 'ribbon') {
    g.fillTriangle(x - 49, ty - 7, x - 106, ty - 32, x - 83, ty + 5);
    g.strokeTriangle(x - 49, ty - 7, x - 106, ty - 32, x - 83, ty + 5);
    g.fillTriangle(x - 58, ty + 2, x - 101, ty + 32, x - 80, ty + 2);
    g.strokeTriangle(x - 58, ty + 2, x - 101, ty + 32, x - 80, ty + 2);
  } else {
    ellipse(g, x - 77, ty - 3, 64, 38, fill, outline, 3.5);
    g.fillStyle(fill, 1);
    g.fillCircle(x - 103, ty + 2, 17);
    g.strokeCircle(x - 103, ty + 2, 17);
  }

  g.fillStyle(0xffffff, 0.17);
  g.fillEllipse(x - 80, ty - 9, 30, 9);
}

function drawMane(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
  fill: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const lift = metrics.maneLift;
  g.fillStyle(fill, 1);
  g.lineStyle(3.2, outline, 0.84);

  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, r] of [[43, -47, 14], [34, -31, 16], [30, -13, 15], [27, 4, 12]] as const) {
      g.fillCircle(x + dx, y + dy - lift, r);
      g.strokeCircle(x + dx, y + dy - lift, r);
    }
  } else if (appearance.maneStyle === 'swept') {
    g.fillTriangle(x + 48, y - 62 - lift, x + 17, y - 16 - lift, x + 58, y - 4 - lift);
    g.strokeTriangle(x + 48, y - 62 - lift, x + 17, y - 16 - lift, x + 58, y - 4 - lift);
    ellipse(g, x + 31, y - 24 - lift, 23, 42, fill, outline, 3);
  } else {
    ellipse(g, x + 42, y - 45 - lift, 25, 27, fill, outline, 3);
    ellipse(g, x + 34, y - 24 - lift, 27, 43, fill, outline, 3);
    ellipse(g, x + 29, y - 3 - lift, 23, 34, fill, outline, 3);
  }

  g.fillStyle(0xffffff, 0.18);
  g.fillEllipse(x + 35, y - 35 - lift, 7, 24);
}

function drawHorn(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
): void {
  // The tallest celebration pose moves the head up by 11 px. Keeping the horn
  // inside y-88 (and the star centre at y-84) leaves a safe top margin in every
  // 202 px production frame without changing texture/display proportions.
  const tipOffset = appearance.hornStyle === 'star' ? -82 : -88;
  g.fillStyle(0xf3d47c, 1);
  g.lineStyle(2.8, 0xb8894a, 0.92);
  g.fillTriangle(x + 67, y - 58, x + 78, y + tipOffset, x + 84, y - 57);
  g.strokeTriangle(x + 67, y - 58, x + 78, y + tipOffset, x + 84, y - 57);
  g.lineStyle(2, 0xb8894a, 0.95);
  g.lineBetween(x + 70, y - 68, x + 82, y - 72);
  if (appearance.hornStyle === 'spiral') {
    g.lineBetween(x + 72, y - 78, x + 81, y - 82);
  } else if (appearance.hornStyle === 'star') {
    g.fillStyle(0xffec96, 1);
    star(g, x + 78, y - 84, 8);
  }
}

function drawMarking(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
  body: number,
): void {
  g.fillStyle(0xffffff, 0.84);
  if (appearance.marking === 'star') {
    star(g, x - 13, y + 5, 11);
  } else if (appearance.marking === 'heart') {
    heart(g, x - 13, y, 0.78);
  } else if (appearance.marking === 'moon') {
    g.fillCircle(x - 13, y + 5, 12);
    g.fillStyle(body, 1);
    g.fillCircle(x - 7, y + 1, 9.5);
  }
}

function drawAccessory(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  appearance: UnicornAppearance,
): void {
  if (appearance.accessory === 'flower') {
    g.fillStyle(0xffbfdc, 1);
    for (const [dx, dy] of [[0, -7], [8, 0], [0, 7], [-8, 0]] as const) {
      g.fillCircle(x + 52 + dx, y - 52 + dy, 7);
    }
    g.fillStyle(0xffe28a, 1);
    g.fillCircle(x + 52, y - 52, 5);
  } else if (appearance.accessory === 'bow') {
    g.fillStyle(0xe77aa8, 1);
    g.fillTriangle(x + 33, y - 9, x + 50, y + 1, x + 34, y + 12);
    g.fillTriangle(x + 68, y - 9, x + 50, y + 1, x + 67, y + 12);
    g.fillCircle(x + 50, y + 1, 6);
  } else if (appearance.accessory === 'bell') {
    g.lineStyle(3, 0x9aa8b5, 1);
    g.lineBetween(x + 42, y + 2, x + 51, y + 16);
    g.fillStyle(0xe6edf2, 1);
    g.fillCircle(x + 52, y + 21, 9);
    g.fillStyle(0x8495a5, 1);
    g.fillCircle(x + 52, y + 24, 2.4);
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
  const metrics = POSES[pose];
  const body = colourValue(BODY_COLOURS, appearance.bodyColour);
  const eye = colourValue(EYE_COLOURS, appearance.eyeColour);
  const mane = colourValue(HAIR_COLOURS, appearance.maneColour);
  const tail = colourValue(HAIR_COLOURS, appearance.tailColour);
  const outline = mixColour(body, 0x554261, 0.48);
  const shade = mixColour(body, 0x705c78, 0.23);
  const highlight = mixColour(body, 0xffffff, 0.4);
  const maneOutline = mixColour(mane, 0x493a58, 0.45);
  const tailOutline = mixColour(tail, 0x493a58, 0.45);
  const bx = x;
  const by = y + metrics.bodyY * scale;
  const hx = x + metrics.headX * scale;
  const hy = y + metrics.headY * scale;
  const s = scale;

  graphics.fillStyle(0x4b3658, 0.12);
  graphics.fillEllipse(bx - 4 * s, y + 67 * s, 154 * s, 24 * s);
  drawTail(graphics, bx / s, by / s, appearance, tail, tailOutline, {
    ...metrics,
    tailY: metrics.tailY,
  });

  for (const leg of [
    { x: -43, offset: metrics.rearA },
    { x: 3, offset: metrics.rearB },
  ] as const) {
    graphics.fillStyle(shade, 0.9);
    graphics.fillRoundedRect(
      bx + leg.x * s,
      by + (27 + leg.offset) * s,
      18 * s,
      50 * s,
      8 * s,
    );
  }

  ellipse(graphics, bx - 6 * s, by + 7 * s, 124 * s, 66 * s, body, outline, 4 * s);
  ellipse(graphics, bx + 39 * s, by - 9 * s, 47 * s, 72 * s, body, outline, 4 * s);

  for (const leg of [
    { x: -29, offset: metrics.frontA },
    { x: 27, offset: metrics.frontB },
  ] as const) {
    roundedRect(
      graphics,
      bx + leg.x * s,
      by + (29 + leg.offset) * s,
      18 * s,
      52 * s,
      8 * s,
      body,
      outline,
      3 * s,
    );
    graphics.fillStyle(shade, 0.33);
    graphics.fillRoundedRect(
      bx + leg.x * s,
      by + (68 + leg.offset) * s,
      18 * s,
      10 * s,
      5 * s,
    );
  }

  ellipse(graphics, hx + 72 * s, hy - 34 * s, 72 * s, 58 * s, body, outline, 4 * s);
  ellipse(
    graphics,
    hx + 101 * s,
    hy - 18 * s,
    32 * s,
    23 * s,
    mixColour(body, 0xffdfd6, 0.13),
    outline,
    3 * s,
  );

  graphics.fillStyle(body, 1);
  graphics.lineStyle(3 * s, outline, 0.9);
  for (const ear of [
    [51, -55, 57, -80, 66, -55],
    [71, -57, 79, -82, 88, -55],
  ] as const) {
    graphics.fillTriangle(
      hx + ear[0] * s,
      hy + ear[1] * s,
      hx + ear[2] * s,
      hy + ear[3] * s,
      hx + ear[4] * s,
      hy + ear[5] * s,
    );
    graphics.strokeTriangle(
      hx + ear[0] * s,
      hy + ear[1] * s,
      hx + ear[2] * s,
      hy + ear[3] * s,
      hx + ear[4] * s,
      hy + ear[5] * s,
    );
  }

  graphics.fillStyle(0xffd7e0, 0.42);
  graphics.fillTriangle(hx + 55 * s, hy - 58 * s, hx + 58 * s, hy - 72 * s, hx + 63 * s, hy - 57 * s);
  graphics.fillTriangle(hx + 76 * s, hy - 59 * s, hx + 79 * s, hy - 74 * s, hx + 84 * s, hy - 57 * s);

  graphics.fillStyle(highlight, 0.57);
  graphics.fillEllipse(bx - 19 * s, by - 3 * s, 52 * s, 21 * s);
  graphics.fillEllipse(hx + 58 * s, hy - 24 * s, 22 * s, 34 * s);
  graphics.fillStyle(0xe99aba, 0.13);
  graphics.fillEllipse(hx + 91 * s, hy - 17 * s, 18 * s, 9 * s);

  // Hair/horn helpers operate in the renderer's 1x design coordinate space.
  graphics.save();
  graphics.scaleCanvas?.(s, s);
  graphics.restore();

  if (s === 1) {
    drawMane(graphics, hx, hy, appearance, mane, maneOutline, metrics);
    drawHorn(graphics, hx, hy, appearance);
    drawMarking(graphics, bx, by, appearance, body);
    drawAccessory(graphics, hx, hy, appearance);
  } else {
    // Preview rendering currently uses the same 1x source geometry in generated
    // textures. Keep a conservative scaled fallback for any future direct use.
    const scaledMetrics = { ...metrics, maneLift: metrics.maneLift * s, tailY: metrics.tailY * s };
    drawMane(graphics, hx, hy, appearance, mane, maneOutline, scaledMetrics);
    drawHorn(graphics, hx, hy, appearance);
    drawMarking(graphics, bx, by, appearance, body);
    drawAccessory(graphics, hx, hy, appearance);
  }

  graphics.fillStyle(0x493955, 0.3);
  graphics.fillCircle(hx + 104 * s, hy - 15 * s, 2.2 * s);
  graphics.fillStyle(eye, 1);
  graphics.fillCircle(hx + 86 * s, hy - 37 * s, 7.5 * s);
  graphics.fillStyle(0x2f2940, 0.82);
  graphics.fillCircle(hx + 87 * s, hy - 35 * s, 3 * s);
  graphics.fillStyle(0xffffff, 0.96);
  graphics.fillCircle(hx + 88.5 * s, hy - 39.3 * s, 2.5 * s);
  graphics.lineStyle(2 * s, outline, 0.45);
  graphics.lineBetween(hx + 97 * s, hy - 8 * s, hx + 106 * s, hy - 6 * s);

  if (pose === 'celebrate') {
    graphics.fillStyle(0xffef9a, 0.95);
    star(graphics, bx - 70 * s, y - 55 * s, 7 * s);
    star(graphics, bx + 114 * s, y - 86 * s, 6 * s);
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
