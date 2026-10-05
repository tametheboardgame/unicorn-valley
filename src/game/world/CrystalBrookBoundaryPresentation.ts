import Phaser from 'phaser';
import { CRYSTAL_BROOK_BOUNDARY_ROCKS, type CrystalBrookBoundaryRock } from './CrystalBrookMap';
import { worldDepthForY } from './WorldDepth';

function fillRockBody(graphics: Phaser.GameObjects.Graphics, rock: CrystalBrookBoundaryRock): void {
  const width = rock.width;
  const height = rock.height;
  graphics.fillStyle(rock.colour, 1);

  if (rock.kind === 'rounded') {
    graphics.fillEllipse(0, 4, width, height * 0.88);
    graphics.fillEllipse(-width * 0.28, height * 0.08, width * 0.46, height * 0.58);
  } else if (rock.kind === 'slab') {
    graphics.beginPath();
    graphics.moveTo(-width * 0.48, height * 0.36);
    graphics.lineTo(-width * 0.42, -height * 0.3);
    graphics.lineTo(-width * 0.2, -height * 0.48);
    graphics.lineTo(width * 0.34, -height * 0.42);
    graphics.lineTo(width * 0.48, -height * 0.1);
    graphics.lineTo(width * 0.43, height * 0.37);
    graphics.lineTo(width * 0.08, height * 0.48);
    graphics.lineTo(-width * 0.3, height * 0.46);
    graphics.closePath();
    graphics.fillPath();
  } else if (rock.kind === 'lopsided') {
    graphics.beginPath();
    graphics.moveTo(-width * 0.48, height * 0.42);
    graphics.lineTo(-width * 0.38, -height * 0.14);
    graphics.lineTo(-width * 0.12, -height * 0.5);
    graphics.lineTo(width * 0.3, -height * 0.38);
    graphics.lineTo(width * 0.5, height * 0.04);
    graphics.lineTo(width * 0.34, height * 0.46);
    graphics.lineTo(-width * 0.2, height * 0.5);
    graphics.closePath();
    graphics.fillPath();
  } else if (rock.kind === 'spire') {
    graphics.beginPath();
    graphics.moveTo(-width * 0.48, height * 0.46);
    graphics.lineTo(-width * 0.34, -height * 0.06);
    graphics.lineTo(-width * 0.12, -height * 0.5);
    graphics.lineTo(width * 0.02, -height * 0.08);
    graphics.lineTo(width * 0.18, -height * 0.42);
    graphics.lineTo(width * 0.44, height * 0.06);
    graphics.lineTo(width * 0.48, height * 0.46);
    graphics.closePath();
    graphics.fillPath();
  } else if (rock.kind === 'stack') {
    graphics.fillEllipse(-width * 0.2, height * 0.09, width * 0.7, height * 0.65);
    graphics.fillEllipse(width * 0.23, height * 0.15, width * 0.58, height * 0.54);
    graphics.fillEllipse(0, -height * 0.22, width * 0.6, height * 0.48);
  } else {
    graphics.beginPath();
    graphics.moveTo(-width * 0.5, height * 0.28);
    graphics.lineTo(-width * 0.38, -height * 0.32);
    graphics.lineTo(-width * 0.06, -height * 0.46);
    graphics.lineTo(width * 0.42, -height * 0.3);
    graphics.lineTo(width * 0.5, height * 0.12);
    graphics.lineTo(width * 0.34, height * 0.42);
    graphics.lineTo(-width * 0.34, height * 0.44);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0x344b49, 0.34);
    graphics.beginPath();
    graphics.moveTo(-width * 0.4, height * 0.26);
    graphics.lineTo(width * 0.45, height * 0.1);
    graphics.lineTo(width * 0.32, height * 0.4);
    graphics.lineTo(-width * 0.32, height * 0.42);
    graphics.closePath();
    graphics.fillPath();
  }
}

function addNaturalHighlight(
  graphics: Phaser.GameObjects.Graphics,
  rock: CrystalBrookBoundaryRock,
): void {
  graphics.fillStyle(0x9aaba4, 0.15);
  if (rock.kind === 'spire') {
    graphics.beginPath();
    graphics.moveTo(-rock.width * 0.1, -rock.height * 0.42);
    graphics.lineTo(rock.width * 0.02, -rock.height * 0.08);
    graphics.lineTo(-rock.width * 0.2, rock.height * 0.2);
    graphics.lineTo(-rock.width * 0.28, -rock.height * 0.02);
    graphics.closePath();
    graphics.fillPath();
    return;
  }

  graphics.fillEllipse(
    -rock.width * 0.13,
    -rock.height * 0.2,
    rock.width * 0.38,
    Math.max(18, rock.height * 0.16),
  );
}

function addCrystalAccent(
  graphics: Phaser.GameObjects.Graphics,
  rock: CrystalBrookBoundaryRock,
): void {
  if (rock.crystalColour === undefined) {
    return;
  }

  const baseX = rock.width * 0.18;
  const baseY = rock.height * 0.28;
  const shardHeight = Math.min(64, rock.height * 0.34);

  graphics.fillStyle(rock.crystalColour, 0.9);
  graphics.beginPath();
  graphics.moveTo(baseX - 17, baseY + 6);
  graphics.lineTo(baseX - 7, baseY - shardHeight);
  graphics.lineTo(baseX + 8, baseY - shardHeight * 0.72);
  graphics.lineTo(baseX + 18, baseY + 6);
  graphics.closePath();
  graphics.fillPath();

  graphics.fillStyle(0xe9ffff, 0.42);
  graphics.beginPath();
  graphics.moveTo(baseX - 6, baseY - shardHeight * 0.86);
  graphics.lineTo(baseX - 1, baseY - shardHeight * 0.22);
  graphics.lineTo(baseX + 7, baseY - shardHeight * 0.68);
  graphics.closePath();
  graphics.fillPath();
}

function createBoundaryRock(scene: Phaser.Scene, rock: CrystalBrookBoundaryRock): void {
  const underEastWoodland = rock.x >= 3310 && rock.y >= 250;
  const graphics = scene.add
    .graphics()
    .setPosition(rock.x, rock.y)
    .setAngle(rock.angle)
    .setName(`crystal-brook:boundary:rock:${rock.kind}:${rock.id}`)
    // The existing east woodland container sits at 6.2. Keep its trunks/canopies in front
    // so these rocks read as a subtle root-line/boulder mix rather than a stone wall.
    .setDepth(underEastWoodland ? 6.05 : worldDepthForY(rock.y + rock.height * 0.42, 0.18));

  fillRockBody(graphics, rock);
  addNaturalHighlight(graphics, rock);
  addCrystalAccent(graphics, rock);

  graphics.lineStyle(3, 0x425653, 0.68);
  graphics.beginPath();
  graphics.moveTo(-rock.width * 0.34, rock.height * 0.4);
  graphics.lineTo(rock.width * 0.3, rock.height * 0.42);
  graphics.strokePath();
}

export function createCrystalBrookBoundaryPresentation(scene: Phaser.Scene): void {
  for (const rock of CRYSTAL_BROOK_BOUNDARY_ROCKS) {
    createBoundaryRock(scene, rock);
  }
}
