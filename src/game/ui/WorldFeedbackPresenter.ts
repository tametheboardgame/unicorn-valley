import Phaser from 'phaser';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { isInteractionModalActive } from '../interaction/InteractionModalState';
import { UI_FONT } from './uiTheme';

export interface WorldFeedbackAnchor {
  x: number;
  y: number;
}

interface PendingReaction {
  message: string;
  anchor: WorldFeedbackAnchor;
  durationMs: number;
}

type FeedbackObject = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text;

const GUIDANCE_NAME = 'world-feedback-guidance';
const REACTION_NAME = 'world-feedback-reaction';
const GUIDANCE_Y = GAME_HEIGHT - 150;
const GUIDANCE_WIDTH = 660;
const GUIDANCE_MAX_TEXT_WIDTH = GUIDANCE_WIDTH - 58;
const GUIDANCE_DURATION_MS = 5200;
const REACTION_DURATION_MS = 2800;
const REACTION_MAX_TEXT_WIDTH = 360;
const TOP_SAFE_MARGIN = 126;
const SIDE_SAFE_MARGIN = 24;
const BOTTOM_SAFE_MARGIN = 92;

/**
 * Owns ordinary non-dialogue world feedback introduced by WP19E1.
 *
 * Guidance is a small non-modal lower-screen card. Environmental reactions stay attached to
 * their world source and are clamped inside the camera's safe viewport. Dialogue, reward and
 * Wonderbook discovery presenters remain separate semantic owners.
 */
export class WorldFeedbackPresenter {
  private guidanceObjects: FeedbackObject[] = [];
  private reactionObjects: FeedbackObject[] = [];
  private guidanceTimer: Phaser.Time.TimerEvent | null = null;
  private reactionTimer: Phaser.Time.TimerEvent | null = null;
  private pendingTimer: Phaser.Time.TimerEvent | null = null;
  private pendingGuidance: { message: string; durationMs: number } | null = null;
  private pendingReaction: PendingReaction | null = null;
  private reactionAnchor: WorldFeedbackAnchor | null = null;
  private reactionPanel: Phaser.GameObjects.Graphics | null = null;
  private reactionText: Phaser.GameObjects.Text | null = null;

  public constructor(private readonly scene: Phaser.Scene) {
    this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.refreshReactionPosition, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  public showGuidance(message: string, durationMs = GUIDANCE_DURATION_MS): void {
    if (isInteractionModalActive(this.scene)) {
      this.pendingGuidance = { message, durationMs };
      this.schedulePending();
      return;
    }

    this.pendingGuidance = null;
    this.clearGuidance();

    const text = this.scene.add
      .text(GAME_WIDTH / 2 - 70, GUIDANCE_Y, message, {
        color: '#244f5c',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: GUIDANCE_MAX_TEXT_WIDTH },
      })
      .setName(`${GUIDANCE_NAME}-text`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_162);

    const height = Math.max(72, text.height + 30);
    const shadow = this.scene.add
      .graphics()
      .setName(`${GUIDANCE_NAME}-shadow`)
      .setScrollFactor(0)
      .setDepth(20_160);
    shadow.fillStyle(0x263948, 0.2);
    shadow.fillRoundedRect(
      GAME_WIDTH / 2 - 70 - GUIDANCE_WIDTH / 2 + 6,
      GUIDANCE_Y - height / 2 + 7,
      GUIDANCE_WIDTH,
      height,
      22,
    );

    const panel = this.scene.add
      .graphics()
      .setName(GUIDANCE_NAME)
      .setScrollFactor(0)
      .setDepth(20_161);
    panel.fillStyle(0xe9fff8, 0.98);
    panel.lineStyle(4, 0x55aebb, 1);
    panel.fillRoundedRect(
      GAME_WIDTH / 2 - 70 - GUIDANCE_WIDTH / 2,
      GUIDANCE_Y - height / 2,
      GUIDANCE_WIDTH,
      height,
      22,
    );
    panel.strokeRoundedRect(
      GAME_WIDTH / 2 - 70 - GUIDANCE_WIDTH / 2,
      GUIDANCE_Y - height / 2,
      GUIDANCE_WIDTH,
      height,
      22,
    );

    const marker = this.scene.add
      .text(GAME_WIDTH / 2 - 70 - GUIDANCE_WIDTH / 2 + 30, GUIDANCE_Y, '✦', {
        color: '#297f8e',
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setName(`${GUIDANCE_NAME}-marker`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20_162);

    this.guidanceObjects = [shadow, panel, marker, text];
    if (!isReducedMotionEnabled()) {
      for (const object of this.guidanceObjects) {
        object.setAlpha(0);
      }
      this.scene.tweens.add({
        targets: this.guidanceObjects,
        alpha: 1,
        duration: 150,
        ease: 'Sine.Out',
      });
    }

    this.guidanceTimer = this.scene.time.delayedCall(durationMs, () => {
      this.dismissGuidance();
    });
  }

  public showReaction(
    message: string,
    anchor: WorldFeedbackAnchor,
    durationMs = REACTION_DURATION_MS,
  ): void {
    if (isInteractionModalActive(this.scene)) {
      this.pendingReaction = { message, anchor, durationMs };
      this.schedulePending();
      return;
    }

    this.pendingReaction = null;
    this.clearReaction();
    this.reactionAnchor = { ...anchor };

    const text = this.scene.add
      .text(0, 0, message, {
        color: '#694632',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: REACTION_MAX_TEXT_WIDTH },
      })
      .setName(`${REACTION_NAME}-text`)
      .setOrigin(0.5)
      .setDepth(20_122);

    const width = Math.min(REACTION_MAX_TEXT_WIDTH + 38, Math.max(210, text.width + 34));
    const height = Math.max(54, text.height + 24);
    const panel = this.scene.add.graphics().setName(REACTION_NAME).setDepth(20_121);
    panel.fillStyle(0x4b3022, 0.18);
    panel.fillRoundedRect(-width / 2 + 5, -height / 2 + 6, width, height, 18);
    panel.fillStyle(0xffedcf, 0.98);
    panel.lineStyle(3, 0xd49a58, 1);
    panel.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    panel.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);

    this.reactionPanel = panel;
    this.reactionText = text;
    this.reactionObjects = [panel, text];
    this.refreshReactionPosition();

    if (!isReducedMotionEnabled()) {
      for (const object of this.reactionObjects) {
        object.setAlpha(0);
      }
      this.scene.tweens.add({
        targets: this.reactionObjects,
        alpha: 1,
        duration: 120,
        ease: 'Sine.Out',
      });
    }

    this.reactionTimer = this.scene.time.delayedCall(durationMs, () => {
      this.dismissReaction();
    });
  }

