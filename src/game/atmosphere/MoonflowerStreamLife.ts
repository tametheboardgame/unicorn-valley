import Phaser from 'phaser';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';

const ROOT_NAME = 'h1.6:moonflower-stream-life';
export const AMBIENT_STREAM_FISH_NAME_PREFIX = 'ambient-stream-fish:moonflower:';

const STREAM_X = 1400;
const STREAM_Y = 900;
const STREAM_WIDTH = 220;
const STREAM_HEIGHT = 1800;
const FISH_START_Y = -90;
const FISH_END_Y = 1890;

export const MOONFLOWER_STREAM_FISHING_HOOK = {
  id: 'stream:moonflower-glade',
  sceneKey: 'MoonflowerGladeScene',
  bounds: {
    left: STREAM_X - STREAM_WIDTH / 2,
    right: STREAM_X + STREAM_WIDTH / 2,
    top: 0,
    bottom: STREAM_HEIGHT,
  },
  fishNamePrefix: AMBIENT_STREAM_FISH_NAME_PREFIX,
} as const;

export const MOONFLOWER_STREAM_SURFACE_MARKS = [
  { x: 1370, y: 145, width: 70, height: 14, drift: 13, duration: 2300 },
  { x: 1437, y: 318, width: 48, height: 11, drift: -10, duration: 2800 },
  { x: 1361, y: 514, width: 82, height: 16, drift: 16, duration: 3200 },
  { x: 1442, y: 733, width: 62, height: 13, drift: -14, duration: 2500 },
  { x: 1368, y: 1068, width: 54, height: 12, drift: 11, duration: 3000 },
  { x: 1430, y: 1263, width: 78, height: 15, drift: -16, duration: 3350 },
  { x: 1378, y: 1518, width: 58, height: 12, drift: 15, duration: 2650 },
  { x: 1440, y: 1694, width: 69, height: 14, drift: -12, duration: 3100 },
] as const;

const FISH_COLOURS = [0xb7e8ee, 0xd9f3ed, 0xaed9ef, 0xcce8d7] as const;

interface FishRuntime {
  container: Phaser.GameObjects.Container;
  index: number;
  timer: Phaser.Time.TimerEvent | null;
  surfaceTimer: Phaser.Time.TimerEvent | null;
}

interface StreamRuntime {
  root: Phaser.GameObjects.Container;
  fish: FishRuntime[];
  timers: Phaser.Time.TimerEvent[];
}

export interface AmbientFishRun {
  x: number;
  durationMs: number;
  shouldSurface: boolean;
}

export function resolveAmbientFishRun(
  laneSample: number,
  speedSample: number,
  surfaceSample: number,
): AmbientFishRun {
  const lane = Phaser.Math.Clamp(laneSample, 0, 1);
  const speed = Phaser.Math.Clamp(speedSample, 0, 1);
  return {
    x: Phaser.Math.Linear(1348, 1452, lane),
    durationMs: Math.round(Phaser.Math.Linear(9_200, 15_400, speed)),
    shouldSurface: Phaser.Math.Clamp(surfaceSample, 0, 1) < 0.32,
  };
}

const runtimes = new WeakMap<Phaser.Scene, StreamRuntime>();

function retireLegacyStreamArt(scene: Phaser.Scene): void {
  for (const child of [...scene.children.list]) {
    if (child instanceof Phaser.GameObjects.Rectangle) {
      const isLegacyWater =
        Math.abs(child.x - STREAM_X) < 1 &&
        Math.abs(child.y - STREAM_Y) < 1 &&
        Math.abs(child.displayHeight - STREAM_HEIGHT) < 2 &&
        (Math.abs(child.displayWidth - STREAM_WIDTH) < 2 || Math.abs(child.displayWidth - 92) < 2);
      if (isLegacyWater) {
        child.destroy();
      }
      continue;
    }

    if (
      child instanceof Phaser.GameObjects.Ellipse &&
      child.x >= STREAM_X - STREAM_WIDTH / 2 &&
      child.x <= STREAM_X + STREAM_WIDTH / 2 &&
      child.y >= 0 &&
      child.y <= STREAM_HEIGHT &&
      child.fillColor === 0xe8ffff
    ) {
      child.destroy();
    }
  }
}

