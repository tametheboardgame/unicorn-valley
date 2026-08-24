import Phaser from 'phaser';
import { isExplorationGallopHeld, explorationSpeedMultiplier } from '../input/ExplorationGallop';
import { isExplorationMovementBlocked } from '../input/ExplorationMovementBlocker';
import { consumeWorldArrivalFacing } from '../world/WorldArrivalState';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import type { PlayerFacing, PlayerMotionState, PlayerMovementCommand } from './PlayerMovement';

const MOVEMENT_DETAIL_NAME = 'world-movement-detail';

export class PlayerEntity {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private facing: PlayerFacing = 'down';
  private motionState: PlayerMotionState = 'idle';
  private lastStepEffectAt = -1000;
  private stepIndex = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
  ) {
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setName(WORLD_PLAYER_NAME);
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(68, 44, true);

    this.setFacing(consumeWorldArrivalFacing(scene.scene.key) ?? 'down');
  }

  public applyMovement(command: PlayerMovementCommand): void {
    const movementBlocked = isExplorationMovementBlocked(this.scene);
    if (!movementBlocked) {
      this.setFacing(command.facing);
    }
    this.motionState = movementBlocked ? 'idle' : command.motionState;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const response = movementBlocked || command.motionState === 'idle' ? 0.56 : 0.34;
    const multiplier = explorationSpeedMultiplier(
      this.scene.scene.key,
      isExplorationGallopHeld(this.scene.scene.key),
    );
    const targetVelocityX = movementBlocked ? 0 : command.velocityX * multiplier;
    const targetVelocityY = movementBlocked ? 0 : command.velocityY * multiplier;
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

    if (this.motionState === 'moving' || speed > 24) {
      const gait = Math.sin(time * 0.024);
      const directionalLean = Phaser.Math.Clamp(body.velocity.x / 300, -1, 1) * 1.25;
      this.sprite.setAngle(gait * 1.75 + directionalLean);

      if (speed > 80 && time - this.lastStepEffectAt >= 185) {
        this.createStepEffect();
        this.lastStepEffectAt = time;
      }
      return;
    }

    this.sprite.setAngle(Math.sin(time * 0.004) * 0.35);
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
    this.sprite.destroy();
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
