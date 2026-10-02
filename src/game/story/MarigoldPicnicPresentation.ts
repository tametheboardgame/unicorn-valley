import Phaser from 'phaser';
import type { SaveGame } from '../save/saveSchema';
import { RAINBOW_MEADOW_LAYOUT } from '../world/RainbowMeadowMap';
import { worldDepthForY } from '../world/WorldDepth';
import { getPicnicTheme, isMarigoldPicnicReady } from './MarigoldPicnicStory';

interface PicnicPalette {
  blanket: number;
  blanketAccent: number;
  flowers: number;
  bunting: readonly number[];
}

const PICNIC_PALETTES = {
  sunshine: {
    blanket: 0xf4c95d,
    blanketAccent: 0xfff1a8,
    flowers: 0xf3c95d,
    bunting: [0xf4c95d, 0xf08a5d, 0xffefad],
  },
  moonflower: {
    blanket: 0x8099d6,
    blanketAccent: 0xd9dcff,
    flowers: 0xaeb7eb,
    bunting: [0x8099d6, 0xb7a6e8, 0xe8e3ff],
  },
  rainbow: {
    blanket: 0xef8aa6,
    blanketAccent: 0x8fcde3,
    flowers: 0xc69be0,
    bunting: [0xef8aa6, 0xf4c95d, 0x8fcde3, 0xa7d780, 0xb89ce0],
  },
} as const satisfies Record<string, PicnicPalette>;

export function createPicnicHillLandscape(scene: Phaser.Scene): void {
  const picnic = RAINBOW_MEADOW_LAYOUT.picnicHill;
  const { x, y } = picnic.centre;

  scene.add
    .ellipse(x + 10, y + 34, picnic.hill.width, picnic.hill.height, 0x6fa66d, 0.24)
    .setName('rainbow-meadow:picnic-hill:shadow')
    .setDepth(2.14);
  scene.add
    .ellipse(x, y, picnic.hill.width - 24, picnic.hill.height - 26, 0xa7dc91, 0.94)
    .setName('rainbow-meadow:picnic-hill:ground')
    .setDepth(2.18);
  scene.add
    .ellipse(x - 12, y - 20, picnic.hill.width - 130, picnic.hill.height - 105, 0xc2e9a5, 0.46)
    .setName('rainbow-meadow:picnic-hill:upper-grass')
    .setDepth(2.2);

  for (const [index, patch] of picnic.flowerPatches.entries()) {
    const depth = worldDepthForY(patch.y, -0.3);
    scene.add
      .circle(patch.x - 11, patch.y + 2, 9, patch.colour, 0.92)
      .setName(`rainbow-meadow:picnic-hill:flower:${index}:a`)
      .setDepth(depth);
    scene.add.circle(patch.x + 4, patch.y - 5, 8, 0xffefad, 0.9).setDepth(depth);
    scene.add.circle(patch.x + 14, patch.y + 5, 7, patch.colour, 0.86).setDepth(depth);
    scene.add.rectangle(patch.x + 2, patch.y + 17, 4, 22, 0x6d9f62, 0.72).setDepth(depth - 0.02);
  }

  for (const [index, tuft] of picnic.grassTufts.entries()) {
    const grass = scene.add.graphics().setDepth(worldDepthForY(tuft.y, -0.32));
    grass.lineStyle(4, 0x62985e, 0.6);
    grass.beginPath();
    grass.moveTo(tuft.x - 12, tuft.y + 10);
    grass.lineTo(tuft.x - 3, tuft.y - 10);
    grass.moveTo(tuft.x, tuft.y + 10);
    grass.lineTo(tuft.x + 3, tuft.y - 13);
    grass.moveTo(tuft.x + 11, tuft.y + 10);
    grass.lineTo(tuft.x + 15, tuft.y - 7);
    grass.strokePath();
    grass.setName(`rainbow-meadow:picnic-hill:grass:${index}`);
  }
}

