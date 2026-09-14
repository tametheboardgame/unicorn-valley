import type Phaser from 'phaser';
import { worldDepthForY } from '../world/WorldDepth';

interface WonderbookWorldPropPosition {
  x: number;
  y: number;
}

/**
 * Renders the physical Wonderbook on a small cottage lectern.
 * This is deliberately a world prop only: Wonderbook content remains owned by WonderbookScene.
 */
export function renderWonderbookWorldProp(
  scene: Phaser.Scene,
  position: WonderbookWorldPropPosition,
): void {
  const { x, y } = position;
  const baseDepth = worldDepthForY(y + 92);

  scene.add.ellipse(x, y + 48, 150, 42, 0x6b584d, 0.2).setDepth(baseDepth - 0.5);

  scene.add
    .rectangle(x, y + 24, 104, 66, 0x98704f, 1)
    .setStrokeStyle(5, 0x6f4e3b, 0.95)
    .setDepth(baseDepth);
  scene.add.rectangle(x, y - 6, 126, 16, 0xb98a60, 1).setDepth(baseDepth + 0.2);
  scene.add.rectangle(x - 35, y + 60, 18, 56, 0x76513d, 1).setDepth(baseDepth - 0.1);
  scene.add.rectangle(x + 35, y + 60, 18, 56, 0x76513d, 1).setDepth(baseDepth - 0.1);

  const glow = scene.add.circle(x, y - 48, 58, 0xd9b0ff, 0.12).setDepth(baseDepth + 0.3);
  scene.tweens.add({
    targets: glow,
    alpha: 0.22,
    scale: 1.12,
    duration: 1350,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });

  scene.add
    .rectangle(x, y - 38, 108, 62, 0x76559f, 1)
    .setStrokeStyle(4, 0x51396b, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.5);
  scene.add
    .rectangle(x - 45, y - 39, 10, 56, 0x5e417f, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.6);
  scene.add
    .rectangle(x + 48, y - 39, 12, 22, 0xe4bc62, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.65);
  scene.add
    .text(x, y - 45, '✦', {
      color: '#ffe6a0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '27px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAngle(-5)
    .setDepth(baseDepth + 0.7);
  scene.add
    .text(x + 2, y - 25, '☾', {
      color: '#f0d8ff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAngle(-5)
    .setDepth(baseDepth + 0.7);

  for (const [sparkX, sparkY, size] of [
    [x - 72, y - 58, 10],
    [x + 66, y - 70, 8],
    [x + 78, y - 24, 6],
  ] as const) {
    scene.add
      .text(sparkX, sparkY, '✦', {
        color: '#f6df9f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${size}px`,
      })
      .setOrigin(0.5)
      .setAlpha(0.72)
      .setDepth(baseDepth + 0.8);
  }
}
