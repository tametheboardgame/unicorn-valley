import type Phaser from 'phaser';

export const COTTAGE_EXTERIOR_SLOT_IDS = [
  'roof',
  'wall-finish',
  'door',
  'windows',
  'window-boxes',
  'flowerbeds',
  'porch',
] as const;

export type CottageExteriorSlotId = (typeof COTTAGE_EXTERIOR_SLOT_IDS)[number];

export interface CottageExteriorStyle {
  roof: 'moon-plum-shingle';
  wallFinish: 'warm-cream-plaster';
  door: 'berry-oak-arched';
  windows: 'soft-blue-cottage';
  windowBoxes: 'lavender-mix';
  flowerbeds: 'moonflower-mix';
  porch: 'honey-stone';
}

export const DEFAULT_COTTAGE_EXTERIOR_STYLE: Readonly<CottageExteriorStyle> = {
  roof: 'moon-plum-shingle',
  wallFinish: 'warm-cream-plaster',
  door: 'berry-oak-arched',
  windows: 'soft-blue-cottage',
  windowBoxes: 'lavender-mix',
  flowerbeds: 'moonflower-mix',
  porch: 'honey-stone',
};

const PREFIX = 'cottage-exterior';

interface CottageExteriorAnchor {
  x: number;
  y: number;
}

function name<T extends Phaser.GameObjects.GameObject>(
  object: T,
  slot: CottageExteriorSlotId | 'detail' | 'plaque',
  id: string,
): T {
  object.setName(`${PREFIX}:${slot}:${id}`);
  return object;
}

function addFlower(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  petalColour: number,
  depth: number,
): void {
  name(
    scene.add.rectangle(x, y + 12 * scale, 5 * scale, 28 * scale, 0x56845c, 0.96).setDepth(depth),
    'flowerbeds',
    `stem-${x}-${y}`,
  );
  for (const [dx, dy] of [
    [0, -8],
    [9, -2],
    [6, 7],
    [-6, 7],
    [-9, -2],
  ] as const) {
    name(
      scene.add
        .ellipse(x + dx * scale, y + dy * scale, 15 * scale, 19 * scale, petalColour, 0.98)
        .setDepth(depth + 0.05),
      'flowerbeds',
      `petal-${x}-${y}-${dx}-${dy}`,
    );
  }
  name(
    scene.add.circle(x, y, 6 * scale, 0xffdda1, 1).setDepth(depth + 0.1),
    'flowerbeds',
    `centre-${x}-${y}`,
  );
}

function addWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): void {
  name(
    scene.add
      .rectangle(x, y, width + 18, height + 18, 0xc59473, 1)
      .setStrokeStyle(3, 0x8d684e, 0.9)
      .setDepth(depth),
    'windows',
    `frame-${x}-${y}`,
  );
  name(
    scene.add
      .rectangle(x, y, width, height, 0xbfe7ed, 1)
      .setStrokeStyle(3, 0xf5f0dc, 0.96)
      .setDepth(depth + 0.05),
    'windows',
    `glass-${x}-${y}`,
  );
  name(
    scene.add.rectangle(x, y, 5, height, 0xf8f0da, 0.96).setDepth(depth + 0.1),
    'windows',
    `mullion-v-${x}-${y}`,
  );
  name(
    scene.add.rectangle(x, y, width, 5, 0xf8f0da, 0.96).setDepth(depth + 0.1),
    'windows',
    `mullion-h-${x}-${y}`,
  );
  name(
    scene.add
      .rectangle(x - width / 2 - 13, y, 18, height + 16, 0x8ea26d, 1)
      .setStrokeStyle(2, 0x6c8155, 0.9)
      .setDepth(depth + 0.12),
    'windows',
    `shutter-left-${x}-${y}`,
  );
  name(
    scene.add
      .rectangle(x + width / 2 + 13, y, 18, height + 16, 0x8ea26d, 1)
      .setStrokeStyle(2, 0x6c8155, 0.9)
      .setDepth(depth + 0.12),
    'windows',
    `shutter-right-${x}-${y}`,
  );
}

function addWindowBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  depth: number,
): void {
  name(
    scene.add
      .rectangle(x, y, width, 18, 0x8a6049, 1)
      .setStrokeStyle(2, 0x694735, 0.9)
      .setDepth(depth),
    'window-boxes',
    `box-${x}-${y}`,
  );
  const colours = [0xdba8f4, 0xf4a9c9, 0xb9d99a, 0xe5b9ff] as const;
  for (let index = 0; index < 5; index += 1) {
    const flowerX = x - width * 0.36 + index * (width * 0.18);
    name(
      scene.add
        .circle(flowerX, y - 10 - (index % 2) * 4, 7, colours[index % colours.length], 0.98)
        .setDepth(depth + 0.1),
      'window-boxes',
      `bloom-${x}-${index}`,
    );
    name(
      scene.add.rectangle(flowerX, y - 3, 3, 15, 0x5f8a5c, 0.9).setDepth(depth + 0.05),
      'window-boxes',
      `stem-${x}-${index}`,
    );
  }
}

