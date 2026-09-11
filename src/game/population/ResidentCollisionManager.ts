import Phaser from 'phaser';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const RESIDENT_NAME_PREFIX = 'supporting-resident:';
const CORE_NPC_WORLD_NAME = /^core-npc:[^:]+:(?:world|picnic)$/;
const MINIMUM_CENTRE_DISTANCE = 76;
const PAUSE_DISTANCE = 92;
const RESUME_DISTANCE = 108;
const PLAYER_EDGE_PADDING = 34;

interface PausedResidentTweens {
  resident: Phaser.GameObjects.Container;
  tweens: Phaser.Tweens.Tween[];
}

interface CollisionActor {
  object: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;
  pausesRoute: boolean;
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

function findCollisionActors(scene: Phaser.Scene): CollisionActor[] {
  const actors: CollisionActor[] = [];
  for (const object of scene.children.list) {
    if (!object.active || !object.visible) {
      continue;
    }
    if (
      object instanceof Phaser.GameObjects.Container &&
      object.name.startsWith(RESIDENT_NAME_PREFIX)
    ) {
      actors.push({ object, pausesRoute: true });
      continue;
    }
    if (object instanceof Phaser.GameObjects.Sprite && CORE_NPC_WORLD_NAME.test(object.name)) {
      actors.push({ object, pausesRoute: false });
    }
  }
  return actors;
}

/**
 * Presentation-safe physical separation for visible world NPCs.
 *
 * Tween-driven supporting residents keep their authored routes in AmbientPopulationWorldManager;
 * this manager pauses that route before a resident walks through the player. Core NPC world sprites
 * are stationary presentation actors, so they only need separation. In both cases the Arcade player
 * is moved to the edge of the NPC's personal space without introducing a second NPC movement owner.
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

      for (const actor of findCollisionActors(scene)) {
        this.resolvePair(scene, player, actor);
      }
    }
  };

  private resolvePair(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    actor: CollisionActor,
  ): void {
    const resident = actor.object;
    const dx = player.x - resident.x;
    const dy = player.y - resident.y;
    const distance = Math.hypot(dx, dy);

    if (actor.pausesRoute && resident instanceof Phaser.GameObjects.Container) {
      if (distance <= PAUSE_DISTANCE) {
        this.pauseResidentRoute(scene, resident);
      } else if (distance >= RESUME_DISTANCE) {
        this.resumeResidentRoute(resident);
      }
    }

    if (distance >= MINIMUM_CENTRE_DISTANCE) {
      return;
    }

    const body = player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) {
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
    body.reset(nextX, nextY);
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
