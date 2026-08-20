import Phaser from 'phaser';
import type { SaveGame } from '../save/saveSchema';
import { getPicnicTheme, isMarigoldPicnicReady } from './MarigoldPicnicStory';

interface PicnicPalette {
  blanket: number;
  blanketAccent: number;
  flowers: string;
  bunting: readonly number[];
}

const PICNIC_PALETTES = {
  sunshine: {
    blanket: 0xf4c95d,
    blanketAccent: 0xfff1a8,
    flowers: '🌻',
    bunting: [0xf4c95d, 0xf08a5d, 0xffefad],
  },
  moonflower: {
    blanket: 0x8099d6,
    blanketAccent: 0xd9dcff,
    flowers: '🌙',
    bunting: [0x8099d6, 0xb7a6e8, 0xe8e3ff],
  },
  rainbow: {
    blanket: 0xef8aa6,
    blanketAccent: 0x8fcde3,
    flowers: '🌈',
    bunting: [0xef8aa6, 0xf4c95d, 0x8fcde3, 0xa7d780, 0xb89ce0],
  },
} as const satisfies Record<string, PicnicPalette>;

export function createMarigoldPicnicPresentation(scene: Phaser.Scene, save: SaveGame | null): void {
  if (!isMarigoldPicnicReady(save)) {
    return;
  }

  const theme = getPicnicTheme(save);
  if (!theme) {
    return;
  }

  const palette = PICNIC_PALETTES[theme];
  const x = 1760;
  const y = 1210;
  const depth = 6;

  scene.add.ellipse(x, y + 40, 760, 430, 0xa5dd8f, 0.55).setDepth(depth - 1);
  scene.add
    .rectangle(x, y + 45, 510, 250, palette.blanket, 0.98)
    .setStrokeStyle(9, palette.blanketAccent, 1)
    .setAngle(-4)
    .setDepth(depth);

  for (const offset of [-185, -60, 65, 190]) {
    scene.add
      .rectangle(x + offset, y + 45, 18, 240, palette.blanketAccent, 0.56)
      .setAngle(-4)
      .setDepth(depth + 0.1);
  }

  scene.add
    .text(x, y - 132, 'Sunbeam Picnic', {
      color: '#6f4e58',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      backgroundColor: '#fff8e5df',
      padding: { x: 12, y: 6 },
    })
    .setOrigin(0.5)
    .setDepth(depth + 4);

  scene.add
    .text(x - 155, y + 20, '🧺', { fontFamily: 'system-ui, sans-serif', fontSize: '52px' })
    .setOrigin(0.5)
    .setDepth(depth + 2);
  scene.add
    .text(x - 20, y + 80, '🥐 🍓 🧁', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px',
    })
    .setOrigin(0.5)
    .setDepth(depth + 2);
  scene.add
    .text(x + 175, y + 15, palette.flowers, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '46px',
    })
    .setOrigin(0.5)
    .setDepth(depth + 2);

  const bunting = scene.add.graphics().setDepth(depth + 1);
  bunting.lineStyle(5, 0x8b6a67, 0.72);
  bunting.lineBetween(x - 330, y - 205, x + 330, y - 205);
  for (let index = 0; index < 9; index += 1) {
    scene.add
      .triangle(
        x - 300 + index * 75,
        y - 185,
        0,
        0,
        34,
        0,
        17,
        38,
        palette.bunting[index % palette.bunting.length],
        0.96,
      )
      .setDepth(depth + 2);
  }

  const guests = [
    { x: x - 255, y: y + 205, icon: '🥐', label: 'Marigold' },
    { x: x - 75, y: y + 235, icon: '🌿', label: 'Willow' },
    { x: x + 115, y: y + 225, icon: '🧭', label: 'Pip' },
    { x: x + 285, y: y + 190, icon: '⭐', label: 'Nova' },
  ] as const;

  for (const guest of guests) {
    scene.add.circle(guest.x, guest.y, 37, 0xfff5dc, 0.96).setDepth(depth + 2);
    scene.add
      .text(guest.x, guest.y, guest.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
      })
      .setOrigin(0.5)
      .setDepth(depth + 3);
    scene.add
      .text(guest.x, guest.y + 52, guest.label, {
        color: '#654d61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e5cc',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(depth + 3);
  }
}