  public destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.refreshReactionPosition, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    this.pendingTimer?.destroy();
    this.pendingTimer = null;
    this.pendingGuidance = null;
    this.pendingReaction = null;
    this.clearGuidance();
    this.clearReaction();
    presenters.delete(this.scene);
  }

  private readonly refreshReactionPosition = (): void => {
    if (!this.reactionAnchor || !this.reactionPanel || !this.reactionText) {
      return;
    }

    const camera = this.scene.cameras.main;
    const view = camera.worldView;
    const width = this.reactionText.width + 42;
    const height = this.reactionText.height + 30;
    const x = Phaser.Math.Clamp(
      this.reactionAnchor.x,
      view.left + SIDE_SAFE_MARGIN + width / 2,
      view.right - SIDE_SAFE_MARGIN - width / 2,
    );
    const preferredY = this.reactionAnchor.y - Math.max(76, height / 2 + 42);
    const y = Phaser.Math.Clamp(
      preferredY,
      view.top + TOP_SAFE_MARGIN + height / 2,
      view.bottom - BOTTOM_SAFE_MARGIN - height / 2,
    );

    this.reactionPanel.setPosition(x, y);
    this.reactionText.setPosition(x, y);
  };

  private schedulePending(): void {
    if (this.pendingTimer) {
      return;
    }
    this.pendingTimer = this.scene.time.delayedCall(180, () => {
      this.pendingTimer = null;
      if (isInteractionModalActive(this.scene)) {
        this.schedulePending();
        return;
      }
      const guidance = this.pendingGuidance;
      const reaction = this.pendingReaction;
      this.pendingGuidance = null;
      this.pendingReaction = null;
      if (guidance) {
        this.showGuidance(guidance.message, guidance.durationMs);
      }
      if (reaction) {
        this.showReaction(reaction.message, reaction.anchor, reaction.durationMs);
      }
    });
  }

  private dismissGuidance(): void {
    this.guidanceTimer?.destroy();
    this.guidanceTimer = null;
    if (this.guidanceObjects.length === 0) {
      return;
    }
    if (isReducedMotionEnabled()) {
      this.clearGuidance();
      return;
    }
    const objects = [...this.guidanceObjects];
    this.guidanceObjects = [];
    this.scene.tweens.add({
      targets: objects,
      alpha: 0,
      duration: 180,
      ease: 'Sine.In',
      onComplete: () => objects.forEach((object) => object.destroy()),
    });
  }

  private dismissReaction(): void {
    this.reactionTimer?.destroy();
    this.reactionTimer = null;
    if (this.reactionObjects.length === 0) {
      return;
    }
    if (isReducedMotionEnabled()) {
      this.clearReaction();
      return;
    }
    const objects = [...this.reactionObjects];
    this.reactionObjects = [];
    this.reactionPanel = null;
    this.reactionText = null;
    this.reactionAnchor = null;
    this.scene.tweens.add({
      targets: objects,
      alpha: 0,
      y: '-=6',
      duration: 160,
      ease: 'Sine.In',
      onComplete: () => objects.forEach((object) => object.destroy()),
    });
  }

  private clearGuidance(): void {
    this.guidanceTimer?.destroy();
    this.guidanceTimer = null;
    for (const object of this.guidanceObjects) {
      object.destroy();
    }
    this.guidanceObjects = [];
  }

  private clearReaction(): void {
    this.reactionTimer?.destroy();
    this.reactionTimer = null;
    for (const object of this.reactionObjects) {
      object.destroy();
    }
    this.reactionObjects = [];
    this.reactionPanel = null;
    this.reactionText = null;
    this.reactionAnchor = null;
  }
}

const presenters = new WeakMap<Phaser.Scene, WorldFeedbackPresenter>();

export function getWorldFeedbackPresenter(scene: Phaser.Scene): WorldFeedbackPresenter {
  const existing = presenters.get(scene);
  if (existing) {
    return existing;
  }
  const presenter = new WorldFeedbackPresenter(scene);
  presenters.set(scene, presenter);
  return presenter;
}
