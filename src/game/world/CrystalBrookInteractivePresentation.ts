import Phaser from 'phaser';
import type { CrystalBrookCollectableSpot, CrystalBrookSecretRoute } from './CrystalBrookMap';
import { worldDepthForY } from './WorldDepth';

// H6.7A: scene-owned, grounded discoveries. Item IDs, flags, radii and
// collection remain exclusively owned by the Crystal Brook map/scene.
function facets(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly (readonly [number, number])[],
): void {
  graphics.fillPoints(
    points.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
    true,
  );
}

export function createCrystalBrookTreasurePresentation(
  scene: Phaser.Scene,
  spot: CrystalBrookCollectableSpot,
  isCrystal: boolean,
): Phaser.GameObjects.Container {
  const bank = scene.add.graphics();
  bank.fillStyle(isCrystal ? 0x68878a : 0x9c9a81, 0.7);
  bank.fillEllipse(0, 14, 104, 34);
  bank.fillStyle(isCrystal ? 0x99b0a5 : 0xc9bc9c, 0.94);
  bank.fillEllipse(-8, 5, 80, 27);
  for (const [x, y, radius] of [
    [-35, 15, 9],
    [31, 15, 7],
    [14, -7, 5],
  ] as const) {
    bank.fillStyle(0x677f80, 0.6);
    bank.fillCircle(x, y, radius);
  }

  const treasure = scene.add.graphics();
  if (isCrystal) {
    // Cluster rises *from* the stone: a dark foot, faceted body, cold light.
    treasure.fillStyle(0x3b7386, 1);
    facets(treasure, [[-27, 10], [-24, -18], [-8, -40], [7, -13], [15, 11]]);
    treasure.fillStyle(0x7ed8e9, 1);
    facets(treasure, [[-24, -18], [-8, -40], [-7, 10], [-27, 10]]);
    treasure.fillStyle(0xe4ffff, 0.91);
    facets(treasure, [[-8, -40], [7, -13], [-7, 10]]);
    treasure.fillStyle(0x407b96, 1);
    facets(treasure, [[6, 12], [4, -19], [20, -33], [32, -8], [29, 13]]);
    treasure.fillStyle(0xa2eaf1, 0.98);
    facets(treasure, [[4, -19], [20, -33], [18, 11], [6, 12]]);
    treasure.fillStyle(0xedffff, 0.84);
    facets(treasure, [[20, -33], [32, -8], [18, 11]]);
    treasure.fillStyle(0xb8eff1, 0.96);
    facets(treasure, [[-11, 13], [-7, -14], [5, -27], [15, 13]]);
    treasure.fillStyle(0xffffff, 0.8);
    facets(treasure, [[-7, -14], [5, -27], [4, 12]]);
  } else {
    // Ribbed pearly river shell, nestled in its own ochre/silver cobble bed.
    treasure.fillStyle(0x916f65, 0.75);
    treasure.fillEllipse(1, 12, 72, 22);
    treasure.fillStyle(0xf1dcb6, 1);
    facets(treasure, [[-34, 10], [-28, -14], [-13, -29], [2, -33], [21, -20], [34, 8], [0, 21]]);
    treasure.fillStyle(0xfff5d7, 0.92);
    facets(treasure, [[-28, -14], [2, -33], [3, 10], [-34, 10]]);
    treasure.fillStyle(0xd3bba2, 0.88);
    facets(treasure, [[2, -33], [21, -20], [34, 8], [3, 10]]);
    treasure.lineStyle(2, 0xb79a8b, 0.67);
    for (const endX of [-23, -13, 0, 14, 25]) {
      treasure.beginPath();
      treasure.moveTo(2, -30);
      treasure.lineTo(endX, 9);
      treasure.strokePath();
    }
    treasure.fillStyle(0xbddfdb, 0.7);
    treasure.fillEllipse(1, 13, 26, 5);
  }

  const glimmer = scene.add.graphics();
  glimmer.fillStyle(0xf6ffeb, 0.9);
  glimmer.fillEllipse(isCrystal ? 10 : -6, -40, 9, 3);
  glimmer.fillEllipse(isCrystal ? 14 : -2, -37, 3, 9);
  scene.tweens.add({
    targets: glimmer,
    alpha: { from: 0.18, to: 0.75 },
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });

  return scene.add
    .container(spot.position.x, spot.position.y, [bank, treasure, glimmer])
    .setName(`crystal-brook:treasure:${spot.id}`)
    .setDepth(worldDepthForY(spot.position.y, 0.35));
}

export function createCrystalBrookSecretRoutePresentation(
  scene: Phaser.Scene,
  route: CrystalBrookSecretRoute,
): Phaser.GameObjects.Container {
  // A small runic cobble belongs to the established Grotto path, instead of
  // an oversized glowing, hovering discovery icon.
  const stone = scene.add.graphics();
  stone.fillStyle(0x516b71, 0.55);
  stone.fillEllipse(4, 8, 84, 30);
  stone.fillStyle(0x83929a, 1);
  facets(stone, [[-36, 7], [-29, -13], [-10, -23], [25, -17], [39, 5], [20, 17], [-21, 15]]);
  stone.fillStyle(0xadc4c3, 0.88);
  facets(stone, [[-29, -13], [-10, -23], [25, -17], [7, -5], [-22, -3]]);
  stone.lineStyle(3, 0xd8bdec, 0.78);
  stone.beginPath();
  stone.moveTo(-16, 8);
  stone.lineTo(-4, -9);
  stone.lineTo(9, 5);
  stone.lineTo(20, -7);
  stone.strokePath();

  const highlight = scene.add.graphics();
  highlight.fillStyle(0xf3d9ff, 0.67);
  highlight.fillCircle(-5, -9, 3);
  scene.tweens.add({
    targets: highlight,
    alpha: { from: 0.18, to: 0.67 },
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
  return scene.add
    .container(route.position.x, route.position.y, [stone, highlight])
    .setName('crystal-brook:secret-route:prism-inlay')
    .setDepth(worldDepthForY(route.position.y, 0.2));
}
