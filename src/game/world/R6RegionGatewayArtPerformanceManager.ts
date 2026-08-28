import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const TARGET_CONTAINERS = [
  'r6-region-gateway-art:crystal-brook:production-upgrade',
  'r6-region-gateway-art:crystal-brook:cascade-upgrade',
  'r6-region-gateway-art:whispering-woods:production-upgrade',
] as const;

const FLATTENED_DATA_KEY = 'r6-region-art-flattened';

interface DepthCapableGameObject extends Phaser.GameObjects.GameObject {
  setDepth(depth: number): this;
}

function flattenStaticWorldContainer(scene: Phaser.Scene, name: string): void {
  const container = scene.children.getByName(name);
  if (!(container instanceof Phaser.GameObjects.Container)) {
    return;
  }
  if (container.getData(FLATTENED_DATA_KEY) === true || container.list.length === 0) {
    return;
  }

  const baseDepth = container.depth;
  const children = [...container.list];
  container.removeAll(false);
  container.setData(FLATTENED_DATA_KEY, true).setVisible(false);

  children.forEach((child, index) => {
    scene.add.existing(child);
    const depthObject = child as DepthCapableGameObject;
    if (typeof depthObject.setDepth === 'function') {
      depthObject.setDepth(baseDepth + index * 0.0001);
    }
  });
}

export class R6RegionGatewayArtPerformanceManager {
  private readonly refresh = new RefreshThrottle(40);

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
      if (scene.scene.key !== 'CrystalBrookScene' && scene.scene.key !== 'WhisperingWoodsScene') {
        continue;
      }
      for (const name of TARGET_CONTAINERS) {
        flattenStaticWorldContainer(scene, name);
      }
    }
  }
}

let manager: R6RegionGatewayArtPerformanceManager | null = null;

export function getR6RegionGatewayArtPerformanceManager(
  game: Phaser.Game,
): R6RegionGatewayArtPerformanceManager {
  manager ??= new R6RegionGatewayArtPerformanceManager(game);
  return manager;
}
