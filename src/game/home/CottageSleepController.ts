import Phaser from 'phaser';
import { isReducedMotionEnabled } from '../accessibility/AccessibilitySettings';
import type { AtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import type { PlayerEntity } from '../player/PlayerEntity';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import { worldDepthForY } from '../world/WorldDepth';

export const COTTAGE_SLEEP_AUDIO_EVENTS = {
  settle: 'cottage-sleep:audio:settle',
  asleep: 'cottage-sleep:audio:asleep',
  wake: 'cottage-sleep:audio:wake',
} as const;

const OVERLAY_DEPTH = 20_000;
const SLEEP_PLAYER_DEPTH = worldDepthForY(748, 0.08);

export class CottageSleepController {
  private active = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private message: Phaser.GameObjects.Text | null = null;
  private holdTimer: Phaser.Time.TimerEvent | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: PlayerEntity,
    private readonly timeService: AtmosphericTimeService,
    private readonly onWake?: () => void,
  ) {}

  public isActive(): boolean {
    return this.active;
  }

  public start(): boolean {
    if (this.active) {
      return false;
    }

    this.active = true;
    this.player.sprite.setVelocity(0, 0);
    this.scene.game.events.emit(COTTAGE_SLEEP_AUDIO_EVENTS.settle);

    const reducedMotion = isReducedMotionEnabled();
    const entryDuration = reducedMotion ? 0 : 320;
    const fadeDuration = reducedMotion ? 90 : 520;
    const messageDuration = reducedMotion ? 480 : 1050;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
    }

    const sleepPosition = COTTAGE_INTERIOR_MAP.sleepLayout.trigger;
    const finishEntry = (): void => {
      this.player.sprite
        .setPosition(sleepPosition.x, sleepPosition.y)
        .setDisplaySize(100, 82)
        .setFlipX(false)
        .setAngle(-90)
        .setDepth(SLEEP_PLAYER_DEPTH);
      this.fadeToSleep(fadeDuration, messageDuration);
    };

    if (entryDuration === 0) {
      finishEntry();
      return true;
    }

    this.scene.tweens.add({
      targets: this.player.sprite,
      x: sleepPosition.x,
      y: sleepPosition.y,
      angle: -90,
      duration: entryDuration,
      ease: 'Sine.InOut',
      onComplete: finishEntry,
    });
    return true;
  }

  public destroy(): void {
    this.holdTimer?.destroy();
    this.holdTimer = null;
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.killTweensOf(this.message);
    this.overlay?.destroy();
    this.message?.destroy();
    this.overlay = null;
    this.message = null;
    this.active = false;
  }

  private fadeToSleep(fadeDuration: number, messageDuration: number): void {
    const camera = this.scene.cameras.main;
    this.overlay = this.scene.add
      .rectangle(camera.width / 2, camera.height / 2, camera.width + 8, camera.height + 8, 0x120f1c, 1)
      .setName('cottage-sleep-overlay')
      .setScrollFactor(0)
      .setDepth(OVERLAY_DEPTH)
      .setAlpha(0);
    this.message = this.scene.add
      .text(camera.width / 2, camera.height / 2, "A lovely night's sleep", {
        color: '#fff4d8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('cottage-sleep-message')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(OVERLAY_DEPTH + 1)
      .setAlpha(0);

    const afterFadeOut = (): void => {
      this.timeService.resetToMorning();
      this.scene.game.events.emit(COTTAGE_SLEEP_AUDIO_EVENTS.asleep);
      this.message?.setAlpha(1);
      this.holdTimer = this.scene.time.delayedCall(messageDuration, () => {
        this.holdTimer = null;
        this.wake(fadeDuration);
      });
    };

    if (fadeDuration === 0) {
      this.overlay.setAlpha(1);
      afterFadeOut();
      return;
    }

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: fadeDuration,
      ease: 'Sine.InOut',
      onComplete: afterFadeOut,
    });
  }

  private wake(fadeDuration: number): void {
    const wakePosition = COTTAGE_INTERIOR_MAP.sleepLayout.wake;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;

    this.message?.setAlpha(0);
    this.player.setFacing('down');
    this.player.sprite
      .setPosition(wakePosition.x, wakePosition.y)
      .setDisplaySize(112, 92)
      .setAngle(0)
      .setDepth(worldDepthForY(wakePosition.y + 22, 0.12));

    if (body) {
      body.enable = true;
      body.reset(wakePosition.x, wakePosition.y);
    }

    const finishWake = (): void => {
      this.overlay?.destroy();
      this.message?.destroy();
      this.overlay = null;
      this.message = null;
      this.active = false;
      this.scene.game.events.emit(COTTAGE_SLEEP_AUDIO_EVENTS.wake);
      this.onWake?.();
    };

    if (!this.overlay || fadeDuration === 0) {
      finishWake();
      return;
    }

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: fadeDuration,
      ease: 'Sine.InOut',
      onComplete: finishWake,
    });
  }
}
