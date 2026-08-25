import type Phaser from 'phaser';

export const CORE_NPC_IDS = ['nova', 'willow', 'pip', 'pebble', 'lumi', 'marigold'] as const;

export type CoreNpcId = (typeof CORE_NPC_IDS)[number];
export type CoreNpcExpression = 'neutral' | 'happy';
export type CoreNpcPresentation = 'world' | 'portrait';

export interface CoreNpcVisualSpec {
  label: string;
  body: number;
  bodyShadow: number;
  mane: number;
  maneAccent: number;
  accent: number;
  outline: number;
  frame: number;
  motif: 'star' | 'moonflower' | 'explorer' | 'pebbles' | 'firefly' | 'marigold';
  silhouette: 'racer' | 'gardener' | 'small-explorer' | 'maker' | 'storykeeper' | 'baker';
}

export const CORE_NPC_VISUALS: Readonly<Record<CoreNpcId, CoreNpcVisualSpec>> = {
  nova: {
    label: 'Nova',
    body: 0xf2a4d1,
    bodyShadow: 0xd95ea9,
    mane: 0x69bde3,
    maneAccent: 0x8b75d2,
    accent: 0xffde73,
    outline: 0x63466f,
    frame: 0xfff0c7,
    motif: 'star',
    silhouette: 'racer',
  },
  willow: {
    label: 'Willow',
    body: 0xc9dfb4,
    bodyShadow: 0x8fb47f,
    mane: 0x668f73,
    maneAccent: 0x9ecb7f,
    accent: 0xffefad,
    outline: 0x49614c,
    frame: 0xf4f0ce,
    motif: 'moonflower',
    silhouette: 'gardener',
  },
  pip: {
    label: 'Pip',
    body: 0xf3a4c8,
    bodyShadow: 0xde77a9,
    mane: 0xffd7e8,
    maneAccent: 0xf8c75f,
    accent: 0x6ea9c9,
    outline: 0x563b66,
    frame: 0xfff1dc,
    motif: 'explorer',
    silhouette: 'small-explorer',
  },
  pebble: {
    label: 'Pebble',
    body: 0xb7b9a8,
    bodyShadow: 0x858b7c,
    mane: 0x6f7368,
    maneAccent: 0xd7a978,
    accent: 0xf0d08a,
    outline: 0x4f594b,
    frame: 0xfff2cf,
    motif: 'pebbles',
    silhouette: 'maker',
  },
  lumi: {
    label: 'Lumi',
    body: 0xc8e3d3,
    bodyShadow: 0x8bb8a4,
    mane: 0x5f8d86,
    maneAccent: 0x8ab7ad,
    accent: 0xf6ef9c,
    outline: 0x38564f,
    frame: 0xeaf6df,
    motif: 'firefly',
    silhouette: 'storykeeper',
  },
  marigold: {
    label: 'Marigold',
    body: 0xf2b36f,
    bodyShadow: 0xd98355,
    mane: 0xffdf82,
    maneAccent: 0xf39b55,
    accent: 0xfff1bd,
    outline: 0x7b4b3b,
    frame: 0xffefd0,
    motif: 'marigold',
    silhouette: 'baker',
  },
};

const TEXTURE_WIDTH = 184;
const TEXTURE_HEIGHT = 148;

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

function drawOutlinedEllipse(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  outline: number,
  lineWidth = 4,
): void {
  graphics.fillStyle(fill, 1);
  graphics.fillEllipse(x, y, width, height);
  graphics.lineStyle(lineWidth, outline, 0.9);
  graphics.strokeEllipse(x, y, width, height);
}

function drawOutlinedCircle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  fill: number,
  outline: number,
  lineWidth = 4,
): void {
  graphics.fillStyle(fill, 1);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(lineWidth, outline, 0.9);
  graphics.strokeCircle(x, y, radius);
}

function drawLeg(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  fill: number,
  outline: number,
  angleOffset: number,
): void {
  graphics.fillStyle(fill, 1);
  graphics.fillRoundedRect(x - 6 + angleOffset, y, 13, 38, 6);
  graphics.lineStyle(3, outline, 0.85);
  graphics.strokeRoundedRect(x - 6 + angleOffset, y, 13, 38, 6);
  graphics.fillStyle(0xf8e8d6, 0.92);
  graphics.fillRoundedRect(x - 6 + angleOffset, y + 29, 13, 9, 4);
}

