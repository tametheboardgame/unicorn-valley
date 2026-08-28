import Phaser from 'phaser';
import { isExplorationGallopHeld, explorationSpeedMultiplier } from '../input/ExplorationGallop';
import { isExplorationMovementBlocked } from '../input/ExplorationMovementBlocker';
import { consumeWorldArrivalFacing } from '../world/WorldArrivalState';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import {
  getUnicornProductionTextureKey,
  selectUnicornProductionPose,
  type UnicornProductionPose,
} from './UnicornProductionArt';
import type { PlayerFacing, PlayerMotionState, PlayerMovementCommand } from './PlayerMovement';

const MOVEMENT_DETAIL_NAME = 'world-movement-detail';
const PLAYER_ENTITIES = new WeakMap<Phaser.Physics.Arcade.Sprite, PlayerEntity>();

export class PlayerEntity {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private facing: PlayerFacing = 'down';
  private motionState: PlayerMotionState = 'idle';
  private lastStepEffectAt = -1000;
  private stepIndex = 0;
  private activeProductionPose: UnicornProductionPose = 'idle';

  public constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly textureKey: string,
  ) {
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    PLAYER_ENTITIES.set(this.sprite, this);
    this.sprite.setName(WORLD_PLAYER_NAME);
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData('production-art', true);
    this.sprite.setData('production-art-pose', 'idle');

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(68, 44, true);

    this.setFacing(consumeWorldArrivalFacing(scene.scene.key) ?? 'down');
  }

  public applyMovement(command: PlayerMovementCommand): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (isExplorationMovementBlocked(this.scene)) {
      this.motionState = 'idle';
      this.sprite.setVelocity(0, 0);
      return;
    }

    this.setFacing(command.facing);
    this.motionState = command.motionState;

    const response = command.motionState === 'moving' ? 0.34 : 0.56;
    const multiplier = explorationSpeedMultiplier(
      this.scene.scene.key,
      isExplorationGallopHeld(this.scene.scene.key),
    );
    const targetVelocityX = command.velocityX * multiplier;
    const targetVelocityY = command.velocityY * multiplier;
    let velocityX = Phaser.Math.Linear(body.velocity.x, targetVelocityX, response);
    let velocityY = Phaser.Math.Linear(body.velocity.y, targetVelocityY, response);

    if (targetVelocityX === 0 && Math.abs(velocityX) < 4) {
      velocityX = 0;
    }
    if (targetVelocityY === 0 && Math.abs(velocityY) < 4) {
      velocityY = 0;
    }

    this.sprite.setVelocity(velocityX, velocityY);
  }

  public updatePresentation(time: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const galloping = isExplorationGallopHeld(this.scene.scene.key);
    this.applyProductionPose(selectUnicornProductionPose(this.motionState, speed, time, galloping));

    if (this.motionState === 'moving' || speed > 24) {
      const gait = Math.sin(time * (galloping ? 0.032 : 0.024));
      const directionalLean = Phaser.Math.Clamp(body.velocity.x / 300, -1, 1) * 1.15;
      this.sprite.setAngle(gait * (galloping ? 1.25 : 0.8) + directionalLean);

      if (speed > 80 && time - this.lastStepEffectAt >= (galloping ? 130 : 185)) {
        this.createStepEffect();
        this.lastStepEffectAt = time;
      }
      return;
    }

    this.sprite.setAngle(Math.sin(time * 0.004) * 0.28);
  }

  public getFacing(): PlayerFacing {
    return this.facing;
  }

  public setFacing(facing: PlayerFacing): void {
    this.facing = facing;
    this.sprite.setData('player-facing', facing);

    if (facing === 'left') {
      this.sprite.setFlipX(true);
    } else if (facing === 'right') {
      this.sprite.setFlipX(false);
    }
  }

  public getMotionState(): PlayerMotionState {
    return this.motionState;
  }

  public destroy(): void {
    PLAYER_ENTITIES.delete(this.sprite);
    this.sprite.destroy();
  }

  private applyProductionPose(pose: UnicornProductionPose): void {
    if (pose === this.activeProductionPose) {
      return;
    }

    const nextTexture = getUnicornProductionTextureKey(this.textureKey, pose);
    if (!this.scene.textures.exists(nextTexture)) {
      return;
    }

    this.activeProductionPose = pose;
    this.sprite.setTexture(nextTexture);
    this.sprite.setData('production-art-pose', pose);
  }

  private createStepEffect(): void {
    const alternate = this.stepIndex % 2 === 0 ? -1 : 1;
    this.stepIndex += 1;

    let x = this.sprite.x + alternate * 18;
    let y = this.sprite.y + 34;

    if (this.facing === 'left') {
      x += 28;
    } else if (this.facing === 'right') {
      x -= 28;
    } else if (this.facing === 'up') {
      y += 20;
    } else {
      y -= 4;
    }

    const puff = this.scene.add
      .ellipse(x, y, 28, 12, 0xe7d2a4, 0.34)
      .setDepth(this.sprite.depth - 0.35)
      .setName(MOVEMENT_DETAIL_NAME);
    const sparkle = this.scene.add
      .circle(x + alternate * 8, y - 8, 5, 0xffeda0, 0.7)
      .setDepth(this.sprite.depth - 0.3)
      .setName(MOVEMENT_DETAIL_NAME);

    this.scene.tweens.add({
      targets: puff,
      alpha: 0,
      scaleX: 1.7,
      scaleY: 1.35,
      duration: 320,
      ease: 'Sine.Out',
      onComplete: () => puff.destroy(),
    });
    this.scene.tweens.add({
      targets: sparkle,
      alpha: 0,
      y: y - 15,
      scale: 0.35,
      duration: 300,
      ease: 'Sine.Out',
      onComplete: () => sparkle.destroy(),
    });
  }
}

export function getPlayerEntityFacing(sprite: Phaser.Physics.Arcade.Sprite): PlayerFacing | null {
  return PLAYER_ENTITIES.get(sprite)?.getFacing() ?? null;
}

export function setPlayerEntityFacing(
  sprite: Phaser.Physics.Arcade.Sprite,
  facing: PlayerFacing,
): boolean {
  const entity = PLAYER_ENTITIES.get(sprite);
  if (!entity) {
    return false;
  }
  entity.setFacing(facing);
  return true;
}
