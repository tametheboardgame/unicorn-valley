import Phaser from 'phaser';
import {
  getFireflyLanternProgress,
  recordFireflyLanternAttempt,
  type FireflyLanternAttemptResult,
  type FireflyLanternMilestone,
} from '../activities/FireflyLanternActivity';
import {
  FIREFLY_MULTICOLOUR_MISTAKE_LIMIT,
  FIREFLY_NORMAL_TARGET,
  FIREFLY_NORMAL_TUNING,
  getEndlessTuning,
  getMulticolourFireflyColour,
  isMulticolourAttemptFinished,
  modeLabel,
  normalCompletionCopy,
  type FireflyColour,
  type FireflyLanternMode,
  type FireflyLanternTuning,
  type FireflyNormalDifficulty,
} from '../activities/FireflyLanternRules';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';

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

const MULTICOLOUR_TUNING: FireflyLanternTuning = {
  lifetimeMs: 2250,
  hitSize: 112,
  bobDurationMs: 700,
  spawnDelayMs: 330,
};

const FIREFLY_COLOURS: Readonly<Record<FireflyColour, { outer: number; core: number }>> = {
  yellow: { outer: 0xe9df73, core: 0xfffbd0 },
  pink: { outer: 0xe892bc, core: 0xffd9eb },
  blue: { outer: 0x78bde8, core: 0xdaf3ff },
  green: { outer: 0x7fd392, core: 0xe1ffe5 },
  purple: { outer: 0xa98ce5, core: 0xeee1ff },
};

const MILESTONE_LABELS: Readonly<Record<FireflyLanternMilestone, string>> = {
  'normal-first': '🏮 Lantern Keeper added to your Wonderbook!',
  'multicolour-first': '🌈 Prism Keeper added to your Wonderbook!',
  'endless-glow': '✨ Endless Glow added to your Wonderbook!',
  'endless-mastery': '🌙 Midnight Lantern Master added to your Wonderbook!',
};

interface FireflyLanternSceneData {
  mode?: FireflyLanternMode;
  difficulty?: FireflyNormalDifficulty;
  startImmediately?: boolean;
}

type FireflySelector = 'mode' | 'difficulty';

