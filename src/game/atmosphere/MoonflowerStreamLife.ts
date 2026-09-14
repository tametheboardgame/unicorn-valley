import Phaser from 'phaser';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { worldDepthForY } from '../world/WorldDepth';
import {
  AMBIENT_STREAM_FISH_NAME_PREFIX,
  MOONFLOWER_STREAM_FISHING_HOOK,
  MOONFLOWER_STREAM_REED_BEDS,
  MOONFLOWER_STREAM_SURFACE_MARKS,
  resolveAmbientFishRun,
} from './MoonflowerStreamLifeModel';

export {
  AMBIENT_STREAM_FISH_NAME_PREFIX,
  MOONFLOWER_STREAM_FISHING_HOOK,
  MOONFLOWER_STREAM_REED_BEDS,
  MOONFLOWER_STREAM_SURFACE_MARKS,
  resolveAmbientFishRun,
} from './MoonflowerStreamLifeModel';

const ROOT_NAME = 'h1.6:moonflower-stream-life';
const REED_ROOT_NAME = 'h1.6a:moonflower-stream-reed-beds';
const STREAM_X = 1400;
const STREAM_Y = 900;
const STREAM_WIDTH = 220;
const STREAM_HEIGHT = 1800;
const FISH_START_Y = -90;
const FISH_END_Y = 1890;

const FISH_STYLES = [
  { body: 0xb9e1e8, accent: 0x82b9c8, detail: 0xe7f8f6, scale: 0.92 },
  { body: 0xd8c7ec, accent: 0xaa8dca, detail: 0xf4ecff, scale: 1.04 },
  { body: 0xead8a8, accent: 0xc5a15e, detail: 0xfff3cf, scale: 0.96 },
  { body: 0xb9dcc0, accent: 0x7fae8b, detail: 0xe8f6e7, scale: 1 },
] as const;

const LEGACY_REED_CENTRES = [
  { x: 1288, y: 590 },
  { x: 1512, y: 690 },
  { x: 1296, y: 1220 },
  { x: 1502, y: 1330 },
] as const;

interface FishRuntime {
  container: Phaser.GameObjects.Container;
  index: number;
  timer: Phaser.Time.TimerEvent | null;
  surfaceTimer: Phaser.Time.TimerEvent | null;
}