export function createMarigoldPicnicPresentation(scene: Phaser.Scene, save: SaveGame | null): void {
  if (!isMarigoldPicnicReady(save)) {
    return;
  }

  const theme = getPicnicTheme(save);
  if (!theme) {
    return;
  }

  const picnic = RAINBOW_MEADOW_LAYOUT.picnicHill;
  const blanket = picnic.blanket;
  const palette = PICNIC_PALETTES[theme];
  const blanketDepth = worldDepthForY(blanket.y, -0.08);

  scene.add
    .ellipse(blanket.x + 7, blanket.y + 18, blanket.width + 28, blanket.height + 35, 0x5f775e, 0.18)
    .setName('rainbow-meadow:picnic-hill:blanket-shadow')
    .setAngle(blanket.angle)
    .setDepth(blanketDepth - 0.04);

  scene.add
    .rectangle(blanket.x, blanket.y, blanket.width, blanket.height, palette.blanket, 0.98)
    .setName('rainbow-meadow:picnic-hill:blanket')
    .setStrokeStyle(8, palette.blanketAccent, 1)
    .setAngle(blanket.angle)
    .setDepth(blanketDepth);

  for (const offset of [-150, -50, 50, 150]) {
    scene.add
      .rectangle(blanket.x + offset, blanket.y, 15, blanket.height - 16, palette.blanketAccent, 0.5)
      .setAngle(blanket.angle)
      .setDepth(blanketDepth + 0.01);
  }

  const leftPost = picnic.bunting.leftPost;
  const rightPost = picnic.bunting.rightPost;
  const postDepth = worldDepthForY(picnic.bunting.lineY + 70, -0.2);
  scene.add
    .rectangle(leftPost.x, leftPost.y, 18, 150, 0x8b674c, 0.96)
    .setName('rainbow-meadow:picnic-hill:bunting-left-post')
    .setDepth(postDepth);
  scene.add
    .rectangle(rightPost.x, rightPost.y, 18, 150, 0x8b674c, 0.96)
    .setName('rainbow-meadow:picnic-hill:bunting-right-post')
    .setDepth(postDepth);

  const bunting = scene.add
    .graphics()
    .setName('rainbow-meadow:picnic-hill:bunting')
    .setDepth(postDepth + 0.02);
  bunting.lineStyle(4, 0x7f6658, 0.78);
  bunting.lineBetween(leftPost.x, picnic.bunting.lineY, rightPost.x, picnic.bunting.lineY);
  for (let index = 0; index < 8; index += 1) {
    const px = leftPost.x + 28 + index * 56;
    bunting.fillStyle(palette.bunting[index % palette.bunting.length], 0.96);
    bunting.fillTriangle(px - 15, picnic.bunting.lineY + 1, px + 15, picnic.bunting.lineY + 1, px, picnic.bunting.lineY + 32);
  }

  scene.add
    .ellipse(blanket.x - 145, blanket.y + 15, 90, 58, 0xb77b43, 0.98)
    .setName('rainbow-meadow:picnic-hill:basket')
    .setStrokeStyle(4, 0x81542f, 0.9)
    .setDepth(blanketDepth + 0.08);
  scene.add
    .arc(blanket.x - 145, blanket.y - 12, 38, 196, 344, false, 0x000000, 0)
    .setStrokeStyle(5, 0x81542f, 0.9)
    .setDepth(blanketDepth + 0.09);

  scene.add
    .text(blanket.x - 28, blanket.y + 36, '🥐  🍓  🧁', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '34px',
    })
    .setName('rainbow-meadow:picnic-hill:food')
    .setOrigin(0.5)
    .setDepth(blanketDepth + 0.1);

  scene.add
    .ellipse(blanket.x + 150, blanket.y - 40, 82, 52, palette.flowers, 0.34)
    .setStrokeStyle(3, palette.blanketAccent, 0.8)
    .setDepth(blanketDepth + 0.06);
  scene.add
    .text(blanket.x + 150, blanket.y - 47, '🌼', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '31px',
    })
    .setName('rainbow-meadow:picnic-hill:flower-jar')
    .setOrigin(0.5)
    .setDepth(blanketDepth + 0.11);

  scene.add
    .text(blanket.x + 135, blanket.y + 48, '🧭', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '30px',
    })
    .setName('rainbow-meadow:picnic-hill:pip-compass')
    .setOrigin(0.5)
    .setAngle(-8)
    .setDepth(blanketDepth + 0.11);

  for (const [index, cushion] of [
    { x: blanket.x - 70, y: blanket.y - 65, colour: palette.blanketAccent },
    { x: blanket.x + 55, y: blanket.y - 72, colour: palette.flowers },
  ].entries()) {
    scene.add
      .ellipse(cushion.x, cushion.y, 88, 48, cushion.colour, 0.86)
      .setName(`rainbow-meadow:picnic-hill:cushion:${index}`)
      .setStrokeStyle(3, 0xffffff, 0.34)
      .setAngle(index === 0 ? -8 : 7)
      .setDepth(blanketDepth + 0.04);
  }
}