function drawHappyFace(
  graphics: Phaser.GameObjects.Graphics,
  eyeX: number,
  eyeY: number,
  outline: number,
  expression: CoreNpcExpression,
): void {
  graphics.fillStyle(outline, 1);
  if (expression === 'happy') {
    graphics.fillEllipse(eyeX, eyeY, 8, 5);
    graphics.fillStyle(0xf6a6b8, 0.55);
    graphics.fillCircle(eyeX + 13, eyeY + 12, 5);
    graphics.lineStyle(2.5, outline, 0.9);
    graphics.lineBetween(eyeX + 2, eyeY + 14, eyeX + 8, eyeY + 18);
    graphics.lineBetween(eyeX + 8, eyeY + 18, eyeX + 15, eyeY + 13);
  } else {
    graphics.fillCircle(eyeX, eyeY, 4.5);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(eyeX + 1.4, eyeY - 1.4, 1.4);
  }
}

function drawUnicornTail(
  graphics: Phaser.GameObjects.Graphics,
  id: Exclude<CoreNpcId, 'pip'>,
  spec: CoreNpcVisualSpec,
): void {
  graphics.fillStyle(spec.mane, 1);
  graphics.lineStyle(4, spec.outline, 0.86);

  if (id === 'nova') {
    graphics.fillTriangle(50, 76, 7, 57, 24, 84);
    graphics.strokeTriangle(50, 76, 7, 57, 24, 84);
    graphics.fillTriangle(45, 82, 10, 94, 29, 70);
    graphics.strokeTriangle(45, 82, 10, 94, 29, 70);
    return;
  }

  if (id === 'lumi') {
    drawOutlinedEllipse(graphics, 25, 76, 52, 27, spec.mane, spec.outline, 3.5);
    drawOutlinedEllipse(graphics, 14, 89, 36, 21, spec.maneAccent, spec.outline, 3);
    return;
  }

  if (id === 'marigold') {
    for (const [x, y, radius] of [
      [28, 68, 14],
      [18, 81, 13],
      [30, 91, 12],
    ] as const) {
      graphics.fillCircle(x, y, radius);
      graphics.strokeCircle(x, y, radius);
    }
    return;
  }

  if (id === 'pebble') {
    graphics.fillRoundedRect(11, 66, 42, 25, 10);
    graphics.strokeRoundedRect(11, 66, 42, 25, 10);
    graphics.fillStyle(spec.maneAccent, 0.9);
    graphics.fillCircle(18, 86, 8);
    return;
  }

  drawOutlinedEllipse(graphics, 25, 76, 48, 30, spec.mane, spec.outline, 3.5);
  graphics.fillStyle(spec.maneAccent, 0.85);
  graphics.fillEllipse(14, 78, 18, 11);
}

function drawUnicornMane(
  graphics: Phaser.GameObjects.Graphics,
  id: Exclude<CoreNpcId, 'pip'>,
  spec: CoreNpcVisualSpec,
): void {
  graphics.fillStyle(spec.mane, 1);
  graphics.lineStyle(3.5, spec.outline, 0.86);

  if (id === 'nova') {
    graphics.fillTriangle(116, 34, 83, 20, 100, 57);
    graphics.strokeTriangle(116, 34, 83, 20, 100, 57);
    graphics.fillTriangle(111, 48, 77, 43, 102, 68);
    graphics.strokeTriangle(111, 48, 77, 43, 102, 68);
    graphics.fillStyle(spec.maneAccent, 0.96);
    graphics.fillTriangle(107, 54, 82, 57, 104, 73);
    return;
  }

  if (id === 'willow') {
    for (const [x, y, radius] of [
      [104, 37, 12],
      [99, 50, 14],
      [96, 65, 13],
    ] as const) {
      graphics.fillCircle(x, y, radius);
      graphics.strokeCircle(x, y, radius);
    }
    graphics.fillStyle(spec.maneAccent, 1);
    graphics.fillEllipse(91, 34, 8, 16);
    graphics.fillEllipse(87, 58, 9, 17);
    return;
  }

  if (id === 'pebble') {
    for (const [x, y, width, height] of [
      [100, 36, 25, 14],
      [97, 50, 28, 15],
      [96, 64, 25, 15],
    ] as const) {
      graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);
      graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    }
    return;
  }

  if (id === 'lumi') {
    drawOutlinedEllipse(graphics, 97, 50, 27, 63, spec.mane, spec.outline, 3.5);
    drawOutlinedEllipse(graphics, 91, 69, 21, 43, spec.maneAccent, spec.outline, 3);
    return;
  }

  for (const [x, y, radius, colour] of [
    [102, 35, 13, spec.mane],
    [96, 49, 15, spec.maneAccent],
    [98, 64, 13, spec.mane],
  ] as const) {
    graphics.fillStyle(colour, 1);
    graphics.fillCircle(x, y, radius);
    graphics.lineStyle(3, spec.outline, 0.84);
    graphics.strokeCircle(x, y, radius);
  }
}

