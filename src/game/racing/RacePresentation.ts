import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';

export const RACE_COUNTDOWN_CUES = ['3', '2', '1', 'GO!'] as const;
export const RACE_COUNTDOWN_INTERVAL_MS = 620;

export type RaceCountdownCue = (typeof RACE_COUNTDOWN_CUES)[number];

export interface RaceCountdownState {
  cue: RaceCountdownCue;
  cueIndex: number;
  readyToRace: boolean;
}

export interface RaceSpeedStreak {
  shape: Phaser.GameObjects.Rectangle;
  speed: number;
  resetOffset: number;
}

export function resolveRaceCountdown(elapsedMs: number): RaceCountdownState {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const cueIndex = Math.min(
    RACE_COUNTDOWN_CUES.length - 1,
    Math.floor(safeElapsedMs / RACE_COUNTDOWN_INTERVAL_MS),
  );

  return {
    cue: RACE_COUNTDOWN_CUES[cueIndex],
    cueIndex,
    readyToRace: cueIndex === RACE_COUNTDOWN_CUES.length - 1,
  };
}

export function createLayeredRaceBackdrop(
  scene: Phaser.Scene,
  worldWidth: number,
  groundY: number,
): void {
  scene.add
    .rectangle(worldWidth / 2, GAME_HEIGHT / 2, worldWidth, GAME_HEIGHT, 0x9bdff2, 1)
    .setDepth(-20);
  scene.add.rectangle(worldWidth / 2, 235, worldWidth, 470, 0xc8f2ff, 0.24).setDepth(-19);

  scene.add
    .circle(GAME_WIDTH - 175, 118, 76, 0xfff2ae, 0.42)
    .setScrollFactor(0.04, 1)
    .setDepth(-18);
  scene.add
    .circle(GAME_WIDTH - 175, 118, 48, 0xfff8d8, 0.62)
    .setScrollFactor(0.04, 1)
    .setDepth(-17);

  for (let x = -160, index = 0; x < worldWidth + 500; x += 620, index += 1) {
    const distantY = groundY - 92 - (index % 2) * 18;
    scene.add
      .ellipse(x, distantY, 780, 330, index % 2 === 0 ? 0x83c6b0 : 0x7dbca8, 0.72)
      .setScrollFactor(0.2, 1)
      .setDepth(-8);
    scene.add
      .ellipse(x + 170, groundY - 35, 690, 250, index % 2 === 0 ? 0x8fd48d : 0x99d88f, 0.96)
      .setScrollFactor(0.58, 1)
      .setDepth(-2);

    if (index % 2 === 0) {
      const cloudX = x + 260;
      const cloudY = 150 + (index % 3) * 44;
      const cloud = scene.add.container(cloudX, cloudY).setScrollFactor(0.28, 1).setDepth(-12);
      cloud.add([
        scene.add.circle(-28, 6, 30, 0xffffff, 0.74),
        scene.add.circle(4, -7, 38, 0xffffff, 0.78),
        scene.add.circle(42, 8, 28, 0xffffff, 0.72),
        scene.add.ellipse(7, 18, 128, 42, 0xffffff, 0.7),
      ]);
    }
  }

  for (let x = 680, index = 0; x < worldWidth - 220; x += 760, index += 1) {
    const trunkY = groundY - 58;
    scene.add.rectangle(x, trunkY, 14, 116, 0x745747, 0.9).setDepth(1);
    scene.add.circle(x - 20, trunkY - 66, 42, 0x5eaa76, 0.92).setDepth(2);
    scene.add.circle(x + 22, trunkY - 73, 47, 0x69b77e, 0.92).setDepth(2);
    scene.add.circle(x + 2, trunkY - 101, 39, 0x78c88a, 0.92).setDepth(2);

    if (index % 2 === 1) {
      scene.add.triangle(x + 92, groundY - 142, 0, 0, 54, 18, 0, 36, 0xf3a4c2, 0.92).setDepth(3);
    }
  }
}

export function createRaceSpeedStreaks(scene: Phaser.Scene, count = 18): RaceSpeedStreak[] {
  const streaks: RaceSpeedStreak[] = [];

  for (let index = 0; index < count; index += 1) {
    const width = 24 + (index % 5) * 11;
    const y = 150 + ((index * 73) % Math.max(120, GAME_HEIGHT - 270));
    const x = (index * 127) % (GAME_WIDTH + 180);
    const shape = scene.add
      .rectangle(x, y, width, 3 + (index % 2), 0xffffff, 0.16 + (index % 4) * 0.045)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(90)
      .setVisible(false);

    streaks.push({
      shape,
      speed: 520 + (index % 6) * 72,
      resetOffset: (index * 41) % 180,
    });
  }

  return streaks;
}

export function updateRaceSpeedStreaks(
  streaks: readonly RaceSpeedStreak[],
  deltaMs: number,
  active: boolean,
  intensity = 1,
): void {
  const safeIntensity = Math.max(0.5, Math.min(intensity, 1.8));
  const deltaSeconds = Math.max(0, Math.min(deltaMs, 50)) / 1000;

  for (const streak of streaks) {
    streak.shape.setVisible(active);
    if (!active) {
      continue;
    }

    streak.shape.x -= streak.speed * safeIntensity * deltaSeconds;
    if (streak.shape.x + streak.shape.width < 0) {
      streak.shape.x = GAME_WIDTH + streak.resetOffset;
    }
  }
}

export function playRaceFinishBurst(scene: Phaser.Scene): void {
  const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0, 0xfff1bd];
  const originX = GAME_WIDTH * 0.57;
  const originY = GAME_HEIGHT * 0.28;

  for (let index = 0; index < 30; index += 1) {
    const angle = (Math.PI * 2 * index) / 30;
    const distance = 170 + (index % 6) * 28;
    const piece = scene.add
      .rectangle(
        originX + Math.cos(angle) * 18,
        originY + Math.sin(angle) * 12,
        11 + (index % 3) * 4,
        6 + (index % 2) * 4,
        colours[index % colours.length],
        1,
      )
      .setScrollFactor(0)
      .setDepth(146)
      .setAngle(index * 19);

    scene.tweens.add({
      targets: piece,
      x: originX + Math.cos(angle) * distance,
      y: originY + Math.sin(angle) * distance + 90,
      angle: piece.angle + 180 + (index % 5) * 45,
      alpha: 0,
      duration: 720 + (index % 5) * 85,
      ease: 'Quad.Out',
      onComplete: () => piece.destroy(),
    });
  }
}