function addFlowerbed(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  depth: number,
  seed: number,
): void {
  name(
    scene.add.ellipse(x, y + 8, width, 54, 0x7d5d49, 0.9).setDepth(depth),
    'flowerbeds',
    `soil-${seed}`,
  );
  name(
    scene.add
      .ellipse(x, y + 16, width + 12, 34, 0xb69372, 0.74)
      .setStrokeStyle(3, 0x88654c, 0.72)
      .setDepth(depth - 0.02),
    'flowerbeds',
    `edge-${seed}`,
  );

  const colours = [0xdca8ff, 0xf3a6c8, 0xc4d99b, 0xb9d8f1] as const;
  for (let index = 0; index < 7; index += 1) {
    const offset = index - 3;
    const flowerX = x + offset * (width / 8.2);
    const flowerY = y - 5 - ((index + seed) % 3) * 10;
    addFlower(
      scene,
      flowerX,
      flowerY,
      0.72 + ((index + seed) % 2) * 0.12,
      colours[(index + seed) % colours.length],
      depth + 0.05,
    );
  }
}

/**
 * Draws the default exterior without persisting a separate exterior save model.
 * H1.2 establishes stable exterior categories so a later home-customisation pass can
 * map owned decoration choices onto these slots through the existing home architecture.
 */