function drawMotif(
  graphics: Phaser.GameObjects.Graphics,
  id: Exclude<CoreNpcId, 'pip'>,
  spec: CoreNpcVisualSpec,
): void {
  if (id === 'nova') {
    graphics.fillStyle(spec.accent, 1);
    drawStar(graphics, 73, 73, 11);
    return;
  }

  if (id === 'willow') {
    graphics.fillStyle(spec.accent, 1);
    graphics.fillCircle(72, 72, 8);
    graphics.fillStyle(0xffffff, 0.85);
    graphics.fillCircle(69, 69, 5);
    graphics.fillStyle(spec.body, 1);
    graphics.fillCircle(72, 68, 4);
    graphics.fillStyle(spec.maneAccent, 1);
    graphics.fillEllipse(81, 79, 7, 13);
    return;
  }

  if (id === 'pebble') {
    graphics.fillStyle(spec.accent, 0.95);
    graphics.fillCircle(67, 74, 8);
    graphics.fillStyle(spec.maneAccent, 0.95);
    graphics.fillCircle(77, 69, 6);
    graphics.fillStyle(0xf3e2c6, 0.95);
    graphics.fillCircle(79, 80, 5);
    return;
  }

  if (id === 'lumi') {
    graphics.fillStyle(spec.accent, 1);
    drawStar(graphics, 73, 72, 8);
    graphics.fillCircle(84, 65, 4);
    graphics.fillCircle(63, 62, 3);
    return;
  }

  graphics.fillStyle(spec.mane, 1);
  for (const [dx, dy] of [
    [0, -7],
    [7, 0],
    [0, 7],
    [-7, 0],
  ] as const) {
    graphics.fillCircle(73 + dx, 73 + dy, 6);
  }
  graphics.fillStyle(spec.maneAccent, 1);
  graphics.fillCircle(73, 73, 5);
}

function drawUnicornNpc(
  graphics: Phaser.GameObjects.Graphics,
  id: Exclude<CoreNpcId, 'pip'>,
  expression: CoreNpcExpression,
): void {
  const spec = CORE_NPC_VISUALS[id];

  drawUnicornTail(graphics, id, spec);

  drawLeg(graphics, 62, 92, spec.bodyShadow, spec.outline, id === 'nova' ? -3 : 0);
  drawLeg(graphics, 83, 92, spec.bodyShadow, spec.outline, id === 'nova' ? 3 : 0);
  drawLeg(graphics, 103, 91, spec.bodyShadow, spec.outline, id === 'nova' ? -2 : 0);

  drawOutlinedEllipse(
    graphics,
    82,
    78,
    id === 'pebble' ? 92 : 98,
    id === 'lumi' ? 55 : 58,
    spec.body,
    spec.outline,
  );
  graphics.fillStyle(0xffffff, 0.17);
  graphics.fillEllipse(73, 66, 48, 14);

  drawUnicornMane(graphics, id, spec);

  drawOutlinedCircle(graphics, 126, 51, id === 'willow' ? 28 : 30, spec.body, spec.outline);
  graphics.fillStyle(spec.bodyShadow, 1);
  graphics.lineStyle(3, spec.outline, 0.84);
  graphics.fillTriangle(111, 31, 117, 13, 124, 34);
  graphics.strokeTriangle(111, 31, 117, 13, 124, 34);

  graphics.fillStyle(spec.accent, 1);
  graphics.lineStyle(2.5, spec.outline, 0.85);
  const hornHeight = id === 'lumi' ? 29 : id === 'pebble' ? 23 : 27;
  graphics.fillTriangle(128, 25, 137, 25 - hornHeight, 143, 30);
  graphics.strokeTriangle(128, 25, 137, 25 - hornHeight, 143, 30);

  drawHappyFace(graphics, 136, 48, spec.outline, expression);
  drawMotif(graphics, id, spec);

  if (id === 'willow') {
    graphics.fillStyle(spec.maneAccent, 1);
    graphics.fillEllipse(120, 24, 8, 16);
    graphics.fillEllipse(128, 20, 8, 15);
  } else if (id === 'lumi') {
    graphics.fillStyle(spec.accent, 0.28);
    graphics.fillCircle(151, 30, 10);
    graphics.fillStyle(spec.accent, 1);
    graphics.fillCircle(151, 30, 4);
  } else if (id === 'marigold') {
    graphics.fillStyle(spec.mane, 1);
    for (const [dx, dy] of [
      [0, -6],
      [6, 0],
      [0, 6],
      [-6, 0],
    ] as const) {
      graphics.fillCircle(116 + dx, 27 + dy, 5);
    }
    graphics.fillStyle(spec.maneAccent, 1);
    graphics.fillCircle(116, 27, 4);
  } else if (id === 'pebble') {
    graphics.fillStyle(spec.maneAccent, 1);
    graphics.fillRoundedRect(46, 85, 26, 12, 5);
  }
}

