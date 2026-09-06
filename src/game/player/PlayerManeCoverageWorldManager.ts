import Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { parseUnicornAppearance } from './UnicornAppearance';
import { PlayerManeCoverageLayer } from './PlayerManeCoverage';
import type { UnicornProductionPose } from './UnicornProductionArt';

function productionPoseFor(sprite: Phaser.Physics.Arcade.Sprite): UnicornProductionPose {
  const pose = sprite.getData('production-art-pose');
  if (
    pose === 'walk-a' ||
    pose === 'walk-b' ||
    pose === 'gallop-a' ||
    pose === 'gallop-b' ||
    pose === 'celebrate'
  ) {
    return pose;
  }
  return 'idle';
}

export class PlayerManeCoverageWorldManager {
  private readonly layers = new Map<Phaser.Physics.Arcade.Sprite, PlayerManeCoverageLayer>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
  }

  private update(): void {
    const activePlayers = new Set<Phaser.Physics.Arcade.Sprite>();

    for (const scene of this.game.scene.getScenes(true)) {
      const object = scene.children.getByName(WORLD_PLAYER_NAME);
      if (!(object instanceof Phaser.Physics.Arcade.Sprite) || !object.active) {
        continue;
      }

      activePlayers.add(object);
      let layer = this.layers.get(object);
      if (!layer) {
        const save = getBrowserSaveService().load();
        if (!save) {
          continue;
        }
        layer = new PlayerManeCoverageLayer(
          scene,
          parseUnicornAppearance(save.profile.appearance),
          object,
        );
        this.layers.set(object, layer);
      }
      layer.sync(object, productionPoseFor(object));
    }

    for (const [player, layer] of this.layers) {
      if (activePlayers.has(player) && player.active) {
        continue;
      }
      layer.destroy();
      this.layers.delete(player);
    }
  }

  private destroy(): void {
    this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
  }
}

let manager: PlayerManeCoverageWorldManager | null = null;

export function getPlayerManeCoverageWorldManager(game: Phaser.Game): PlayerManeCoverageWorldManager {
  manager ??= new PlayerManeCoverageWorldManager(game);
  return manager;
}