function createSurface(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
  const water = scene.add.rectangle(0, 0, STREAM_WIDTH, STREAM_HEIGHT, 0x72c8df, 0.96);
  const innerGlow = scene.add.rectangle(-10, 0, 88, STREAM_HEIGHT, 0xb9ecf0, 0.24);
  root.add([water, innerGlow]);

  for (const [index, mark] of MOONFLOWER_STREAM_SURFACE_MARKS.entries()) {
    const ripple = scene.add
      .ellipse(mark.x - STREAM_X, mark.y - STREAM_Y, mark.width, mark.height, 0xe8ffff, 0.2)
      .setStrokeStyle(2, 0xf5ffff, 0.12);
    root.add(ripple);

    if (!isReducedMotionEnabled()) {
      scene.tweens.add({
        targets: ripple,
        x: ripple.x + mark.drift,
        alpha: { from: 0.1, to: 0.34 },
        scaleX: { from: 0.9, to: 1.08 },
        duration: mark.duration,
        delay: index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }
}

function createFish(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  index: number,
): FishRuntime {
  const colour = FISH_COLOURS[index % FISH_COLOURS.length];
  const body = scene.add.ellipse(0, 0, 31, 15, colour, 0.86);
  const tail = scene.add.triangle(-20, 0, 0, 8, 14, 0, 0, -8, colour, 0.76);
  const glint = scene.add.ellipse(5, -2, 10, 3, 0xffffff, 0.36).setAngle(-12);
  const fish = scene.add
    .container(0, FISH_START_Y - index * 240, [tail, body, glint])
    .setName(`${AMBIENT_STREAM_FISH_NAME_PREFIX}${index + 1}`)
    .setAlpha(0.82);
  fish.setData('streamId', MOONFLOWER_STREAM_FISHING_HOOK.id);
  fish.setData('ambientFishId', `moonflower-fish-${index + 1}`);
  root.add(fish);

  return { container: fish, index, timer: null, surfaceTimer: null };
}

function createSurfaceRipple(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  fish: FishRuntime,
): void {
  if (!fish.container.active || isReducedMotionEnabled()) {
    return;
  }

  const ripple = scene.add
    .ellipse(fish.container.x, fish.container.y, 22, 8, 0xf4ffff, 0.42)
    .setStrokeStyle(2, 0xffffff, 0.45);
  root.add(ripple);
  scene.tweens.add({
    targets: ripple,
    scaleX: 2.6,
    scaleY: 1.8,
    alpha: 0,
    duration: 720,
    ease: 'Sine.Out',
    onComplete: () => ripple.destroy(),
  });
}

function scheduleFishRun(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  fish: FishRuntime,
  initialDelay = 0,
): void {
  fish.timer?.destroy();
  fish.surfaceTimer?.destroy();

  fish.timer = scene.time.delayedCall(initialDelay, () => {
    if (!fish.container.active || !scene.scene.isActive()) {
      return;
    }

    const run = resolveAmbientFishRun(Math.random(), Math.random(), Math.random());
    fish.container.setPosition(run.x - STREAM_X, FISH_START_Y - STREAM_Y);
    fish.container.setAlpha(0.45 + fish.index * 0.08);

    const travel = scene.tweens.add({
      targets: fish.container,
      y: FISH_END_Y - STREAM_Y,
      x: fish.container.x + Phaser.Math.Between(-12, 12),
      duration: run.durationMs,
      ease: 'Linear',
      onComplete: () => {
        const pause = Phaser.Math.Between(900, 3200);
        scheduleFishRun(scene, root, fish, pause);
      },
    });

    if (run.shouldSurface) {
      fish.surfaceTimer = scene.time.delayedCall(Math.round(run.durationMs * 0.55), () => {
        if (travel.isPlaying()) {
          createSurfaceRipple(scene, root, fish);
        }
      });
    }
  });
}

function createFishLife(scene: Phaser.Scene, root: Phaser.GameObjects.Container): FishRuntime[] {
  const fish = [0, 1, 2, 3].map((index) => createFish(scene, root, index));

  if (isReducedMotionEnabled()) {
    const resting = [
      { x: -32, y: -560 },
      { x: 28, y: -120 },
      { x: -18, y: 380 },
      { x: 38, y: 690 },
    ];
    fish.forEach((entry, index) => {
      entry.container.setPosition(resting[index].x, resting[index].y);
    });
    return fish;
  }

  fish.forEach((entry, index) => {
    scheduleFishRun(scene, root, entry, 650 + index * 1900);
  });
  return fish;
}

export function ensureMoonflowerStreamLife(scene: Phaser.Scene): void {
  if (scene.scene.key !== 'MoonflowerGladeScene' || runtimes.has(scene)) {
    return;
  }

  retireLegacyStreamArt(scene);
  const root = scene.add.container(STREAM_X, STREAM_Y).setName(ROOT_NAME).setDepth(5.08);
  createSurface(scene, root);
  const fish = createFishLife(scene, root);
  const runtime: StreamRuntime = { root, fish, timers: [] };
  runtimes.set(scene, runtime);

  const destroy = () => {
    if (runtimes.get(scene) !== runtime) {
      return;
    }
    for (const entry of fish) {
      entry.timer?.destroy();
      entry.surfaceTimer?.destroy();
      scene.tweens.killTweensOf(entry.container);
    }
    for (const timer of runtime.timers) {
      timer.destroy();
    }
    runtime.root.destroy(true);
    runtimes.delete(scene);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy);
}
