import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import {
  getCottageDecorationProfile,
  getCottageDecorationVisualKind,
} from './CottageDecorationCatalogue';

type DecorationArt = Phaser.GameObjects.Graphics;

const OUTLINE = 0x684d72;
const CREAM = 0xfff7df;
const GOLD = 0xf1c85f;
const GOLD_LIGHT = 0xffe8a0;
const GREEN = 0x7fb58f;
const GREEN_DARK = 0x4f8565;
const PINK = 0xe9a7c7;
const BLUE = 0x8fc9df;
const TIMBER = 0x936b58;
const TIMBER_DARK = 0x68493f;

function drawFlower(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  petalColour = 0xfff8de,
): void {
  graphics.fillStyle(petalColour, 1);
  for (const [dx, dy] of [
    [0, -8],
    [8, 0],
    [0, 8],
    [-8, 0],
  ] as const) {
    graphics.fillCircle(x + dx * scale, y + dy * scale, 7 * scale);
  }
  graphics.fillStyle(GOLD, 1);
  graphics.fillCircle(x, y, 5 * scale);
}

function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  outer: number,
  inner: number,
  colour: number,
): void {
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    const radius = index % 2 === 0 ? outer : inner;
    points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
  }
  graphics.fillStyle(colour, 1);
  graphics.fillPoints(points, true);
}

function drawHoop(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.lineStyle(9 * scale, TIMBER, 1);
  graphics.strokeCircle(x, y, 38 * scale);
  graphics.lineStyle(3 * scale, GOLD_LIGHT, 0.9);
  graphics.strokeCircle(x, y, 31 * scale);
  graphics.fillStyle(GREEN_DARK, 1);
  graphics.fillEllipse(x - 26 * scale, y + 20 * scale, 24 * scale, 10 * scale);
  graphics.fillEllipse(x + 26 * scale, y + 14 * scale, 25 * scale, 10 * scale);
  drawFlower(graphics, x - 19 * scale, y + 19 * scale, 0.7 * scale, colour);
  drawFlower(graphics, x + 18 * scale, y + 22 * scale, 0.62 * scale, 0xf8c9df);
  graphics.lineStyle(3 * scale, colour, 0.85);
  graphics.lineBetween(x, y - 39 * scale, x, y - 54 * scale);
}

function drawBunting(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  graphics.lineStyle(4 * scale, OUTLINE, 0.9);
  graphics.beginPath();
  graphics.moveTo(x - 58 * scale, y - 20 * scale);
  graphics.lineTo(x - 28 * scale, y - 10 * scale);
  graphics.lineTo(x, y - 16 * scale);
  graphics.lineTo(x + 29 * scale, y - 8 * scale);
  graphics.lineTo(x + 58 * scale, y - 20 * scale);
  graphics.strokePath();
  const flags = [
    { dx: -43, dy: -15, colour: PINK },
    { dx: -14, dy: -13, colour: GOLD_LIGHT },
    { dx: 15, dy: -12, colour: BLUE },
    { dx: 43, dy: -14, colour: 0xc6a6df },
  ];
  for (const flag of flags) {
    graphics.fillStyle(flag.colour, 1);
    graphics.fillTriangle(
      x + (flag.dx - 10) * scale,
      y + flag.dy * scale,
      x + (flag.dx + 10) * scale,
      y + flag.dy * scale,
      x + flag.dx * scale,
      y + (flag.dy + 30) * scale,
    );
  }
  drawStar(graphics, x, y + 24 * scale, 12 * scale, 5 * scale, GOLD);
}

function drawRug(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(OUTLINE, 0.13);
  graphics.fillEllipse(x, y + 5 * scale, 142 * scale, 68 * scale);
  graphics.fillStyle(colour, 1);
  graphics.fillEllipse(x, y, 132 * scale, 58 * scale);
  graphics.lineStyle(4 * scale, CREAM, 0.88);
  graphics.strokeEllipse(x, y, 112 * scale, 42 * scale);
  graphics.lineStyle(3 * scale, GOLD_LIGHT, 0.9);
  graphics.strokeEllipse(x, y, 78 * scale, 28 * scale);
  drawFlower(graphics, x, y, 0.5 * scale);
}

function drawVase(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.lineStyle(4 * scale, GREEN_DARK, 1);
  graphics.lineBetween(x - 10 * scale, y - 10 * scale, x - 22 * scale, y - 43 * scale);
  graphics.lineBetween(x, y - 12 * scale, x, y - 48 * scale);
  graphics.lineBetween(x + 10 * scale, y - 8 * scale, x + 23 * scale, y - 40 * scale);
  graphics.fillStyle(GREEN, 1);
  graphics.fillEllipse(x - 16 * scale, y - 27 * scale, 17 * scale, 8 * scale);
  graphics.fillEllipse(x + 17 * scale, y - 25 * scale, 17 * scale, 8 * scale);
  drawFlower(graphics, x - 23 * scale, y - 47 * scale, 0.7 * scale, PINK);
  drawFlower(graphics, x, y - 54 * scale, 0.78 * scale, CREAM);
  drawFlower(graphics, x + 25 * scale, y - 44 * scale, 0.7 * scale, GOLD_LIGHT);
  graphics.fillStyle(colour, 1);
  graphics.fillRoundedRect(x - 27 * scale, y - 7 * scale, 54 * scale, 50 * scale, 16 * scale);
  graphics.fillStyle(CREAM, 0.6);
  graphics.fillRoundedRect(x - 15 * scale, y + 2 * scale, 10 * scale, 27 * scale, 5 * scale);
  graphics.lineStyle(4 * scale, OUTLINE, 0.68);
  graphics.strokeRoundedRect(x - 27 * scale, y - 7 * scale, 54 * scale, 50 * scale, 16 * scale);
}

