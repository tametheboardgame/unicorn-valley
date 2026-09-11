import Phaser from 'phaser';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const RESIDENT_NAME_PREFIX = 'supporting-resident:';
const MINIMUM_CENTRE_DISTANCE = 76;
const PAUSE_DISTANCE = 92;
const RESUME_DISTANCE = 108;
const PLAYER_EDGE_PADDING = 34;

interface PausedResidentTweens {
  resident: Phaser.GameObjects.Container;
  tweens: Phaser.Tweens.Tween[];
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const named = scene.children.getByName(WORLD_PLAYER_NAME);
  if (named instanceof Phaser.Physics.Arcade.Sprite) {
    return named;
  }

  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn'),
    ) as Phaser.Physics.Arcade.Sprite | undefined) ?? null
  );
}

function findResidents(scene: Phaser.Scene): Phaser.GameObjects.Container[] {
  return scene.children.list.filter(
    (object): object is Phaser.GameObjects.Container =>
      object instanceof Phaser.GameObjects.Container &&
      object.active &&
      object.name.startsWith(RESIDENT_NAME_PREFIX),
  );
}

/**
 * Presentation-safe physical separation for the tween-driven supporting residents.
 *
 * The roaming residents are deliberately not converted into Arcade-driven actors here: their
 * authored routes remain owned by AmbientPopulationWorldManager. Instead, this manager pauses a
 * resident's route before it walks through the player and enforces a small body separation on the
 * Arcade player. That gives both unicorns physical presence without introducing a second movement
 * authority or changing resident routes.
 */
export class ResidentCollisionManager {
  private readonly pausedTweens = new WeakMap<Phaser.GameObjects.Container, PausedResidentTweens>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
  }

  private readonly update = (): void => {
    for (const scene of this.game.scene.getScenes(true)) {
      const player = findPlayer(scene);
      if (!player) {
        continue;
      }

      for (const resident of findResidents(scene)) {
        this.resolvePair(scene, player, resident);
      }
    }
  };

  private resolvePair(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    resident: Phaser.GameObjects.Container,
  ): void {
    const dx = player.x - resident.x;
    const dy = player.y - resident.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= PAUSE_DISTANCE) {
      this.pauseResidentRoute(scene, resident);
    } else if (distance >= RESUME_DISTANCE) {
      this.resumeResidentRoute(resident);
    }

    if (distance >= MINIMUM_CENTRE_DISTANCE) {
      return;
    }

    const safeDistance = Math.max(distance, 0.001);
    const normalX = distance > 0.001 ? dx / safeDistance : 1;
    const normalY = distance > 0.001 ? dy / safeDistance : 0;
    const bounds = scene.physics.world.bounds;
    const nextX = Phaser.Math.Clamp(
      resident.x + normalX * MINIMUM_CENTRE_DISTANCE,
      bounds.left + PLAYER_EDGE_PADDING,
      bounds.right - PLAYER_EDGE_PADDING,
    );
    const nextY = Phaser.Math.Clamp(
      resident.y + normalY * MINIMUM_CENTRE_DISTANCE,
      bounds.top + PLAYER_EDGE_PADDING,
      bounds.bottom - PLAYER_EDGE_PADDING,
    );

    // body.reset keeps the Arcade body and visual in the same place and clears movement into the
    // resident. The player's normal controls take over again immediately when they move away.
    player.body.reset(nextX, nextY);
  }

  private pauseResidentRoute(scene: Phaser.Scene, resident: Phaser.GameObjects.Container): void {
    if (this.pausedTweens.has(resident)) {
      return;
    }

    const tweens = scene.tweens
      .getTweensOf(resident)
      .filter((tween) => tween.isPlaying())
      .filter((tween) => {
        tween.pause();
        return true;
      });
    if (tweens.length > 0) {
      this.pausedTweens.set(resident, { resident, tweens });
    }
  }

  private resumeResidentRoute(resident: Phaser.GameObjects.Container): void {
    const paused = this.pausedTweens.get(resident);
    if (!paused) {
      return;
    }

    for (const tween of paused.tweens) {
      if (tween.isPaused() && resident.active) {
        tween.resume();
      }
    }
    this.pausedTweens.delete(resident);
  }

  private readonly destroy = (): void => {
    this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
  };
}

let manager: ResidentCollisionManager | null = null;

export function getResidentCollisionManager(game: Phaser.Game): ResidentCollisionManager {
  manager ??= new ResidentCollisionManager(game);
  return manager;
}
