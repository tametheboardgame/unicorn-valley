import Phaser from 'phaser';
import type { InteractionCondition } from '../interaction/InteractionTarget';
import { getInteractionTargetPosition } from '../interaction/InteractionTargeting';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const RESIDENT_NAME_PREFIX = 'supporting-resident:';
const MINIMUM_CENTRE_DISTANCE = 76;
const PAUSE_DISTANCE = 92;
const RESUME_DISTANCE = 108;
const PLAYER_EDGE_PADDING = 34;
const MOVEMENT_EPSILON = 1;

interface PausedResidentTweens {
  resident: Phaser.GameObjects.Container;
  tweens: Phaser.Tweens.Tween[];
}

interface PositionedObject {
  x: number;
  y: number;
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
      object.visible &&
      object.name.startsWith(RESIDENT_NAME_PREFIX),
  );
}

function conditionIsTrue(condition: InteractionCondition | undefined): boolean {
  if (condition === undefined) {
    return true;
  }
  return typeof condition === 'function' ? condition() : condition;
}

function findVisibleTalkPositions(scene: Phaser.Scene): PositionedObject[] {
  return getSceneInteractionRegistry(scene)
    .getTargets()
    .filter((target) => target.actionKind === 'talk' && conditionIsTrue(target.visible))
    .map((target) => getInteractionTargetPosition(target));
}

/**
 * Presentation-safe physical separation for visible world NPCs.
 *
 * Every live semantic Talk target contributes physical personal space, so core NPCs and supporting
 * residents cannot be walked through even when their visuals are owned by different scene systems.
 * Tween-driven supporting residents keep their authored routes in AmbientPopulationWorldManager;
 * this manager pauses those routes before they walk through the player, without introducing a
 * second NPC movement authority.
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
        this.syncResidentRoute(scene, player, resident);
      }
      for (const targetPosition of findVisibleTalkPositions(scene)) {
        this.separatePlayer(scene, player, targetPosition);
      }
    }
  };

  private syncResidentRoute(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    resident: Phaser.GameObjects.Container,
  ): void {
    const distance = Phaser.Math.Distance.Between(player.x, player.y, resident.x, resident.y);
    if (distance <= PAUSE_DISTANCE) {
      this.pauseResidentRoute(scene, resident);
    } else if (distance >= RESUME_DISTANCE) {
      this.resumeResidentRoute(resident);
    }
  }

  private separatePlayer(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    target: PositionedObject,
  ): void {
    const dx = player.x - target.x;
    const dy = player.y - target.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= MINIMUM_CENTRE_DISTANCE) {
      return;
    }

    const body = player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
      return;
    }

    const velocityX = body.velocity.x;
    const velocityY = body.velocity.y;
    const speed = Math.hypot(velocityX, velocityY);
    const movingTowardTarget =
      speed > MOVEMENT_EPSILON &&
      velocityX * (target.x - player.x) + velocityY * (target.y - player.y) > 0;

    let offsetX: number;
    let offsetY: number;

    if (movingTowardTarget) {
      // Sliding around the edge prevents an NPC standing on a path from becoming a hard wall. Keep
      // the player's progress along the held movement axis and add only the minimum perpendicular
      // displacement required to restore personal space.
      const forwardX = velocityX / speed;
      const forwardY = velocityY / speed;
      const perpendicularX = -forwardY;
      const perpendicularY = forwardX;
      const parallelDistance = dx * forwardX + dy * forwardY;
      const perpendicularDistance = dx * perpendicularX + dy * perpendicularY;
      const requiredPerpendicularDistance = Math.sqrt(
        Math.max(
          0,
          MINIMUM_CENTRE_DISTANCE ** 2 -
            Math.min(Math.abs(parallelDistance), MINIMUM_CENTRE_DISTANCE) ** 2,
        ),
      );

      let side = Math.sign(perpendicularDistance);
      if (side === 0) {
        const bounds = scene.physics.world.bounds;
        const positiveX = target.x + perpendicularX * requiredPerpendicularDistance;
        const positiveY = target.y + perpendicularY * requiredPerpendicularDistance;
        const negativeX = target.x - perpendicularX * requiredPerpendicularDistance;
        const negativeY = target.y - perpendicularY * requiredPerpendicularDistance;
        const positiveClearance = Math.min(
          positiveX - bounds.left,
          bounds.right - positiveX,
          positiveY - bounds.top,
          bounds.bottom - positiveY,
        );
        const negativeClearance = Math.min(
          negativeX - bounds.left,
          bounds.right - negativeX,
          negativeY - bounds.top,
          bounds.bottom - negativeY,
        );
        side = positiveClearance >= negativeClearance ? 1 : -1;
      }

      offsetX = parallelDistance * forwardX + side * requiredPerpendicularDistance * perpendicularX;
      offsetY = parallelDistance * forwardY + side * requiredPerpendicularDistance * perpendicularY;
    } else {
      const safeDistance = Math.max(distance, 0.001);
      offsetX = (distance > 0.001 ? dx / safeDistance : 1) * MINIMUM_CENTRE_DISTANCE;
      offsetY = (distance > 0.001 ? dy / safeDistance : 0) * MINIMUM_CENTRE_DISTANCE;
    }

    const bounds = scene.physics.world.bounds;
    const nextX = Phaser.Math.Clamp(
      target.x + offsetX,
      bounds.left + PLAYER_EDGE_PADDING,
      bounds.right - PLAYER_EDGE_PADDING,
    );
    const nextY = Phaser.Math.Clamp(
      target.y + offsetY,
      bounds.top + PLAYER_EDGE_PADDING,
      bounds.bottom - PLAYER_EDGE_PADDING,
    );

    // reset keeps Arcade physics and presentation aligned. Restore the active velocity afterwards so
    // a held movement input naturally carries the player around the NPC instead of pinning them to
    // the edge until the key or stick is released.
    body.reset(nextX, nextY);
    if (speed > MOVEMENT_EPSILON) {
      body.setVelocity(velocityX, velocityY);
    }
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
