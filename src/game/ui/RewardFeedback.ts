import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { gameEventBus } from '../events/GameEventBus';
import { isInteractionModalActive } from '../interaction/InteractionModalState';
import { claimTransientFeedback } from './TransientFeedbackCoordinator';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

interface PendingFeedback {
  message: string;
  icon: string;
  accent: number;
  kind: 'standard' | 'quest-complete';
}

export class RewardFeedback {
  private readonly unsubscriptions: (() => void)[] = [];
  private readonly activeObjects: Phaser.GameObjects.GameObject[] = [];
  private activeTimer: Phaser.Time.TimerEvent | null = null;
  private pendingTimer: Phaser.Time.TimerEvent | null = null;
  private pendingFeedback: PendingFeedback | null = null;
  private releaseActiveClaim: (() => void) | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    this.unsubscriptions.push(
      gameEventBus.on('ITEM_COLLECTED', ({ suppressRewardFeedback }) => {
        getVerticalSliceAudio().playSfx('collect');
        if (!suppressRewardFeedback) {
          this.show('Treasure added to your bag!', '🎁', UI_COLOURS.gold);
        }
      }),
      gameEventBus.on('DISCOVERY_UNLOCKED', ({ suppressRewardFeedback }) => {
        getVerticalSliceAudio().playSfx('discovery');
        if (!suppressRewardFeedback) {
          this.show('New discovery for your Wonderbook!', '✨', UI_COLOURS.blush);
        }
      }),
      gameEventBus.on('QUEST_COMPLETED', () => {
        getVerticalSliceAudio().playSfx('quest-complete');
        this.show('Quest Complete', '✦', UI_COLOURS.mint, 'quest-complete');
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

  private show(
    message: string,
    icon: string,
    accent: number,
    kind: PendingFeedback['kind'] = 'standard',
  ): void {
    const next = { message, icon, accent, kind } satisfies PendingFeedback;
    if (isInteractionModalActive(this.scene)) {
      this.queueFeedback(next);
      return;
    }

    this.pendingFeedback = null;
    this.pendingTimer?.destroy();
    this.pendingTimer = null;
    this.showNow(next);
  }

  private queueFeedback(feedback: PendingFeedback): void {
    // Preserve a queued quest-complete moment if a lower-priority reward happens afterwards.
    if (this.pendingFeedback?.kind === 'quest-complete' && feedback.kind === 'standard') {
      this.schedulePendingFeedback();
      return;
    }
    this.pendingFeedback = feedback;
    this.schedulePendingFeedback();
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
      this.showNow(pending);
    });
  }

  private showNow(feedback: PendingFeedback): void {
    this.activeTimer?.destroy();
    this.activeTimer = null;
    this.clearActiveObjects();

    const transientKind = feedback.kind === 'quest-complete' ? 'quest-complete' : 'reward';
    const releaseClaim = claimTransientFeedback(this.scene, transientKind, () => {
      this.activeTimer?.destroy();
      this.activeTimer = null;
      this.clearActiveObjects();
    });
    if (!releaseClaim) {
      this.queueFeedback(feedback);
      return;
    }
    this.releaseActiveClaim = releaseClaim;

    const questComplete = feedback.kind === 'quest-complete';
    const x = GAME_WIDTH / 2;
    const y = questComplete ? GAME_HEIGHT / 2 : GAME_HEIGHT - 164;
    const width = questComplete ? 500 : 430;
    const height = questComplete ? 92 : 62;
    const shadow = createUiShadow(this.scene, x, y, width, height, 150, 0.2).setName(
      'reward-feedback-shadow',
    );
    const panel = this.scene.add
      .rectangle(x, y, width, height, UI_COLOURS.cream, 0.99)
      .setName('reward-feedback-panel')
      .setStrokeStyle(questComplete ? 6 : 4, feedback.accent, 1)
      .setScrollFactor(0)
      .setDepth(151);
    const iconText = this.scene.add
      .text(x - (questComplete ? 194 : 178), y, feedback.icon, {
        fontFamily: UI_FONT,
        fontSize: questComplete ? '34px' : '25px',
      })
      .setName('reward-feedback-icon')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);
    const label = this.scene.add
      .text(x + (questComplete ? 18 : 14), y, feedback.message, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: questComplete ? '25px' : '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: questComplete ? 360 : 330 },
      })
      .setName('reward-feedback-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);

    this.activeObjects.push(shadow, panel, iconText, label);

    const sparkleOffsets = questComplete ? [-178, 172] : [-140, 132];
    for (const [index, offset] of sparkleOffsets.entries()) {
      const sparkle = this.scene.add
        .text(x + offset, y + (index === 0 ? -37 : 37), index === 0 ? '✦' : '✧', {
          color: index === 0 ? '#fff2a6' : '#f0c9ff',
          fontFamily: UI_FONT,
          fontSize: questComplete ? '24px' : '20px',
          fontStyle: 'bold',
        })
        .setName(`reward-feedback-sparkle-${index}`)
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

    this.activeTimer = this.scene.time.delayedCall(questComplete ? 1800 : 2100, () => {
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
    this.releaseActiveClaim?.();
    this.releaseActiveClaim = null;
  }
}
