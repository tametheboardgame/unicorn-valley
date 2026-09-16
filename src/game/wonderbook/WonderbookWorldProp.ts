import type Phaser from 'phaser';
import { worldDepthForY } from '../world/WorldDepth';

interface WonderbookWorldPropPosition {
  x: number;
  y: number;
}

interface WonderbookWorldPropOptions {
  scale?: number;
  yOffset?: number;
}

/**
 * Renders the physical Wonderbook on a small cottage lectern.
 * This is deliberately a world prop only: Wonderbook content remains owned by WonderbookScene.
 */
export function renderWonderbookWorldProp(
  scene: Phaser.Scene,
  position: WonderbookWorldPropPosition,
  options: WonderbookWorldPropOptions = {},
): void {
  const scale = options.scale ?? 1;
  const x = position.x;
  const y = position.y + (options.yOffset ?? 0);
  const scaled = (value: number): number => value * scale;
  const baseDepth = worldDepthForY(y + scaled(92));

  scene.add
    .ellipse(x, y + scaled(48), scaled(150), scaled(42), 0x6b584d, 0.16)
    .setDepth(baseDepth - 0.5);

  scene.add
    .rectangle(x, y + scaled(24), scaled(104), scaled(66), 0x98704f, 1)
    .setStrokeStyle(Math.max(2, scaled(5)), 0x6f4e3b, 0.95)
    .setDepth(baseDepth);
  scene.add
    .rectangle(x, y - scaled(6), scaled(126), scaled(16), 0xb98a60, 1)
    .setDepth(baseDepth + 0.2);
  scene.add
    .rectangle(x - scaled(35), y + scaled(60), scaled(18), scaled(56), 0x76513d, 1)
    .setDepth(baseDepth - 0.1);
  scene.add
    .rectangle(x + scaled(35), y + scaled(60), scaled(18), scaled(56), 0x76513d, 1)
    .setDepth(baseDepth - 0.1);

  const glow = scene.add
    .circle(x, y - scaled(48), scaled(58), 0xd9b0ff, 0.1)
    .setDepth(baseDepth + 0.3);
  scene.tweens.add({
    targets: glow,
    alpha: 0.2,
    scale: 1.12,
    duration: 1350,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });

  scene.add
    .rectangle(x, y - scaled(38), scaled(108), scaled(62), 0x76559f, 1)
    .setStrokeStyle(Math.max(2, scaled(4)), 0x51396b, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.5);
  scene.add
    .rectangle(x - scaled(45), y - scaled(39), scaled(10), scaled(56), 0x5e417f, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.6);
  scene.add
    .rectangle(x + scaled(48), y - scaled(39), scaled(12), scaled(22), 0xe4bc62, 1)
    .setAngle(-5)
    .setDepth(baseDepth + 0.65);
  scene.add
    .text(x, y - scaled(45), '✦', {
      color: '#ffe6a0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${Math.max(15, Math.round(scaled(27)))}px`,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAngle(-5)
    .setDepth(baseDepth + 0.7);
  scene.add
    .text(x + scaled(2), y - scaled(25), '☾', {
      color: '#f0d8ff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${Math.max(11, Math.round(scaled(18)))}px`,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setAngle(-5)
    .setDepth(baseDepth + 0.7);

  for (const [sparkX, sparkY, size] of [
    [x - scaled(72), y - scaled(58), 10],
    [x + scaled(66), y - scaled(70), 8],
    [x + scaled(78), y - scaled(24), 6],
  ] as const) {
    scene.add
      .text(sparkX, sparkY, '✦', {
        color: '#f6df9f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.max(5, Math.round(scaled(size)))}px`,
      })
      .setOrigin(0.5)
      .setAlpha(0.72)
      .setDepth(baseDepth + 0.8);
  }
}
