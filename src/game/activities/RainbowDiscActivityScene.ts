import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DEFAULT_UNICORN_APPEARANCE, parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { createResidentAppearanceSprite } from '../population/SupportingResidentArt';
import { getBrowserSaveService } from '../save/browserSaveService';
import { returnFromMiniGame } from '../minigames/MiniGameLauncher';
import { readMiniGameSession, type MiniGameSession } from '../minigames/MiniGameSession';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import {
  RAINBOW_DISC_PASSING_DRILL_ROUNDS,
  RAINBOW_DISC_STREAK_THROWS,
  RAINBOW_DISC_TARGET_RANGE_THROWS,
  rainbowDiscStreakTarget,
  rainbowDiscStreakTiming,
  type RainbowDiscPracticeDrill,
} from './RainbowDiscPracticeRules';
import {
  RAINBOW_DISC_GOALS_TO_WIN,
  applyRainbowDiscAssistance,
  getRainbowDiscAssistanceProfile,
  isRainbowDiscMatchComplete,
  isRainbowDiscReleaseAccurate,
  rainbowDiscDefenceLane,
  rainbowDiscDefenceTelegraphAlpha,
  rainbowDiscMissOffset,
  rainbowDiscOpenLane,
  type RainbowDiscAssistanceLevel,
} from './RainbowDiscRules';
import {
  createRainbowDiscRing,
  drawRainbowTarget,
  resolveRainbowDiscHornCatchPoint,
  resolveRainbowDiscResidentBodyOrigin,
} from '../world/RainbowDiscArt';
import { RAINBOW_DISC_PLAYER_APPEARANCES } from '../world/RainbowDiscMeadowPresentation';

interface RainbowDiscActivitySceneData {
  returnScene?: string;
  mode?: 'match' | 'practice';
}

interface Point {
  x: number;
  y: number;
}

const PLAYER_TEXTURE_KEY = 'rainbow-disc-activity:player-unicorn';
const FIELD_LEFT = 80;
const FIELD_RIGHT = 1200;
const FIELD_TOP = 128;
const FIELD_BOTTOM = 590;
const RECEIVER_Y = [225, 360, 495] as const;
const THROW_X = [220, 440, 680] as const;
const TARGET_X = [535, 775, 1040] as const;
const PASS_COUNT = 3;
const PRACTICE_TARGET_BASE_Y = 470;
const PRACTICE_TARGETS = [
  {
    x: 700,
    y: 325,
    radius: 78,
    points: 1,
    tolerance: 0.27,
    sweepSpeed: 0.0035,
    label: 'Easy',
  },
  {
    x: 890,
    y: 325,
    radius: 58,
    points: 2,
    tolerance: 0.18,
    sweepSpeed: 0.0051,
    label: 'Medium',
  },
  {
    x: 1080,
    y: 325,
    radius: 42,
    points: 3,
    tolerance: 0.11,
    sweepSpeed: 0.0072,
    label: 'Hard',
  },
] as const;
const ACTIVITY_THROWER_SIZE = { width: 122, height: 86 } as const;
const ACTIVITY_RESIDENT_SCALE = 0.62;
const ACTIVITY_RESIDENT_BODY_ORIGIN = resolveRainbowDiscResidentBodyOrigin(false);
const ACTIVITY_FLIPPED_RESIDENT_BODY_ORIGIN = resolveRainbowDiscResidentBodyOrigin(true);
const TIMING_TRACK_LEFT = 462;
const TIMING_TRACK_WIDTH = 350;

export class RainbowDiscActivityScene extends Phaser.Scene {
  private miniGameSession: MiniGameSession | null = null;
  private returnScene = 'RainbowMeadowScene';
  private mode: 'match' | 'practice' = 'match';
  private possession = 0;
  private playerScore = 0;
  private oppositionScore = 0;
  private attackSequence = 0;
  private defenceSequence = 0;
  private practiceThrows = 0;
  private practiceScore = 0;
  private practiceStreak = 0;
  private practiceDrill: RainbowDiscPracticeDrill = 'menu';
  private bestTargetRangeScore = 0;
  private bestPassingStreak = 0;
  private bestRainbowStreak = 0;
  private phase: 'attack' | 'defence' = 'attack';
  private opponentAdvance = 0;
  private defenceAttackLane = 1;
  private selectedReceiver = 1;
  private dragging = false;
  private actionLocked = false;
  private completed = false;
  private timingPhase = 0;
  private timingValue = 0.5;
  private assistance: RainbowDiscAssistanceLevel = 'standard';
  private dragStartPoint: Point | null = null;

  private playLayer: Phaser.GameObjects.Container | null = null;
  private disc: Phaser.GameObjects.Graphics | null = null;
  private aimGraphics: Phaser.GameObjects.Graphics | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private timingMarker: Phaser.GameObjects.Rectangle | null = null;
  private timingSuccessZone: Phaser.GameObjects.Rectangle | null = null;
  private timingDifficultyText: Phaser.GameObjects.Text | null = null;
  private receiverRings: Phaser.GameObjects.Arc[] = [];
  private receiverSprites: Phaser.GameObjects.Sprite[] = [];

  public constructor() {
    super('RainbowDiscActivityScene');
  }

