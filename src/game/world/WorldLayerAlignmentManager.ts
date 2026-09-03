import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from './WorldDepth';

const ALIGNMENT_ANCHOR = 'world-layer-alignment-anchor';
const WOODS_REPLACEMENT_PREFIX = 'world-layer-alignment:woods-bottom-tree';

const WOODS_BOTTOM_TREES = [
  { x: 520, y: 1830, scale: 1.18 },
  { x: 1290, y: 1810, scale: 1.04 },
  { x: 2780, y: 1830, scale: 1.16 },
] as const;

function findNamedContainer(
  scene: Phaser.Scene,
  name: string,
): Phaser.GameObjects.Container | null {
  const object = scene.children.getByName(name);
  return object instanceof Phaser.GameObjects.Container ? object : null;
}

function createWoodsTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale: number,
  index: number,
): Phaser.GameObjects.Container {
  const trunk = scene.add.rectangle(0, 0, 48 * scale, 240 * scale, 0x473d34, 1);
  const left = scene.add.ellipse(
    -58 * scale,
    -112 * scale,
    190 * scale,
    128 * scale,
    0x214a3c,
    0.96,
  );
  const right = scene.add.ellipse(
    50 * scale,
    -130 * scale,
    210 * scale,
    142 * scale,
    0x2c5d47,
    0.96,
  );
  const crown = scene.add.ellipse(5 * scale, -182 * scale, 180 * scale, 126 * scale, 0x386c50, 0.9);
  return scene.add
    .container(x, y, [trunk, left, right, crown])
    .setName(`${WOODS_REPLACEMENT_PREFIX}:${index}`)
    .setDepth(worldDepthForY(y, 0.32));
}

function alignMeadow(scene: Phaser.Scene): void {
  findNamedContainer(scene, 'r6-region-gateway-art:meadow-crystal-brook:divider')?.setDepth(
    worldDepthForY(1770, 0.18),
  );
}

function alignBrook(scene: Phaser.Scene): void {
  findNamedContainer(scene, 'r6-region-gateway-art:crystal-brook:production-upgrade')?.setDepth(
    worldDepthForY(520, 0.22),
  );
  findNamedContainer(scene, 'r6-region-gateway-art:crystal-brook:cascade-upgrade')?.setDepth(
    worldDepthForY(790, 0.22),
  );
}

function alignWoods(scene: Phaser.Scene): void {
  const production = findNamedContainer(
    scene,
    'r6-region-gateway-art:whispering-woods:production-upgrade',
  );
  if (!production) {
    return;
  }

  production.setDepth(worldDepthForY(520, 0.18));

  // The original production container spans both the north and south edges of the entire map.
  // A single parent depth cannot interleave both edges with the player. Hide only the three
  // southern tree groups in that parent and recreate them as independent Y-sorted objects.
  for (const child of production.list) {
    const positioned = child as Phaser.GameObjects.GameObject & Partial<{ x: number; y: number }>;
    if (typeof positioned.x !== 'number' || typeof positioned.y !== 'number') {
      continue;
    }
    const belongsToSouthernTree = WOODS_BOTTOM_TREES.some(
      (tree) => Math.abs(positioned.x - tree.x) <= 145 && positioned.y >= 1540,
    );
    if (belongsToSouthernTree && 'setVisible' in child) {
      (
        child as Phaser.GameObjects.GameObject & { setVisible: (visible: boolean) => unknown }
      ).setVisible(false);
    }
  }

  if (!scene.children.getByName(`${WOODS_REPLACEMENT_PREFIX}:0`)) {
    WOODS_BOTTOM_TREES.forEach((tree, index) => {
      createWoodsTree(scene, tree.x, tree.y, tree.scale, index);
    });
  }
}

export class WorldLayerAlignmentManager {
  private readonly refresh = new RefreshThrottle(120);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!this.refresh.shouldRun(this.game.loop.time)) {
      return;
    }
    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key === 'RainbowMeadowScene') {
        alignMeadow(scene);
      } else if (scene.scene.key === 'CrystalBrookScene') {
        alignBrook(scene);
      } else if (scene.scene.key === 'WhisperingWoodsScene') {
        alignWoods(scene);
      } else {
        continue;
      }

      if (!scene.children.getByName(ALIGNMENT_ANCHOR)) {
        scene.add.zone(-64, -64, 2, 2).setName(ALIGNMENT_ANCHOR).setVisible(false);
      }
    }
  }
}

let manager: WorldLayerAlignmentManager | null = null;

export function getWorldLayerAlignmentManager(game: Phaser.Game): WorldLayerAlignmentManager {
  manager ??= new WorldLayerAlignmentManager(game);
  return manager;
}