export function renderCottageExterior(
  scene: Phaser.Scene,
  anchor: CottageExteriorAnchor,
  _style: Readonly<CottageExteriorStyle> = DEFAULT_COTTAGE_EXTERIOR_STYLE,
): void {
  const { x, y } = anchor;

  name(scene.add.ellipse(x, y + 184, 440, 72, 0x78956c, 0.18).setDepth(5.8), 'detail', 'shadow');

  // Keep the wall body entirely below the roof eaves so no square plaster corner peeks
  // through the asymmetric roof silhouette.
  name(
    scene.add
      .rectangle(x, y + 55, 410, 192, 0xffedc8, 1)
      .setStrokeStyle(6, 0xd8b88e, 0.95)
      .setDepth(9.8),
    'wall-finish',
    'plaster-body',
  );
  name(
    scene.add.rectangle(x, y + 139, 404, 42, 0xc5a982, 1).setDepth(9.9),
    'wall-finish',
    'stone-base',
  );
  for (let offset = -170; offset <= 170; offset += 56) {
    name(
      scene.add
        .ellipse(x + offset, y + 139 + ((offset / 56) % 2) * 4, 46, 23, 0xddc49d, 0.92)
        .setDepth(9.95),
      'wall-finish',
      `base-stone-${offset}`,
    );
  }

  // The chimney is deliberately behind the roof. Only its upper stack and cap should
  // emerge above the shingles instead of reading as a block pasted onto the roof face.
  name(
    scene.add
      .rectangle(x - 122, y - 183, 46, 70, 0x9d735a, 1)
      .setStrokeStyle(4, 0x75523f, 0.92)
      .setDepth(9.72),
    'roof',
    'chimney',
  );
  name(
    scene.add.rectangle(x - 122, y - 223, 60, 18, 0xb98867, 1).setDepth(9.73),
    'roof',
    'chimney-cap',
  );

  // Asymmetric shingled roof with a broad eave and visible layered bands.
  const roof = name(scene.add.graphics().setDepth(10.15), 'roof', 'main');
  roof.fillStyle(0x75548f, 1);
  roof.fillTriangle(x - 226, y - 72, x + 26, y - 214, x + 224, y - 88);
  roof.fillTriangle(x - 226, y - 72, x + 224, y - 88, x + 204, y - 45);
  roof.fillTriangle(x - 226, y - 72, x + 204, y - 45, x - 210, y - 42);
  roof.fillStyle(0x956cac, 1);
  roof.fillTriangle(x - 204, y - 76, x + 20, y - 194, x + 198, y - 84);
  roof.fillTriangle(x - 204, y - 76, x + 198, y - 84, x + 181, y - 62);
  roof.fillTriangle(x - 204, y - 76, x + 181, y - 62, x - 190, y - 58);
  for (const [bandY, halfWidth] of [
    [y - 68, 192],
    [y - 98, 176],
    [y - 128, 150],
  ] as const) {
    roof.lineStyle(5, 0xb990c5, 0.68);
    roof.beginPath();
    roof.moveTo(x - halfWidth, bandY);
    roof.lineTo(x + halfWidth, bandY - 8);
    roof.strokePath();
  }
  for (let shingleX = x - 158; shingleX <= x + 150; shingleX += 44) {
    roof.lineStyle(3, 0x624578, 0.42);
    roof.beginPath();
    roof.moveTo(shingleX, y - 58);
    roof.lineTo(shingleX + 22, y - 96);
    roof.strokePath();
  }

  // Deliberately asymmetrical windows break the previous pair-of-eyes composition.
  addWindow(scene, x - 122, y + 31, 70, 66, 10.35);
  addWindow(scene, x + 130, y + 49, 56, 52, 10.35);
  addWindowBox(scene, x - 122, y + 75, 102, 10.55);
  addWindowBox(scene, x + 130, y + 84, 84, 10.55);

  // Arched-looking door, frame and tiny porch canopy stay centred on the established approach point.
  name(
    scene.add
      .rectangle(x + 18, y + 91, 84, 142, 0x82533f, 1)
      .setStrokeStyle(6, 0x654031, 0.95)
      .setDepth(10.5),
    'door',
    'door-leaf',
  );
  name(scene.add.ellipse(x + 18, y + 21, 84, 52, 0x82533f, 1).setDepth(10.51), 'door', 'door-arch');
  name(scene.add.circle(x + 45, y + 98, 7, 0xe6c276, 1).setDepth(10.65), 'door', 'knob');
  name(scene.add.rectangle(x + 18, y + 4, 130, 18, 0x8e694f, 1).setDepth(10.7), 'porch', 'canopy');
  name(
    scene.add.triangle(x + 18, y - 12, -68, 22, 0, -28, 68, 22, 0xa87991, 1).setDepth(10.68),
    'porch',
    'canopy-roof',
  );

  // Decorative mounted nameplate, integrated into the cottage rather than floating as UI copy.
  name(
    scene.add
      .rectangle(x + 18, y - 32, 188, 36, 0x7b5848, 1)
      .setStrokeStyle(4, 0xe0bd85, 0.98)
      .setDepth(10.84),
    'plaque',
    'board',
  );
  name(scene.add.circle(x - 70, y - 32, 7, 0xd6a7ec, 1).setDepth(10.86), 'plaque', 'left-bloom');
  name(scene.add.circle(x + 106, y - 32, 7, 0xd6a7ec, 1).setDepth(10.86), 'plaque', 'right-bloom');
  name(
    scene.add
      .text(x + 18, y - 32, 'Moonflower Cottage', {
        color: '#fff0cd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10.88),
    'plaque',
    'name',
  );

  // Porch stones visually connect the H1.1 cottage spur to the door without changing collision.
  for (const [stepY, stepWidth] of [
    [y + 173, 104],
    [y + 193, 126],
    [y + 214, 146],
  ] as const) {
    name(
      scene.add
        .ellipse(x + 18, stepY, stepWidth, 28, 0xd6c39f, 1)
        .setStrokeStyle(3, 0xb49a77, 0.78)
        .setDepth(9.7),
      'porch',
      `step-${stepY}`,
    );
  }

  // A climbing vine gives one side of the house a lived-in, organic silhouette.
  const vine = name(scene.add.graphics().setDepth(10.75), 'detail', 'vine');
  vine.lineStyle(5, 0x68845a, 0.86);
  vine.beginPath();
  vine.moveTo(x + 183, y + 139);
  vine.lineTo(x + 176, y + 90);
  vine.lineTo(x + 190, y + 42);
  vine.lineTo(x + 180, y - 3);
  vine.strokePath();
  for (const [leafX, leafY, colour] of [
    [x + 172, y + 110, 0x7aa36d],
    [x + 191, y + 82, 0x8bb878],
    [x + 175, y + 54, 0x739a65],
    [x + 194, y + 24, 0x88ae73],
    [x + 179, y - 2, 0x6e945f],
  ] as const) {
    name(
      scene.add.ellipse(leafX, leafY, 25, 15, colour, 0.95).setAngle(-24).setDepth(10.77),
      'detail',
      `vine-leaf-${leafX}-${leafY}`,
    );
  }
  for (const [bloomX, bloomY] of [
    [x + 195, y + 73],
    [x + 178, y + 35],
    [x + 193, y + 4],
  ] as const) {
    name(
      scene.add.circle(bloomX, bloomY, 7, 0xd9a6f3, 1).setDepth(10.8),
      'detail',
      `vine-bloom-${bloomX}-${bloomY}`,
    );
  }

  // Two proper beds sit in front of the façade, replacing the two oversized corner flowers.
  addFlowerbed(scene, x - 125, y + 166, 154, 12.4, 1);
  addFlowerbed(scene, x + 133, y + 166, 142, 12.4, 2);
}