  public create(data: RainbowDiscActivitySceneData = {}): void {
    this.miniGameSession = readMiniGameSession(data);
    this.returnScene =
      this.miniGameSession?.returnTarget.sceneKey ?? data.returnScene ?? 'RainbowMeadowScene';
    this.mode =
      this.miniGameSession?.variantId === 'practice'
        ? 'practice'
        : this.miniGameSession?.variantId === 'match'
          ? 'match'
          : (data.mode ?? 'match');
    this.possession = 0;
    this.playerScore = 0;
    this.oppositionScore = 0;
    this.attackSequence = 0;
    this.defenceSequence = 0;
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.practiceStreak = 0;
    this.practiceDrill = this.mode === 'practice' ? 'menu' : 'target-range';
    this.bestTargetRangeScore = 0;
    this.bestPassingStreak = 0;
    this.bestRainbowStreak = 0;
    this.phase = 'attack';
    this.opponentAdvance = 0;
    this.defenceAttackLane = 1;
    this.selectedReceiver = 1;
    this.dragging = false;
    this.actionLocked = false;
    this.completed = false;
    this.timingPhase = 0;
    this.timingValue = 0.5;
    this.assistance = 'standard';
    this.dragStartPoint = null;

    this.cameras.main.setBackgroundColor('#6ead72');
    this.createBackdrop();
    this.createPlayerTexture();
    this.renderPossession();

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.keyboard?.on('keydown-UP', this.selectPreviousMatchLane, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNextMatchLane, this);
    this.input.keyboard?.on('keydown-W', this.selectPreviousMatchLane, this);
    this.input.keyboard?.on('keydown-S', this.selectNextMatchLane, this);
    this.input.keyboard?.on('keydown-LEFT', this.selectPreviousPracticeTarget, this);
    this.input.keyboard?.on('keydown-RIGHT', this.selectNextPracticeTarget, this);
    this.input.keyboard?.on('keydown-A', this.selectPreviousPracticeTarget, this);
    this.input.keyboard?.on('keydown-D', this.selectNextPracticeTarget, this);
    this.input.keyboard?.on('keydown-SPACE', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown-ENTER', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown', this.handlePracticeMenuKeyboard, this);
    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.keyboard?.off('keydown-UP', this.selectPreviousMatchLane, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNextMatchLane, this);
      this.input.keyboard?.off('keydown-W', this.selectPreviousMatchLane, this);
      this.input.keyboard?.off('keydown-S', this.selectNextMatchLane, this);
      this.input.keyboard?.off('keydown-LEFT', this.selectPreviousPracticeTarget, this);
      this.input.keyboard?.off('keydown-RIGHT', this.selectNextPracticeTarget, this);
      this.input.keyboard?.off('keydown-A', this.selectPreviousPracticeTarget, this);
      this.input.keyboard?.off('keydown-D', this.selectNextPracticeTarget, this);
      this.input.keyboard?.off('keydown-SPACE', this.keyboardThrow, this);
      this.input.keyboard?.off('keydown-ENTER', this.keyboardThrow, this);
      this.input.keyboard?.off('keydown', this.handlePracticeMenuKeyboard, this);
      this.input.keyboard?.off('keydown-ESC', this.leaveActivity, this);
      this.playLayer?.destroy(true);
      this.playLayer = null;
      this.disc = null;
      this.aimGraphics = null;
      this.statusText = null;
      this.progressText = null;
      this.timingMarker = null;
      this.timingSuccessZone = null;
      this.timingDifficultyText = null;
      this.dragStartPoint = null;
      this.receiverRings = [];
      this.receiverSprites = [];
    });
  }

  public update(_time: number, delta: number): void {
    if (this.completed || this.actionLocked) {
      return;
    }

    const profile = this.currentTimingProfile();
    this.timingPhase += delta * profile.sweepSpeed;
    this.timingValue = (Math.sin(this.timingPhase) + 1) / 2;
    this.timingMarker?.setX(TIMING_TRACK_LEFT + this.timingValue * TIMING_TRACK_WIDTH);
    this.updateTimingSuccessZone();
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7fbe81, 1);

    const panel = this.add.graphics().setName('rainbow-disc-activity:panel');
    panel.fillStyle(0xfffbf1, 1);
    panel.lineStyle(6, 0xc89bd9, 1);
    panel.fillRoundedRect(48, 34, 1184, 652, 34);
    panel.strokeRoundedRect(48, 34, 1184, 652, 34);

    this.add
      .text(
        GAME_WIDTH / 2,
        66,
        this.mode === 'practice' ? 'Rainbow Disc Practice' : 'Rainbow Disc',
        {
          color: '#5f496d',
          fontFamily: UI_FONT,
          fontSize: '32px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        101,
        this.mode === 'practice'
          ? 'Choose a drill: target throwing, open-lane passing or a progressive Rainbow Streak.'
          : 'First to 2 goals. Build a three-catch chain, read the defenders and protect the disc.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 860 },
        },
      )
      .setOrigin(0.5);

    const field = this.add.graphics().setName('rainbow-disc-activity:field');
    field.fillStyle(0xa7dc8f, 1);
    field.lineStyle(4, 0xf5edc6, 0.92);
    field.fillRoundedRect(
      FIELD_LEFT,
      FIELD_TOP,
      FIELD_RIGHT - FIELD_LEFT,
      FIELD_BOTTOM - FIELD_TOP,
      30,
    );
    field.strokeRoundedRect(
      FIELD_LEFT,
      FIELD_TOP,
      FIELD_RIGHT - FIELD_LEFT,
      FIELD_BOTTOM - FIELD_TOP,
      30,
    );

    const markings = this.add.graphics().setName('rainbow-disc-activity:field-markings');
    markings.lineStyle(4, 0xf8f0c9, 0.48);
    markings.lineBetween(315, FIELD_TOP + 22, 315, FIELD_BOTTOM - 22);
    markings.lineBetween(975, FIELD_TOP + 22, 975, FIELD_BOTTOM - 22);
    markings.lineStyle(5, 0xf8e8ab, 0.7);
    markings.lineBetween(1090, FIELD_TOP + 22, 1090, FIELD_BOTTOM - 22);

    this.add
      .text(1140, 154, this.mode === 'practice' ? 'TARGET\nRANGE' : 'END\nZONE', {
        color: '#66724f',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const progressCard = this.add.graphics();
    progressCard.fillStyle(0xf4ead8, 1);
    progressCard.fillRoundedRect(94, 116, 340, 36, 16);
    this.progressText = this.add
      .text(264, 134, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:scoreline');

    const statusCard = this.add.graphics();
    statusCard.fillStyle(0xf4ead8, 1);
    statusCard.fillRoundedRect(330, 596, 620, 42, 18);
    this.statusText = this.add
      .text(640, 617, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5);

    this.createTimingMeter();
    this.createButton(1090, 617, 210, this.backLabel(), () => this.leaveActivity(), 'back');
  }

  private createTimingMeter(): void {
    this.add
      .text(332, 660, 'Throw timing', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);

    const track = this.add.graphics().setName('rainbow-disc-activity:timing-track');
    track.fillStyle(0xd8cfc0, 1);
    track.lineStyle(2, 0x9b8977, 0.65);
    track.fillRoundedRect(TIMING_TRACK_LEFT, 649, TIMING_TRACK_WIDTH, 22, 11);
    track.strokeRoundedRect(TIMING_TRACK_LEFT, 649, TIMING_TRACK_WIDTH, 22, 11);

    this.timingSuccessZone = this.add
      .rectangle(TIMING_TRACK_LEFT, 660, 120, 14, 0x9fd394, 0.95)
      .setName('rainbow-disc-activity:timing-success-zone');

    this.timingMarker = this.add
      .rectangle(TIMING_TRACK_LEFT, 660, 7, 30, 0x6f4d80, 1)
      .setName('rainbow-disc-activity:timing-marker');

    this.timingDifficultyText = this.add
      .text(832, 660, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setName('rainbow-disc-activity:timing-difficulty');

    this.updateTimingSuccessZone();
  }

  private createPlayerTexture(): void {
    const saveService = getBrowserSaveService();
    const loadedSave = saveService.load();
    const appearance = loadedSave
      ? parseUnicornAppearance(loadedSave.profile.appearance)
      : this.miniGameSession?.sideEffectPolicy === 'sandbox'
        ? DEFAULT_UNICORN_APPEARANCE
        : parseUnicornAppearance(saveService.createNewGame().profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);
  }

  private renderPossession(): void {
    this.playLayer?.destroy(true);
    this.playLayer = this.add.container(0, 0).setDepth(10);
    this.receiverRings = [];
    this.receiverSprites = [];
    this.dragging = false;
    this.dragStartPoint = null;
    this.actionLocked = false;
    this.selectedReceiver = Phaser.Math.Clamp(this.selectedReceiver, 0, RECEIVER_Y.length - 1);

    if (this.completed) {
      this.renderResult();
      return;
    }

    if (this.mode === 'practice') {
      if (this.practiceDrill === 'menu') {
        this.renderPracticeMenu();
      } else if (this.practiceDrill === 'passing-drill') {
        this.renderPassingDrillRound();
      } else if (this.practiceDrill === 'rainbow-streak') {
        this.renderRainbowStreakRound();
      } else {
        this.renderPracticeRound();
      }
      return;
    }

    if (this.phase === 'defence') {
      this.renderDefencePhase();
      return;
    }

    const throwOrigin = this.throwOrigin();
    const targetX =
      this.mode === 'practice' && this.practiceDrill === 'passing-drill'
        ? 900
        : (TARGET_X[this.possession] ?? TARGET_X[0]);
    const openLane = rainbowDiscOpenLane(this.attackSequence, this.possession);

    const thrower = this.add
      .sprite(throwOrigin.x - 28, throwOrigin.y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(ACTIVITY_THROWER_SIZE.width, ACTIVITY_THROWER_SIZE.height)
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:thrower');
    this.playLayer.add(thrower);

    RECEIVER_Y.forEach((receiverY, index) => {
      const appearance =
        RAINBOW_DISC_PLAYER_APPEARANCES[
          (index + this.possession + 1) % RAINBOW_DISC_PLAYER_APPEARANCES.length
        ];
      const receiver = createResidentAppearanceSprite(
        this,
        `rainbow-disc-activity:receiver:${this.possession}:${index}`,
        `rainbow-disc-activity:receiver:${index}`,
        appearance,
      )
        .setPosition(targetX, receiverY)
        .setOrigin(ACTIVITY_RESIDENT_BODY_ORIGIN.x, ACTIVITY_RESIDENT_BODY_ORIGIN.y)
        .setScale(ACTIVITY_RESIDENT_SCALE)
        .setInteractive({ useHandCursor: true });
      receiver.on('pointerdown', () => this.selectReceiver(index));
      this.receiverSprites.push(receiver);

      const marked = index !== openLane;
      const ring = this.add
        .circle(
          targetX,
          receiverY,
          55,
          marked ? 0xf2b4c2 : 0xfff4b8,
          index === this.selectedReceiver ? 0.2 : 0.05,
        )
        .setStrokeStyle(
          4,
          index === this.selectedReceiver ? 0xf4c96b : marked ? 0xd9899f : 0xc9b55f,
          index === this.selectedReceiver ? 0.94 : 0.48,
        )
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      this.receiverRings.push(ring);
      this.playLayer?.add([ring, receiver]);

      if (marked) {
        const defenderPoint = this.defenderPoint(index);
        const defenderX = defenderPoint.x;
        const defenderY = defenderPoint.y;
        const defenderAppearance =
          RAINBOW_DISC_PLAYER_APPEARANCES[(index + 3) % RAINBOW_DISC_PLAYER_APPEARANCES.length];
        const defenderHalo = this.add
          .circle(defenderX, defenderY, 42, 0xe38da7, 0.14)
          .setStrokeStyle(3, 0xd37894, 0.78)
          .setName(`rainbow-disc-activity:defender-halo:${index}`);
        const defender = createResidentAppearanceSprite(
          this,
          `rainbow-disc-activity:defender:${this.possession}:${index}`,
          `rainbow-disc-activity:defender:${index}`,
          defenderAppearance,
        )
          .setPosition(defenderX, defenderY)
          .setOrigin(
            ACTIVITY_FLIPPED_RESIDENT_BODY_ORIGIN.x,
            ACTIVITY_FLIPPED_RESIDENT_BODY_ORIGIN.y,
          )
          .setScale(ACTIVITY_RESIDENT_SCALE)
          .setFlipX(true);
        this.playLayer?.add([defenderHalo, defender]);
      }
    });

    this.aimGraphics = this.add.graphics().setName('rainbow-disc-activity:aim-line').setDepth(25);
    this.playLayer.add(this.aimGraphics);

    this.disc = createRainbowDiscRing(
      this,
      'rainbow-disc-activity:disc',
      throwOrigin.x,
      throwOrigin.y,
      18,
      7,
    )
      .setScale(1, 0.62)
      .setDepth(30);
    this.disc.on('pointerdown', () => {
      if (!this.actionLocked) {
        this.dragging = true;
        this.dragStartPoint = this.throwOrigin();
      }
    });
    this.playLayer.add(this.disc);

    this.statusText?.setText(
      this.possession === PASS_COUNT - 1
        ? 'Final pass: find the open lane and reach the end zone.'
        : `Pass ${this.possession + 1} of ${PASS_COUNT}: two lanes are marked — find the open receiver.`,
    );
    this.progressText?.setText(this.matchScoreLabel());
    this.refreshReceiverSelection();
  }

  private renderDefencePhase(): void {
    const opponentThrowerX = 390;
    const opponentReceiverX = 920;

    const yourDefender = this.add
      .sprite(610, 370, PLAYER_TEXTURE_KEY)
      .setDisplaySize(ACTIVITY_THROWER_SIZE.width, ACTIVITY_THROWER_SIZE.height)
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:defence-player');
    this.playLayer?.add(yourDefender);

    const opponentThrower = createResidentAppearanceSprite(
      this,
      'rainbow-disc-activity:opponent-thrower',
      'rainbow-disc-activity:opponent-thrower',
      RAINBOW_DISC_PLAYER_APPEARANCES[4],
    )
      .setPosition(opponentThrowerX, 370)
      .setOrigin(ACTIVITY_RESIDENT_BODY_ORIGIN.x, ACTIVITY_RESIDENT_BODY_ORIGIN.y)
      .setScale(ACTIVITY_RESIDENT_SCALE)
      .setFlipX(false);
    this.playLayer?.add(opponentThrower);

    RECEIVER_Y.forEach((receiverY, index) => {
      const appearance =
        RAINBOW_DISC_PLAYER_APPEARANCES[(index + 2) % RAINBOW_DISC_PLAYER_APPEARANCES.length];
      const attacker = createResidentAppearanceSprite(
        this,
        `rainbow-disc-activity:opponent-receiver:${index}`,
        `rainbow-disc-activity:opponent-receiver:${index}`,
        appearance,
      )
        .setPosition(opponentReceiverX, receiverY)
        .setOrigin(ACTIVITY_RESIDENT_BODY_ORIGIN.x, ACTIVITY_RESIDENT_BODY_ORIGIN.y)
        .setScale(ACTIVITY_RESIDENT_SCALE)
        .setInteractive({ useHandCursor: true });
      attacker.on('pointerdown', () => this.resolveDefenceChoice(index));

      const ring = this.add
        .circle(
          opponentReceiverX,
          receiverY,
          55,
          0xb9d9ef,
          index === this.selectedReceiver ? 0.2 : 0.05,
        )
        .setStrokeStyle(
          4,
          index === this.selectedReceiver ? 0x6f95cb : 0x8cb7d7,
          index === this.selectedReceiver ? 0.95 : 0.5,
        )
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      this.receiverRings.push(ring);
      this.receiverSprites.push(attacker);
      this.playLayer?.add([ring, attacker]);
    });

    this.disc = createRainbowDiscRing(
      this,
      'rainbow-disc-activity:disc',
      opponentThrowerX + 35,
      330,
      18,
      7,
    )
      .setScale(1, 0.62)
      .setDepth(30);
    this.playLayer?.add(this.disc);

    const telegraphAlpha = rainbowDiscDefenceTelegraphAlpha(this.assistance);
    const telegraphY = RECEIVER_Y[this.defenceAttackLane] ?? RECEIVER_Y[1];
    const telegraph = this.add
      .graphics()
      .setName(`rainbow-disc-activity:defence-telegraph:${this.defenceAttackLane}`)
      .setDepth(18);
    telegraph.lineStyle(9, 0x88c9e8, telegraphAlpha);
    telegraph.lineBetween(opponentThrowerX + 55, 370, opponentReceiverX - 72, telegraphY);
    telegraph.fillStyle(0xbfe7f7, telegraphAlpha);
    telegraph.fillTriangle(
      opponentReceiverX - 72,
      telegraphY,
      opponentReceiverX - 96,
      telegraphY - 13,
      opponentReceiverX - 96,
      telegraphY + 13,
    );
    this.playLayer?.add(telegraph);
    this.tweens.add({
      targets: telegraph,
      alpha: { from: 0.62, to: 1 },
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.statusText?.setText(
      'DEFEND: watch the blue route shimmer, then cover that lane. Tap it, or use ↑/↓ then Space.',
    );
    this.progressText?.setText(
      `${this.matchScoreLabel()} · Attack ${this.opponentAdvance + 1}/2`,
    );
    this.refreshReceiverSelection();
  }

  private renderPracticeMenu(): void {
    this.statusText?.setText('Pick a drill. Each one practises a different Rainbow Disc skill.');
    this.progressText?.setText('PRACTICE · Choose a drill');

    this.add
      .text(640, 205, 'Choose a practice drill', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:practice-menu-title');

    this.createButton(
      640,
      285,
      520,
      `1 · Target Range  ·  Best ${this.bestTargetRangeScore}`,
      () => this.startPracticeDrill('target-range'),
      'practice-target-range',
      this.playLayer,
    );
    this.createButton(
      640,
      385,
      520,
      `2 · Passing Drill  ·  Best streak ${this.bestPassingStreak}`,
      () => this.startPracticeDrill('passing-drill'),
      'practice-passing-drill',
      this.playLayer,
    );
    this.createButton(
      640,
      485,
      520,
      `3 · Rainbow Streak  ·  Best streak ${this.bestRainbowStreak}`,
      () => this.startPracticeDrill('rainbow-streak'),
      'practice-rainbow-streak',
      this.playLayer,
    );

    const help = this.add
      .text(640, 548, 'Tap a drill, or press 1, 2 or 3.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.playLayer?.add(help);
  }

  private startPracticeDrill(drill: Exclude<RainbowDiscPracticeDrill, 'menu'>): void {
    this.practiceDrill = drill;
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.practiceStreak = 0;
    this.selectedReceiver = 1;
    this.completed = false;
    this.actionLocked = false;
    this.timingPhase = 0;
    this.renderPossession();
  }

  private renderPassingDrillRound(): void {
    const throwOrigin = this.throwOrigin();
    const targetX = 900;
    const openLane = rainbowDiscOpenLane(this.practiceThrows, this.practiceThrows % 3);

    const thrower = this.add
      .sprite(throwOrigin.x - 28, throwOrigin.y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(ACTIVITY_THROWER_SIZE.width, ACTIVITY_THROWER_SIZE.height)
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:thrower');
    this.playLayer?.add(thrower);

    RECEIVER_Y.forEach((receiverY, index) => {
      const appearance = RAINBOW_DISC_PLAYER_APPEARANCES[(index + 1) % RAINBOW_DISC_PLAYER_APPEARANCES.length];
      const receiver = createResidentAppearanceSprite(
        this,
        `rainbow-disc-practice:receiver:${this.practiceThrows}:${index}`,
        `rainbow-disc-activity:receiver:${index}`,
        appearance,
      )
        .setPosition(targetX, receiverY)
        .setOrigin(ACTIVITY_RESIDENT_BODY_ORIGIN.x, ACTIVITY_RESIDENT_BODY_ORIGIN.y)
        .setScale(ACTIVITY_RESIDENT_SCALE)
        .setInteractive({ useHandCursor: true });
      receiver.on('pointerdown', () => this.selectReceiver(index));
      this.receiverSprites.push(receiver);

      const marked = index !== openLane;
      const ring = this.add
        .circle(
          targetX,
          receiverY,
          55,
          marked ? 0xf2b4c2 : 0xfff4b8,
          index === this.selectedReceiver ? 0.2 : 0.05,
        )
        .setStrokeStyle(
          4,
          index === this.selectedReceiver ? 0xf4c96b : marked ? 0xd9899f : 0xc9b55f,
          index === this.selectedReceiver ? 0.94 : 0.5,
        )
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      this.receiverRings.push(ring);
      this.playLayer?.add([ring, receiver]);

      if (marked) {
        const defenderPoint = this.defenderPoint(index);
        const defender = createResidentAppearanceSprite(
          this,
          `rainbow-disc-practice:defender:${this.practiceThrows}:${index}`,
          `rainbow-disc-activity:defender:${index}`,
          RAINBOW_DISC_PLAYER_APPEARANCES[(index + 3) % RAINBOW_DISC_PLAYER_APPEARANCES.length],
        )
          .setPosition(defenderPoint.x, defenderPoint.y)
          .setOrigin(
            ACTIVITY_FLIPPED_RESIDENT_BODY_ORIGIN.x,
            ACTIVITY_FLIPPED_RESIDENT_BODY_ORIGIN.y,
          )
          .setScale(ACTIVITY_RESIDENT_SCALE)
          .setFlipX(true);
        this.playLayer?.add(defender);
      }
    });

    this.aimGraphics = this.add.graphics().setName('rainbow-disc-activity:aim-line').setDepth(25);
    this.playLayer?.add(this.aimGraphics);
    this.disc = createRainbowDiscRing(
      this,
      'rainbow-disc-activity:disc',
      throwOrigin.x,
      throwOrigin.y,
      18,
      7,
    )
      .setScale(1, 0.62)
      .setDepth(30);
    this.disc.on('pointerdown', () => {
      if (!this.actionLocked) {
        this.dragging = true;
        this.dragStartPoint = this.throwOrigin();
      }
    });
    this.playLayer?.add(this.disc);

    this.statusText?.setText(
      `Pass ${this.practiceThrows + 1} of ${RAINBOW_DISC_PASSING_DRILL_ROUNDS}: find the open receiver and release in the green.`,
    );
    this.progressText?.setText(
      `Passing · Score ${this.practiceScore}/${RAINBOW_DISC_PASSING_DRILL_ROUNDS} · Streak ${this.practiceStreak} · Best ${this.bestPassingStreak}`,
    );
    this.refreshReceiverSelection();
  }

  private renderRainbowStreakRound(): void {
    const throwOrigin = this.throwOrigin();
    const calledTarget = rainbowDiscStreakTarget(this.practiceThrows);

    const thrower = this.add
      .sprite(throwOrigin.x - 28, throwOrigin.y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(ACTIVITY_THROWER_SIZE.width, ACTIVITY_THROWER_SIZE.height)
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:thrower');
    this.playLayer?.add(thrower);

    const targets = this.add
      .graphics()
      .setName('rainbow-disc-activity:practice-targets')
      .setDepth(16);
    this.playLayer?.add(targets);

    targets.lineStyle(4, 0xf4edc4, 0.55);
    targets.lineBetween(
      PRACTICE_TARGETS[0].x - 105,
      PRACTICE_TARGET_BASE_Y,
      PRACTICE_TARGETS[PRACTICE_TARGETS.length - 1].x + 105,
      PRACTICE_TARGET_BASE_Y,
    );

    PRACTICE_TARGETS.forEach((target, index) => {
      targets.lineStyle(8, 0x7d5b44, 0.9);
      targets.lineBetween(target.x, target.y + target.radius, target.x, PRACTICE_TARGET_BASE_Y);
      drawRainbowTarget(targets, target.x, target.y, target.radius, 9);
      targets.fillStyle(index === calledTarget ? 0xffffff : 0xffefae, 0.95);
      targets.fillCircle(target.x, target.y, Math.max(7, target.radius * 0.16));

      const selector = this.add
        .circle(
          target.x,
          target.y,
          target.radius + 14,
          index === calledTarget ? 0xc9f4ff : 0xfff4b8,
          index === this.selectedReceiver ? 0.16 : index === calledTarget ? 0.1 : 0,
        )
        .setStrokeStyle(
          index === calledTarget ? 6 : 4,
          index === this.selectedReceiver ? 0xf4c96b : index === calledTarget ? 0x69bddd : 0xc9b55f,
          index === calledTarget || index === this.selectedReceiver ? 0.95 : 0.18,
        )
        .setInteractive({ useHandCursor: true })
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      selector.on('pointerdown', () => this.selectReceiver(index));
      this.receiverRings.push(selector);
      this.playLayer?.add(selector);

      const label = this.add
        .text(
          target.x,
          PRACTICE_TARGET_BASE_Y + 22,
          index === calledTarget ? `★ ${target.label.toUpperCase()}` : target.label,
          {
            color: '#5f496d',
            fontFamily: UI_FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            align: 'center',
          },
        )
        .setOrigin(0.5);
      this.playLayer?.add(label);
    });

    this.aimGraphics = this.add.graphics().setName('rainbow-disc-activity:aim-line').setDepth(25);
    this.playLayer?.add(this.aimGraphics);
    this.disc = createRainbowDiscRing(
      this,
      'rainbow-disc-activity:disc',
      throwOrigin.x,
      throwOrigin.y,
      18,
      7,
    )
      .setScale(1, 0.62)
      .setDepth(30);
    this.disc.on('pointerdown', () => {
      if (!this.actionLocked) {
        this.dragging = true;
        this.dragStartPoint = this.throwOrigin();
      }
    });
    this.playLayer?.add(this.disc);

    const called = PRACTICE_TARGETS[calledTarget] ?? PRACTICE_TARGETS[1];
    this.statusText?.setText(
      `Throw ${this.practiceThrows + 1} of ${RAINBOW_DISC_STREAK_THROWS}: hit the ★ ${called.label} target and keep the streak alive.`,
    );
    this.progressText?.setText(
      `Rainbow Streak · Hits ${this.practiceScore} · Streak ${this.practiceStreak} · Best ${this.bestRainbowStreak}`,
    );
    this.refreshReceiverSelection();
  }

  private renderPracticeRound(): void {
    const throwOrigin = this.throwOrigin();

    const thrower = this.add
      .sprite(throwOrigin.x - 28, throwOrigin.y, PLAYER_TEXTURE_KEY)
      .setDisplaySize(ACTIVITY_THROWER_SIZE.width, ACTIVITY_THROWER_SIZE.height)
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:thrower');
    this.playLayer?.add(thrower);

    const targets = this.add
      .graphics()
      .setName('rainbow-disc-activity:practice-targets')
      .setDepth(16);
    this.playLayer?.add(targets);

    targets.lineStyle(4, 0xf4edc4, 0.55);
    targets.lineBetween(
      PRACTICE_TARGETS[0].x - 105,
      PRACTICE_TARGET_BASE_Y,
      PRACTICE_TARGETS[PRACTICE_TARGETS.length - 1].x + 105,
      PRACTICE_TARGET_BASE_Y,
    );

    PRACTICE_TARGETS.forEach((target, index) => {
      targets.lineStyle(8, 0x7d5b44, 0.9);
      targets.lineBetween(target.x, target.y + target.radius, target.x, PRACTICE_TARGET_BASE_Y);
      drawRainbowTarget(targets, target.x, target.y, target.radius, 9);
      targets.fillStyle(0xffefae, 0.92);
      targets.fillCircle(target.x, target.y, Math.max(7, target.radius * 0.16));

      const selector = this.add
        .circle(
          target.x,
          target.y,
          target.radius + 14,
          0xfff4b8,
          index === this.selectedReceiver ? 0.12 : 0,
        )
        .setStrokeStyle(4, 0xf4c96b, index === this.selectedReceiver ? 0.88 : 0.12)
        .setInteractive({ useHandCursor: true })
        .setName(`rainbow-disc-activity:receiver-ring:${index}`);
      selector.on('pointerdown', () => this.selectReceiver(index));
      this.receiverRings.push(selector);
      this.playLayer?.add(selector);

      const points = this.add
        .text(target.x, PRACTICE_TARGET_BASE_Y + 22, `${target.points} pt • ${target.label}`, {
          color: '#5f496d',
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);
      this.playLayer?.add(points);
    });

    this.aimGraphics = this.add.graphics().setName('rainbow-disc-activity:aim-line').setDepth(25);
    this.playLayer?.add(this.aimGraphics);

    this.disc = createRainbowDiscRing(
      this,
      'rainbow-disc-activity:disc',
      throwOrigin.x,
      throwOrigin.y,
      18,
      7,
    )
      .setScale(1, 0.62)
      .setDepth(30);
    this.disc.on('pointerdown', () => {
      if (!this.actionLocked) {
        this.dragging = true;
        this.dragStartPoint = this.throwOrigin();
      }
    });
    this.playLayer?.add(this.disc);

    const selected = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
    this.statusText?.setText(
      `Throw ${this.practiceThrows + 1} of ${RAINBOW_DISC_TARGET_RANGE_THROWS}: ${selected.label} target — ${selected.points} point${selected.points === 1 ? '' : 's'}.`,
    );
    this.progressText?.setText(
      `Practice: ${this.practiceThrows}/${RAINBOW_DISC_TARGET_RANGE_THROWS} • Score: ${this.practiceScore}`,
    );
    this.refreshReceiverSelection();
    this.updateTimingSuccessZone();
  }

  private renderResult(): void {
    if (this.mode === 'practice') {
      this.statusText?.setText('Practice complete!');
      this.progressText?.setText(
        `Practice: ${RAINBOW_DISC_TARGET_RANGE_THROWS}/${RAINBOW_DISC_TARGET_RANGE_THROWS} • Score: ${this.practiceScore}`,
      );
    } else {
      this.statusText?.setText(
        this.playerScore > this.oppositionScore ? 'You win the Rainbow Disc match!' : 'Good match!',
      );
      this.progressText?.setText(this.matchScoreLabel());
    }

    const burst = this.add.graphics().setName('rainbow-disc-activity:score-burst');
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      const colour = [0xf19fbd, 0xffdc7d, 0x86cae0, 0xb9a0df][index % 4];
      burst.fillStyle(colour, 0.94);
      burst.fillCircle(GAME_WIDTH / 2 + Math.cos(angle) * 105, 345 + Math.sin(angle) * 75, 7);
    }

    const title = this.add
      .text(
        GAME_WIDTH / 2,
        300,
        this.mode === 'practice'
          ? 'PRACTICE COMPLETE!'
          : this.playerScore > this.oppositionScore
            ? 'YOU WIN!'
            : 'GOOD MATCH!',
        {
          color: '#5f496d',
          fontFamily: UI_FONT,
          fontSize: '36px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setName('rainbow-disc-activity:result');
    const summary = this.add
      .text(
        GAME_WIDTH / 2,
        365,
        this.mode === 'practice'
          ? `You scored ${this.practiceScore} points from five throws.`
          : `Final score: You ${this.playerScore} · ${this.oppositionScore} Village`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.playLayer?.add([burst, title, summary]);
    this.createButton(
      510,
      460,
      250,
      this.mode === 'practice' ? 'Practice again' : 'Play again',
      () => this.restartRun(),
      'replay',
      this.playLayer,
    );
    this.createButton(
      790,
      460,
      250,
      this.backLabel(),
      () => this.leaveActivity(),
      'result-back',
      this.playLayer,
    );
  }

  private backLabel(): string {
    return this.miniGameSession?.source === 'just-games' ? 'Back to Games' : 'Back to Meadow';
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || this.actionLocked || !this.disc || this.completed) {
      return;
    }

    const x = Phaser.Math.Clamp(pointer.x, FIELD_LEFT + 35, FIELD_RIGHT - 35);
    const y = Phaser.Math.Clamp(pointer.y, FIELD_TOP + 30, FIELD_BOTTOM - 30);
    this.disc.setPosition(x, y);

    const throwOrigin = this.throwOrigin();
    this.aimGraphics?.clear();
    this.aimGraphics?.lineStyle(5, 0xffffff, 0.52);
    this.aimGraphics?.lineBetween(throwOrigin.x, throwOrigin.y, x, y);

    const nearest = this.nearestReceiverIndex({ x, y });
    if (nearest !== this.selectedReceiver) {
      this.selectReceiver(nearest);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (
      !this.dragging ||
      this.actionLocked ||
      !this.disc ||
      this.completed ||
      this.phase === 'defence'
    ) {
      return;
    }

    this.dragging = false;
    const release = {
      x: Phaser.Math.Clamp(pointer.x, FIELD_LEFT + 35, FIELD_RIGHT - 35),
      y: Phaser.Math.Clamp(pointer.y, FIELD_TOP + 30, FIELD_BOTTOM - 30),
    };
    const dragStart = this.dragStartPoint ?? this.throwOrigin();
    this.dragStartPoint = null;
    const assistance = getRainbowDiscAssistanceProfile(this.assistance);
    const dragDistance = Phaser.Math.Distance.Between(
      dragStart.x,
      dragStart.y,
      release.x,
      release.y,
    );

    if (dragDistance < assistance.minimumPointerDrag) {
      this.disc.setPosition(dragStart.x, dragStart.y);
      this.aimGraphics?.clear();
      this.statusText?.setText('Drag towards a lane or target, then release the disc.');
      return;
    }

    const receiverIndex = this.nearestReceiverIndex(release);
    this.selectedReceiver = receiverIndex;
    this.refreshReceiverSelection();
    this.commitTimedThrow(receiverIndex);
  }

  private keyboardThrow(): void {
    if (
      this.actionLocked ||
      this.completed ||
      this.dragging ||
      (this.mode === 'practice' && this.practiceDrill === 'menu')
    ) {
      return;
    }

    if (this.phase === 'defence' && this.mode === 'match') {
      this.resolveDefenceChoice(this.selectedReceiver);
      return;
    }

    this.commitTimedThrow(this.selectedReceiver);
  }

  private commitTimedThrow(receiverIndex: number): void {
    this.selectedReceiver = Phaser.Math.Clamp(receiverIndex, 0, RECEIVER_Y.length - 1);
    this.refreshReceiverSelection();

    const target = this.receiverPoint(this.selectedReceiver);
    const profile = this.currentTimingProfile();
    const accurate = isRainbowDiscReleaseAccurate(this.timingValue, profile.tolerance);
    const missOffset = rainbowDiscMissOffset(this.timingValue);

    this.resolveThrow(
      target,
      accurate,
      accurate ? target : { x: target.x - 20, y: target.y + missOffset },
      this.selectedReceiver,
    );
  }

  private resolveThrow(
    target: Point,
    accurate: boolean,
    missPoint: Point,
    receiverIndex = this.selectedReceiver,
  ): void {
    if (!this.disc || this.actionLocked) {
      return;
    }

    this.actionLocked = true;
    this.dragging = false;
    this.aimGraphics?.clear();

    const intercepted =
      this.mode === 'match' && this.phase === 'attack' && this.isReceiverMarked(receiverIndex);
    const blockedPracticePass =
      this.mode === 'practice' &&
      this.practiceDrill === 'passing-drill' &&
      this.isReceiverMarked(receiverIndex);
    const destination =
      intercepted || blockedPracticePass
        ? this.defenderPoint(receiverIndex)
        : accurate
          ? target
          : missPoint;

    this.tweens.add({
      targets: this.disc,
      x: destination.x,
      y: destination.y,
      angle: this.disc.angle + 280,
      duration: 430,
      ease: 'Sine.Out',
      onComplete: () => {
        if (this.mode === 'practice') {
          this.handlePracticeAttempt(accurate && !blockedPracticePass, receiverIndex);
        } else if (intercepted) {
          this.handleTurnover('intercepted');
        } else if (accurate) {
          this.handleCatch();
        } else {
          this.handleTurnover('missed');
        }
      },
    });
  }

  private handleCatch(): void {
    const receiver = this.receiverSprites[this.selectedReceiver];
    if (receiver) {
      const direction = receiver.flipX ? -1 : 1;
      this.tweens.add({
        targets: receiver,
        angle: direction * 7,
        duration: 120,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }

    this.possession += 1;
    if (this.possession >= PASS_COUNT) {
      this.playerScore += 1;
      this.attackSequence += 1;
      this.possession = 0;
      this.cameras.main.flash(150, 255, 239, 164, false);

      if (isRainbowDiscMatchComplete(this.playerScore, this.oppositionScore)) {
        this.completed = true;
        this.statusText?.setText('Goal! That wins the match.');
        this.progressText?.setText(this.matchScoreLabel());
        this.time.delayedCall(520, () => this.renderPossession());
        return;
      }

      this.statusText?.setText('Goal! The village team starts the next possession.');
      this.beginDefence();
      this.time.delayedCall(620, () => this.renderPossession());
      return;
    }

    this.statusText?.setText('Caught! Keep the chain moving.');
    this.time.delayedCall(420, () => this.renderPossession());
  }

  private handlePracticeAttempt(success: boolean, receiverIndex: number): void {
    if (this.practiceDrill === 'passing-drill') {
      if (success) {
        this.practiceScore += 1;
        this.practiceStreak += 1;
        this.bestPassingStreak = Math.max(this.bestPassingStreak, this.practiceStreak);
        this.statusText?.setText('Clean pass! Keep the streak going.');
        this.cameras.main.flash(90, 255, 239, 164, false);
      } else {
        this.practiceStreak = 0;
        this.statusText?.setText('Marked or mistimed — reset and find the next open lane.');
        this.cameras.main.shake(80, 0.0015);
      }

      this.practiceThrows += 1;
      if (this.practiceThrows >= RAINBOW_DISC_PASSING_DRILL_ROUNDS) {
        this.completed = true;
        this.time.delayedCall(320, () => this.renderPossession());
        return;
      }
      this.time.delayedCall(360, () => this.renderPossession());
      return;
    }

    if (this.practiceDrill === 'rainbow-streak') {
      const calledTarget = rainbowDiscStreakTarget(this.practiceThrows);
      const hitCalledTarget = success && receiverIndex === calledTarget;
      if (hitCalledTarget) {
        this.practiceScore += 1;
        this.practiceStreak += 1;
        this.bestRainbowStreak = Math.max(this.bestRainbowStreak, this.practiceStreak);
        this.statusText?.setText('Yes! Streak stays alive.');
        this.cameras.main.flash(90, 255, 239, 164, false);
      } else {
        this.practiceStreak = 0;
        this.statusText?.setText('Streak reset — watch the ★ target and go again.');
        this.cameras.main.shake(80, 0.0015);
      }

      this.practiceThrows += 1;
      if (this.practiceThrows >= RAINBOW_DISC_STREAK_THROWS) {
        this.completed = true;
        this.time.delayedCall(320, () => this.renderPossession());
        return;
      }
      this.time.delayedCall(360, () => this.renderPossession());
      return;
    }

    if (success) {
      this.practiceScore += PRACTICE_TARGETS[receiverIndex]?.points ?? 1;
      this.bestTargetRangeScore = Math.max(this.bestTargetRangeScore, this.practiceScore);
      this.statusText?.setText('Hit! Pick another target.');
      this.cameras.main.flash(90, 255, 239, 164, false);
    } else {
      this.statusText?.setText('Missed — next disc.');
      this.cameras.main.shake(80, 0.0015);
    }

    this.practiceThrows += 1;
    if (this.practiceThrows >= RAINBOW_DISC_TARGET_RANGE_THROWS) {
      this.completed = true;
      this.time.delayedCall(320, () => this.renderPossession());
      return;
    }

    this.time.delayedCall(360, () => this.renderPossession());
  }

  private handleTurnover(reason: 'intercepted' | 'missed'): void {
    this.statusText?.setText(
      reason === 'intercepted'
        ? 'Intercepted! Possession flips — now stop their attack.'
        : 'Loose throw! They collect it — switch to defence.',
    );
    this.cameras.main.shake(110, 0.002);
    this.attackSequence += 1;
    this.possession = 0;
    this.beginDefence();
    this.time.delayedCall(520, () => this.renderPossession());
  }

  private throwOrigin(): Point {
    if (this.mode === 'practice') {
      return { x: 245, y: this.practiceDrill === 'passing-drill' ? 370 : 350 };
    }

    return {
      x: THROW_X[this.possession] ?? THROW_X[0],
      y: 370,
    };
  }

  private receiverPoint(index: number): Point {
    if (this.mode === 'practice' && this.practiceDrill !== 'passing-drill') {
      const target = PRACTICE_TARGETS[index] ?? PRACTICE_TARGETS[1];
      return { x: target.x, y: target.y };
    }

    const receiver = this.receiverSprites[index];
    if (receiver) {
      const appearanceIndex =
        (index + this.possession + 1) % RAINBOW_DISC_PLAYER_APPEARANCES.length;
      return resolveRainbowDiscHornCatchPoint(
        receiver,
        RAINBOW_DISC_PLAYER_APPEARANCES[appearanceIndex] ?? RAINBOW_DISC_PLAYER_APPEARANCES[0],
      );
    }

    return {
      x: TARGET_X[this.possession] ?? TARGET_X[0],
      y: (RECEIVER_Y[index] ?? RECEIVER_Y[1]) - 58,
    };
  }

  private nearestReceiverIndex(point: Point): number {
    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    RECEIVER_Y.forEach((_receiverY, index) => {
      const target = this.receiverPoint(index);
      const distance = Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  private selectPreviousMatchLane(): void {
    if (this.mode === 'practice' && this.practiceDrill !== 'passing-drill') {
      return;
    }
    this.selectPreviousReceiver();
  }

  private selectNextMatchLane(): void {
    if (this.mode === 'practice' && this.practiceDrill !== 'passing-drill') {
      return;
    }
    this.selectNextReceiver();
  }

  private selectPreviousPracticeTarget(): void {
    if (
      this.mode !== 'practice' ||
      (this.practiceDrill !== 'target-range' && this.practiceDrill !== 'rainbow-streak')
    ) {
      return;
    }
    this.selectPreviousReceiver();
  }

  private selectNextPracticeTarget(): void {
    if (
      this.mode !== 'practice' ||
      (this.practiceDrill !== 'target-range' && this.practiceDrill !== 'rainbow-streak')
    ) {
      return;
    }
    this.selectNextReceiver();
  }

  private selectPreviousReceiver(): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectReceiver((this.selectedReceiver + RECEIVER_Y.length - 1) % RECEIVER_Y.length);
  }

  private selectNextReceiver(): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectReceiver((this.selectedReceiver + 1) % RECEIVER_Y.length);
  }

  private selectReceiver(index: number): void {
    if (this.actionLocked || this.completed) {
      return;
    }
    this.selectedReceiver = Phaser.Math.Clamp(index, 0, RECEIVER_Y.length - 1);
    this.refreshReceiverSelection();
  }

  private refreshReceiverSelection(): void {
    this.receiverRings.forEach((ring, index) => {
      const selected = index === this.selectedReceiver;
      const practiceTarget = PRACTICE_TARGETS[index];
      const marked =
        this.mode === 'match' && this.phase === 'attack' && this.isReceiverMarked(index);
      const baseStroke =
        this.phase === 'defence'
          ? 0x8cb7d7
          : marked
            ? 0xd9899f
            : practiceTarget
              ? 0xc9b55f
              : 0xc9b55f;
      ring.setFillStyle(
        this.phase === 'defence' ? 0xb9d9ef : marked ? 0xf2b4c2 : 0xfff4b8,
        selected ? 0.2 : 0.05,
      );
      ring.setStrokeStyle(4, selected ? 0xf4c96b : baseStroke, selected ? 0.95 : 0.5);
    });
    this.updateTimingSuccessZone();

    if (
      this.mode === 'practice' &&
      this.practiceDrill === 'target-range' &&
      this.statusText &&
      !this.completed
    ) {
      const target = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
      this.statusText.setText(
        `Throw ${this.practiceThrows + 1} of ${RAINBOW_DISC_TARGET_RANGE_THROWS}: ${target.label} target — ${target.points} point${target.points === 1 ? '' : 's'}.`,
      );
    }
  }

  private currentTimingProfile(): { tolerance: number; sweepSpeed: number; label: string } {
    const baseProfile =
      this.mode === 'practice'
        ? this.practiceDrill === 'passing-drill'
          ? { tolerance: 0.22, sweepSpeed: 0.0042, label: 'Passing' }
          : this.practiceDrill === 'rainbow-streak'
            ? rainbowDiscStreakTiming(this.practiceThrows)
            : (() => {
                const target = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
                return {
                  tolerance: target.tolerance,
                  sweepSpeed: target.sweepSpeed,
                  label: target.label,
                };
              })()
        : { tolerance: 0.22, sweepSpeed: 0.0042, label: 'Match' };

    return applyRainbowDiscAssistance(baseProfile, this.assistance);
  }

  private updateTimingSuccessZone(): void {
    if (!this.timingSuccessZone || !this.timingDifficultyText) {
      return;
    }

    const profile = this.currentTimingProfile();
    const centre = 0.55;
    const start = Phaser.Math.Clamp(centre - profile.tolerance, 0, 1);
    const end = Phaser.Math.Clamp(centre + profile.tolerance, 0, 1);
    const width = (end - start) * TIMING_TRACK_WIDTH;
    const x = TIMING_TRACK_LEFT + ((start + end) / 2) * TIMING_TRACK_WIDTH;

    this.timingSuccessZone.setPosition(x, 660).setDisplaySize(Math.max(18, width), 14);
    const assistance = getRainbowDiscAssistanceProfile(this.assistance);
    this.timingDifficultyText.setText(
      this.mode === 'practice'
        ? `${profile.label} • ${assistance.title} • ${profile.sweepSpeed.toFixed(4)} speed`
        : `${assistance.title} • Match timing`,
    );
  }

  private isReceiverMarked(index: number): boolean {
    const openLane =
      this.mode === 'practice' && this.practiceDrill === 'passing-drill'
        ? rainbowDiscOpenLane(this.practiceThrows, this.practiceThrows % 3)
        : rainbowDiscOpenLane(this.attackSequence, this.possession);
    return index !== openLane;
  }

  private defenderPoint(index: number): Point {
    const targetX = TARGET_X[this.possession] ?? TARGET_X[0];
    const receiverY = RECEIVER_Y[index] ?? RECEIVER_Y[1];
    return {
      x: targetX - 150,
      y: receiverY + (index === 0 ? -20 : index === 2 ? 20 : 0),
    };
  }

  private resolveDefenceChoice(index: number): void {
    if (this.actionLocked || this.completed || this.phase !== 'defence') {
      return;
    }

    this.selectedReceiver = index;
    this.refreshReceiverSelection();
    this.actionLocked = true;

    const correct = index === this.defenceAttackLane;
    if (correct) {
      this.statusText?.setText('Intercepted! You read the route and win the disc back.');
      this.cameras.main.flash(100, 215, 244, 193, false);
      this.defenceSequence += 1;
      this.beginAttack();
      this.time.delayedCall(520, () => this.renderPossession());
      return;
    }

    this.opponentAdvance += 1;
    if (this.opponentAdvance >= 2) {
      this.oppositionScore += 1;
      this.cameras.main.shake(110, 0.002);
      this.defenceSequence += 1;

      if (isRainbowDiscMatchComplete(this.playerScore, this.oppositionScore)) {
        this.completed = true;
        this.statusText?.setText('The village team scores. Good match — have another go!');
        this.progressText?.setText(this.matchScoreLabel());
        this.time.delayedCall(620, () => this.renderPossession());
        return;
      }

      this.statusText?.setText('Village goal. Your team starts with the disc.');
      this.beginAttack();
      this.time.delayedCall(620, () => this.renderPossession());
      return;
    }

    this.statusText?.setText('They advance. Read the next blue route and cover it.');
    this.defenceAttackLane = rainbowDiscDefenceLane(
      this.defenceSequence,
      this.opponentAdvance,
    );
    this.selectedReceiver = 1;
    this.time.delayedCall(520, () => this.renderPossession());
  }

  private handlePracticeMenuKeyboard(event: KeyboardEvent): void {
    if (this.mode !== 'practice' || this.practiceDrill !== 'menu') {
      return;
    }

    if (event.key === '1') {
      event.preventDefault();
      this.startPracticeDrill('target-range');
    } else if (event.key === '2') {
      event.preventDefault();
      this.startPracticeDrill('passing-drill');
    } else if (event.key === '3') {
      event.preventDefault();
      this.startPracticeDrill('rainbow-streak');
    }
  }

  private returnToPracticeMenu(): void {
    this.completed = false;
    this.practiceDrill = 'menu';
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.practiceStreak = 0;
    this.selectedReceiver = 1;
    this.actionLocked = false;
    this.renderPossession();
  }

  private matchScoreLabel(): string {
    return `YOU ${this.playerScore}  •  ${this.oppositionScore} VILLAGE  ·  First to ${RAINBOW_DISC_GOALS_TO_WIN}`;
  }

  private beginAttack(): void {
    this.phase = 'attack';
    this.opponentAdvance = 0;
    this.possession = 0;
    this.selectedReceiver = 1;
  }

  private beginDefence(): void {
    this.phase = 'defence';
    this.opponentAdvance = 0;
    this.possession = 0;
    this.defenceAttackLane = rainbowDiscDefenceLane(this.defenceSequence, 0);
    this.selectedReceiver = 1;
  }

  private restartRun(): void {
    if (this.mode === 'practice') {
      if (this.practiceDrill === 'menu') {
        this.renderPossession();
        return;
      }
      this.practiceThrows = 0;
      this.practiceScore = 0;
      this.practiceStreak = 0;
      this.selectedReceiver = 1;
      this.completed = false;
      this.actionLocked = false;
      this.timingPhase = 0;
      this.renderPossession();
      return;
    }

    this.possession = 0;
    this.playerScore = 0;
    this.oppositionScore = 0;
    this.attackSequence = 0;
    this.defenceSequence = 0;
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.phase = 'attack';
    this.opponentAdvance = 0;
    this.defenceAttackLane = rainbowDiscDefenceLane(0, 0);
    this.selectedReceiver = 1;
    this.completed = false;
    this.actionLocked = false;
    this.timingPhase = 0;
    this.renderPossession();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    onPress: () => void,
    name: string,
    parent: Phaser.GameObjects.Container | null = null,
  ): void {
    const visual = this.add.graphics().setName(`rainbow-disc-activity:${name}-visual`);

    const draw = (fill: number, stroke: number): void => {
      visual.clear();
      visual.fillStyle(fill, 1);
      visual.lineStyle(3, stroke, 1);
      visual.fillRoundedRect(x - width / 2, y - 25, width, 50, 18);
      visual.strokeRoundedRect(x - width / 2, y - 25, width, 50, 18);
    };
    draw(UI_COLOURS.mint, 0x6aa996);

    const button = this.add
      .rectangle(x, y, width, 50, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .setName(`rainbow-disc-activity:${name}`);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    for (const target of [button, label]) {
      target.on('pointerover', () => draw(UI_COLOURS.gold, 0xc29a4c));
      target.on('pointerout', () => draw(UI_COLOURS.mint, 0x6aa996));
      target.on('pointerdown', onPress);
    }

    parent?.add([visual, button, label]);
  }

  private leaveActivity(): void {
    if (this.miniGameSession) {
      returnFromMiniGame(this, this.miniGameSession);
      return;
    }

    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