export class FireflyLanternScene extends Phaser.Scene {
  private mode: FireflyLanternMode = 'normal';
  private difficulty: FireflyNormalDifficulty = 'classic';
  private opportunityIndex = 0;
  private score = 0;
  private mistakes = 0;
  private currentTarget: Phaser.GameObjects.Container | null = null;
  private currentColour: FireflyColour = 'yellow';
  private roundTimer: Phaser.Time.TimerEvent | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private instructionText: Phaser.GameObjects.Text | null = null;
  private selectorContainer: Phaser.GameObjects.Container | null = null;
  private activeSelector: FireflySelector | null = null;
  private finished = false;
  private attemptStarted = false;
  private modesUnlocked = false;
  private endlessBestAtStart = 0;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;
  private retryKey: Phaser.Input.Keyboard.Key | null = null;
  private modeKey: Phaser.Input.Keyboard.Key | null = null;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];
  private catchKeys: Phaser.Input.Keyboard.Key[] = [];

  public constructor() {
    super('FireflyLanternScene');
  }

  public create(data: FireflyLanternSceneData = {}): void {
    this.mode = data.mode ?? 'normal';
    this.difficulty = data.difficulty ?? 'classic';
    this.opportunityIndex = 0;
    this.score = 0;
    this.mistakes = 0;
    this.finished = false;
    this.attemptStarted = false;
    this.currentTarget = null;
    this.roundTimer = null;
    this.selectorContainer = null;
    this.activeSelector = null;
    this.cameras.main.setBackgroundColor('#203b3d');

    const progress = getFireflyLanternProgress(getBrowserSaveService());
    this.modesUnlocked = progress.modesUnlocked;
    this.endlessBestAtStart = progress.endlessBest;

    this.createBackground();
    this.createHud();
    this.createKeyboardInput();

    if (data.startImmediately && data.mode) {
      this.time.delayedCall(300, () => this.startAttempt(data.mode, data.difficulty ?? 'classic'));
    } else if (this.modesUnlocked) {
      this.showModeSelector();
    } else {
      this.instructionText?.setText(
        'Guide all eight golden fireflies to the lantern. Tap one, or press Space / Enter.',
      );
      this.time.delayedCall(500, () => this.startAttempt('normal', 'classic'));
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.roundTimer?.destroy();
      this.roundTimer = null;
      this.currentTarget = null;
      this.selectorContainer = null;
      this.activeSelector = null;
      this.catchKeys = [];
      this.numberKeys = [];
    });
  }

  public update(): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.returnToWoods();
      return;
    }

    if (this.activeSelector) {
      this.updateSelectorInput();
      return;
    }

    if (this.finished) {
      if (this.retryKey && Phaser.Input.Keyboard.JustDown(this.retryKey)) {
        this.retryAttempt();
      } else if (
        this.modesUnlocked &&
        this.modeKey &&
        Phaser.Input.Keyboard.JustDown(this.modeKey)
      ) {
        this.scene.restart();
      }
      return;
    }

    if (
      this.attemptStarted &&
      this.currentTarget &&
      this.catchKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))
    ) {
      this.completeCurrentFirefly(true);
    }
  }

  private createBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x284c46, 1);
    this.add.circle(180, 150, 230, 0x446957, 0.36);
    this.add.circle(1090, 160, 250, 0x345c59, 0.34);
    this.add.ellipse(GAME_WIDTH / 2, 690, 1100, 280, 0x172f36, 0.78);

    for (const [index, position] of TARGET_POSITIONS.slice(0, 5).entries()) {
      const mote = this.add.circle(position.x, position.y + 70, 4, 0xfff2a1, 0.22);
      this.tweens.add({
        targets: mote,
        y: position.y + 35,
        alpha: { from: 0.12, to: 0.42 },
        duration: 1100 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createHud(): void {
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
    this.instructionText = this.add
      .text(GAME_WIDTH / 2, 92, '', {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5, 0);
    this.scoreText = this.add
      .text(38, 35, '', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#efffeef2',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0, 0)
      .setVisible(false);
    this.statusText = this.add
      .text(GAME_WIDTH / 2, 650, '', {
        color: '#eff9db',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    ui.add([title, this.instructionText, this.scoreText, this.statusText]);
  }

  private createKeyboardInput(): void {
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null;
    this.retryKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R) ?? null;
    this.modeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M) ?? null;
    this.numberKeys = [
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ].filter((key): key is Phaser.Input.Keyboard.Key => Boolean(key));
    this.catchKeys = [
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    ].filter((key): key is Phaser.Input.Keyboard.Key => Boolean(key));
  }

  private updateSelectorInput(): void {
    const selection = this.numberKeys.findIndex((key) => Phaser.Input.Keyboard.JustDown(key));
    if (selection < 0) {
      return;
    }

    if (this.activeSelector === 'mode') {
      if (selection === 0) {
        this.showDifficultySelector();
      } else if (selection === 1) {
        this.startAttempt('multicolour', 'classic');
      } else if (selection === 2) {
        this.startAttempt('endless', 'classic');
      }
      return;
    }

    const difficulties: readonly FireflyNormalDifficulty[] = ['gentle', 'classic', 'swift'];
    const difficulty = difficulties[selection];
    if (difficulty) {
      this.startAttempt('normal', difficulty);
    }
  }

  private showModeSelector(): void {
    this.destroySelector();
    this.activeSelector = 'mode';
    this.instructionText?.setText(
      'Choose a lantern game. You can always come back and try another.',
    );
    this.statusText?.setText('Press 1, 2 or 3 • Esc returns to the Woods');

    const panel = this.add
      .rectangle(GAME_WIDTH / 2, 370, 850, 390, 0xefffee, 0.97)
      .setStrokeStyle(6, 0x8fb28d, 1);
    const heading = this.add
      .text(GAME_WIDTH / 2, 215, 'Which lantern game?', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const normal = this.createSelectorButton(310, 355, '1  🏮 Normal\nGuide 8 golden lights', () =>
      this.showDifficultySelector(),
    );
    const multicolour = this.createSelectorButton(
      640,
      355,
      '2  🌈 Multicolour\nCatch yellow • skip colours',
      () => this.startAttempt('multicolour', 'classic'),
    );
    const endless = this.createSelectorButton(970, 355, '3  ✨ Endless\nKeep the glow going', () =>
      this.startAttempt('endless', 'classic'),
    );
    const best = this.add
      .text(GAME_WIDTH / 2, 500, `Endless best: ${this.endlessBestAtStart}`, {
        color: '#607164',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.selectorContainer = this.add
      .container(0, 0, [panel, heading, normal, multicolour, endless, best])
      .setName('firefly-mode-selector')
      .setDepth(115);
  }

  private showDifficultySelector(): void {
    this.destroySelector();
    this.activeSelector = 'difficulty';
    this.instructionText?.setText(
      'Normal is always eight golden lights. Choose how quickly they flutter.',
    );
    this.statusText?.setText('Press 1, 2 or 3 • Esc returns to the Woods');

    const panel = this.add
      .rectangle(GAME_WIDTH / 2, 370, 850, 390, 0xefffee, 0.97)
      .setStrokeStyle(6, 0x8fb28d, 1);
    const heading = this.add
      .text(GAME_WIDTH / 2, 215, 'Normal difficulty', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const gentle = this.createSelectorButton(310, 355, '1  🌼 Gentle\nBig • slow lights', () =>
      this.startAttempt('normal', 'gentle'),
    );
    const classic = this.createSelectorButton(640, 355, '2  ✨ Classic\nThe familiar game', () =>
      this.startAttempt('normal', 'classic'),
    );
    const swift = this.createSelectorButton(970, 355, '3  ⚡ Swift\nSmall • quick lights', () =>
      this.startAttempt('normal', 'swift'),
    );

    this.selectorContainer = this.add
      .container(0, 0, [panel, heading, gentle, classic, swift])
      .setName('firefly-difficulty-selector')
      .setDepth(115);
  }

  private createSelectorButton(
    x: number,
    y: number,
    label: string,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#d7efcfee',
        padding: { x: 16, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', action);
    return button;
  }

  private destroySelector(): void {
    this.selectorContainer?.destroy(true);
    this.selectorContainer = null;
    this.activeSelector = null;
  }

  private startAttempt(
    mode: FireflyLanternMode,
    difficulty: FireflyNormalDifficulty = 'classic',
  ): void {
    this.destroySelector();
    this.mode = mode;
    this.difficulty = difficulty;
    this.opportunityIndex = 0;
    this.score = 0;
    this.mistakes = 0;
    this.finished = false;
    this.attemptStarted = true;
    this.scoreText?.setVisible(true);

    if (mode === 'normal') {
      this.instructionText?.setText(
        `${modeLabel(mode)} • ${difficulty}: guide all eight golden lights before they flutter away.`,
      );
    } else if (mode === 'multicolour') {
      this.instructionText?.setText(
        'Multicolour: catch yellow fireflies. Let pink, blue, green and purple ones flutter past.',
      );
    } else {
      this.instructionText?.setText(
        'Endless: catch every golden firefly. The lights become quicker as your streak grows.',
      );
    }
    this.updateScoreText();
    this.statusText?.setText('Ready...');
    this.time.delayedCall(360, () => this.spawnFirefly());
  }

  private tuningForCurrentFirefly(): FireflyLanternTuning {
    if (this.mode === 'normal') {
      return FIREFLY_NORMAL_TUNING[this.difficulty];
    }
    if (this.mode === 'multicolour') {
      return MULTICOLOUR_TUNING;
    }
    return getEndlessTuning(this.score);
  }

  private spawnFirefly(): void {
    if (this.finished || !this.attemptStarted || this.currentTarget) {
      return;
    }
    if (this.mode === 'normal' && this.opportunityIndex >= FIREFLY_NORMAL_TARGET) {
      this.finishActivity();
      return;
    }
    if (this.mode === 'multicolour' && isMulticolourAttemptFinished(this.score, this.mistakes)) {
      this.finishActivity();
      return;
    }

    const tuning = this.tuningForCurrentFirefly();
    const position = TARGET_POSITIONS[this.opportunityIndex % TARGET_POSITIONS.length];
    this.currentColour =
      this.mode === 'multicolour' ? getMulticolourFireflyColour(this.opportunityIndex) : 'yellow';
    const colours = FIREFLY_COLOURS[this.currentColour];
    const glow = this.add.circle(0, 0, tuning.hitSize * 0.47, colours.core, 0.16);
    const outer = this.add.circle(0, 0, tuning.hitSize * 0.22, colours.outer, 0.78);
    const core = this.add.circle(0, 0, tuning.hitSize * 0.1, colours.core, 1);
    const wingWidth = Math.max(16, tuning.hitSize * 0.21);
    const wingHeight = Math.max(10, tuning.hitSize * 0.12);
    const wingLeft = this.add
      .ellipse(-tuning.hitSize * 0.16, -3, wingWidth, wingHeight, 0xdff5da, 0.72)
      .setAngle(-20);
    const wingRight = this.add
      .ellipse(tuning.hitSize * 0.16, -3, wingWidth, wingHeight, 0xdff5da, 0.72)
      .setAngle(20);
    const zone = this.add
      .zone(0, 0, tuning.hitSize, tuning.hitSize)
      .setInteractive({ useHandCursor: true });
    const target = this.add
      .container(position.x, position.y, [glow, wingLeft, wingRight, outer, core, zone])
      .setName('firefly-lantern-target')
      .setDepth(40);
    this.currentTarget = target;

    zone.on('pointerdown', () => this.completeCurrentFirefly(true));
    this.tweens.add({
      targets: target,
      y: position.y - 22,
      scale: { from: 0.92, to: 1.06 },
      duration: tuning.bobDurationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    if (this.mode === 'normal') {
      this.statusText?.setText(
        `Golden light ${this.opportunityIndex + 1} of ${FIREFLY_NORMAL_TARGET}`,
      );
    } else if (this.mode === 'multicolour') {
      this.statusText?.setText(
        this.currentColour === 'yellow'
          ? 'Yellow light! Catch it! ✨'
          : `${this.currentColour[0]?.toUpperCase()}${this.currentColour.slice(1)} decoy • let it flutter by`,
      );
    } else {
      this.statusText?.setText(`Glow streak ${this.score} • don’t miss this one!`);
    }

    this.roundTimer = this.time.delayedCall(tuning.lifetimeMs, () =>
      this.completeCurrentFirefly(false),
    );
  }

  private completeCurrentFirefly(caught: boolean): void {
    if (!this.currentTarget || this.finished) {
      return;
    }
    this.roundTimer?.destroy();
    this.roundTimer = null;

    const target = this.currentTarget;
    this.currentTarget = null;
    this.tweens.killTweensOf(target);
    target.destroy(true);

    if (this.mode === 'normal') {
      this.resolveNormalFirefly(caught);
    } else if (this.mode === 'multicolour') {
      this.resolveMulticolourFirefly(caught);
    } else {
      this.resolveEndlessFirefly(caught);
    }
  }

  private resolveNormalFirefly(caught: boolean): void {
    if (caught) {
      this.score += 1;
      this.cameras.main.flash(100, 255, 247, 190, false);
      this.statusText?.setText('Lovely! ✨');
    } else {
      this.statusText?.setText('That light found a safe way home.');
    }
    this.opportunityIndex += 1;
    this.updateScoreText();
    this.queueNextOrFinish();
  }

  private resolveMulticolourFirefly(caught: boolean): void {
    const wasTarget = this.currentColour === 'yellow';
    if (caught && wasTarget) {
      this.score += 1;
      this.cameras.main.flash(100, 255, 247, 190, false);
      this.statusText?.setText('Yes! Yellow goes to the lantern! ✨');
    } else if (caught) {
      this.mistakes += 1;
      this.cameras.main.flash(120, 239, 142, 184, false);
      this.statusText?.setText(
        `Oops, that was a decoy. ${FIREFLY_MULTICOLOUR_MISTAKE_LIMIT - this.mistakes} chances left.`,
      );
    } else if (wasTarget) {
      this.statusText?.setText('That yellow light got away. Another will come!');
    } else {
      this.statusText?.setText('Good choice • the decoy fluttered on.');
    }
    this.opportunityIndex += 1;
    this.updateScoreText();
    this.queueNextOrFinish();
  }

  private resolveEndlessFirefly(caught: boolean): void {
    if (!caught) {
      this.statusText?.setText('The streak is over • brilliant glowing!');
      this.finishActivity();
      return;
    }
    this.score += 1;
    this.opportunityIndex += 1;
    this.cameras.main.flash(90, 255, 247, 190, false);
    this.statusText?.setText(`Streak ${this.score}! ✨`);
    this.updateScoreText();
    this.queueNextOrFinish();
  }

  private queueNextOrFinish(): void {
    const finished =
      (this.mode === 'normal' && this.opportunityIndex >= FIREFLY_NORMAL_TARGET) ||
      (this.mode === 'multicolour' && isMulticolourAttemptFinished(this.score, this.mistakes));
    if (finished) {
      this.time.delayedCall(260, () => this.finishActivity());
      return;
    }
    const delay = this.tuningForCurrentFirefly().spawnDelayMs;
    this.time.delayedCall(delay, () => this.spawnFirefly());
  }

  private updateScoreText(): void {
    if (this.mode === 'normal') {
      this.scoreText?.setText(`Guided: ${this.score} / ${FIREFLY_NORMAL_TARGET}`);
    } else if (this.mode === 'multicolour') {
      this.scoreText?.setText(
        `Yellow: ${this.score} / ${FIREFLY_NORMAL_TARGET} • Mistakes: ${this.mistakes} / ${FIREFLY_MULTICOLOUR_MISTAKE_LIMIT}`,
      );
    } else {
      this.scoreText?.setText(`Glow streak: ${this.score} • Best: ${this.endlessBestAtStart}`);
    }
  }

  private finishActivity(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.attemptStarted = false;
    this.roundTimer?.destroy();
    this.roundTimer = null;
    this.currentTarget?.destroy(true);
    this.currentTarget = null;

    const completed =
      (this.mode === 'normal' && this.score >= FIREFLY_NORMAL_TARGET) ||
      (this.mode === 'multicolour' && this.score >= FIREFLY_NORMAL_TARGET);
    const result = recordFireflyLanternAttempt(getBrowserSaveService(), {
      mode: this.mode,
      score: this.score,
      completed,
    });
    this.modesUnlocked = result.modesUnlocked;
    this.endlessBestAtStart = result.endlessBest;
    this.showResultPanel(result, completed);
  }

  private showResultPanel(result: FireflyLanternAttemptResult, completed: boolean): void {
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 780, 430, 0xefffee, 0.98)
      .setStrokeStyle(6, 0x8fb28d, 1);
    const heading = this.add
      .text(GAME_WIDTH / 2, 225, this.resultHeading(completed), {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const resultText = this.add
      .text(GAME_WIDTH / 2, 285, this.resultCopy(result, completed), {
        color: '#4b6659',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 670 },
      })
      .setOrigin(0.5, 0);
    const rewardText = this.add
      .text(
        GAME_WIDTH / 2,
        438,
        result.newMilestones.length > 0
          ? result.newMilestones.map((milestone) => MILESTONE_LABELS[milestone]).join('\n')
          : 'Your best scores are remembered.',
        {
          color: '#6a7145',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5);

    const buttons: Phaser.GameObjects.Text[] = [
      this.createResultButton(395, 545, 'Try again', () => this.retryAttempt()),
      this.createResultButton(885, 545, 'Back to the Woods', () => this.returnToWoods()),
    ];
    if (this.modesUnlocked) {
      buttons.push(this.createResultButton(640, 545, 'Choose game', () => this.scene.restart()));
    }

    this.add
      .container(0, 0, [panel, heading, resultText, rewardText, ...buttons])
      .setName('firefly-result-panel')
      .setDepth(120);
    this.statusText?.setText(
      this.modesUnlocked ? 'R: retry   M: choose game   Esc: back' : 'R: retry   Esc: back',
    );
  }

  private resultHeading(completed: boolean): string {
    if (this.mode === 'normal') {
      return completed ? 'The lantern is glowing!' : 'A cosy lantern evening';
    }
    if (this.mode === 'multicolour') {
      return completed ? 'Rainbow brilliant!' : 'The decoys got cheeky!';
    }
    return 'Endless glow complete!';
  }

  private resultCopy(result: FireflyLanternAttemptResult, completed: boolean): string {
    if (this.mode === 'normal') {
      return `You guided ${this.score} of ${FIREFLY_NORMAL_TARGET} lights.\nBest: ${result.normalBest} of ${FIREFLY_NORMAL_TARGET}\n\n${normalCompletionCopy(this.score)}`;
    }
    if (this.mode === 'multicolour') {
      const ending = completed
        ? 'All eight yellow lights reached the lantern!'
        : 'Three decoys were caught. The yellow lights will wait for another try.';
      return `Yellow lights: ${this.score} of ${FIREFLY_NORMAL_TARGET}\nMistakes: ${this.mistakes} of ${FIREFLY_MULTICOLOUR_MISTAKE_LIMIT}\n\n${ending}`;
    }
    return `Glow streak: ${this.score}\nPersonal best: ${result.endlessBest}\n\nOne missed light ends Endless, but your best streak stays safe.`;
  }

  private createResultButton(
    x: number,
    y: number,
    label: string,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#d7efcfee',
        padding: { x: 17, y: 11 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', action);
    return button;
  }

  private retryAttempt(): void {
    this.scene.restart({
      mode: this.mode,
      difficulty: this.difficulty,
      startImmediately: true,
    } satisfies FireflyLanternSceneData);
  }

  private returnToWoods(): void {
    this.scene.start('WhisperingWoodsScene');
  }
}
