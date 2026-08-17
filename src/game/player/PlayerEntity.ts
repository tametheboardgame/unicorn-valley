import Phaser from 'phaser';
import type { PlayerFacing, PlayerMotionState, PlayerMovementCommand } from './PlayerMovement';

export class PlayerEntity {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private facing: PlayerFacing = 'down';
  private motionState: PlayerMotionState = 'idle';

  public constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(68, 44, true);
  }

  public applyMovement(command: PlayerMovementCommand): void {
    this.facing = command.facing;
    this.motionState = command.motionState;
    this.sprite.setVelocity(command.velocityX, command.velocityY);

    if (command.facing === 'left') {
      this.sprite.setFlipX(true);
    } else if (command.facing === 'right') {
      this.sprite.setFlipX(false);
    }
  }

  public updatePresentation(time: number): void {
    if (this.motionState === 'moving') {
      this.sprite.setAngle(Math.sin(time * 0.018) * 1.6);
      return;
    }

    this.sprite.setAngle(Math.sin(time * 0.004) * 0.35);
  }

  public getFacing(): PlayerFacing {
    return this.facing;
  }

  public getMotionState(): PlayerMotionState {
    return this.motionState;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
