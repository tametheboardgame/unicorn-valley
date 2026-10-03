import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { createResidentAppearanceSprite } from '../population/SupportingResidentArt';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import {
  createRainbowDiscRing,
  drawRainbowTarget,
  resolveRainbowDiscHornCatchPoint,
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
const FIELD_BOTTOM = 615;
const RECEIVER_Y = [250, 370, 490] as const;
const THROW_X = [220, 440, 680] as const;
const TARGET_X = [535, 775, 1040] as const;
const CATCH_RADIUS = 118;
const PASS_COUNT = 3;
const PRACTICE_THROW_COUNT = 5;
const PRACTICE_TARGET_X = 960;
const PRACTICE_TARGETS = [
  { y: 250, radius: 78, points: 1, tolerance: 0.27, sweepSpeed: 0.0035, label: 'Easy' },
  { y: 370, radius: 58, points: 2, tolerance: 0.18, sweepSpeed: 0.0051, label: 'Medium' },
  { y: 490, radius: 42, points: 3, tolerance: 0.11, sweepSpeed: 0.0072, label: 'Hard' },
] as const;
const OPEN_LANE_BY_PASS = [1, 2, 0] as const;
const ACTIVITY_THROWER_SIZE = { width: 122, height: 86 } as const;
const ACTIVITY_RECEIVER_SCALE = 0.72;
const TIMING_TRACK_LEFT = 462;
const TIMING_TRACK_WIDTH = 350;

export class RainbowDiscActivityScene extends Phaser.Scene {
  private returnScene = 'RainbowMeadowScene';
  private mode: 'match' | 'practice' = 'match';
  private possession = 0;
  private practiceThrows = 0;
  private practiceScore = 0;
  private phase: 'attack' | 'defence' = 'attack';
  private opponentAdvance = 0;
  private defenceAttackLane = 1;
  private selectedReceiver = 1;
  private dragging = false;
  private actionLocked = false;
  private completed = false;
  private timingPhase = 0;
  private timingValue = 0.5;

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
    this.returnScene = data.returnScene ?? 'RainbowMeadowScene';
    this.mode = data.mode ?? 'match';
    this.possession = 0;
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.phase = 'attack';
    this.opponentAdvance = 0;
    this.defenceAttackLane = 1;
    this.selectedReceiver = 1;
    this.dragging = false;
    this.actionLocked = false;
    this.completed = false;
    this.timingPhase = 0;
    this.timingValue = 0.5;

    this.cameras.main.setBackgroundColor('#6ead72');
    this.createBackdrop();
    this.createPlayerTexture();
    this.renderPossession();

    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.keyboard?.on('keydown-UP', this.selectPreviousReceiver, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNextReceiver, this);
    this.input.keyboard?.on('keydown-W', this.selectPreviousReceiver, this);
    this.input.keyboard?.on('keydown-S', this.selectNextReceiver, this);
    this.input.keyboard?.on('keydown-SPACE', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown-ENTER', this.keyboardThrow, this);
    this.input.keyboard?.on('keydown-ESC', this.leaveActivity, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerup', this.handlePointerUp, this);
      this.input.keyboard?.off('keydown-UP', this.selectPreviousReceiver, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNextReceiver, this);
      this.input.keyboard?.off('keydown-W', this.selectPreviousReceiver, this);
      this.input.keyboard?.off('keydown-S', this.selectNextReceiver, this);
      this.input.keyboard?.off('keydown-SPACE', this.keyboardThrow, this);
      this.input.keyboard?.off('keydown-ENTER', this.keyboardThrow, this);
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
          ? 'Five throws. Smaller rainbow targets are worth more — and their timing window is faster and tighter.'
          : 'Build a three-catch chain. Read the defenders, pick the open lane and protect the disc.',
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
    progressCard.fillRoundedRect(94, 116, 260, 36, 16);
    this.progressText = this.add
      .text(224, 134, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    const statusCard = this.add.graphics();
    statusCard.fillStyle(0xf4ead8, 1);
    statusCard.fillRoundedRect(330, 624, 620, 42, 18);
    this.statusText = this.add
      .text(640, 645, '', {
        color: '#5f496d',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5);

    this.createTimingMeter();
    this.createButton(1090, 645, 210, 'Back to Meadow', () => this.leaveActivity(), 'back');
  }

  private createTimingMeter(): void {
    this.add
      .text(332, 684, 'Throw timing', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);

    const track = this.add.graphics().setName('rainbow-disc-activity:timing-track');
    track.fillStyle(0xd8cfc0, 1);
    track.lineStyle(2, 0x9b8977, 0.65);
    track.fillRoundedRect(TIMING_TRACK_LEFT, 673, TIMING_TRACK_WIDTH, 22, 11);
    track.strokeRoundedRect(TIMING_TRACK_LEFT, 673, TIMING_TRACK_WIDTH, 22, 11);

    this.timingSuccessZone = this.add
      .rectangle(TIMING_TRACK_LEFT, 684, 120, 14, 0x9fd394, 0.95)
      .setName('rainbow-disc-activity:timing-success-zone');

    this.timingMarker = this.add
      .rectangle(TIMING_TRACK_LEFT, 684, 7, 30, 0x6f4d80, 1)
      .setName('rainbow-disc-activity:timing-marker');

    this.timingDifficultyText = this.add
      .text(832, 684, '', {
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
    const save = saveService.load() ?? saveService.createNewGame();
    createUnicornAppearanceTexture(
      this,
      PLAYER_TEXTURE_KEY,
      parseUnicornAppearance(save.profile.appearance),
    );
  }

  private renderPossession(): void {
    this.playLayer?.destroy(true);
    this.playLayer = this.add.container(0, 0).setDepth(10);
    this.receiverRings = [];
    this.receiverSprites = [];
    this.dragging = false;
    this.actionLocked = false;
    this.selectedReceiver = Phaser.Math.Clamp(this.selectedReceiver, 0, RECEIVER_Y.length - 1);

    if (this.completed) {
      this.renderResult();
      return;
    }

    if (this.mode === 'practice') {
      this.renderPracticeRound();
      return;
    }

    if (this.phase === 'defence') {
      this.renderDefencePhase();
      return;
    }

    const throwOrigin = this.throwOrigin();
    const targetX = TARGET_X[this.possession] ?? TARGET_X[0];
    const openLane = OPEN_LANE_BY_PASS[this.possession] ?? OPEN_LANE_BY_PASS[0];

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
        .setOrigin(0.5)
        .setScale(ACTIVITY_RECEIVER_SCALE)
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
        const defenderX = Phaser.Math.Linear(throwOrigin.x, targetX, 0.7);
        const defenderAppearance =
          RAINBOW_DISC_PLAYER_APPEARANCES[(index + 3) % RAINBOW_DISC_PLAYER_APPEARANCES.length];
        const defenderHalo = this.add
          .circle(defenderX, receiverY, 45, 0xe38da7, 0.14)
          .setStrokeStyle(3, 0xd37894, 0.78)
          .setName(`rainbow-disc-activity:defender-halo:${index}`);
        const defender = createResidentAppearanceSprite(
          this,
          `rainbow-disc-activity:defender:${this.possession}:${index}`,
          `rainbow-disc-activity:defender:${index}`,
          defenderAppearance,
        )
          .setPosition(defenderX, receiverY)
          .setOrigin(0.5)
          .setScale(0.6)
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
      }
    });
    this.playLayer.add(this.disc);

    this.statusText?.setText(
      this.possession === PASS_COUNT - 1
        ? 'Final pass: find the open lane and reach the end zone.'
        : `Pass ${this.possession + 1} of ${PASS_COUNT}: two lanes are marked — find the open receiver.`,
    );
    this.progressText?.setText(
      `Your chain: ${'●'.repeat(this.possession)}${'○'.repeat(PASS_COUNT - this.possession)}`,
    );
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
      .setOrigin(0.5)
      .setScale(0.65)
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
        .setOrigin(0.5)
        .setScale(ACTIVITY_RECEIVER_SCALE)
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

    this.statusText?.setText(
      'DEFEND: choose which lane they will use. Tap a lane, or use ↑/↓ then Space.',
    );
    this.progressText?.setText(
      `Opposition advance: ${'●'.repeat(this.opponentAdvance)}${'○'.repeat(2 - this.opponentAdvance)}`,
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

    PRACTICE_TARGETS.forEach((target, index) => {
      targets.lineStyle(8, 0x7d5b44, 0.9);
      targets.lineBetween(
        PRACTICE_TARGET_X,
        target.y + target.radius,
        PRACTICE_TARGET_X,
        target.y + 105,
      );
      drawRainbowTarget(targets, PRACTICE_TARGET_X, target.y, target.radius, 9);
      targets.fillStyle(0xffefae, 0.92);
      targets.fillCircle(PRACTICE_TARGET_X, target.y, Math.max(7, target.radius * 0.16));

      const selector = this.add
        .circle(
          PRACTICE_TARGET_X,
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
        .text(PRACTICE_TARGET_X + 118, target.y, `${target.points} pt • ${target.label}`, {
          color: '#5f496d',
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
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
      }
    });
    this.playLayer?.add(this.disc);

    const selected = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
    this.statusText?.setText(
      `Throw ${this.practiceThrows + 1} of ${PRACTICE_THROW_COUNT}: ${selected.label} target — ${selected.points} point${selected.points === 1 ? '' : 's'}.`,
    );
    this.progressText?.setText(
      `Practice: ${this.practiceThrows}/${PRACTICE_THROW_COUNT} • Score: ${this.practiceScore}`,
    );
    this.refreshReceiverSelection();
    this.updateTimingSuccessZone();
  }

  private renderResult(): void {
    if (this.mode === 'practice') {
      this.statusText?.setText('Practice complete!');
      this.progressText?.setText(
        `Practice: ${PRACTICE_THROW_COUNT}/${PRACTICE_THROW_COUNT} • Score: ${this.practiceScore}`,
      );
    } else {
      this.statusText?.setText('Score! Three catches all the way into the end zone.');
      this.progressText?.setText('Catch chain: ●●●');
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
        this.mode === 'practice' ? 'PRACTICE COMPLETE!' : 'RAINBOW DISC SCORE!',
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
          : 'Nice passing. The team catches the third throw inside the end zone.',
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
      'Back to Meadow',
      () => this.leaveActivity(),
      'result-back',
      this.playLayer,
    );
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
    const receiverIndex = this.nearestReceiverIndex(release);
    this.selectedReceiver = receiverIndex;
    this.refreshReceiverSelection();

    const target = this.receiverPoint(receiverIndex);
    const distance = Phaser.Math.Distance.Between(release.x, release.y, target.x, target.y);
    const catchRadius =
      this.mode === 'practice' ? (PRACTICE_TARGETS[receiverIndex]?.radius ?? 42) : CATCH_RADIUS;
    const accurate = distance <= catchRadius;
    this.resolveThrow(target, accurate, release, receiverIndex);
  }

  private keyboardThrow(): void {
    if (this.actionLocked || this.completed || this.dragging) {
      return;
    }

    if (this.phase === 'defence' && this.mode === 'match') {
      this.resolveDefenceChoice(this.selectedReceiver);
      return;
    }

    const target = this.receiverPoint(this.selectedReceiver);
    const profile = this.currentTimingProfile();
    const accurate = Math.abs(this.timingValue - 0.55) <= profile.tolerance;
    const missOffset = this.timingValue < 0.55 ? -150 : 150;
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
    const destination = intercepted
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
          this.handlePracticeAttempt(accurate);
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
      this.completed = true;
      this.cameras.main.flash(150, 255, 239, 164, false);
      this.renderPossession();
      return;
    }

    this.statusText?.setText('Caught! Keep the chain moving.');
    this.time.delayedCall(420, () => this.renderPossession());
  }

  private handlePracticeAttempt(success: boolean): void {
    if (success) {
      this.practiceScore += PRACTICE_TARGETS[this.selectedReceiver]?.points ?? 1;
      this.statusText?.setText('Hit! Pick another target.');
      this.cameras.main.flash(90, 255, 239, 164, false);
    } else {
      this.statusText?.setText('Missed — next disc.');
      this.cameras.main.shake(80, 0.0015);
    }

    this.practiceThrows += 1;
    if (this.practiceThrows >= PRACTICE_THROW_COUNT) {
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
    this.phase = 'defence';
    this.opponentAdvance = 0;
    this.defenceAttackLane = (this.possession + this.selectedReceiver + 1) % RECEIVER_Y.length;
    this.selectedReceiver = 1;
    this.time.delayedCall(520, () => this.renderPossession());
  }

  private throwOrigin(): Point {
    if (this.mode === 'practice') {
      return { x: 240, y: 370 };
    }

    return {
      x: THROW_X[this.possession] ?? THROW_X[0],
      y: 370,
    };
  }

  private receiverPoint(index: number): Point {
    if (this.mode === 'practice') {
      return {
        x: PRACTICE_TARGET_X,
        y: PRACTICE_TARGETS[index]?.y ?? PRACTICE_TARGETS[1].y,
      };
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

    if (this.mode === 'practice' && this.statusText && !this.completed) {
      const target = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
      this.statusText.setText(
        `Throw ${this.practiceThrows + 1} of ${PRACTICE_THROW_COUNT}: ${target.label} target — ${target.points} point${target.points === 1 ? '' : 's'}.`,
      );
    }
  }

  private currentTimingProfile(): { tolerance: number; sweepSpeed: number; label: string } {
    if (this.mode === 'practice') {
      const target = PRACTICE_TARGETS[this.selectedReceiver] ?? PRACTICE_TARGETS[1];
      return {
        tolerance: target.tolerance,
        sweepSpeed: target.sweepSpeed,
        label: target.label,
      };
    }

    return { tolerance: 0.22, sweepSpeed: 0.0042, label: 'Match' };
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

    this.timingSuccessZone.setPosition(x, 684).setDisplaySize(Math.max(18, width), 14);
    this.timingDifficultyText.setText(
      this.mode === 'practice'
        ? `${profile.label} • ${profile.sweepSpeed.toFixed(4)} speed`
        : 'Match timing',
    );
  }

  private isReceiverMarked(index: number): boolean {
    const openLane = OPEN_LANE_BY_PASS[this.possession] ?? OPEN_LANE_BY_PASS[0];
    return index !== openLane;
  }

  private defenderPoint(index: number): Point {
    const targetX = TARGET_X[this.possession] ?? TARGET_X[0];
    const receiverY = RECEIVER_Y[index] ?? RECEIVER_Y[1];
    const throwOrigin = this.throwOrigin();
    return {
      x: Phaser.Math.Linear(throwOrigin.x, targetX, 0.7),
      y: receiverY,
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
      this.statusText?.setText('Blocked! You read the lane and win the disc back.');
      this.cameras.main.flash(100, 215, 244, 193, false);
      this.phase = 'attack';
      this.opponentAdvance = 0;
      this.selectedReceiver = 1;
      this.time.delayedCall(520, () => this.renderPossession());
      return;
    }

    this.opponentAdvance += 1;
    if (this.opponentAdvance >= 2) {
      this.statusText?.setText('They break through and score. Your team restarts with the disc.');
      this.cameras.main.shake(110, 0.002);
      this.phase = 'attack';
      this.opponentAdvance = 0;
      this.possession = 0;
      this.selectedReceiver = 1;
      this.time.delayedCall(620, () => this.renderPossession());
      return;
    }

    this.statusText?.setText('Wrong lane — they advance. Read the next pass and defend again.');
    this.defenceAttackLane = (this.defenceAttackLane + 1) % RECEIVER_Y.length;
    this.selectedReceiver = 1;
    this.time.delayedCall(520, () => this.renderPossession());
  }

  private restartRun(): void {
    this.possession = 0;
    this.practiceThrows = 0;
    this.practiceScore = 0;
    this.phase = 'attack';
    this.opponentAdvance = 0;
    this.defenceAttackLane = 1;
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
    this.scene.stop();
    if (this.game.scene.isPaused(this.returnScene)) {
      this.game.scene.resume(this.returnScene);
    } else if (!this.game.scene.isActive(this.returnScene)) {
      this.game.scene.start(this.returnScene);
    }
  }
}
