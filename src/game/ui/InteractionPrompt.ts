import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import type { InteractionTarget } from '../interaction/InteractionTarget';

export class InteractionPrompt {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly bagButton: Phaser.GameObjects.Rectangle;
  private readonly bagLabel: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, pointerInput: PointerTouchInputAdapter) {
    this.panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 72, 470, 74, 0xfffbf0, 0.96)
      .setStrokeStyle(5, 0xc69ad9, 0.95)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.label = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 72, '', {
        color: '#503a61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

    this.bagButton = scene.add
      .rectangle(GAME_WIDTH - 92, 58, 142, 64, 0xfffbf0, 0.96)
      .setStrokeStyle(4, 0xc69ad9, 0.95)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    this.bagLabel = scene.add
      .text(GAME_WIDTH - 92, 58, 'Bag 🎒', {
        color: '#503a61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

    this.panel.on('pointerdown', () => pointerInput.setButton('INTERACT', true));
    this.panel.on('pointerup', () => pointerInput.setButton('INTERACT', false));
    this.panel.on('pointerout', () => pointerInput.setButton('INTERACT', false));

    this.bagButton.on('pointerdown', () => {
      const returnScene = scene.scene.key;
      if (!scene.scene.isActive('InventoryScene')) {
        scene.scene.launch('InventoryScene', { returnScene });
        scene.scene.pause();
      }
    });

    this.setTarget(null);
  }

  public setTarget(target: InteractionTarget | null): void {
    const visible = target !== null;
    this.panel.setVisible(visible);
    this.label.setVisible(visible);

    if (target) {
      this.label.setText(`${target.actionLabel}: ${target.label}   ✨`);
    }
  }

  public destroy(): void {
    this.panel.destroy();
    this.label.destroy();
    this.bagButton.destroy();
    this.bagLabel.destroy();
  }
}
