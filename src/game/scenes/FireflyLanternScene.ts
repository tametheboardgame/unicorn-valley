import Phaser from 'phaser';
import {
  getFireflyLanternBestScore,
  recordFireflyLanternResult,
} from '../activities/FireflyLanternActivity';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';

const TOTAL_ROUNDS = 8;
const ROUND_DURATION_MS = 2200;
const TARGET_POSITIONS = [
  { x: 250, y: 220 },
  { x: 580, y: 180 },
  { x: 930, y: 250 },
  { x: 760, y: 430 },
  { x: 360, y: 470 },
  { x: 1030, y: 500 },
  { x: 610, y: 330 },
  { x: 190, y: 520 },
] as const;

export class FireflyLanternScene extends Phaser.Scene {
  private roundIndex = 0;
  private score = 0;
  private currentTarget: Phaser.GameObjects.Container | null = null;
  private roundTimer: Phaser.Time.TimerEvent | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private finished = false;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;
  private retryKey: Phaser.Input.Keyboard.Key | null = null;
  private catchKeys: Phaser.Input.Keyboard.Key[] = [];

  public constructor() {
    super('FireflyLanternScene');
  }

  public create(): void {
    this.roundIndex = 0;
    this.score = 0;
    this.finished = false;
    this.currentTarget = null;
    this.roundTimer = null;
    this.cameras.main.setBackgroundColor('#203b3d');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x284c46, 1);
    this.add.circle(180, 150, 230, 0x446957, 0.36);
    this.add.circle(1090, 160, 250, 0x345c59, 0.34);
    this.add.ellipse(GAME_WIDTH / 2, 690, 1100, 280, 0x172f36, 0.78);

    const ui = this.add.container(0, 0).setName('firefly-lantern-ui').setDepth(100);
    const title = this.add
      .text(GAME_WIDTH / 2, 32, 'Firefly Lantern', {
        color: '#eff9db',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        backgroundColor: '#1f3d38e8',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5, 0);
    const instruction = this.add
      .text(GAME_WIDTH / 2, 92, 'Tap each bright firefly before it wanders on. Missed lights are completely fine.', {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        align: 'center',
        wordWrap: { width: 850 },
      })
      .setOrigin(0.5, 0);
    this.scoreText = this.add
      .text(38, 35, 'Guided: 0 / 8', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#efffeef2',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0, 0);
    this.statusText = this.add
      .text(GAME_WIDTH / 2, 650, '', {
        color: '#eff9db',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    ui.add([title, instruction, this.scoreText, this.statusText]);

    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null;
    this.retryKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R) ?? null;
    this.catchKeys = [
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    ].filter((key): key is Phaser.Input.Keyboard.Key => Boolean(key));

    this.time.delayedCall(500, () => this.spawnRound());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.roundTimer?.destroy();
      this.roundTimer = null;
      this.currentTarget = null;
      this.catchKeys = [];
    });
  }

  public update(): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.returnToWoods();
      return;
    }
    if (this.finished && this.retryKey && Phaser.Input.Keyboard.JustDown(this.retryKey)) {
      this.scene.restart();
      return;
    }
    if (
      !this.finished &&
      this.currentTarget &&
      this.catchKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))
    ) {
      this.completeRound(true);
    }
  }

  private spawnRound(): void {
    if (this.finished || this.roundIndex >= TOTAL_ROUNDS) {
      this.finishActivity();
      return;
    }

    const position = TARGET_POSITIONS[this.roundIndex];
    const glow = this.add.circle(0, 0, 52, 0xfff1a0, 0.18);
    const outer = this.add.circle(0, 0, 25, 0xe9df73, 0.72);
    const core = this.add.circle(0, 0, 12, 0xfffbd0, 1);
    const wingLeft = this.add.ellipse(-18, -3, 24, 14, 0xdff5da, 0.72).setAngle(-20);
    const wingRight = this.add.ellipse(18, -3, 24, 14, 0xdff5da, 0.72).setAngle(20);
    const zone = this.add.zone(0, 0, 112, 112).setInteractive({ useHandCursor: true });
    const target = this.add
      .container(position.x, position.y, [glow, wingLeft, wingRight, outer, core, zone])
      .setName('firefly-lantern-target')
      .setDepth(40);
    this.currentTarget = target;

    zone.on('pointerdown', () => this.completeRound(true));
    this.tweens.add({
      targets: target,
      y: position.y - 22,
      scale: { from: 0.9, to: 1.08 },
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.statusText?.setText(`Light ${this.roundIndex + 1} of ${TOTAL_ROUNDS}`);
    this.roundTimer = this.time.delayedCall(ROUND_DURATION_MS, () => this.completeRound(false));
  }

  private completeRound(caught: boolean): void {
    if (!this.currentTarget || this.finished) {
      return;
    }
    this.roundTimer?.destroy();
    this.roundTimer = null;

    const target = this.currentTarget;
    this.currentTarget = null;
    if (caught) {
      this.score += 1;
      this.scoreText?.setText(`Guided: ${this.score} / ${TOTAL_ROUNDS}`);
      this.cameras.main.flash(100, 255, 247, 190, false);
      this.statusText?.setText('Lovely! ✨');
    } else {
      this.statusText?.setText('That one wandered home. No problem.');
    }
    target.destroy(true);
    this.roundIndex += 1;

    this.time.delayedCall(360, () => {
      if (this.roundIndex >= TOTAL_ROUNDS) {
        this.finishActivity();
      } else {
        this.spawnRound();
      }
    });
  }

  private finishActivity(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.roundTimer?.destroy();
    this.roundTimer = null;
    this.currentTarget?.destroy(true);
    this.currentTarget = null;

    const result = recordFireflyLanternResult(getBrowserSaveService(), this.score);
    const previousBest = getFireflyLanternBestScore(getBrowserSaveService());
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 720, 410, 0xefffee, 0.97)
      .setStrokeStyle(6, 0x8fb28d, 1)
      .setDepth(120);
    const heading = this.add
      .text(GAME_WIDTH / 2, 245, 'The lantern is glowing!', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(121);
    const resultText = this.add
      .text(
        GAME_WIDTH / 2,
        320,
        `You guided ${this.score} of ${TOTAL_ROUNDS} lights.\nBest: ${Math.max(result.bestScore, previousBest)} of ${TOTAL_ROUNDS}\n\nMissed lights just wander back on their own.`,
        {
          color: '#4b6659',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '21px',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(121);
    const firstCompletion = result.firstCompletion
      ? this.add
          .text(GAME_WIDTH / 2, 450, 'First lantern evening remembered ✨', {
            color: '#6a7145',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(121)
      : null;

    const retry = this.createButton(480, 535, 'Try again', () => this.scene.restart());
    const back = this.createButton(800, 535, 'Back to the Woods', () => this.returnToWoods());
    this.add.container(0, 0, [panel, heading, resultText, retry, back, ...(firstCompletion ? [firstCompletion] : [])]);
    this.statusText?.setText('R: retry   Esc: back');
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#d7efcfee',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(122)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', action);
    return button;
  }

  private returnToWoods(): void {
    this.scene.start('WhisperingWoodsScene');
  }
}