function drawCushion(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(OUTLINE, 0.12);
  graphics.fillEllipse(x, y + 27 * scale, 88 * scale, 24 * scale);
  graphics.fillStyle(colour, 1);
  graphics.fillRoundedRect(x - 42 * scale, y - 30 * scale, 84 * scale, 64 * scale, 22 * scale);
  graphics.lineStyle(3 * scale, CREAM, 0.72);
  graphics.strokeRoundedRect(x - 34 * scale, y - 22 * scale, 68 * scale, 48 * scale, 17 * scale);
  drawStar(graphics, x, y + 1 * scale, 15 * scale, 7 * scale, GOLD_LIGHT);
}

function drawLantern(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.lineStyle(5 * scale, TIMBER_DARK, 1);
  graphics.strokeCircle(x, y - 36 * scale, 17 * scale);
  graphics.fillStyle(TIMBER_DARK, 1);
  graphics.fillRoundedRect(x - 31 * scale, y - 28 * scale, 62 * scale, 69 * scale, 12 * scale);
  graphics.fillStyle(colour, 0.8);
  graphics.fillRoundedRect(x - 22 * scale, y - 19 * scale, 44 * scale, 49 * scale, 8 * scale);
  graphics.fillStyle(GOLD_LIGHT, 0.9);
  graphics.fillCircle(x, y + 4 * scale, 14 * scale);
  drawStar(graphics, x, y + 4 * scale, 10 * scale, 4 * scale, CREAM);
}

function drawRibbon(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(colour, 1);
  graphics.fillRoundedRect(x - 20 * scale, y - 39 * scale, 40 * scale, 50 * scale, 9 * scale);
  graphics.fillTriangle(
    x - 18 * scale,
    y + 3 * scale,
    x - 2 * scale,
    y + 41 * scale,
    x + 2 * scale,
    y + 3 * scale,
  );
  graphics.fillTriangle(
    x + 18 * scale,
    y + 3 * scale,
    x + 2 * scale,
    y + 41 * scale,
    x - 2 * scale,
    y + 3 * scale,
  );
  drawStar(graphics, x, y - 16 * scale, 13 * scale, 6 * scale, GOLD_LIGHT);
}

function drawRosette(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    graphics.fillStyle(index % 2 === 0 ? colour : GOLD_LIGHT, 1);
    graphics.fillCircle(
      x + Math.cos(angle) * 27 * scale,
      y - 10 * scale + Math.sin(angle) * 27 * scale,
      13 * scale,
    );
  }
  graphics.fillStyle(CREAM, 1);
  graphics.fillCircle(x, y - 10 * scale, 24 * scale);
  drawStar(graphics, x, y - 10 * scale, 15 * scale, 7 * scale, GOLD);
  graphics.fillStyle(colour, 1);
  graphics.fillTriangle(
    x - 17 * scale,
    y + 9 * scale,
    x - 5 * scale,
    y + 47 * scale,
    x + 1 * scale,
    y + 10 * scale,
  );
  graphics.fillTriangle(
    x + 17 * scale,
    y + 9 * scale,
    x + 5 * scale,
    y + 47 * scale,
    x - 1 * scale,
    y + 10 * scale,
  );
}

function drawPennant(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.lineStyle(5 * scale, TIMBER_DARK, 1);
  graphics.lineBetween(x - 43 * scale, y - 46 * scale, x - 43 * scale, y + 46 * scale);
  graphics.fillStyle(colour, 1);
  graphics.fillTriangle(
    x - 39 * scale,
    y - 39 * scale,
    x + 47 * scale,
    y - 19 * scale,
    x - 39 * scale,
    y + 9 * scale,
  );
  drawStar(graphics, x - 11 * scale, y - 15 * scale, 13 * scale, 6 * scale, GOLD_LIGHT);
}

function drawBasket(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  graphics.lineStyle(6 * scale, TIMBER_DARK, 1);
  graphics.strokeEllipse(x, y - 20 * scale, 72 * scale, 62 * scale);
  graphics.fillStyle(TIMBER, 1);
  graphics.fillRoundedRect(x - 46 * scale, y - 10 * scale, 92 * scale, 54 * scale, 14 * scale);
  graphics.lineStyle(4 * scale, GOLD_LIGHT, 0.75);
  for (const dx of [-28, -10, 10, 28]) {
    graphics.lineBetween(x + dx * scale, y - 5 * scale, x + dx * scale, y + 37 * scale);
  }
}

