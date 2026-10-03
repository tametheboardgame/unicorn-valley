import Phaser from 'phaser';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
import { worldDepthForY } from './WorldDepth';

interface Point {
  x: number;
  y: number;
}

function drawRoundedStroke(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly Point[],
  width: number,
  colour: number,
): void {
  if (points.length === 0) {
    return;
  }

  graphics.lineStyle(width, colour, 1);
  graphics.beginPath();
  graphics.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
  for (const point of points.slice(1)) {
    graphics.lineTo(point.x, point.y);
  }
  graphics.strokePath();

  graphics.fillStyle(colour, 1);
  const radius = width / 2;
  for (const point of points) {
    graphics.fillCircle(point.x, point.y, radius);
  }
}

function createStructuralPaths(scene: Phaser.Scene): void {
  const paths = scene.add.graphics().setName('rainbow-meadow:path-network').setDepth(2.45);

  for (const stroke of RAINBOW_MEADOW_LAYOUT.structuralPaths) {
    drawRoundedStroke(paths, stroke.points, stroke.outerWidth, 0xd7c18f);
  }
  for (const stroke of RAINBOW_MEADOW_LAYOUT.structuralPaths) {
    drawRoundedStroke(paths, stroke.points, stroke.innerWidth, 0xf0dfb2);
  }
}

function createSunbeamThreshold(scene: Phaser.Scene): void {
  const gateway = RAINBOW_MEADOW_LAYOUT.sunbeamGateway;
  const { x, y } = gateway.position;

  for (const yOffset of [-104, 104]) {
    const postY = y + yOffset;
    const postDepth = worldDepthForY(postY, -0.18);
    scene.add
      .rectangle(x, postY, 42, 72, 0xb79a79, 1)
      .setStrokeStyle(5, 0x8d725d, 0.95)
      .setName(`rainbow-meadow:sunbeam-threshold:post:${yOffset}`)
      .setDepth(postDepth);
    scene.add
      .ellipse(x, postY - 39, 58, 24, 0xd9c39e, 1)
      .setName(`rainbow-meadow:sunbeam-threshold:cap:${yOffset}`)
      .setDepth(postDepth + 0.02);

    const flowerY = postY - 56;
    for (const [offsetX, offsetY, radius, colour] of [
      [-12, 0, 12, 0xf3a5c4],
      [10, 3, 10, 0xc7a2df],
      [0, -8, 9, 0xffdf79],
    ] as const) {
      scene.add
        .circle(x + offsetX, flowerY + offsetY, radius, colour, 1)
        .setName('rainbow-meadow:sunbeam-threshold:flowers')
        .setDepth(worldDepthForY(flowerY, 0.04));
    }

    const hedgeY = postY + Math.sign(yOffset) * 76;
    scene.add
      .ellipse(x, hedgeY, 78, 94, 0x6da66f, 0.96)
      .setName('rainbow-meadow:sunbeam-threshold:hedge')
      .setDepth(worldDepthForY(hedgeY, -0.12));
    scene.add
      .ellipse(x - 14, hedgeY + Math.sign(yOffset) * 28, 58, 66, 0x82b77a, 0.94)
      .setName('rainbow-meadow:sunbeam-threshold:hedge-detail')
      .setDepth(worldDepthForY(hedgeY, -0.1));
  }

  for (const yOffset of [-44, 0, 44]) {
    const stoneY = y + yOffset;
    scene.add
      .ellipse(x, stoneY, 32, 20, 0xe1cda5, 0.92)
      .setName('rainbow-meadow:sunbeam-threshold:stone')
      .setDepth(3.1);
  }

  for (let index = 1; index <= 3; index += 1) {
    const sparkleX = x - (30 + index * 28);
    const sparkleY = y + (index - 2) * 25;
    const sparkle = scene.add
      .circle(sparkleX, sparkleY, 6 + index, 0xffef9c, 0.42)
      .setName('rainbow-meadow:sunbeam-threshold:sparkle')
      .setDepth(worldDepthForY(sparkleY, 0.16));
    scene.tweens.add({
      targets: sparkle,
      alpha: 0.9,
      scale: 1.35,
      duration: 650 + index * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }
}

export function createRainbowMeadowTraversalPresentation(scene: Phaser.Scene): void {
  createStructuralPaths(scene);
  createSunbeamThreshold(scene);
}
