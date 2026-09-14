import type Phaser from 'phaser';

interface MeadowFlower {
  x: number;
  y: number;
  colour: number;
  scale: number;
}

const FLOWERS: readonly MeadowFlower[] = [
  { x: 690, y: 1085, colour: 0xf4b4ce, scale: 0.9 },
  { x: 735, y: 1150, colour: 0xd7b1f4, scale: 0.75 },
  { x: 780, y: 1055, colour: 0xf5d48e, scale: 0.7 },
  { x: 815, y: 1195, colour: 0xb9d9f0, scale: 0.85 },
  { x: 860, y: 1105, colour: 0xe0b0f5, scale: 0.8 },
  { x: 910, y: 1170, colour: 0xf5b4c7, scale: 0.72 },
  { x: 955, y: 1065, colour: 0xc8dfa1, scale: 0.78 },
  { x: 1000, y: 1140, colour: 0xb9d9f0, scale: 0.82 },
  { x: 1040, y: 1210, colour: 0xf0c0db, scale: 0.74 },
  { x: 1085, y: 1095, colour: 0xd8b2f4, scale: 0.8 },
  { x: 715, y: 1260, colour: 0xc7dda0, scale: 0.72 },
  { x: 775, y: 1315, colour: 0xf3c488, scale: 0.76 },
  { x: 850, y: 1275, colour: 0xf0aeca, scale: 0.82 },
  { x: 930, y: 1330, colour: 0xc1dcf1, scale: 0.72 },
  { x: 1015, y: 1280, colour: 0xd8b2f4, scale: 0.78 },
];

function addGrassTuft(scene: Phaser.Scene, x: number, y: number, scale: number): void {
  const grass = scene.add.graphics().setDepth(5.2);
  grass.lineStyle(Math.max(2, 4 * scale), 0x5c9b68, 0.76);
  for (const offset of [-13, -6, 0, 7, 14]) {
    grass.beginPath();
    grass.moveTo(x, y + 12 * scale);
    grass.lineTo(x + offset * scale, y - (14 + Math.abs(offset) * 0.45) * scale);
    grass.strokePath();
  }
}

function addWildflower(scene: Phaser.Scene, flower: MeadowFlower): void {
  const { x, y, colour, scale } = flower;
  scene.add.rectangle(x, y + 11 * scale, 3 * scale, 24 * scale, 0x5e9164, 0.88).setDepth(5.35);
  for (const [dx, dy] of [
    [0, -6],
    [7, -1],
    [4, 6],
    [-4, 6],
    [-7, -1],
  ] as const) {
    scene.add.ellipse(x + dx * scale, y + dy * scale, 11 * scale, 14 * scale, colour, 0.92).setDepth(5.45);
  }
  scene.add.circle(x, y, 4.5 * scale, 0xffdfa0, 0.98).setDepth(5.5);
}

function addButterfly(scene: Phaser.Scene, x: number, y: number, colour: number, delay: number): void {
  const leftWing = scene.add.ellipse(-6, 0, 11, 8, colour, 0.78).setAngle(-20);
  const rightWing = scene.add.ellipse(6, 0, 11, 8, colour, 0.78).setAngle(20);
  const body = scene.add.ellipse(0, 1, 3, 9, 0x6f5b62, 0.85);
  const butterfly = scene.add.container(x, y, [leftWing, rightWing, body]).setDepth(6.1);

  scene.tweens.add({
    targets: butterfly,
    x: x + 48,
    y: y - 24,
    angle: 8,
    duration: 2600,
    delay,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
  scene.tweens.add({
    targets: [leftWing, rightWing],
    scaleX: 0.55,
    duration: 260,
    delay,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
}

/**
 * H1.3 quiet home meadow replacing the former outdoor Wonderbook display.
 * It is intentionally scenery rather than another activity hub: walkable grass,
 * low wildflowers and small ambient movement only.
 */
export function renderHomeMeadow(scene: Phaser.Scene): void {
  scene.add.ellipse(875, 1200, 520, 330, 0xb8e3b6, 0.3).setDepth(2.8);
  scene.add.ellipse(900, 1215, 390, 245, 0x93cf9d, 0.16).setDepth(2.9);
  scene.add.ellipse(780, 1270, 225, 145, 0xd6edb3, 0.12).setDepth(3);

  for (const [x, y, scale] of [
    [650, 1160, 0.9],
    [700, 1215, 1.05],
    [755, 1105, 0.82],
    [820, 1240, 0.94],
    [885, 1150, 0.9],
    [950, 1225, 1.02],
    [1010, 1120, 0.86],
    [1070, 1190, 0.96],
    [760, 1360, 0.82],
    [890, 1370, 0.88],
    [1030, 1340, 0.84],
  ] as const) {
    addGrassTuft(scene, x, y, scale);
  }

  for (const flower of FLOWERS) {
    addWildflower(scene, flower);
  }

  for (const [x, y, width] of [
    [720, 1370, 42],
    [790, 1390, 34],
    [1050, 1325, 38],
  ] as const) {
    scene.add.ellipse(x, y, width, width * 0.44, 0xbda98e, 0.5).setDepth(4.4);
    scene.add.ellipse(x, y - 2, width * 0.76, width * 0.3, 0xd9c9aa, 0.56).setDepth(4.45);
  }

  addButterfly(scene, 755, 1110, 0xe6b1f5, 0);
  addButterfly(scene, 980, 1260, 0xf4b2c7, 480);
}
