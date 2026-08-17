import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_WIDTH } from '../config/gameConstants';
import { gameEventBus } from '../events/GameEventBus';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

export class RewardFeedback {
  private readonly unsubscriptions: (() => void)[] = [];
  private readonly activeObjects: Phaser.GameObjects.GameObject[] = [];
  private activeTimer: Phaser.Time.TimerEvent | null = null;

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
    );
  }

  public destroy(): void {
    this.activeTimer?.destroy();
    this.activeTimer = null;
    for (const unsubscribe of this.unsubscriptions) {
      unsubscribe();
    }
    this.unsubscriptions.length = 0;
    this.clearActiveObjects();
  }

  private show(message: string, icon: string, accent: number): void {
    this.activeTimer?.destroy();
    this.activeTimer = null;
    this.clearActiveObjects();

    const x = GAME_WIDTH / 2;
    const y = 106;
    const shadow = createUiShadow(this.scene, x, y, 520, 78, 150, 0.24);
    const panel = this.scene.add
      .rectangle(x, y, 520, 78, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(5, accent, 1)
      .setScrollFactor(0)
      .setDepth(151);
    const iconText = this.scene.add
      .text(x - 218, y, icon, {
        fontFamily: UI_FONT,
        fontSize: '31px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);
    const label = this.scene.add
      .text(x + 16, y, message, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(152);

    this.activeObjects.push(shadow, panel, iconText, label);

    const sparkleOffsets = [-170, -98, 95, 166];
    for (const [index, offset] of sparkleOffsets.entries()) {
      const sparkle = this.scene.add
        .text(x + offset, y + (index % 2 === 0 ? -48 : 48), index % 2 === 0 ? '✦' : '✧', {
          color: index % 2 === 0 ? '#fff2a6' : '#f0c9ff',
          fontFamily: UI_FONT,
          fontSize: '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(153);
      this.activeObjects.push(sparkle);
      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 18,
        alpha: 0.15,
        scale: 1.35,
        duration: 720 + index * 90,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.InOut',
      });
    }

    panel.setScale(0.92);
    label.setAlpha(0);
    iconText.setAlpha(0);
    this.scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 170,
      ease: 'Back.Out',
    });
    this.scene.tweens.add({
      targets: [label, iconText],
      alpha: 1,
      duration: 180,
      ease: 'Sine.Out',
    });

    this.activeTimer = this.scene.time.delayedCall(2100, () => {
      const fading = [...this.activeObjects];
      this.scene.tweens.add({
        targets: fading,
        alpha: 0,
        y: '-=10',
        duration: 320,
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