function drawPip(graphics: Phaser.GameObjects.Graphics, expression: CoreNpcExpression): void {
  const spec = CORE_NPC_VISUALS.pip;

  graphics.fillStyle(spec.bodyShadow, 1);
  graphics.lineStyle(4, spec.outline, 0.9);
  graphics.fillTriangle(58, 48, 68, 8, 82, 51);
  graphics.strokeTriangle(58, 48, 68, 8, 82, 51);
  graphics.fillTriangle(101, 48, 116, 8, 126, 53);
  graphics.strokeTriangle(101, 48, 116, 8, 126, 53);
  graphics.fillStyle(spec.mane, 0.82);
  graphics.fillTriangle(65, 42, 69, 18, 76, 44);
  graphics.fillTriangle(106, 43, 115, 18, 120, 46);

  drawOutlinedCircle(graphics, 91, 70, 45, spec.body, spec.outline, 4.5);
  graphics.fillStyle(spec.mane, 0.96);
  graphics.fillEllipse(91, 84, 55, 42);

  graphics.fillStyle(spec.bodyShadow, 1);
  graphics.lineStyle(3.5, spec.outline, 0.86);
  graphics.fillEllipse(48, 82, 31, 24);
  graphics.strokeEllipse(48, 82, 31, 24);

  drawHappyFace(graphics, 78, 63, spec.outline, expression);
  drawHappyFace(graphics, 106, 63, spec.outline, expression);

  graphics.fillStyle(spec.outline, 1);
  graphics.fillTriangle(87, 75, 95, 75, 91, 81);
  graphics.lineStyle(2.2, spec.outline, 0.85);
  graphics.lineBetween(91, 82, 91, 88);
  graphics.lineBetween(91, 88, 98, 91);

  // Explorer scarf and satchel make Pip readable even at small world scale.
  graphics.fillStyle(spec.maneAccent, 1);
  graphics.fillRoundedRect(56, 95, 70, 10, 5);
  graphics.fillTriangle(66, 102, 79, 126, 87, 102);
  graphics.fillStyle(0xa66b4d, 1);
  graphics.fillRoundedRect(116, 91, 24, 26, 5);
  graphics.lineStyle(3, 0x6f4938, 0.9);
  graphics.strokeRoundedRect(116, 91, 24, 26, 5);
  graphics.lineBetween(112, 84, 126, 98);

  // Tiny blue compass badge.
  graphics.fillStyle(spec.accent, 1);
  graphics.fillCircle(48, 106, 10);
  graphics.lineStyle(2, 0xffffff, 0.9);
  graphics.strokeCircle(48, 106, 7);
  graphics.fillStyle(0xffffff, 0.9);
  drawStar(graphics, 48, 106, 5);
}

export function getCoreNpcTextureKey(
  id: CoreNpcId,
  expression: CoreNpcExpression = 'neutral',
): string {
  return `core-npc-production:${id}:${expression}`;
}

export function ensureCoreNpcTexture(
  scene: Phaser.Scene,
  id: CoreNpcId,
  expression: CoreNpcExpression = 'neutral',
): string {
  const key = getCoreNpcTextureKey(id, expression);
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  if (id === 'pip') {
    drawPip(graphics, expression);
  } else {
    drawUnicornNpc(graphics, id, expression);
  }
  graphics.generateTexture(key, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  graphics.destroy();
  return key;
}

export function createCoreNpcSprite(
  scene: Phaser.Scene,
  id: CoreNpcId,
  x: number,
  y: number,
  presentation: CoreNpcPresentation,
  expression: CoreNpcExpression = presentation === 'portrait' ? 'happy' : 'neutral',
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(x, y, ensureCoreNpcTexture(scene, id, expression))
    .setName(`core-npc:${id}:${presentation}`)
    .setOrigin(0.5, 0.82);
}

export function addCoreNpcIdleTween(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  id: CoreNpcId,
  amplitude = 4,
): Phaser.Tweens.Tween {
  const durations: Record<CoreNpcId, number> = {
    nova: 760,
    willow: 1180,
    pip: 820,
    pebble: 1080,
    lumi: 1260,
    marigold: 900,
  };
  return scene.tweens.add({
    targets: sprite,
    y: sprite.y - amplitude,
    angle: id === 'nova' ? -1.8 : id === 'pip' ? 1.4 : 0,
    duration: durations[id],
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
}

export function playCoreNpcReaction(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
): Phaser.Tweens.Tween {
  const startScaleX = sprite.scaleX;
  const startScaleY = sprite.scaleY;
  return scene.tweens.add({
    targets: sprite,
    scaleX: startScaleX * 1.055,
    scaleY: startScaleY * 1.055,
    duration: 180,
    yoyo: true,
    ease: 'Quad.Out',
  });
}
