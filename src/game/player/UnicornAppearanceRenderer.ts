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
  idle: {
    bodyY: 0,
    headY: 0,
    headX: 0,
    rearA: 0,
    rearB: 0,
    frontA: 0,
    frontB: 0,
    tailY: 0,
    maneLift: 0,
  },
  'walk-a': {
    bodyY: -2,
    headY: -1,
    headX: 1,
    rearA: -5,
    rearB: 5,
    frontA: 6,
    frontB: -5,
    tailY: -3,
    maneLift: 1,
  },
  'walk-b': {
    bodyY: 1,
    headY: 1,
    headX: -1,
    rearA: 5,
    rearB: -5,
    frontA: -5,
    frontB: 6,
    tailY: 2,
    maneLift: -1,
  },
  'gallop-a': {
    bodyY: -5,
    headY: -4,
    headX: 4,
    rearA: -12,
    rearB: 9,
    frontA: 13,
    frontB: -9,
    tailY: -8,
    maneLift: 5,
  },
  'gallop-b': {
    bodyY: -1,
    headY: 0,
    headX: -1,
    rearA: 10,
    rearB: -10,
    frontA: -10,
    frontB: 12,
    tailY: -4,
    maneLift: 2,
  },
  celebrate: {
    bodyY: -8,
    headY: -11,
    headX: 3,
    rearA: 2,
    rearB: -2,
    frontA: -14,
    frontB: -12,
    tailY: -10,
    maneLift: 6,
  },
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
  graphics.lineStyle(lineWidth, outline, 0.88);
  graphics.strokeEllipse(x, y, width, height);
}

