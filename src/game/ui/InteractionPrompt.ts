import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { ActivitySuggestionCard } from './ActivitySuggestionCard';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import { RewardFeedback } from './RewardFeedback';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

function isAutomaticInteraction(target: InteractionTarget): boolean {
  return target.id.includes('-gate') || target.id === 'interaction:meadow-race-entrance';
}

export class InteractionPrompt {
  private readonly panelShadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly bagShadow: Phaser.GameObjects.Rectangle;
  private readonly bagButton: Phaser.GameObjects.Rectangle;
  private readonly bagLabel: Phaser.GameObjects.Text;
  private readonly suggestionCard: ActivitySuggestionCard;
  private readonly audioSettingsPanel: AudioSettingsPanel;
  private readonly rewardFeedback: RewardFeedback;

  public constructor(scene: Phaser.Scene, pointerInput: PointerTouchInputAdapter) {
    this.panelShadow = createUiShadow(scene, GAME_WIDTH / 2, GAME_HEIGHT - 72, 470, 74, 119, 0.2);
    this.panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 72, 470, 74, UI_COLOURS.cream, 0.98)
      .setStrokeStyle(5, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });

    this.label = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 72, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

    this.bagShadow = createUiShadow(scene, GAME_WIDTH - 92, 58, 142, 64, 119, 0.16);
    this.bagButton = scene.add
      .rectangle(GAME_WIDTH - 92, 58, 142, 64, UI_COLOURS.cream, 0.98)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    this.bagLabel = scene.add
      .text(GAME_WIDTH - 92, 58, 'Bag 🎒', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    applyButtonHover(this.bagButton, UI_COLOURS.cream, UI_COLOURS.gold);

    this.suggestionCard = new ActivitySuggestionCard(scene);
    this.audioSettingsPanel = new AudioSettingsPanel(scene);
    this.rewardFeedback = new RewardFeedback(scene);

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
    const visible = target !== null && !isAutomaticInteraction(target);
    this.panelShadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.label.setVisible(visible);
    this.suggestionCard.refresh();

    if (target && visible) {
      this.label.setText(`${target.actionLabel}: ${target.label}   ✨`);
    }
  }

  public destroy(): void {
    this.panelShadow.destroy();
    this.panel.destroy();
    this.label.destroy();
    this.bagShadow.destroy();
    this.bagButton.destroy();
    this.bagLabel.destroy();
    this.suggestionCard.destroy();
    this.audioSettingsPanel.destroy();
    this.rewardFeedback.destroy();
  }
}
