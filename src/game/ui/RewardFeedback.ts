import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { gameEventBus } from '../events/GameEventBus';
import { isInteractionModalActive } from '../interaction/InteractionModalState';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

interface PendingFeedback {
  message: string;
  icon: string;
  accent: number;
}

export class RewardFeedback {
  private readonly unsubscriptions: (() => void)[] = [];
  private readonly activeObjects: Phaser.GameObjects.GameObject[] = [];
  private activeTimer: Phaser.Time.TimerEvent | null = null;
  private pendingTimer: Phaser.Time.TimerEvent | null = null;
  private pendingFeedback: PendingFeedback | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    this.unsubscriptions.push(
      gameEventBus.on('ITEM_COLLECTED', () => {
        getVerticalSliceAudio().playSfx('collect');
        this.show('Treasure added to your bag!', '🎁', UI_COLOURS.gold);
      }),
      gameEventBus.on('DISCOVERY_UNLOCKED', () => {
        getVerticalSliceAudio().playSfx('discovery');
        this.show('New discovery for your Wonderbook!', '✨', UI_COLOURS.blush);
      }),
      gameEventBus.on('QUEST_COMPLETED', () => {
        getVerticalSliceAudio().playSfx('quest-complete');
        this.show('You helped! The valley remembers.', '🌟', UI_COLOURS.mint);
      }),
      gameEventBus.on('SHIMMER_REWARDED', ({ amount, balance }) => {
        getVerticalSliceAudio().playSfx('collect');
        this.show(`+${amount} Shimmer earned! Balance: ${balance}`, '✨', UI_COLOURS.gold);
      }),
    );
  }

  public destroy(): void {
    this.activeTimer?.destroy();
    this.activeTimer = null;
    this.pendingTimer?.destroy();
    this.pendingTimer = null;
    this.pendingFeedback = null;
    for (const unsubscribe of this.unsubscriptions) {
      unsubscribe();
    }
    this.unsubscriptions.length = 0;
    this.clearActiveObjects();
  }

  private show(message: string, icon: string, accent: number): void {
    if (isInteractionModalActive(this.scene)) {
      // Conversation owns the lower safe area. Coalesce non-essential feedback until speech closes
      // instead of stacking it behind/over the conversation surface.
      this.pendingFeedback = { message, icon, accent };
      this.schedulePendingFeedback();
      return;
    }

    this.pendingFeedback = null;
    this.pendingTimer?.destroy();
    this.pendingTimer = null;
    this.showNow(message, icon, accent);
  }

  private schedulePendingFeedback(): void {
    if (this.pendingTimer) {
      return;
    }
    this.pendingTimer = this.scene.time.delayedCall(220, () => {
      this.pendingTimer = null;
      const pending = this.pendingFeedback;
      if (!pending) {
        return;
      }
      if (isInteractionModalActive(this.scene)) {
        this.schedulePendingFeedback();
        return;
      }
      this.pendingFeedback = null;
      this.showNow(pending.message, pending.icon, pending.accent);
    });
  }

  private showNow(message: string, icon: string, accent: number): void {
    this.activeTimer?.destroy();
    this.activeTimer = null;
    this.clearActiveObjects();

    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 164;
    const width = 430;
    const height = 62;
    const shadow = createUiShadow(this.scene, x, y, width, height, 150, 0.2);
    const panel = this.scene.add
      .rectangle(x, y, width, height, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(4, accent, 1)
      .setScrollFactor(0)
      .setDepth(151);
    const iconText = this.scene.add
      .text(x - 178, y, icon, {
        fontFamily: UI_FONT,
        fontSize: '25px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);
    const label = this.scene.add
      .text(x + 14, y, message, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 330 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);

    this.activeObjects.push(shadow, panel, iconText, label);

    const sparkleOffsets = [-140, 132];
    for (const [index, offset] of sparkleOffsets.entries()) {
      const sparkle = this.scene.add
        .text(x + offset, y + (index === 0 ? -37 : 37), index === 0 ? '✦' : '✧', {
          color: index === 0 ? '#fff2a6' : '#f0c9ff',
          fontFamily: UI_FONT,
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(153);
      this.activeObjects.push(sparkle);
      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 12,
        alpha: 0.15,
        scale: 1.25,
        duration: 620 + index * 90,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.InOut',
      });
    }

    panel.setScale(0.94);
    label.setAlpha(0);
    iconText.setAlpha(0);
    this.scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 150,
      ease: 'Back.Out',
    });
    this.scene.tweens.add({
      targets: [label, iconText],
      alpha: 1,
      duration: 160,
      ease: 'Sine.Out',
    });

    this.activeTimer = this.scene.time.delayedCall(2100, () => {
      const fading = [...this.activeObjects];
      this.scene.tweens.add({
        targets: fading,
        alpha: 0,
        y: '-=8',
        duration: 280,
        ease: 'Sine.In',
        onComplete: () => this.clearActiveObjects(),
      });
      this.activeTimer = null;
    });
  }

  private clearActiveObjects(): void {
    for (const object of this.activeObjects) {
      object.destroy();
    }
    this.activeObjects.length = 0;
  }
}