interface StreamRuntime {
  root: Phaser.GameObjects.Container;
  fish: FishRuntime[];
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

function retireLegacyReeds(scene: Phaser.Scene): void {
  for (const child of [...scene.children.list]) {
    if (child.name !== 'visual-tightening-detail') {
      continue;
    }

    for (const centre of LEGACY_REED_CENTRES) {
      if (
        child instanceof Phaser.GameObjects.Rectangle &&
        Math.abs(child.x - centre.x) <= 18 &&
        Math.abs(child.y - (centre.y - 16)) <= 22 &&
        child.displayWidth <= 8 &&
        child.displayHeight <= 58
      ) {
        child.destroy();
        break;
      }

      if (
        child instanceof Phaser.GameObjects.Ellipse &&
        Math.abs(child.x - centre.x) <= 2 &&
        Math.abs(child.y - (centre.y + 7)) <= 2 &&
        Math.abs(child.displayWidth - 68) <= 2 &&
        Math.abs(child.displayHeight - 20) <= 2
      ) {
        child.destroy();
        break;
      }
    }
  }
}

function createReedBed(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  width: number,
  variant: number,
): Phaser.GameObjects.Container {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const ground = scene.add.ellipse(0, 5, width, 26, 0x659b68, 0.18);
  parts.push(ground);

  const offsets = [-0.43, -0.34, -0.25, -0.16, -0.06, 0.05, 0.15, 0.24, 0.34, 0.43];
  const heights = [50, 67, 58, 78, 64, 84, 55, 73, 61, 70];
  const greens = [0x4f8d5d, 0x5c9a64, 0x467e55, 0x69a56d] as const;

  offsets.forEach((normalised, index) => {
    const localX = normalised * width;
    const height = heights[(index + variant) % heights.length];
    const lean = ((index + variant) % 3 - 1) * 5;
    const colour = greens[(index + variant) % greens.length];
    const stalk = scene.add
      .rectangle(localX, -height / 2 + 5, 4 + ((index + variant) % 2), height, colour, 0.94)
      .setAngle(lean);
    parts.push(stalk);

    if ((index + variant) % 3 === 0) {
      const seedHead = scene.add
        .ellipse(localX + lean * 0.28, -height + 7, 9, 22, 0x8a6e50, 0.88)
        .setAngle(lean);
      parts.push(seedHead);
    }

    if ((index + variant) % 2 === 0) {
      const leaf = scene.add
        .ellipse(localX + 5, -height * 0.38, 8, 28, 0x72aa70, 0.72)
        .setAngle(24 + lean);
      parts.push(leaf);
    }
  });

  return scene.add
    .container(x, y, parts)
    .setName(`${REED_ROOT_NAME}:${id}`)
    .setDepth(worldDepthForY(y + 10, -0.16));
}

function ensureReedBeds(scene: Phaser.Scene): void {
  retireLegacyReeds(scene);
  if (scene.children.getByName(REED_ROOT_NAME)) {
    return;
  }

  const root = scene.add.container(0, 0).setName(REED_ROOT_NAME);
  MOONFLOWER_STREAM_REED_BEDS.forEach((bed, index) => {
    root.add(createReedBed(scene, bed.id, bed.x, bed.y, bed.width, index));
  });
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
  const style = FISH_STYLES[index % FISH_STYLES.length];
  const scale = style.scale;
  const art = scene.add.graphics();

  art.fillStyle(style.accent, 0.9);
  art.fillTriangle(-11 * scale, -20 * scale, 11 * scale, -20 * scale, 0, -7 * scale);
  art.fillTriangle(-8 * scale, -1 * scale, -17 * scale, 7 * scale, -7 * scale, 10 * scale);
  art.fillTriangle(8 * scale, -1 * scale, 17 * scale, 7 * scale, 7 * scale, 10 * scale);

  art.fillStyle(style.body, 0.96);
  art.fillEllipse(0, 2 * scale, 22 * scale, 40 * scale);
  art.fillCircle(0, 14 * scale, 9 * scale);

  art.fillStyle(style.accent, 0.48);
  art.fillEllipse(0, -2 * scale, 8 * scale, 20 * scale);

  art.fillStyle(0x4f5f68, 0.7);
  art.fillCircle(-4 * scale, 13 * scale, 1.6 * scale);
  art.fillCircle(4 * scale, 13 * scale, 1.6 * scale);

  const glint = scene.add.ellipse(-4 * scale, 5 * scale, 5 * scale, 13 * scale, style.detail, 0.45);
  const fish = scene.add
    .container(0, FISH_START_Y - index * 240, [art, glint])
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
    const lateralDrift = Phaser.Math.Between(-12, 12);
    fish.container.setPosition(run.x - STREAM_X, FISH_START_Y - STREAM_Y);
    fish.container.setAlpha(0.5 + fish.index * 0.07);
    fish.container.setAngle(Phaser.Math.Clamp(lateralDrift * 0.38, -5, 5));

    const travel = scene.tweens.add({
      targets: fish.container,
      y: FISH_END_Y - STREAM_Y,
      x: fish.container.x + lateralDrift,
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
  if (scene.scene.key !== 'MoonflowerGladeScene') {
    return;
  }

  ensureReedBeds(scene);
  if (runtimes.has(scene)) {
    return;
  }

  retireLegacyStreamArt(scene);
  const root = scene.add.container(STREAM_X, STREAM_Y).setName(ROOT_NAME).setDepth(5.08);
  createSurface(scene, root);
  const fish = createFishLife(scene, root);
  const runtime: StreamRuntime = { root, fish };
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
    runtime.root.destroy(true);
    runtimes.delete(scene);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy);
}
