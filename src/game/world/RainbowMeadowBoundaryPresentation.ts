import Phaser from 'phaser';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
import { worldDepthForY } from './WorldDepth';

function createHedge(
  scene: Phaser.Scene,
  hedge: (typeof RAINBOW_MEADOW_LAYOUT.boundaries.hedges)[number],
): void {
  const horizontal = hedge.width >= hedge.height;
  const length = horizontal ? hedge.width : hedge.height;
  const count = Math.max(3, Math.ceil(length / 58));

  for (let index = 0; index < count; index += 1) {
    const progress = count <= 1 ? 0.5 : index / (count - 1);
    const primaryOffset = (progress - 0.5) * Math.max(0, length - 48);
    const wobble = index % 2 === 0 ? -7 : 7;
    const worldX = hedge.x + (horizontal ? primaryOffset : wobble);
    const worldY = hedge.y + (horizontal ? wobble : primaryOffset);
    const bush = scene.add
      .graphics()
      .setPosition(worldX, worldY)
      .setName(`rainbow-meadow:boundary:hedge:${hedge.id}:bush:${index}`)
      .setDepth(worldDepthForY(worldY, 0.12));

    bush.fillStyle(index % 3 === 0 ? 0x5f9860 : 0x6eaa69, 1);
    bush.fillEllipse(0, 0, 72, 58);
    bush.fillStyle(0x86ba73, 0.78);
    bush.fillEllipse(-8, -8, 44, 30);

    if (index % 3 === 1) {
      bush.fillStyle(index % 2 === 0 ? 0xffd47e : 0xf2a4c3, 0.9);
      bush.fillCircle(14, -17, 5);
    }
  }
}

function createRaceFence(
  scene: Phaser.Scene,
  segment: (typeof RAINBOW_MEADOW_LAYOUT.boundaries.raceFence)[number],
): void {
  const graphics = scene.add
    .graphics()
    .setName(`rainbow-meadow:boundary:race-fence:${segment.id}`)
    .setDepth(worldDepthForY(Math.max(segment.y1, segment.y2) + 40, 0.22));

  graphics.lineStyle(10, 0x765442, 1);
  graphics.lineBetween(segment.x1, segment.y1, segment.x2, segment.y2);
  graphics.lineStyle(5, 0xb98c61, 0.96);
  graphics.lineBetween(segment.x1, segment.y1 - 18, segment.x2, segment.y2 - 18);

  const length = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1);
  const postCount = Math.max(2, Math.floor(length / 90) + 1);
  for (let index = 0; index < postCount; index += 1) {
    const progress = postCount <= 1 ? 0 : index / (postCount - 1);
    const x = Phaser.Math.Linear(segment.x1, segment.x2, progress);
    const y = Phaser.Math.Linear(segment.y1, segment.y2, progress);
    graphics.fillStyle(0x6b4d3d, 1);
    graphics.fillRoundedRect(x - 7, y - 34, 14, 72, 5);

    if (index < postCount - 1 && index % 2 === 0) {
      const nextProgress = (index + 0.5) / (postCount - 1);
      const flagX = Phaser.Math.Linear(segment.x1, segment.x2, nextProgress);
      const flagY = Phaser.Math.Linear(segment.y1, segment.y2, nextProgress) - 25;
      graphics.fillStyle(index % 4 === 0 ? 0xf0a0bd : 0x88c9df, 0.94);
      graphics.fillTriangle(flagX - 10, flagY, flagX + 12, flagY + 8, flagX - 10, flagY + 17);
    }
  }
}

function createBoundaryRock(
  scene: Phaser.Scene,
  rock: (typeof RAINBOW_MEADOW_LAYOUT.boundaries.crystalRocks)[number],
): void {
  const graphics = scene.add
    .graphics()
    .setPosition(rock.x, rock.y)
    .setName(`rainbow-meadow:boundary:crystal-rock:${rock.id}`)
    .setDepth(worldDepthForY(rock.y + rock.height / 2, 0.24));

  const width = rock.width;
  const height = rock.height;
  graphics.fillStyle(0x667a76, 1);

  if (rock.kind === 'spire') {
    graphics.fillTriangle(0, -height / 2, -width / 2, height / 2, width / 2, height / 2);
  } else if (rock.kind === 'slab') {
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, Math.min(24, height / 3));
  } else if (rock.kind === 'lopsided') {
    graphics.beginPath();
    graphics.moveTo(-width / 2, height / 2);
    graphics.lineTo(-width * 0.36, -height * 0.28);
    graphics.lineTo(width * 0.14, -height / 2);
    graphics.lineTo(width / 2, -height * 0.08);
    graphics.lineTo(width * 0.42, height / 2);
    graphics.closePath();
    graphics.fillPath();
  } else {
    graphics.fillEllipse(0, 0, width, height);
  }

  graphics.fillStyle(0x879590, 0.7);
  graphics.fillEllipse(-width * 0.13, -height * 0.18, width * 0.42, height * 0.22);
  graphics.fillStyle(0xb7d9d1, 0.32);
  graphics.fillCircle(width * 0.18, -height * 0.06, Math.max(5, Math.min(width, height) * 0.08));
}

function createWildflowerPocket(
  scene: Phaser.Scene,
  pocket: (typeof RAINBOW_MEADOW_LAYOUT.boundaries.wildflowerPockets)[number],
): void {
  const graphics = scene.add
    .graphics()
    .setPosition(pocket.x, pocket.y)
    .setName(`rainbow-meadow:boundary:wildflowers:${pocket.id}`)
    .setDepth(worldDepthForY(pocket.y, -0.08));

  const colours = [0xf2a4c3, 0xffdc7d, 0x90cce0, 0xc6a5e1] as const;
  const count = 7;
  for (let index = 0; index < count; index += 1) {
    const x = -pocket.width / 2 + 18 + (index * (pocket.width - 36)) / (count - 1);
    const y = index % 2 === 0 ? 0 : 12;
    const stemHeight = 18 + (index % 3) * 5;
    graphics.lineStyle(3, 0x5f985d, 0.86);
    graphics.lineBetween(x, y + 12, x + 2, y - stemHeight);
    graphics.fillStyle(colours[index % colours.length] ?? colours[0], 0.95);
    graphics.fillCircle(x + 2, y - stemHeight, 7);
    graphics.fillStyle(0xffefae, 0.95);
    graphics.fillCircle(x + 2, y - stemHeight, 2.5);
  }
}

export function createRainbowMeadowBoundaryPresentation(scene: Phaser.Scene): void {
  RAINBOW_MEADOW_LAYOUT.boundaries.hedges.forEach((hedge) => {
    createHedge(scene, hedge);
  });
  RAINBOW_MEADOW_LAYOUT.boundaries.raceFence.forEach((segment) => {
    createRaceFence(scene, segment);
  });
  RAINBOW_MEADOW_LAYOUT.boundaries.crystalRocks.forEach((rock) => {
    createBoundaryRock(scene, rock);
  });
  RAINBOW_MEADOW_LAYOUT.boundaries.wildflowerPockets.forEach((pocket) => {
    createWildflowerPocket(scene, pocket);
  });
}
