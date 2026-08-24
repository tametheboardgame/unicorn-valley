import Phaser from 'phaser';

export const WORLD_INTERACTION_PROMPT = 'E / Enter / tap';

export class WorldInteractionInput {
  private readonly keys: readonly Phaser.Input.Keyboard.Key[];

  public constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.keys = keyboard
      ? [
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        ]
      : [];
  }

  public justPressed(): boolean {
    return this.keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
  }

  public bindPointer(zone: Phaser.GameObjects.Zone, activate: () => void): void {
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', activate);
  }

  public destroy(): void {
    this.keys.forEach((key) => this.scene.input.keyboard?.removeKey(key));
  }
}