function drawJar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(BLUE, 0.38);
  graphics.fillRoundedRect(x - 32 * scale, y - 35 * scale, 64 * scale, 78 * scale, 17 * scale);
  graphics.lineStyle(4 * scale, OUTLINE, 0.72);
  graphics.strokeRoundedRect(x - 32 * scale, y - 35 * scale, 64 * scale, 78 * scale, 17 * scale);
  graphics.fillStyle(TIMBER_DARK, 1);
  graphics.fillRoundedRect(x - 27 * scale, y - 42 * scale, 54 * scale, 13 * scale, 5 * scale);
  for (const [dx, dy] of [
    [-14, -11],
    [10, 2],
    [-3, 21],
    [17, -20],
  ] as const) {
    drawStar(graphics, x + dx * scale, y + dy * scale, 8 * scale, 3.5 * scale, colour);
  }
}

function drawHanging(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.lineStyle(4 * scale, OUTLINE, 0.82);
  graphics.lineBetween(x, y - 52 * scale, x, y + 12 * scale);
  graphics.lineBetween(x - 38 * scale, y - 22 * scale, x + 38 * scale, y - 22 * scale);
  for (const dx of [-28, 0, 28]) {
    graphics.lineBetween(x + dx * scale, y - 21 * scale, x + dx * scale, y + 22 * scale);
    graphics.fillStyle(colour, 0.92);
    graphics.fillTriangle(
      x + (dx - 8) * scale,
      y + 20 * scale,
      x + (dx + 8) * scale,
      y + 20 * scale,
      x + dx * scale,
      y + 43 * scale,
    );
  }
}

function drawBookend(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(TIMBER_DARK, 1);
  graphics.fillRoundedRect(x - 48 * scale, y + 23 * scale, 96 * scale, 15 * scale, 6 * scale);
  graphics.fillRoundedRect(x - 48 * scale, y - 25 * scale, 13 * scale, 62 * scale, 6 * scale);
  graphics.fillStyle(colour, 1);
  graphics.fillRoundedRect(x - 27 * scale, y - 18 * scale, 23 * scale, 48 * scale, 5 * scale);
  graphics.fillStyle(PINK, 1);
  graphics.fillRoundedRect(x + 1 * scale, y - 27 * scale, 23 * scale, 57 * scale, 5 * scale);
  graphics.fillStyle(GOLD_LIGHT, 1);
  graphics.fillRoundedRect(x + 29 * scale, y - 13 * scale, 19 * scale, 43 * scale, 5 * scale);
}

function drawKeepsake(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  graphics.fillStyle(TIMBER, 1);
  graphics.fillRoundedRect(x - 48 * scale, y + 22 * scale, 96 * scale, 18 * scale, 7 * scale);
  graphics.fillStyle(colour, 0.9);
  graphics.fillRoundedRect(x - 34 * scale, y - 34 * scale, 68 * scale, 56 * scale, 12 * scale);
  graphics.fillStyle(CREAM, 1);
  graphics.fillRoundedRect(x - 25 * scale, y - 25 * scale, 50 * scale, 38 * scale, 8 * scale);
  drawStar(graphics, x, y - 6 * scale, 14 * scale, 6 * scale, GOLD);
}

/** Recognisable vector cottage art shared by the room and the decoration editor. */
export function renderCottageDecoration(
  scene: Phaser.Scene,
  itemId: ItemId,
  x: number,
  y: number,
  scale = 1,
): DecorationArt[] {
  const profile = getCottageDecorationProfile(itemId);
  const colour = profile?.previewColour ?? 0xb99ad2;
  const kind = getCottageDecorationVisualKind(itemId);
  const graphics = scene.add.graphics().setName(`cottage-decoration-art:${itemId}`);

  switch (kind) {
    case 'hoop':
      drawHoop(graphics, x, y, scale, colour);
      break;
    case 'bunting':
      drawBunting(graphics, x, y, scale);
      break;
    case 'rug':
      drawRug(graphics, x, y, scale, colour);
      break;
    case 'vase':
      drawVase(graphics, x, y, scale, colour);
      break;
    case 'cushion':
      drawCushion(graphics, x, y, scale, colour);
      break;
    case 'lantern':
      drawLantern(graphics, x, y, scale, colour);
      break;
    case 'ribbon':
      drawRibbon(graphics, x, y, scale, colour);
      break;
    case 'rosette':
      drawRosette(graphics, x, y, scale, colour);
      break;
    case 'pennant':
      drawPennant(graphics, x, y, scale, colour);
      break;
    case 'basket':
      drawBasket(graphics, x, y, scale);
      break;
    case 'jar':
      drawJar(graphics, x, y, scale, colour);
      break;
    case 'mobile':
    case 'charm':
    case 'chime':
      drawHanging(graphics, x, y, scale, colour);
      break;
    case 'bookend':
      drawBookend(graphics, x, y, scale, colour);
      break;
    case 'ornament':
    case 'keepsake':
      drawKeepsake(graphics, x, y, scale, colour);
      break;
  }

  return [graphics];
}