function roundedRect(
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
  graphics.lineStyle(lineWidth, outline, 0.88);
  graphics.strokeRoundedRect(x, y, width, height, radius);
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

function drawTail(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
  fill: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const tailY = y + metrics.tailY * scale;
  graphics.fillStyle(fill, 1);
  graphics.lineStyle(3.5 * scale, outline, 0.85);

  if (appearance.tailStyle === 'curl') {
    for (const [dx, dy, radius] of [
      [-66, 1, 23],
      [-84, -12, 17],
      [-94, 8, 13],
    ] as const) {
      graphics.fillCircle(x + dx * scale, tailY + dy * scale, radius * scale);
      graphics.strokeCircle(x + dx * scale, tailY + dy * scale, radius * scale);
    }
  } else if (appearance.tailStyle === 'ribbon') {
    graphics.fillTriangle(
      x - 49 * scale,
      tailY - 7 * scale,
      x - 106 * scale,
      tailY - 32 * scale,
      x - 83 * scale,
      tailY + 5 * scale,
    );
    graphics.strokeTriangle(
      x - 49 * scale,
      tailY - 7 * scale,
      x - 106 * scale,
      tailY - 32 * scale,
      x - 83 * scale,
      tailY + 5 * scale,
    );
    graphics.fillTriangle(
      x - 58 * scale,
      tailY + 2 * scale,
      x - 101 * scale,
      tailY + 32 * scale,
      x - 80 * scale,
      tailY + 2 * scale,
    );
    graphics.strokeTriangle(
      x - 58 * scale,
      tailY + 2 * scale,
      x - 101 * scale,
      tailY + 32 * scale,
      x - 80 * scale,
      tailY + 2 * scale,
    );
  } else if (appearance.tailStyle === 'braid') {
    const braid = [
      [-55, -3, 20, 17],
      [-69, 3, 19, 16],
      [-82, -3, 18, 15],
      [-94, 3, 17, 14],
      [-105, -2, 15, 12],
    ] as const;
    for (const [dx, dy, width, height] of braid) {
      ellipse(
        graphics,
        x + dx * scale,
        tailY + dy * scale,
        width * scale,
        height * scale,
        fill,
        outline,
        2.4 * scale,
      );
    }
    graphics.fillStyle(0xffd778, 1);
    graphics.fillCircle(x - 113 * scale, tailY, 5 * scale);
  } else if (appearance.tailStyle === 'puff') {
    for (const [dx, dy, radius] of [
      [-63, -3, 22],
      [-83, 2, 20],
      [-101, -2, 16],
    ] as const) {
      graphics.fillStyle(fill, 1);
      graphics.fillCircle(x + dx * scale, tailY + dy * scale, radius * scale);
      graphics.lineStyle(3 * scale, outline, 0.84);
      graphics.strokeCircle(x + dx * scale, tailY + dy * scale, radius * scale);
    }
  } else {
    ellipse(
      graphics,
      x - 77 * scale,
      tailY - 3 * scale,
      64 * scale,
      38 * scale,
      fill,
      outline,
      3.5 * scale,
    );
    graphics.fillStyle(fill, 1);
    graphics.fillCircle(x - 103 * scale, tailY + 2 * scale, 17 * scale);
    graphics.strokeCircle(x - 103 * scale, tailY + 2 * scale, 17 * scale);
  }

  graphics.fillStyle(0xffffff, 0.17);
  graphics.fillEllipse(x - 80 * scale, tailY - 9 * scale, 30 * scale, 9 * scale);
}

function drawMane(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
  fill: number,
  outline: number,
  metrics: PoseMetrics,
): void {
  const lift = metrics.maneLift * scale;
  graphics.fillStyle(fill, 1);
  graphics.lineStyle(3.2 * scale, outline, 0.84);

  if (appearance.maneStyle === 'fluffy') {
    for (const [dx, dy, radius] of [
      [43, -47, 14],
      [34, -31, 16],
      [30, -13, 15],
      [27, 4, 12],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale - lift, radius * scale);
      graphics.strokeCircle(x + dx * scale, y + dy * scale - lift, radius * scale);
    }
  } else if (appearance.maneStyle === 'swept') {
    graphics.fillTriangle(
      x + 48 * scale,
      y - 62 * scale - lift,
      x + 17 * scale,
      y - 16 * scale - lift,
      x + 58 * scale,
      y - 4 * scale - lift,
    );
    graphics.strokeTriangle(
      x + 48 * scale,
      y - 62 * scale - lift,
      x + 17 * scale,
      y - 16 * scale - lift,
      x + 58 * scale,
      y - 4 * scale - lift,
    );
    ellipse(
      graphics,
      x + 31 * scale,
      y - 24 * scale - lift,
      23 * scale,
      42 * scale,
      fill,
      outline,
      3 * scale,
    );
  } else if (appearance.maneStyle === 'braid') {
    for (const [dx, dy, width, height] of [
      [44, -47, 18, 20],
      [37, -31, 19, 21],
      [32, -14, 18, 20],
      [29, 2, 16, 18],
    ] as const) {
      ellipse(
        graphics,
        x + dx * scale,
        y + dy * scale - lift,
        width * scale,
        height * scale,
        fill,
        outline,
        2.4 * scale,
      );
    }
    graphics.fillStyle(0xffd778, 1);
    graphics.fillCircle(x + 28 * scale, y + 13 * scale - lift, 4.5 * scale);
  } else if (appearance.maneStyle === 'crest') {
    for (const [dx, top, baseY, width] of [
      [44, -67, -43, 15],
      [37, -53, -28, 16],
      [31, -37, -12, 15],
      [27, -21, 4, 13],
    ] as const) {
      graphics.fillStyle(fill, 1);
      graphics.fillTriangle(
        x + (dx - width / 2) * scale,
        y + baseY * scale - lift,
        x + dx * scale,
        y + top * scale - lift,
        x + (dx + width / 2) * scale,
        y + baseY * scale - lift,
      );
      graphics.lineStyle(2.6 * scale, outline, 0.84);
      graphics.strokeTriangle(
        x + (dx - width / 2) * scale,
        y + baseY * scale - lift,
        x + dx * scale,
        y + top * scale - lift,
        x + (dx + width / 2) * scale,
        y + baseY * scale - lift,
      );
    }
  } else {
    ellipse(
      graphics,
      x + 42 * scale,
      y - 45 * scale - lift,
      25 * scale,
      27 * scale,
      fill,
      outline,
      3 * scale,
    );
    ellipse(
      graphics,
      x + 34 * scale,
      y - 24 * scale - lift,
      27 * scale,
      43 * scale,
      fill,
      outline,
      3 * scale,
    );
    ellipse(
      graphics,
      x + 29 * scale,
      y - 3 * scale - lift,
      23 * scale,
      34 * scale,
      fill,
      outline,
      3 * scale,
    );
  }

  graphics.fillStyle(0xffffff, 0.18);
  graphics.fillEllipse(x + 35 * scale, y - 35 * scale - lift, 7 * scale, 24 * scale);
}

function drawHorn(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  appearance: UnicornAppearance,
): void {
  const tipOffset =
    appearance.hornStyle === 'star'
      ? -82
      : appearance.hornStyle === 'short'
        ? -75
        : appearance.hornStyle === 'crystal'
          ? -85
          : -88;
  graphics.fillStyle(appearance.hornStyle === 'crystal' ? 0xd9f6ff : 0xf3d47c, 1);
  graphics.lineStyle(2.8 * scale, appearance.hornStyle === 'crystal' ? 0x77a8bb : 0xb8894a, 0.92);
  graphics.fillTriangle(
    x + 67 * scale,
    y - 58 * scale,
    x + 78 * scale,
    y + tipOffset * scale,
    x + 84 * scale,
    y - 57 * scale,
  );
  graphics.strokeTriangle(
    x + 67 * scale,
    y - 58 * scale,
    x + 78 * scale,
    y + tipOffset * scale,
    x + 84 * scale,
    y - 57 * scale,
  );
  graphics.lineStyle(2 * scale, appearance.hornStyle === 'crystal' ? 0x77a8bb : 0xb8894a, 0.95);
  graphics.lineBetween(x + 70 * scale, y - 68 * scale, x + 82 * scale, y - 72 * scale);
  if (appearance.hornStyle === 'spiral') {
    graphics.lineBetween(x + 72 * scale, y - 78 * scale, x + 81 * scale, y - 82 * scale);
  } else if (appearance.hornStyle === 'star') {
    graphics.fillStyle(0xffec96, 1);
    drawStar(graphics, x + 78 * scale, y - 84 * scale, 8 * scale);
  } else if (appearance.hornStyle === 'crystal') {
    graphics.fillStyle(0xbdefff, 0.95);
    graphics.fillTriangle(
      x + 72 * scale,
      y - 82 * scale,
      x + 78 * scale,
      y - 92 * scale,
      x + 84 * scale,
      y - 82 * scale,
    );
    graphics.fillTriangle(
      x + 72 * scale,
      y - 82 * scale,
      x + 78 * scale,
      y - 74 * scale,
      x + 84 * scale,
      y - 82 * scale,
    );
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
  graphics.fillStyle(0xffffff, 0.84);
  if (appearance.marking === 'star') {
    drawStar(graphics, x - 13 * scale, y + 5 * scale, 11 * scale);
  } else if (appearance.marking === 'heart') {
    drawHeart(graphics, x - 13 * scale, y, scale * 0.78);
  } else if (appearance.marking === 'moon') {
    graphics.fillCircle(x - 13 * scale, y + 5 * scale, 12 * scale);
    graphics.fillStyle(body, 1);
    graphics.fillCircle(x - 7 * scale, y + 1 * scale, 9.5 * scale);
  } else if (appearance.marking === 'freckles') {
    for (const [dx, dy, radius] of [
      [-28, -3, 3.2],
      [-18, 5, 2.7],
      [-7, -1, 3],
      [4, 7, 2.5],
      [13, -3, 2.8],
    ] as const) {
      graphics.fillCircle(x + dx * scale, y + dy * scale, radius * scale);
    }
  } else if (appearance.marking === 'sparkles') {
    drawStar(graphics, x - 24 * scale, y + 1 * scale, 7 * scale);
    drawStar(graphics, x - 5 * scale, y + 11 * scale, 5 * scale);
    drawStar(graphics, x + 10 * scale, y - 2 * scale, 4.5 * scale);
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
  } else if (appearance.accessory === 'crown') {
    graphics.fillStyle(0xffdf70, 1);
    graphics.fillRect(x + 46 * scale, y - 66 * scale, 28 * scale, 7 * scale);
    for (const [dx, height] of [
      [48, 13],
      [60, 18],
      [72, 13],
    ] as const) {
      graphics.fillTriangle(
        x + (dx - 5) * scale,
        y - 64 * scale,
        x + dx * scale,
        y - (64 + height) * scale,
        x + (dx + 5) * scale,
        y - 64 * scale,
      );
    }
    graphics.fillStyle(0xff8fb7, 1);
    graphics.fillCircle(x + 60 * scale, y - 62 * scale, 3.5 * scale);
  } else if (appearance.accessory === 'ribbon') {
    graphics.fillStyle(0xb989dc, 1);
    graphics.fillTriangle(
      x + 35 * scale,
      y + 2 * scale,
      x + 48 * scale,
      y + 11 * scale,
      x + 35 * scale,
      y + 18 * scale,
    );
    graphics.fillTriangle(
      x + 61 * scale,
      y + 2 * scale,
      x + 48 * scale,
      y + 11 * scale,
      x + 61 * scale,
      y + 18 * scale,
    );
    graphics.fillCircle(x + 48 * scale, y + 11 * scale, 5 * scale);
    graphics.fillTriangle(
      x + 45 * scale,
      y + 14 * scale,
      x + 42 * scale,
      y + 31 * scale,
      x + 50 * scale,
      y + 18 * scale,
    );
    graphics.fillTriangle(
      x + 51 * scale,
      y + 14 * scale,
      x + 59 * scale,
      y + 29 * scale,
      x + 53 * scale,
      y + 18 * scale,
    );
  } else if (appearance.accessory === 'scarf') {
    graphics.lineStyle(9 * scale, 0xe989a8, 1);
    graphics.lineBetween(x + 32 * scale, y + 2 * scale, x + 57 * scale, y + 14 * scale);
    graphics.lineStyle(6 * scale, 0xc96b91, 1);
    graphics.lineBetween(x + 52 * scale, y + 12 * scale, x + 63 * scale, y + 38 * scale);
    graphics.lineStyle(2 * scale, 0xffd3df, 0.85);
    graphics.lineBetween(x + 56 * scale, y + 29 * scale, x + 64 * scale, y + 33 * scale);
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
  const bodyY = y + metrics.bodyY * scale;
  const headX = x + metrics.headX * scale;
  const headY = y + metrics.headY * scale;

  graphics.fillStyle(0x4b3658, 0.12);
  graphics.fillEllipse(x - 4 * scale, y + 67 * scale, 154 * scale, 24 * scale);
  drawTail(graphics, x, bodyY, scale, appearance, tail, tailOutline, metrics);

  for (const leg of [
    { x: -43, offset: metrics.rearA },
    { x: 3, offset: metrics.rearB },
  ] as const) {
    graphics.fillStyle(shade, 0.9);
    graphics.fillRoundedRect(
      x + leg.x * scale,
      bodyY + (27 + leg.offset) * scale,
      18 * scale,
      50 * scale,
      8 * scale,
    );
  }

  ellipse(
    graphics,
    x - 6 * scale,
    bodyY + 7 * scale,
    124 * scale,
    66 * scale,
    body,
    outline,
    4 * scale,
  );
  ellipse(
    graphics,
    x + 39 * scale,
    bodyY - 9 * scale,
    47 * scale,
    72 * scale,
    body,
    outline,
    4 * scale,
  );

  for (const leg of [
    { x: -29, offset: metrics.frontA },
    { x: 27, offset: metrics.frontB },
  ] as const) {
    roundedRect(
      graphics,
      x + leg.x * scale,
      bodyY + (29 + leg.offset) * scale,
      18 * scale,
      52 * scale,
      8 * scale,
      body,
      outline,
      3 * scale,
    );
    graphics.fillStyle(shade, 0.33);
    graphics.fillRoundedRect(
      x + leg.x * scale,
      bodyY + (68 + leg.offset) * scale,
      18 * scale,
      10 * scale,
      5 * scale,
    );
  }

  ellipse(
    graphics,
    headX + 72 * scale,
    headY - 34 * scale,
    72 * scale,
    58 * scale,
    body,
    outline,
    4 * scale,
  );
  ellipse(
    graphics,
    headX + 101 * scale,
    headY - 18 * scale,
    32 * scale,
    23 * scale,
    mixColour(body, 0xffdfd6, 0.13),
    outline,
    3 * scale,
  );

  graphics.fillStyle(body, 1);
  graphics.lineStyle(3 * scale, outline, 0.9);
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

  graphics.fillStyle(highlight, 0.57);
  graphics.fillEllipse(x - 19 * scale, bodyY - 3 * scale, 52 * scale, 21 * scale);
  graphics.fillEllipse(headX + 58 * scale, headY - 24 * scale, 22 * scale, 34 * scale);
  graphics.fillStyle(0xe99aba, 0.13);
  graphics.fillEllipse(headX + 91 * scale, headY - 17 * scale, 18 * scale, 9 * scale);

  drawMane(graphics, headX, headY, scale, appearance, mane, maneOutline, metrics);
  drawHorn(graphics, headX, headY, scale, appearance);
  drawMarking(graphics, x, bodyY, scale, appearance, body);
  drawAccessory(graphics, headX, headY, scale, appearance);

  graphics.fillStyle(0x493955, 0.3);
  graphics.fillCircle(headX + 104 * scale, headY - 15 * scale, 2.2 * scale);
  graphics.fillStyle(eye, 1);
  graphics.fillCircle(headX + 86 * scale, headY - 37 * scale, 7.5 * scale);
  graphics.fillStyle(0x2f2940, 0.82);
  graphics.fillCircle(headX + 87 * scale, headY - 35 * scale, 3 * scale);
  graphics.fillStyle(0xffffff, 0.96);
  graphics.fillCircle(headX + 88.5 * scale, headY - 39.3 * scale, 2.5 * scale);
  graphics.lineStyle(2 * scale, outline, 0.45);
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
